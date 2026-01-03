'use client';

import ModalShell from './ModalShell';
import type { CalendarEvent } from '@/types/event';
import type { CategoryItem } from '@/types/category';
import type { Labels } from '@/lib/i18n';

type Props = {
  open: boolean;
  dateKey: string | null;
  events: CalendarEvent[];
  categories: CategoryItem[];
  onClickEvent: (event: CalendarEvent) => void;
  onClose: () => void;
  labels: Labels;
};

export default function DayEventsModal({
  open,
  dateKey,
  events,
  categories,
  onClickEvent,
  onClose,
  labels,
}: Props) {
  const colorById = new Map(categories.map((c) => [c.id, c.color] as const));
  const nameById = new Map(categories.map((c) => [c.id, c.name] as const));

  return (
    <ModalShell
      open={open}
      title={labels.modals.dayEventsTitle(dateKey)}
      onClose={onClose}
      closeLabel={labels.modals.close}
    >
      <div className="space-y-2">
        {events.map((e) => (
          <button
            key={e.id}
            type="button"
            className="flex w-full items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
            onClick={() => onClickEvent(e)}
          >
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colorById.get(e.categoryId) ?? '#999' }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white/90">{e.title}</div>
              <div className="text-xs text-white/50">
                {nameById.get(e.categoryId) ?? e.categoryId}
              </div>
            </div>
          </button>
        ))}
        {events.length === 0 && (
          <div className="text-sm text-white/60">{labels.modals.dayEventsEmpty}</div>
        )}
      </div>
    </ModalShell>
  );
}
