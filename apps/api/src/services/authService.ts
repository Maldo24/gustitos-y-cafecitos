import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { validateUsername, validatePersonName, validateEmail, assertSafeText } from '../utils/validators.js';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_para_desarrollo';

export const authService = {
  /**
   * Registra un nuevo usuario encriptando su contraseña.
   */
  async registerUser(username: string, password: string, names: string, firstSurname: string, email: string): Promise<IUser> {
    const cleanUsername = validateUsername(username);
    const cleanNames = validatePersonName(names, 'nombres');
    const cleanFirstSurname = validatePersonName(firstSurname, 'primer apellido');
    const cleanEmail = validateEmail(email);

    if (/\s/.test(password)) {
      throw new Error('La contraseña no puede contener espacios');
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const usernameExists = await User.findOne({ username: cleanUsername });
    if (usernameExists) throw new Error('El nombre de usuario ya esta en uso');

    const emailExists = await User.findOne({ email: cleanEmail });
    if (emailExists) throw new Error('El correo electronico ya esta registrado');

    // Encriptación de la contraseña con un factor de costo de 10
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: cleanUsername,
      passwordHash,
      names: cleanNames,
      firstSurname: cleanFirstSurname,
      email: cleanEmail
    });

    return await newUser.save();
  },

  /**
   * Valida las credenciales de inicio de sesión y genera un token JWT.
   */
  async loginUser(username: string, password: string): Promise<{ user: IUser; accessToken: string }> {
    const cleanUsername = assertSafeText(String(username ?? ''), 'nombre de usuario');
    const user = await User.findOne({ username: cleanUsername });
    if (!user) throw new Error('Usuario o contrasena incorrectos');

    // Comparar la contraseña ingresada con el hash guardado
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new Error('Usuario o contrasena incorrectos');

    // Cuenta bloqueada: no entra, pero el motivo viaja para que pueda apelar
    if (user.blocked) {
      const error = new Error(
        `Tu cuenta fue bloqueada por un administrador. Motivo: ${user.blockReason || 'no especificado'}.`
      ) as Error & { code?: string };
      error.code = 'USER_BLOCKED';
      throw error;
    }

    // Generar el token de acceso con una validez de 2 horas
    const accessToken = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return { user, accessToken };
  }
};