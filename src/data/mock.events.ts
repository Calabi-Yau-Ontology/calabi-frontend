export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  description?: string;
  allDay?: boolean;
};


export const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', calendarId: 'mac-default', title: '팀 미팅', startDate: '2025-12-03', endDate: '2025-12-05' },
  { id: 'e2', calendarId: 'mac-personal', title: '헬스 PT', startDate: '2025-12-04', endDate: '2025-12-05' },
  { id: 'e3', calendarId: 'school', title: '캡스톤 회의', startDate: '2025-12-10' },
  { id: 'e4', calendarId: 'kr-holidays', title: '공휴일', startDate: '2025-12-25' },
  { id: 'e5', calendarId: 'mac-default', title: '논문 초안 정리', startDate: '2025-12-28' },
  // 한 날짜에 여러 개 예시
  { id: 'e6', calendarId: 'school', title: '스터디', startDate: '2025-12-28' },
  { id: 'e7', calendarId: 'mac-personal', title: '러닝', startDate: '2025-12-28' },
  { id: 'e8', calendarId: 'mac-default', title: '긴 제목의 이벤트는 말줄임 처리되어야 함', startDate: '2025-12-28' },
];
