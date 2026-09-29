import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { PasswordRequest, IPasswordRequest } from '../models/PasswordRequest.js';
import { validateUsername, validateEmail, assertSafeText } from '../utils/validators.js';

const TOKEN_TTL_MINUTES = 30;
// Evita que alguien spamee solicitudes y llene el panel del admin
const MAX_PENDING_REQUESTS = 5;

export const passwordRequestService = {
  /**
   * El usuario solicita el cambio indicando username + correo registrado.
   * La respuesta es SIEMPRE la misma (no revela si el correo coincide), pero
   * la solicitud solo se crea si los datos realmente corresponden a una cuenta.
   */
  async createRequest(username: string, email: string) {
    const cleanUsername = validateUsername(username);
    const cleanEmail = validateEmail(email);

    const genericMessage =
      'Si los datos coinciden con una cuenta, la solicitud fue enviada a revisión.';

    const user = await User.findOne({ username: cleanUsername });

    // No revelamos nada: respuesta genérica siempre
    if (!user) return { message: genericMessage, created: false };

    const emailMatches =
      user.email.toLowerCase() === cleanEmail.toLowerCase();

    if (!emailMatches) {
      // Queda registrado en el log del servidor para poder investigar
      console.warn(
        `[password-request] Correo no coincide para @${cleanUsername} (intento desde el formulario de recuperacion)`
      );
      return { message: genericMessage, created: false };
    }

    // Si ya tiene una solicitud viva, no creamos otra
    const liveRequest = await PasswordRequest.findOne({
      userId: user._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (liveRequest) {
      return { message: genericMessage, created: false, existingStatus: liveRequest.status };
    }

    const pendingCount = await PasswordRequest.countDocuments({ status: 'pending' });
    if (pendingCount >= MAX_PENDING_REQUESTS) {
      throw new Error('Hay demasiadas solicitudes pendientes en este momento. Intenta más tarde.');
    }

    await PasswordRequest.create({
      userId: user._id,
      username: user.username,
      email: user.email
    });

    return { message: genericMessage, created: true };
  },

  /**
   * El usuario consulta el estado de su solicitud con username + correo.
   * Si fue aprobada y el token sigue vigente, se le devuelve el token para
   * que pueda definir su nueva contraseña.
   */
  async getStatus(username: string, email: string) {
    const cleanUsername = validateUsername(username);
    const cleanEmail = validateEmail(email);

    const user = await User.findOne({ username: cleanUsername });

    // Mismo criterio anti-enumeración: si no coincide, "none"
    if (!user || user.email.toLowerCase() !== cleanEmail.toLowerCase()) {
      return { status: 'none' as const };
    }

    const request = await PasswordRequest.findOne({ userId: user._id })
      .sort({ createdAt: -1 });

    if (!request) return { status: 'none' as const };

    if (request.status === 'approved' && request.token && request.expiresAt) {
      if (request.expiresAt.getTime() < Date.now()) {
        // Token vencido: el admin tiene que volver a aprobar
        request.status = 'pending';
        request.token = null;
        request.expiresAt = null;
        await request.save();
        return { status: 'pending' as const };
      }

      return { status: 'approved' as const, token: request.token };
    }

    if (request.status === 'completed') {
      return { status: 'completed' as const };
    }

    return { status: request.status };
  },

  /** El admin aprueba o rechaza una solicitud. */
  async reviewRequest(requestId: string, adminId: string, action: 'approve' | 'reject') {
    const request = await PasswordRequest.findById(requestId);

    if (!request) {
      throw new Error('La solicitud no existe');
    }

    if (request.status === 'completed') {
      throw new Error('Esta solicitud ya fue completada');
    }

    if (action === 'approve') {
      request.status = 'approved';
      request.token = crypto.randomBytes(32).toString('hex');
      request.expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
    } else {
      request.status = 'rejected';
      request.token = null;
      request.expiresAt = null;
    }

    request.reviewedBy = adminId as any;
    request.reviewedAt = new Date();

    return await request.save();
  },

  /**
   * El usuario define su nueva contraseña usando el token entregado al aprobar.
   * El token es de un solo uso: al completar, se anula.
   */
  async confirmPasswordChange(token: string, newPassword: string) {
    const cleanToken = assertSafeText(String(token ?? ''), 'token');

    if (!/^[a-f0-9]{64}$/.test(cleanToken)) {
      throw new Error('El código de cambio no es válido');
    }

    if (/\s/.test(newPassword)) {
      throw new Error('La contraseña no puede contener espacios');
    }

    if (newPassword.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const request = await PasswordRequest.findOne({ token: cleanToken });

    if (!request) {
      throw new Error('El código de cambio no es válido');
    }

    if (request.status !== 'approved') {
      throw new Error('El código de cambio ya no está disponible');
    }

    if (!request.expiresAt || request.expiresAt.getTime() < Date.now()) {
      request.status = 'pending';
      request.token = null;
      request.expiresAt = null;
      await request.save();
      throw new Error('El código expiró. Vuelve a solicitar el cambio para que el administrador lo apruebe.');
    }

    const user = await User.findById(request.userId);
    if (!user) {
      throw new Error('El usuario ya no existe');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Un solo uso: el token queda invalidado al completar
    request.status = 'completed';
    request.token = null;
    request.expiresAt = null;
    await request.save();

    return { username: user.username };
  },

  /** Listado para el panel de admin. */
  async listRequests() {
    const requests: IPasswordRequest[] = await PasswordRequest.find()
      .populate('userId', 'username email names firstSurname')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    return requests;
  },

  /** Limpieza periódica de solicitudes viejas. */
  async purgeOldRequests() {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await PasswordRequest.deleteMany({
      createdAt: { $lt: cutoff },
      status: { $in: ['rejected', 'completed'] }
    });
    return result.deletedCount ?? 0;
  }
};
