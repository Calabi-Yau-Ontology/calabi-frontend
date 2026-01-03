export type CalendarEvent = {
  id: string;
  categoryId: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  description?: string;
  allDay?: boolean;
};
