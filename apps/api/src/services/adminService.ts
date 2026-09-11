import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { Restaurant } from '../models/Restaurant.js';
import { Session } from '../models/Session.js';

export const adminService = {
  async getStats() {
    const [users, groups, restaurants, sessions, paidParticipants] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Restaurant.countDocuments(),
      Session.countDocuments(),
      Session.aggregate([
        { $unwind: '$participants' },
        { $match: { 'participants.isPaid': true } },
        { $count: 'total' }
      ]),
    ]);

    return {
      users,
      groups,
      restaurants,
      sessions,
      paidParticipants: paidParticipants[0]?.total ?? 0,
    };
  },

  async getAllUsers() {
    return await User.find()
      .select('username email names firstSurname role createdAt')
      .sort({ createdAt: -1 });
  },

  async setUserRole(userId: string, role: 'admin' | 'user') {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('El usuario no existe');
    }
    user.role = role;
    return await user.save();
  },

  async getAllGroups() {
    return await Group.find()
      .populate('members', 'username names firstSurname email')
      .populate('savedRestaurants', 'name categoryId')
      .sort({ createdAt: -1 });
  },
};