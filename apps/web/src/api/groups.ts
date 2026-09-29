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

export async function joinGroup(
  groupId: string
): Promise<{ message: string; group: Group }> {
  return apiClient<{ message: string; group: Group }>(`/groups/${groupId}/join`, {
    method: 'POST',
  });
}

export async function leaveGroup(
  groupId: string
): Promise<{ message: string; group: Group }> {
  return apiClient<{ message: string; group: Group }>(`/groups/${groupId}/leave`, {
    method: 'POST',
  });
}

export async function removeMember(
  groupId: string,
  memberId: string
): Promise<{ message: string; group: Group }> {
  return apiClient<{ message: string; group: Group }>(
    `/groups/${groupId}/members/${memberId}`,
    { method: 'DELETE' }
  );
}

export async function removeRestaurantFromGroup(
  groupId: string,
  restaurantId: string
): Promise<{ message: string; group: Group }> {
  return apiClient<{ message: string; group: Group }>(
    `/groups/${groupId}/restaurants/${restaurantId}`,
    { method: 'DELETE' }
  );
}
