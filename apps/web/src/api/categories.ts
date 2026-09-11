import { apiClient } from './client';
import type { Category } from '../types';

export async function getCategories(): Promise<Category[]> {
  return apiClient<Category[]>('/categories');
}

export async function createCategory(name: string): Promise<{ message: string; category: Category }> {
  return apiClient<{ message: string; category: Category }>('/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateCategory(
  id: string,
  name: string
): Promise<{ message: string; category: Category }> {
  return apiClient<{ message: string; category: Category }>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategory(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/categories/${id}`, {
    method: 'DELETE',
  });
}