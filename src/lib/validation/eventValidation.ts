import type { CalendarEvent } from '@/data/mock.events';

export type EventDraft = Omit<CalendarEvent, 'id'> & { id?: string };

export function validateEventDraft(draft: EventDraft) {
  const errors: Record<string, string> = {};

  if (!draft.title?.trim()) errors.title = '제목을 입력하세요.';
  if (!draft.calendarId) errors.calendarId = '캘린더를 선택하세요.';
  if (!draft.startDate) errors.startDate = '시작 날짜를 선택하세요.';

  const end = draft.endDate?.trim();
  if (end && draft.startDate && end < draft.startDate) {
    errors.endDate = '끝 날짜는 시작 날짜보다 빠를 수 없어요.';
  }

  return errors;
}
