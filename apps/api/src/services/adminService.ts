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
    const groups = await Group.find()
      .populate('members', 'username names firstSurname email')
      .sort({ createdAt: -1 });

    return await Promise.all(
      groups.map(async (group) => {
        // La fuente de verdad de los restaurantes es restaurant.groupId.
        // group.savedRestaurants quedó vacío en versiones anteriores, así que
        // además lo reparamos cuando detectamos la inconsistencia.
        const restaurantIds = await Restaurant.find({ groupId: group._id }).select('_id');

        if (restaurantIds.length > 0 && group.savedRestaurants.length === 0) {
          group.savedRestaurants = restaurantIds.map((r) => r._id);
          await group.save();
        }

        return {
          ...group.toObject(),
          membersCount: group.members.length,
          restaurantsCount: restaurantIds.length
        };
      })
    );
  },
};