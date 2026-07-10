import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_para_desarrollo';

export const authService = {
  /**
   * Registra un nuevo usuario encriptando su contraseña.
   */
  async registerUser(username: string, password: string, names: string, firstSurname: string, email: string): Promise<IUser> {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) throw new Error('El nombre de usuario ya esta en uso');

    const emailExists = await User.findOne({ email });
    if (emailExists) throw new Error('El correo electronico ya esta registrado');

    // Encriptación de la contraseña con un factor de costo de 10
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      passwordHash,
      names,
      firstSurname,
      email
    });

    return await newUser.save();
  },

  /**
   * Valida las credenciales de inicio de sesión y genera un token JWT.
   */
  async loginUser(username: string, password: string): Promise<{ user: IUser; accessToken: string }> {
    const user = await User.findOne({ username });
    if (!user) throw new Error('Usuario o contrasena incorrectos');

    // Comparar la contraseña ingresada con el hash guardado
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new Error('Usuario o contrasena incorrectos');

    // Generar el token de acceso con una validez de 2 horas
    const accessToken = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return { user, accessToken };
  }
};