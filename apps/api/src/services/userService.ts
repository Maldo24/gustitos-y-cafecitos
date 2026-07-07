import { User, IUser } from '../models/User.js';

export const userService = {

  async createUser(username: string, email: string): Promise<IUser> {

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      throw new Error('El nombre de usuario ya está registrado');
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const newUser = new User({ username, email });
    return await newUser.save();
  },

  
  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  },

  
  async getUserByUsername(username: string): Promise<IUser | null> {
    return await User.findOne({ username });
  }
};