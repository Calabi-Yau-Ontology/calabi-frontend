import { MOCK_CALENDARS } from '@/data/mock.calendars';
import CalendarGroup from './CalendarGroup';

export default function Sidebar() {
  const groups = Array.from(new Set(MOCK_CALENDARS.map((c) => c.source)));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-3 py-3">
        <div className="text-sm font-semibold text-white/85">캘린더</div>
        <div className="text-xs text-white/35">macOS Month UI (mock)</div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-3">
        {groups.map((g) => (
          <CalendarGroup key={g} title={g as any} items={MOCK_CALENDARS.filter((c) => c.source === g)} />
        ))}
      </div>

      <div className="border-t border-white/10 p-3 text-xs text-white/35">
        Calabi · Frontend
      </div>
    </div>
  );
}
