import { apiClient } from './client';
import type { Appeal } from '../types';

/**
 * Crear una apelación.
 * - Grupo eliminado: requiere token (eres miembro).
 * - Cuenta bloqueada: se puede hacer sin token, probando usuario + correo.
 */
export async function createAppeal(payload: {
  targetType: 'group' | 'user';
  targetId: string;
  reason: string;
  username?: string;
  email?: string;
}): Promise<{ message: string; appeal: Appeal }> {
  return apiClient<{ message: string; appeal: Appeal }>('/appeals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMyAppeals(): Promise<Appeal[]> {
  return apiClient<Appeal[]>('/appeals/mine');
}
