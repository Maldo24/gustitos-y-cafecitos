import { apiClient } from './client';

export interface RegisterData {
  username: string;
  names: string;
  firstSurname: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  message: string;
  userId: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id?: string;
    username: string;
    names: string;
    firstSurname: string;
    email: string;
    role?: 'admin' | 'user';
  };
  accessToken: string;
}

interface MeResponse {
  success: boolean;
  user: {
    id: string;
    username: string;
    names: string;
    firstSurname: string;
    email: string;
    role?: 'admin' | 'user';
  };
}

export async function register(data: RegisterData): Promise<RegisterResponse> {
  return apiClient<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getMe(): Promise<MeResponse> {
  return apiClient<MeResponse>('/auth/me');
}