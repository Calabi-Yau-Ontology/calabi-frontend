import { api } from '@/lib/api/client';
import { getAuthToken } from '@/lib/auth/storage';
import type { CalendarItem, CalendarSource } from '@/data/mock.calendars';

type BackendCalendar = {
  id: string;
  name: string;
  color: string;
  isVisible?: boolean;
  isDefault?: boolean;
};

type CalendarPayload = {
  name?: string;
  color?: string;
  isVisible?: boolean;
  isDefault?: boolean;
};

const DEFAULT_SOURCE: CalendarSource = '기타';

const getAuthTokenOrThrow = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }
  return token;
};

const toCalendarItem = (calendar: BackendCalendar): CalendarItem => ({
  id: calendar.id,
  source: DEFAULT_SOURCE,
  name: calendar.name,
  color: calendar.color,
  checked: calendar.isVisible ?? true,
  isDefault: calendar.isDefault ?? false,
});

const toPayload = (draft: Partial<Omit<CalendarItem, 'id'>>): CalendarPayload => {
  const payload: CalendarPayload = {};
  if (draft.name !== undefined) payload.name = draft.name;
  if (draft.color !== undefined) payload.color = draft.color;
  if (draft.checked !== undefined) payload.isVisible = draft.checked;
  if (draft.isDefault !== undefined) payload.isDefault = draft.isDefault;
  return payload;
};

export const fetchCalendars = async () => {
  const token = getAuthTokenOrThrow();
  const calendars = await api.get<BackendCalendar[]>('/categories', { authToken: token });
  return calendars.map((calendar) => toCalendarItem(calendar));
};

export const createCalendar = async (draft: Omit<CalendarItem, 'id'>) => {
  const token = getAuthTokenOrThrow();
  const created = await api.post<BackendCalendar>('/categories', toPayload(draft), {
    authToken: token,
  });
  return toCalendarItem(created);
};

export const updateCalendar = async (
  id: string,
  patch: Partial<Omit<CalendarItem, 'id'>>
) => {
  const token = getAuthTokenOrThrow();
  const updated = await api.patch<BackendCalendar>(`/categories/${id}`, toPayload(patch), {
    authToken: token,
  });
  return toCalendarItem(updated);
};

export const deleteCalendar = async (id: string) => {
  const token = getAuthTokenOrThrow();
  await api.delete<{ deleted: boolean }>(`/categories/${id}`, { authToken: token });
  return id;
};
