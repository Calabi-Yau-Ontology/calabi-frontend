'use client';

import ModalShell from './ModalShell';
import type { CalendarEvent } from '@/data/mock.events';
import type { CalendarItem } from '@/data/mock.calendars';

type Props = {
  open: boolean;
  dateKey: string | null;
  events: CalendarEvent[];
  calendars: CalendarItem[];
  onClickEvent: (event: CalendarEvent) => void;
  onClose: () => void;
};

export default function DayEventsModal({
  open,
  dateKey,
  events,
  calendars,
  onClickEvent,
  onClose,
}: Props) {
  const colorById = new Map(calendars.map((c) => [c.id, c.color] as const));
  const nameById = new Map(calendars.map((c) => [c.id, c.name] as const));

  return (
    <ModalShell open={open} title={dateKey ? `${dateKey} 이벤트` : '이벤트'} onClose={onClose}>
      <div className="space-y-2">
        {events.map((e) => (
          <button
            key={e.id}
            type="button"
            className="flex w-full items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
            onClick={() => onClickEvent(e)}
          >
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colorById.get(e.calendarId) ?? '#999' }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white/90">{e.title}</div>
              <div className="text-xs text-white/50">
                {nameById.get(e.calendarId) ?? e.calendarId}
              </div>
            </div>
          </button>
        ))}
        {events.length === 0 && <div className="text-sm text-white/60">이 날의 이벤트가 없어요.</div>}
      </div>
    </ModalShell>
  );
}
