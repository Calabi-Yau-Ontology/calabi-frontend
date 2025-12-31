export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  description?: string;
  allDay?: boolean;
};
