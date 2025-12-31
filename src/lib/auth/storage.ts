import type { AuthUser } from './types';

const USER_KEY = 'calabi-user';
const TOKEN_KEY = 'calabi-token';

const safeStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

export const getAuthUser = (): AuthUser | null => {
  const storage = safeStorage();
  if (!storage) return null;
  const raw = storage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const setAuthUser = (user: AuthUser) => {
  const storage = safeStorage();
  if (storage) storage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthUser = () => {
  const storage = safeStorage();
  if (storage) storage.removeItem(USER_KEY);
};

export const setAuthSession = (token: string, user?: AuthUser) => {
  setAuthToken(token);
  if (user) setAuthUser(user);
};

export const clearAuthSession = () => {
  clearAuthUser();
  clearAuthToken();
};
export const getAuthToken = (): string | null => {
  const storage = safeStorage();
  return storage ? storage.getItem(TOKEN_KEY) : null;
};

export const setAuthToken = (token: string) => {
  const storage = safeStorage();
  if (storage) storage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  const storage = safeStorage();
  if (storage) storage.removeItem(TOKEN_KEY);
};
