import CalendarToggleItem from './CalendarToggleItem';
import type { CalendarItem, CalendarSource } from '@/data/mock.calendars';

type Props = {
  title: CalendarSource;
  items: CalendarItem[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
};

export default function CalendarGroup({ title, items, onToggle, onEdit }: Props) {
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
            onToggle={() => onToggle(it.id)}
            onEdit={() => onEdit(it.id)}
          />
        ))}
      </div>
    </section>
  );
}
