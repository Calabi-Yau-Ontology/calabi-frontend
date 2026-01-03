import CategoryToggleItem from './CategoryToggleItem';
import type { CategoryItem, CategorySource } from '@/types/category';

type Props = {
  title: CategorySource;
  items: CategoryItem[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  editLabel: string;
};

export default function CategoryGroup({ title, items, onToggle, onEdit, editLabel }: Props) {
  return (
    <section className="mb-4">
      <div className="px-3 pb-2 text-xs font-semibold tracking-wide text-white/45">
        {title}
      </div>
      <div className="space-y-1 px-2">
        {items.map((it) => (
          <CategoryToggleItem
            key={it.id}
            name={it.name}
            color={it.color}
            checked={it.checked}
            onToggle={() => onToggle(it.id)}
            onEdit={() => onEdit(it.id)}
            editLabel={editLabel}
          />
        ))}
      </div>
    </section>
  );
}
