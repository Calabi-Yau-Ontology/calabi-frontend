export type CalendarSource = '나의 Mac' | 'iCloud' | 'Google' | '기타';


export type CalendarItem = {
  id: string;
  source: CalendarSource;
  name: string;
  color: string; // tailwind color token (bg-*) 대신 raw hex로도 가능
  checked: boolean;
  isDefault?: boolean;
};
