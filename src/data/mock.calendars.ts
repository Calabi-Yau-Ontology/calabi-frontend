export type CalendarSource = '나의 Mac' | 'iCloud' | 'Google' | '기타';


export type CalendarItem = {
  id: string;
  source: CalendarSource;
  name: string;
  color: string; // tailwind color token (bg-*) 대신 raw hex로도 가능
  checked: boolean;
};

export const MOCK_CALENDARS: CalendarItem[] = [
  { id: 'mac-default', source: '나의 Mac', name: '일정', color: '#3b82f6', checked: true },
  { id: 'mac-personal', source: '나의 Mac', name: '개인 일정', color: '#a855f7', checked: true },
  { id: 'school', source: 'Google', name: '학교 일정', color: '#22c55e', checked: true },
  { id: 'kr-holidays', source: '기타', name: '대한민국 공휴일', color: '#f97316', checked: true },
];
