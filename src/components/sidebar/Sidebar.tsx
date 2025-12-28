import CalendarGroup from './CalendarGroup';
import type { CalendarItem } from '@/data/mock.calendars';

type Props = {
  calendars: CalendarItem[];
  onToggleCalendar: (id: string) => void;
};

export default function Sidebar({ calendars, onToggleCalendar }: Props) {
  const groups = Array.from(new Set(calendars.map((c) => c.source)));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-3 py-3">
        <div className="text-sm font-semibold text-white/85">캘린더</div>
        <div className="text-xs text-white/35">macOS Month UI (mock)</div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-3">
        {groups.map((g) => (
          <CalendarGroup
            key={g}
            title={g as any}
            items={calendars.filter((c) => c.source === g)}
            onToggle={onToggleCalendar}
          />
        ))}
      </div>

      <div className="border-t border-white/10 p-3 text-xs text-white/35">
        Calabi · Frontend
      </div>
    </div>
  );
}
