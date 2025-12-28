import type { CalendarEvent } from '@/data/mock.events';

export type EventDraft = Omit<CalendarEvent, 'id'> & { id?: string };

type ValidationMessages = {
  titleRequired: string;
  calendarRequired: string;
  startRequired: string;
  endBeforeStart: string;
};

export function validateEventDraft(draft: EventDraft, messages: ValidationMessages) {
  const errors: Record<string, string> = {};

  if (!draft.title?.trim()) errors.title = messages.titleRequired;
  if (!draft.calendarId) errors.calendarId = messages.calendarRequired;
  if (!draft.startDate) errors.startDate = messages.startRequired;

  const end = draft.endDate?.trim();
  if (end && draft.startDate && end < draft.startDate) {
    errors.endDate = messages.endBeforeStart;
  }

  return errors;
}
