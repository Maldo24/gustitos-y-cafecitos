import { apiClient } from './client';

export type NotificationType =
  | 'member_joined'
  | 'member_added'
  | 'user_blocked'
  | 'user_unblocked'
  | 'group_deleted';

export interface AppNotification {
  _id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  actorName: string | null;
  read: boolean;
  createdAt: string;
}

export async function getNotifications(limit = 20): Promise<AppNotification[]> {
  return apiClient<AppNotification[]>(`/notifications?limit=${limit}`);
}

export async function getUnreadCount(): Promise<number> {
  const result = await apiClient<{ count: number }>('/notifications/unread-count');
  return result.count;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient<{ message: string }>('/notifications/read-all', { method: 'POST' });
}
