import { api } from '@/lib/api/client';
import { getAuthToken } from '@/lib/auth/storage';
import { parseYmd, toYmd } from '@/lib/date/ymd';
import type { CalendarEvent } from '@/types/event';

type BackendEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  categoryId?: string | null;
  nerCacheStatus?: 'pending' | 'ready' | 'error' | 'consumed' | null;
};

type EventPayload = {
  title?: string;
  description?: string | null;
  startTime?: string;
  endTime?: string | null;
  location?: string | null;
  categoryId?: string;
};

const getAuthTokenOrThrow = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }
  return token;
};

const toIsoString = (ymd: string) => {
  const date = parseYmd(ymd);
  return date.toISOString();
};

const toPayload = (draft: Omit<CalendarEvent, 'id'>): EventPayload => {
  const payload: EventPayload = {
    title: draft.title,
    description: draft.description ?? null,
    startTime: toIsoString(draft.startDate),
    categoryId: draft.categoryId,
  };

  if (draft.endDate) {
    payload.endTime = toIsoString(draft.endDate);
  }

  return payload;
};

const toUpdatePayload = (patch: Partial<Omit<CalendarEvent, 'id'>>): EventPayload => {
  const payload: EventPayload = {};

  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description ?? null;
  if (patch.startDate !== undefined) payload.startTime = toIsoString(patch.startDate);
  if (patch.endDate !== undefined) {
    payload.endTime = patch.endDate ? toIsoString(patch.endDate) : null;
  }
  if (patch.categoryId !== undefined) payload.categoryId = patch.categoryId;

  return payload;
};

const toCalendarEvent = (
  event: BackendEvent,
  fallbackCategoryId: string
): CalendarEvent => {
  const startDate = toYmd(new Date(event.startTime));
  const endDate = event.endTime ? toYmd(new Date(event.endTime)) : undefined;

  return {
    id: event.id,
    categoryId: event.categoryId ?? fallbackCategoryId,
    title: event.title,
    startDate,
    endDate,
    description: event.description ?? undefined,
    allDay: true,
    nerCacheStatus: event.nerCacheStatus ?? null,
  };
};

export const fetchEvents = async (fallbackCategoryId: string) => {
  const token = getAuthTokenOrThrow();
  const events = await api.get<BackendEvent[]>('/events', { authToken: token });
  return events.map((event) => toCalendarEvent(event, fallbackCategoryId));
};

export const createEvent = async (draft: Omit<CalendarEvent, 'id'>) => {
  const token = getAuthTokenOrThrow();
  const created = await api.post<BackendEvent>('/events', toPayload(draft), {
    authToken: token,
  });
  return toCalendarEvent(created, draft.categoryId);
};

export const updateEvent = async (
  id: string,
  patch: Partial<Omit<CalendarEvent, 'id'>>,
  fallbackCategoryId: string
) => {
  const token = getAuthTokenOrThrow();
  const updated = await api.patch<BackendEvent>(
    `/events/${id}`,
    toUpdatePayload(patch),
    { authToken: token }
  );
  const nextCategoryId = patch.categoryId ?? fallbackCategoryId;
  return toCalendarEvent(updated, nextCategoryId);
};

export const deleteEvent = async (id: string) => {
  const token = getAuthTokenOrThrow();
  await api.delete<{ deleted: boolean }>(`/events/${id}`, { authToken: token });
  return id;
};
