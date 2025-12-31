import { api } from '@/lib/api/client';
import { getAuthToken } from './storage';
import type { AuthSession, AuthUser } from './types';

export const loginWithCredentials = (email: string, password: string) =>
  api.post<AuthSession>('/auth/login', { email, password });

export const registerWithCredentials = (email: string, password: string) =>
  api.post<AuthSession>('/auth/register', { email, password });

export const fetchMe = (token?: string) => {
  const accessToken = token ?? getAuthToken();
  return api.get<AuthUser>('/auth/me', accessToken ? { authToken: accessToken } : undefined);
};

export const loginWithGoogle = (query: Record<string, string>) =>
  api.get<AuthSession>('/auth/google/login', { query });
