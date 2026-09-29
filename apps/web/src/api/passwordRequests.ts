import { apiClient } from './client';

export type PasswordRequestStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'completed';

export async function createPasswordRequest(
  username: string,
  email: string
): Promise<{ message: string; created: boolean }> {
  return apiClient<{ message: string; created: boolean }>('/auth/password-requests', {
    method: 'POST',
    body: JSON.stringify({ username, email }),
  });
}

export async function getPasswordRequestStatus(
  username: string,
  email: string
): Promise<{ status: PasswordRequestStatus; token?: string }> {
  return apiClient<{ status: PasswordRequestStatus; token?: string }>(
    '/auth/password-requests/status',
    {
      method: 'POST',
      body: JSON.stringify({ username, email }),
    }
  );
}

export async function confirmPasswordChange(
  token: string,
  newPassword: string
): Promise<{ message: string; username: string }> {
  return apiClient<{ message: string; username: string }>('/auth/password-requests/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}
