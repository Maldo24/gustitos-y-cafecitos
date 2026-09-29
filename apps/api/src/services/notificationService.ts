import { Notification, INotification, NotificationType } from '../models/Notification.js';

const DEDUPE_WINDOW_MINUTES = 5;

interface CreateNotificationInput {
  userIds: string[];
  type: NotificationType;
  message: string;
  link?: string | null;
  actorName?: string | null;
}

export const notificationService = {
  /**
   * Crea notificaciones para varios usuarios, evitando duplicados recientes
   * (si alguien entra y sale del grupo varias veces no se llena la lista).
   */
  async notifyMany({ userIds, type, message, link = null, actorName = null }: CreateNotificationInput): Promise<number> {
    const recipients = [...new Set(userIds.filter(Boolean))];
    if (recipients.length === 0) return 0;

    const windowStart = new Date(Date.now() - DEDUPE_WINDOW_MINUTES * 60 * 1000);

    const recent = await Notification.find({
      userId: { $in: recipients },
      type,
      createdAt: { $gte: windowStart }
    }).select('userId');

    const recentlyNotified = new Set(recent.map((n) => n.userId.toString()));

    const toInsert = recipients
      .filter((id) => !recentlyNotified.has(id))
      .map((userId) => ({ userId, type, message, link, actorName, read: false }));

    if (toInsert.length === 0) return 0;

    const created = await Notification.insertMany(toInsert);
    return created.length;
  },

  async notifyOne(input: Omit<CreateNotificationInput, 'userIds'> & { userId: string }) {
    return await this.notifyMany({
      userIds: [input.userId],
      type: input.type,
      message: input.message,
      link: input.link,
      actorName: input.actorName,
    });
  },

  async listForUser(userId: string, limit = 20): Promise<INotification[]> {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

    return await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(safeLimit);
  },

  async countUnread(userId: string): Promise<number> {
    return await Notification.countDocuments({ userId, read: false });
  },

  async markAsRead(userId: string, notificationId: string): Promise<INotification | null> {
    // El filtro incluye userId: nadie puede marcar como leída la notificación de otro
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read: true } },
      { new: true }
    );
  },

  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    return result.modifiedCount ?? 0;
  },

  /** Limpieza: borra notificaciones leídas con más de 60 días. */
  async purgeOld(userId?: string): Promise<number> {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const filter: Record<string, unknown> = { read: true, createdAt: { $lt: cutoff } };
    if (userId) filter.userId = userId;

    const result = await Notification.deleteMany(filter);
    return result.deletedCount ?? 0;
  }
};
