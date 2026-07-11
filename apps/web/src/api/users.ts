// apps/web/src/api/users.ts
import { apiClient } from './client';
import type { User } from '../types/index';

interface RegisterResponse {
  message: string;
  user: User;
}

export async function registerUser(username: string, email: string): Promise<RegisterResponse> {
  return apiClient<RegisterResponse>('/users/register', {
    method: 'POST',
    body: JSON.stringify({ username, email }),
  });
}