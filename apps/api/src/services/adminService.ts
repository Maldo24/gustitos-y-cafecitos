import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import { Restaurant } from '../models/Restaurant.js';
import { Session } from '../models/Session.js';
import { notificationService } from './notificationService.js';

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
      .select('username email names firstSurname role blocked blockedAt blockReason createdAt')
      .sort({ createdAt: -1 });
  },

  /**
   * Elimina un grupo de forma lógica (borrado lógico, no físico).
   * Así el usuario todavía puede apelar y el admin puede restaurarlo.
   * Los restaurantes y cuentas NO se borran: quedan ahí por si se restaura.
   */
  async deleteGroup(groupId: string, adminId: string, reason: string) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('El grupo no existe');
    }

    if (group.status === 'deleted') {
      throw new Error('Este grupo ya está eliminado');
    }

    group.status = 'deleted';
    group.deletedAt = new Date();
    group.deletedBy = adminId as any;
    group.deletionReason = reason;

    await group.save();

    // Avisamos a los miembros para que puedan apelar
    await notificationService.notifyMany({
      userIds: group.members.map((id) => id.toString()),
      type: 'group_deleted',
      message: `El grupo "${group.name}" fue eliminado por un administrador`,
      link: `/grupo/${group.slug}`,
      actorName: null
    });

    return group;
  },

  /** Restaura un grupo eliminado (o tras una apelación aprobada). */
  async restoreGroup(groupId: string) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('El grupo no existe');
    }

    if (group.status === 'active') {
      throw new Error('Este grupo ya está activo');
    }

    group.status = 'active';
    group.deletedAt = null;
    group.deletedBy = null;
    group.deletionReason = null;

    await group.save();

    await notificationService.notifyMany({
      userIds: group.members.map((id) => id.toString()),
      type: 'member_joined',
      message: `El grupo "${group.name}" fue restaurado`,
      link: `/grupo/${group.slug}`,
      actorName: null
    });

    return group;
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