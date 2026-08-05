import { apiClient } from './client';
import type { Group } from '../types';

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