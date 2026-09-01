import { apiClient } from './client';
import type { Group, User } from '../types';

interface CreateGroupResponse {
  message: string;
  group: Group;
}

export async function createGroup(name: string): Promise<CreateGroupResponse> {
  return apiClient<CreateGroupResponse>('/groups', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function getGroupBySlug(slug: string): Promise<Group> {
  return apiClient<Group>(`/groups/${slug}`);
}

export async function getMyGroups(): Promise<Group[]> {
  return apiClient<Group[]>('/groups/my-groups');
}

export async function getGroupMembers(groupId: string): Promise<User[]> {
  return apiClient<User[]>(`/groups/${groupId}/members`);
}

export async function addMember(
  groupId: string,
  username: string
): Promise<{ message: string; group: Group }> {
  return apiClient<{ message: string; group: Group }>(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}