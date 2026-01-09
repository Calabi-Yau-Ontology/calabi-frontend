import { cn } from '@/lib/ui/cn';
import type { DayCellData } from '@/lib/date/monthGrid';
import type { CalendarEvent } from '@/types/event';
import { toDateKey } from '@/lib/date/dateKey';
import EventItem from './EventItem';
import { isMultiDayEvent } from '@/lib/events/filters';

type Props = {
  day: DayCellData;
  events: CalendarEvent[];
  colorByCategoryId: Map<string, string>;
  reservedTopPx?: number;
  onClickDate: (dateKey: string) => void;
  onClickEvent: (eventId: string) => void;
  onClickMore: (dateKey: string, events: CalendarEvent[]) => void;
  onDragStart: (dateKey: string) => void;
  onDragEnter: (dateKey: string) => void;
  suppressClick: boolean;
  isDragging: boolean;
  moreLabel: (count: number) => string;
  consistencyReady: Record<string, true>;
  consistencyPending: Record<string, true>;
  onEventHover: (eventId: string, anchor: HTMLElement) => void;
  onEventLeave: () => void;
};

export default function DayCell({
  day,
  events,
  colorByCategoryId,
  reservedTopPx,
  onClickDate,
  onClickEvent,
  onClickMore,
  onDragStart,
  onDragEnter,
  suppressClick,
  isDragging,
  moreLabel,
  consistencyReady,
  consistencyPending,
  onEventHover,
  onEventLeave,
}: Props) {
  const key = toDateKey(day.date);

  const dayEvents = events
    .filter((e) => e.startDate === key)
    .filter((e) => !isMultiDayEvent(e));

  const MAX = 3;
  const visible = dayEvents.slice(0, MAX);
  const remaining = dayEvents.length - visible.length;
  const topPad = reservedTopPx ?? 0;

  return (
    <div
      className={cn(
        'relative h-28 border-r border-b border-white/10 px-2 py-1',
        'overflow-hidden',
        !day.isCurrentMonth && 'bg-white/2'
      )}
      onClick={() => {
        if (suppressClick || isDragging) return;
        onClickDate(key);
      }}   // ✅ 여기 (DayCell 최상단 div)
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClickDate(key);
      }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        onDragStart(key);
      }}
      onMouseEnter={() => {
        if (!isDragging) return;
        onDragEnter(key);
      }}
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
        className="flex flex-col gap-[2px] overflow-hidden -mx-2"
        style={{ marginTop: 4 + topPad }}
        >
        {visible.map((e) => {
          const hasReady = Boolean(consistencyReady[e.id]);
          const hasPending = Boolean(consistencyPending[e.id]);
          return (
            <EventItem
              key={e.id}
              title={e.title}
              color={colorByCategoryId.get(e.categoryId) ?? '#999999'}
              onClick={(ev) => {
                ev?.stopPropagation?.();
                onClickEvent(e.id);
              }}
              onMouseEnter={(ev) => {
                if (!hasReady && !hasPending) return;
                onEventHover(e.id, ev.currentTarget);
              }}
              onMouseLeave={() => {
                if (!hasReady && !hasPending) return;
                onEventLeave();
              }}
              highlight={hasReady}
            />
          );
        })}

        {remaining > 0 && (
            <button
                type="button"
                className="text-[10px] leading-4 text-white/55 text-center hover:text-white/75"
                onClick={(ev) => { ev.stopPropagation(); onClickMore(key, dayEvents); }}
                >
                {moreLabel(remaining)}
            </button>
        )}
        </div>
    </div>
  );
}
