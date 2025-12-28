import { cn } from '@/lib/ui/cn';
import type { DayCellData } from '@/lib/date/monthGrid';
import type { CalendarEvent } from '@/data/mock.events';
import type { CalendarItem } from '@/data/mock.calendars';
import { toDateKey } from '@/lib/date/dateKey';
import EventItem from './EventItem';

type Props = {
  day: DayCellData;
  events: CalendarEvent[];
  calendars: CalendarItem[];
  searchQuery: string;
  reservedTopPx?: number;
};

export default function DayCell({ day, events, calendars, searchQuery, reservedTopPx }: Props) {
  const key = toDateKey(day.date);

  const enabledCalendarIds = new Set(calendars.filter((c) => c.checked).map((c) => c.id));
  const colorByCalendarId = new Map(calendars.map((c) => [c.id, c.color] as const));

  const q = searchQuery.trim().toLowerCase();

  const dayEvents = events
    .filter((e) => e.startDate === key)
    .filter((e) => !e.endDate || e.endDate === e.startDate)
    .filter((e) => enabledCalendarIds.has(e.calendarId))
    .filter((e) => (q ? e.title.toLowerCase().includes(q) : true));

  const MAX = 3;
  const visible = dayEvents.slice(0, MAX);
  const remaining = dayEvents.length - visible.length;
  const topPad = reservedTopPx ?? 0;

  return (
    <div
      className={cn(
        'relative h-28 border-r border-b border-white/10 px-2 py-1',
        'overflow-hidden',               // 다른 cell 침범 방지
        !day.isCurrentMonth && 'bg-white/2'
      )}
    >
      <div
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
          day.isToday
            ? 'bg-blue-500 text-white'
            : day.isCurrentMonth
            ? 'text-white/85'
            : 'text-white/35'
        )}
      >
        {day.date.getDate()}
      </div>

        {/* 이벤트 영역 */}
        <div
        className="flex flex-col gap-[2px] overflow-hidden"
        style={{ marginTop: 4 + topPad }}
        >
        {visible.map((e) => (
            <EventItem
            key={e.id}
            title={e.title}
            color={colorByCalendarId.get(e.calendarId) ?? '#999999'}
            onClick={() => console.log('open event:', e.id)}
            />
        ))}

        {remaining > 0 && (
            <div className="text-[10px] leading-4 text-white/55 text-center">
            +{remaining}개 더
            </div>
        )}
        </div>
    </div>
  );
}
