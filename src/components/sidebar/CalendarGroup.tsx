"use client";

import CalendarToggleItem from './CalendarToggleItem';
import type { CalendarItem, CalendarSource } from '@/data/mock.calendars';

type Props = {
  title: CalendarSource;
  items: CalendarItem[];
};

export default function CalendarGroup({ title, items }: Props) {
  return (
    <section className="mb-4">
      <div className="px-3 pb-2 text-xs font-semibold tracking-wide text-white/45">
        {title}
      </div>
      <div className="space-y-1 px-2">
        {items.map((it) => (
          <CalendarToggleItem
            key={it.id}
            name={it.name}
            color={it.color}
            checked={it.checked}
            onToggle={() => {
              // Phase 0에서는 상태관리 아직 안 붙임(UI만)
              console.log('toggle calendar:', it.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}
