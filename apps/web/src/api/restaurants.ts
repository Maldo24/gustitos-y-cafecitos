import { apiClient } from './client';
import type { Restaurant } from '../types';

export interface CreateRestaurantPayload {
  groupId: string;
  name: string;
  mapsLink: string;
  categoryId: string;
  comment: string;
  forceCreate?: boolean;
}

interface CreateRestaurantResponse {
  status: 'WARNING_SIMILAR' | 'CREATED';
  message?: string;
  similarPlaces?: Restaurant[];
  data?: Restaurant;
}

export async function createRestaurant(
  payload: CreateRestaurantPayload
): Promise<CreateRestaurantResponse> {
  return apiClient<CreateRestaurantResponse>('/restaurants', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRestaurantsByGroup(groupId: string): Promise<Restaurant[]> {
  return apiClient<Restaurant[]>(`/restaurants/group/${groupId}`);
}

export async function addReview(
  restaurantId: string,
  comment: string
): Promise<{ message: string; restaurant: Restaurant }> {
  return apiClient<{ message: string; restaurant: Restaurant }>(
    `/restaurants/${restaurantId}/reviews`,
    {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }
  );
}

export async function toggleVote(
  restaurantId: string
): Promise<{ message: string; votesCount: number; restaurant: Restaurant }> {
  return apiClient<{ message: string; votesCount: number; restaurant: Restaurant }>(
    `/restaurants/${restaurantId}/vote`,
    { method: 'POST' }
  );
}
