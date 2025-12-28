'use client';

import ModalShell from './ModalShell';
import type { CalendarEvent } from '@/data/mock.events';
import type { CalendarItem } from '@/data/mock.calendars';

type Props = {
  open: boolean;
  mode: 'view' | 'create';
  event?: CalendarEvent | null;
  defaultDateKey?: string | null; // create 모드에서 YYYY-MM-DD
  calendars: CalendarItem[];
  onClose: () => void;
};

export default function EventModal({
  open,
  mode,
  event,
  defaultDateKey,
  calendars,
  onClose,
}: Props) {
  const title = mode === 'create' ? '새 이벤트' : '이벤트';

  const calendar = mode === 'view'
    ? calendars.find((c) => c.id === event?.calendarId)
    : undefined;

  return (
    <ModalShell open={open} title={title} onClose={onClose}>
      {mode === 'view' && event ? (
        <div className="space-y-3">
          <div className="text-lg font-semibold text-white/90">{event.title}</div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <span className="h-2.5 w-2.5 rounded-sm border border-white/10" style={{ backgroundColor: calendar?.color ?? '#999' }} />
            <span>{calendar?.name ?? event.calendarId}</span>
          </div>

          <div className="text-sm text-white/70">
            {event.startDate}
            {event.endDate && event.endDate !== event.startDate ? ` ~ ${event.endDate}` : ''}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              onClick={() => console.log('edit (phase5)', event.id)}
            >
              수정
            </button>
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              onClick={() => console.log('delete (phase5)', event.id)}
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        // create mode: Phase 4에서는 “트리거/기본값만” 보여주고, 실제 생성은 Phase 5에서
        <div className="space-y-3">
          <div className="text-sm text-white/70">생성 날짜</div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85">
            {defaultDateKey ?? '(날짜 선택)'}
          </div>

          <div className="text-sm text-white/60">
            * 실제 입력 폼/저장은 Phase 5에서 붙입니다.
          </div>

          <button
            type="button"
            className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            onClick={() => console.log('create submit (phase5)')}
          >
            생성(placeholder)
          </button>
        </div>
      )}
    </ModalShell>
  );
}
