import { api } from '@/lib/api/client';
import { getAuthToken } from '@/lib/auth/storage';
import type {
  AutocompleteResponse,
  ConsistencyResponse,
} from '@/types/suggestions';

const getAuthTokenOrThrow = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }
  return token;
};

export const fetchAutocomplete = async (
  fragment: string,
  limit = 5
): Promise<AutocompleteResponse> => {
  const token = getAuthTokenOrThrow();
  return api.get<AutocompleteResponse>('/suggestions/autocomplete', {
    authToken: token,
    query: { fragment, limit },
  });
};

export const runConsistencyCheck = async (text: string): Promise<ConsistencyResponse> => {
  const token = getAuthTokenOrThrow();
  return api.post<ConsistencyResponse>(
    '/suggestions/consistency-check',
    { text },
    { authToken: token }
  );
};
