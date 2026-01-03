import { api } from '@/lib/api/client';
import { getAuthToken } from '@/lib/auth/storage';
import type { Language } from '@/lib/i18n';

export type UserPreferences = {
  theme: 'light' | 'dark';
  language: Language;
};

const DEFAULT_ENDPOINT = '/users/me/preferences';

export const updateUserPreferences = async (prefs: UserPreferences) => {
  const token = getAuthToken();
  if (!token) return;
  const endpoint = process.env.NEXT_PUBLIC_USER_PREFERENCES_ENDPOINT ?? DEFAULT_ENDPOINT;
  await api.patch<void>(endpoint, prefs, { authToken: token });
};
