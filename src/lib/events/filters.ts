import type { CalendarEvent } from '@/types/event';

export function isMultiDayEvent(event: CalendarEvent) {
  return Boolean(event.endDate && event.endDate !== event.startDate);
}

export function filterVisibleEvents(
  events: CalendarEvent[],
  enabledCategoryIds: Set<string>,
  searchQuery: string
) {
  const q = searchQuery.trim().toLowerCase();

  return events
    .filter((e) => enabledCategoryIds.has(e.categoryId))
    .filter((e) => (q ? e.title.toLowerCase().includes(q) : true));
}
