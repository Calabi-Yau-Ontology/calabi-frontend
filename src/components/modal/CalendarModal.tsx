"use client";

import { useEffect, useMemo, useState } from 'react';
import ModalShell from './ModalShell';
import type { CalendarItem, CalendarSource } from '@/data/mock.calendars';
import type { Labels } from '@/lib/i18n';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  calendar?: CalendarItem | null;
  onClose: () => void;
  onCreate: (draft: Omit<CalendarItem, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Omit<CalendarItem, 'id'>>) => void;
  onDelete: (id: string) => void;
  labels: Labels;
};

type Draft = {
  name: string;
  source: CalendarSource;
  color: string;
  checked: boolean;
};

const DEFAULT_COLOR = '#3b82f6';
const DEFAULT_SOURCE: CalendarSource = '기타';

export default function CalendarModal({
  open,
  mode,
  calendar,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  labels,
}: Props) {
  const [draft, setDraft] = useState<Draft>({
    name: '',
    source: DEFAULT_SOURCE,
    color: DEFAULT_COLOR,
    checked: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && calendar) {
      setDraft({
        name: calendar.name,
        source: calendar.source,
        color: calendar.color,
        checked: calendar.checked,
      });
      setError(null);
      return;
    }

    setDraft({
      name: '',
      source: DEFAULT_SOURCE,
      color: DEFAULT_COLOR,
      checked: true,
    });
    setError(null);
  }, [open, mode, calendar]);

  const title = useMemo(
    () => (mode === 'create' ? labels.modals.calendar.titleCreate : labels.modals.calendar.titleEdit),
    [mode, labels]
  );

  const submit = () => {
    if (!draft.name.trim()) {
      setError(labels.modals.calendar.nameError);
      return;
    }

    if (mode === 'create') {
      onCreate({
        name: draft.name.trim(),
        source: draft.source,
        color: draft.color,
        checked: draft.checked,
      });
      onClose();
      return;
    }

    if (calendar?.id) {
      onUpdate(calendar.id, {
        name: draft.name.trim(),
        source: draft.source,
        color: draft.color,
        checked: draft.checked,
      });
      onClose();
    }
  };

  const remove = () => {
    if (!calendar?.id) return;
    onDelete(calendar.id);
    onClose();
  };

  return (
    <ModalShell open={open} title={title} onClose={onClose} closeLabel={labels.modals.close}>
      <div className="space-y-3">
        <div className="grid gap-2">
          <label className="text-sm text-white/70">{labels.modals.calendar.nameLabel}</label>
          <input
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            placeholder={labels.modals.calendar.namePlaceholder}
          />
          <div className="min-h-[16px] text-xs text-red-300">{error ?? ''}</div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">{labels.modals.calendar.colorLabel}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={draft.color}
              onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))}
              className="h-9 w-12 rounded-md border border-white/10 bg-white/5 p-1"
            />
            <input
              value={draft.color}
              onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))}
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={draft.checked}
            onChange={(e) => setDraft((p) => ({ ...p, checked: e.target.checked }))}
          />
          {labels.modals.calendar.defaultVisible}
        </label>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            onClick={submit}
          >
            {labels.modals.calendar.save}
          </button>
          <button
            type="button"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            onClick={onClose}
          >
            {labels.modals.calendar.cancel}
          </button>
        </div>

        {mode === 'edit' && calendar?.id && (
          <button
            type="button"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            onClick={remove}
          >
            {labels.modals.calendar.delete}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
