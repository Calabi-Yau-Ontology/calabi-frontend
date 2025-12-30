export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export type ApiFetchOptions = RequestInit & {
  authToken?: string;
  query?: Record<string, QueryValue>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

const buildUrl = (path: string, query?: Record<string, QueryValue>) => {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  const url = new URL(cleanPath, `${base}/`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};

const isJsonResponse = (contentType: string | null) =>
  Boolean(contentType && contentType.includes('application/json'));

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { authToken, query, headers, ...init } = options;
  const url = buildUrl(path, query);
  const finalHeaders = new Headers(headers);

  if (authToken) {
    finalHeaders.set('Authorization', `Bearer ${authToken}`);
  }

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !finalHeaders.has('Content-Type')
  ) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers: finalHeaders });

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError('Request failed', response.status);
    }
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  const payload = isJsonResponse(contentType)
    ? await response.json()
    : await response.text().catch(() => null);

  if (!response.ok) {
    throw new ApiError('Request failed', response.status, payload);
  }

  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new ApiError('API error', response.status, payload);
    }
    return envelope.data;
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};