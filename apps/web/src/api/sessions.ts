import { apiClient } from './client';
import type { Session } from '../types';

export interface CreateSessionParticipant {
  name: string;
  itemsConsumed: { dishName: string; price: number; quantity: number }[];
}

export interface CreateSessionPayload {
  title: string;
  splitMode: 'equal' | 'by_consumption';
  tipPercentage?: number;
  participants: CreateSessionParticipant[];
  groupId?: string;
}

export async function createSession(
  payload: CreateSessionPayload
): Promise<{ message: string; session: Session }> {
  return apiClient<{ message: string; session: Session }>('/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getSessionsByGroup(groupId: string): Promise<Session[]> {
  return apiClient<Session[]>(`/sessions/group/${groupId}`);
}

export async function getSessionById(sessionId: string): Promise<Session> {
  return apiClient<Session>(`/sessions/${sessionId}`);
}

export async function togglePayment(
  sessionId: string,
  participantId: string
): Promise<{ message: string; session: Session }> {
  return apiClient<{ message: string; session: Session }>(
    `/sessions/${sessionId}/participant/${participantId}/pay`,
    { method: 'PUT' }
  );
}
