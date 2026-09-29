import { Appeal, IAppeal, AppealTargetType } from '../models/Appeal.js';
import { Group } from '../models/Group.js';
import { User, IUser } from '../models/User.js';
import { validatePlainText, validateUsername, validateEmail, assertSafeText } from '../utils/validators.js';

const MIN_REASON = 15;
const MAX_REASON = 600;

export const appealService = {
  /**
   * Crea una apelación.
   * - targetType 'group': apela el dueño/admin del grupo eliminado.
   * - targetType 'user': apela el propio usuario bloqueado (puede hacerlo sin
   *  .token, probando identidad con usuario + correo, igual que la recuperación
   *   de contraseña).
   */
  async createAppeal(input: {
    targetType: AppealTargetType;
    targetId: string;
    reason: string;
    requesterId?: string;
    username?: string;
    email?: string;
  }): Promise<IAppeal> {
    const reason = validatePlainText(input.reason, 'justificacion', { min: MIN_REASON, max: MAX_REASON });

    let userId: string;
    let targetLabel: string;

    if (input.targetType === 'group') {
      const group = await Group.findById(input.targetId);

      if (!group) {
        throw new Error('El grupo no existe');
      }

      if (group.status !== 'deleted') {
        throw new Error('Ese grupo no está eliminado, no hay nada que apelar');
      }

      if (!group.adminId) {
        throw new Error('Ese grupo no tiene administrador dueño para apelar');
      }

      // Solo el admin del grupo (o un miembro si el grupo se quedó sin admin) puede apelar
      const isOwner = group.adminId.toString() === input.requesterId;
      const isMember = group.members.some((id) => id.toString() === input.requesterId);

      if (!isOwner && !isMember) {
        throw new Error('Solo un miembro del grupo puede apelar su eliminación');
      }

      userId = group.adminId.toString();
      targetLabel = group.name;
    } else {
      let user: any = null;

      if (input.requesterId) {
        user = await User.findById(input.requesterId);
      } else if (input.username && input.email) {
        const cleanUsername = validateUsername(input.username);
        const cleanEmail = validateEmail(input.email);
        const candidate = await User.findOne({ username: cleanUsername });

        if (!candidate || candidate.email.toLowerCase() !== cleanEmail.toLowerCase()) {
          throw new Error('Los datos no coinciden con ninguna cuenta');
        }

        user = candidate;
      }

      if (!user) {
        throw new Error('No se pudo identificar al usuario');
      }

      if (!user.blocked) {
        throw new Error('Tu cuenta no está bloqueada, no hay nada que apelar');
      }

      userId = user._id.toString();
      targetLabel = `@${user.username}`;

      // La apelación apunta al usuario afectado
      input.targetId = userId;
    }

    // Una sola apelación viva por recurso
    const existing = await Appeal.findOne({
      targetType: input.targetType,
      targetId: input.targetId,
      status: 'pending'
    });

    if (existing) {
      throw new Error('Ya tienes una apelación en revisión para esto. Espera la respuesta del administrador.');
    }

    return await Appeal.create({
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel,
      userId,
      reason
    });
  },
  /** Apelaciones del usuario actual. */
  async listMine(userId: string): Promise<IAppeal[]> {
    return await Appeal.find({ userId }).sort({ createdAt: -1 }).limit(30);
  },

  /** Todas las apelaciones (admin). */
  async listAll(): Promise<IAppeal[]> {
    return await Appeal.find()
      .populate('userId', 'username email names firstSurname')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(100);
  },

  /**
   * El admin resuelve la apelación.
   * - aprobar un grupo  -> lo restaura
   * - aprobar un usuario -> lo desbloquea
   * - rechazar          -> no cambia nada, solo deja constancia
   */
  async resolveAppeal(
    appealId: string,
    adminId: string,
    action: 'approve' | 'reject',
    note?: string
  ): Promise<{ appeal: IAppeal; restored?: string }> {
    const appeal = await Appeal.findById(appealId);

    if (!appeal) {
      throw new Error('La apelación no existe');
    }

    if (appeal.status !== 'pending') {
      throw new Error('Esta apelación ya fue resuelta');
    }

    const cleanNote = note
      ? validatePlainText(note, 'respuesta', { min: 1, max: 400 })
      : null;

    if (action === 'approve') {
      if (appeal.targetType === 'group') {
        await Group.updateOne(
          { _id: appeal.targetId },
          {
            $set: {
              status: 'active',
              deletedAt: null,
              deletedBy: null,
              deletionReason: null
            }
          }
        );
      } else {
        await User.updateOne(
          { _id: appeal.targetId },
          {
            $set: {
              blocked: false,
              blockedAt: null,
              blockedBy: null,
              blockReason: null
            }
          }
        );
      }

      appeal.status = 'approved';
    } else {
      appeal.status = 'rejected';
    }

    appeal.resolutionNote = cleanNote;
    appeal.reviewedBy = adminId as any;
    appeal.reviewedAt = new Date();

    await appeal.save();

    return {
      appeal,
      restored:
        action === 'approve'
          ? appeal.targetType === 'group'
            ? 'El grupo fue restaurado'
            : 'La cuenta fue desbloqueada'
          : undefined
    };
  },

  /** Bloquea o desbloquea una cuenta (acción reversible del admin). */
  async setUserBlocked(userId: string, adminId: string, blocked: boolean, reason?: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('El usuario no existe');
    }

    if (user.role === 'admin' && blocked) {
      throw new Error('No se puede bloquear a otro administrador');
    }

    if (blocked) {
      const cleanReason = validatePlainText(reason, 'justificacion', { min: MIN_REASON, max: MAX_REASON });
      user.blocked = true;
      user.blockedAt = new Date();
      user.blockedBy = adminId as any;
      user.blockReason = cleanReason;
    } else {
      user.blocked = false;
      user.blockedAt = null;
      user.blockedBy = null;
      user.blockReason = null;
    }

    return await user.save();
  },

  /** Justificación obligatoria para eliminar un grupo (borrado lógico). */
  async assertGroupDeletionReason(reason?: string): Promise<string> {
    return validatePlainText(reason, 'justificacion', { min: MIN_REASON, max: MAX_REASON });
  },

  /** Limpia el token si viene sucio (defensa extra en las rutas de apelación). */
  sanitizeToken(token?: string): string | undefined {
    if (!token) return undefined;
    try {
      return assertSafeText(token, 'token');
    } catch {
      return undefined;
    }
  }
};
