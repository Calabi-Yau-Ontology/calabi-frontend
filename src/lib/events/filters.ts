import type { CalendarEvent } from '@/data/mock.events';

export function isMultiDayEvent(event: CalendarEvent) {
  return Boolean(event.endDate && event.endDate !== event.startDate);
}

export function filterVisibleEvents(
  events: CalendarEvent[],
  enabledCalendarIds: Set<string>,
  searchQuery: string
) {
  const q = searchQuery.trim().toLowerCase();

  return events
    .filter((e) => enabledCalendarIds.has(e.calendarId))
    .filter((e) => (q ? e.title.toLowerCase().includes(q) : true));
}
