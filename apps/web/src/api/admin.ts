import { apiClient } from './client';
import type { Group, User } from '../types';

export interface AdminStats {
  users: number;
  groups: number;
  restaurants: number;
  sessions: number;
  paidParticipants: number;
}

export interface AdminUser extends User {
  role: 'admin' | 'user';
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