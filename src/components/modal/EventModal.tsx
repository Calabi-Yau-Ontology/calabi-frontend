'use client';

import { useEffect, useMemo, useState } from 'react';
import ModalShell from './ModalShell';
import type { CalendarEvent } from '@/data/mock.events';
import type { CalendarItem } from '@/data/mock.calendars';
import { validateEventDraft, type EventDraft } from '@/lib/validation/eventValidation';

type Props = {
  open: boolean;
  mode: 'view' | 'create';
  event?: CalendarEvent | null;
  defaultDateKey?: string | null;
  defaultEndDateKey?: string | null;
  calendars: CalendarItem[];
  onClose: () => void;

  // ✅ Phase5: 실제 반영을 위해 콜백 추가
  onCreate: (draft: Omit<CalendarEvent, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => void;
  onDelete: (id: string) => void;
};

export default function EventModal({
  open,
  mode,
  event,
  defaultDateKey,
  defaultEndDateKey,
  calendars,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [uiMode, setUiMode] = useState<'view' | 'edit' | 'create'>('view');
  const [draft, setDraft] = useState<EventDraft>({
    calendarId: calendars.find((c) => c.checked)?.id ?? calendars[0]?.id ?? '',
    title: '',
    startDate: defaultDateKey ?? '',
    endDate: undefined,
    description: '',
    allDay: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    if (mode === 'create') {
      const normalizedEnd =
        defaultEndDateKey && defaultDateKey && defaultEndDateKey !== defaultDateKey
          ? defaultEndDateKey
          : undefined;
      setUiMode('create');
      setDraft({
        calendarId: calendars.find((c) => c.checked)?.id ?? calendars[0]?.id ?? '',
        title: '',
        startDate: defaultDateKey ?? '',
        endDate: normalizedEnd,
        description: '',
        allDay: true,
      });
      setErrors({});
      return;
    }

    // view 모드로 열릴 때
    setUiMode('view');
    if (event) {
      setDraft({
        calendarId: event.calendarId,
        title: event.title ?? '',
        startDate: event.startDate,
        endDate: event.endDate,
        description: event.description ?? '',
        allDay: event.allDay ?? true,
      });
      setErrors({});
    }
  }, [open, mode, event, defaultDateKey, defaultEndDateKey, calendars]);

  const headerTitle = useMemo(() => {
    if (uiMode === 'create') return '새 이벤트';
    return '이벤트';
  }, [uiMode]);

  const calendar = calendars.find((c) => c.id === draft.calendarId);

  const submit = () => {
    const nextErrors = validateEventDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // endDate가 startDate와 같으면 굳이 저장 안 해도 됨(선택)
    const normalized: Omit<CalendarEvent, 'id'> = {
      calendarId: draft.calendarId,
      title: draft.title.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate?.trim() ? draft.endDate : undefined,
      description: draft.description?.trim() ? draft.description : undefined,
      allDay: draft.allDay ?? true,
    };

    if (uiMode === 'create') {
      onCreate(normalized);
      onClose();
      return;
    }

    if (uiMode === 'edit' && event?.id) {
      onUpdate(event.id, normalized);
      setUiMode('view');
    }
  };

  const startEdit = () => setUiMode('edit');

  const remove = () => {
    if (!event?.id) return;
    onDelete(event.id);
    onClose();
  };

  return (
    <ModalShell open={open} title={headerTitle} onClose={onClose}>
      {/* VIEW */}
      {uiMode === 'view' && event ? (
        <div className="space-y-3">
          <div className="text-lg font-semibold text-white/90">{event.title}</div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <span
              className="h-2.5 w-2.5 rounded-sm border border-white/10"
              style={{ backgroundColor: calendar?.color ?? '#999' }}
            />
            <span>{calendar?.name ?? event.calendarId}</span>
          </div>

          <div className="text-sm text-white/70">
            {event.startDate}
            {event.endDate && event.endDate !== event.startDate ? ` ~ ${event.endDate}` : ''}
          </div>

          {event.description && (
            <div className="whitespace-pre-wrap rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              {event.description}
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              onClick={startEdit}
            >
              수정
            </button>
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              onClick={remove}
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        /* CREATE / EDIT */
        <div className="space-y-3">
          <div className="grid gap-2">
            <label className="text-sm text-white/70">제목</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
              placeholder="이벤트 제목"
            />
            <div className="min-h-[16px] text-xs text-red-300">
              {errors.title ?? ''}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">카테고리</label>
            <select
              value={draft.calendarId}
              onChange={(e) => setDraft((p) => ({ ...p, calendarId: e.target.value }))}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="min-h-[16px] text-xs text-red-300">
              {errors.calendarId ?? ''}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm text-white/70">시작</label>
              <input
                type="date"
                value={draft.startDate ?? ''}
                onChange={(e) =>
                  setDraft((p) => {
                    const nextStart = e.target.value;
                    const nextEnd =
                      p.endDate && nextStart && p.endDate < nextStart ? undefined : p.endDate;
                    return { ...p, startDate: nextStart, endDate: nextEnd };
                  })
                }
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
              />
              <div className="min-h-[16px] text-xs text-red-300">
                {errors.startDate ?? ''}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-white/70">끝(선택)</label>
              <input
                type="date"
                value={draft.endDate ?? ''}
                min={draft.startDate ?? undefined}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, endDate: e.target.value || undefined }))
                }
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
              />
              <div className="min-h-[16px] text-xs text-red-300">
                {errors.endDate ?? ''}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">설명(선택)</label>
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className="min-h-[90px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
              placeholder="메모"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={submit}
            >
              저장
            </button>
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={() => {
                // create는 그냥 닫기, edit은 view로 돌아가기
                if (uiMode === 'edit') setUiMode('view');
                else onClose();
              }}
            >
              취소
            </button>
          </div>

          {uiMode === 'edit' && event?.id && (
            <button
              type="button"
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={remove}
            >
              삭제
            </button>
          )}
        </div>
      )}
    </ModalShell>
  );
}
