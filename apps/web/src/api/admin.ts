import { apiClient } from './client';
import type { Appeal, Group, User } from '../types';

export interface AdminStats {
  users: number;
  groups: number;
  restaurants: number;
  sessions: number;
  paidParticipants: number;
}

export interface AdminUser extends User {
  role: 'admin' | 'user';
  blocked: boolean;
  blockReason: string | null;
  blockedAt?: string | null;
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiClient<AdminStats>('/admin/stats');
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiClient<AdminUser[]>('/admin/users');
}

export async function setUserRole(userId: string, role: 'admin' | 'user'): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function getAdminGroups(): Promise<Group[]> {
  return apiClient<Group[]>('/admin/groups');
}

export interface AdminPasswordRequest {
  _id: string;
  username: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  reviewedAt?: string | null;
}

export async function getAdminPasswordRequests(): Promise<AdminPasswordRequest[]> {
  return apiClient<AdminPasswordRequest[]>('/admin/password-requests');
}

export async function reviewPasswordRequest(
  requestId: string,
  action: 'approve' | 'reject'
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/admin/password-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}

/** Elimina un grupo (justificación obligatoria, mínimo 15 caracteres). */
export async function deleteGroup(groupId: string, reason: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/admin/groups/${groupId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

export async function restoreGroup(groupId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/admin/groups/${groupId}/restore`, {
    method: 'POST',
  });
}

export async function setUserBlocked(
  userId: string,
  blocked: boolean,
  reason?: string
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/admin/users/${userId}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ blocked, reason }),
  });
}

export async function getAdminAppeals(): Promise<Appeal[]> {
  return apiClient<Appeal[]>('/admin/appeals');
}

export async function resolveAppeal(
  appealId: string,
  action: 'approve' | 'reject',
  note?: string
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/admin/appeals/${appealId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action, note }),
  });
}