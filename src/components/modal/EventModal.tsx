'use client';

import { useEffect, useMemo, useState } from 'react';
import ModalShell from './ModalShell';
import type { CalendarEvent } from '@/data/mock.events';
import type { CalendarItem } from '@/data/mock.calendars';
import { validateEventDraft, type EventDraft } from '@/lib/validation/eventValidation';
import type { Labels } from '@/lib/i18n';

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
  labels: Labels;
  dateInputLang: string;
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
  labels,
  dateInputLang,
}: Props) {
  const getDefaultCategoryId = () =>
    calendars.find((c) => c.isDefault)?.id ??
    calendars.find((c) => c.checked)?.id ??
    calendars[0]?.id ??
    '';
  const [uiMode, setUiMode] = useState<'view' | 'edit' | 'create'>('view');
  const [draft, setDraft] = useState<EventDraft>({
    categoryId: getDefaultCategoryId(),
    title: '',
    startDate: defaultDateKey ?? '',
    endDate: undefined,
    description: '',
    allDay: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEnglishDate = dateInputLang.toLowerCase().startsWith('en');

  useEffect(() => {
    if (!open) return;

    if (mode === 'create') {
      const normalizedEnd =
        defaultEndDateKey && defaultDateKey && defaultEndDateKey !== defaultDateKey
          ? defaultEndDateKey
          : undefined;
      const nextStart = defaultDateKey ?? '';
      setUiMode('create');
      setDraft({
        categoryId: getDefaultCategoryId(),
        title: '',
        startDate: nextStart,
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
        categoryId: event.categoryId,
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
    if (uiMode === 'create') return labels.modals.event.newTitle;
    return labels.modals.event.title;
  }, [uiMode, labels]);

  const calendar = calendars.find((c) => c.id === draft.categoryId);

  const submit = () => {
    const nextErrors = validateEventDraft(draft, labels.validation);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // endDate가 startDate와 같으면 굳이 저장 안 해도 됨(선택)
    const normalized: Omit<CalendarEvent, 'id'> = {
      categoryId: draft.categoryId,
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
    <ModalShell open={open} title={headerTitle} onClose={onClose} closeLabel={labels.modals.close}>
      {/* VIEW */}
      {uiMode === 'view' && event ? (
        <div className="space-y-3">
          <div className="text-lg font-semibold text-white/90">{event.title}</div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <span
              className="h-2.5 w-2.5 rounded-sm border border-white/10"
              style={{ backgroundColor: calendar?.color ?? '#999' }}
            />
            <span>{calendar?.name ?? event.categoryId}</span>
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
              {labels.modals.event.edit}
            </button>
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              onClick={remove}
            >
              {labels.modals.event.delete}
            </button>
          </div>
        </div>
      ) : (
        /* CREATE / EDIT */
        <div className="space-y-3">
          <div className="grid gap-2">
            <label className="text-sm text-white/70">{labels.modals.event.titleLabel}</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
              placeholder={labels.modals.event.titlePlaceholder}
            />
            <div className="min-h-[16px] text-xs text-red-300">
              {errors.title ?? ''}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">{labels.modals.event.categoryLabel}</label>
            <select
              value={draft.categoryId}
              onChange={(e) => setDraft((p) => ({ ...p, categoryId: e.target.value }))}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="min-h-[16px] text-xs text-red-300">
              {errors.categoryId ?? ''}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm text-white/70">{labels.modals.event.startLabel}</label>
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
              lang={dateInputLang}
              placeholder={isEnglishDate ? 'YY.MM.DD' : undefined}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            />
              <div className="min-h-[16px] text-xs text-red-300">
                {errors.startDate ?? ''}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-white/70">{labels.modals.event.endLabel}</label>
            <input
              type="date"
              value={draft.endDate ?? ''}
              min={draft.startDate ?? undefined}
              onChange={(e) =>
                setDraft((p) => ({ ...p, endDate: e.target.value || undefined }))
              }
              lang={dateInputLang}
              placeholder={isEnglishDate ? 'YY.MM.DD' : undefined}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            />
              <div className="min-h-[16px] text-xs text-red-300">
                {errors.endDate ?? ''}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">{labels.modals.event.descriptionLabel}</label>
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className="min-h-[90px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
              placeholder={labels.modals.event.descriptionPlaceholder}
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={submit}
            >
              {labels.modals.event.save}
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
              {labels.modals.event.cancel}
            </button>
          </div>

          {uiMode === 'edit' && event?.id && (
            <button
              type="button"
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={remove}
            >
              {labels.modals.event.delete}
            </button>
          )}
        </div>
      )}
    </ModalShell>
  );
}
