"use client";

import { cn } from '@/lib/ui/cn';

type Props = {
  name: string;
  color: string;
  checked: boolean;
  onToggle?: () => void;
};

export default function CalendarToggleItem({ name, color, checked, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left',
        'hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/10'
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'h-3.5 w-3.5 rounded-[4px] border border-white/15',
          checked ? '' : 'opacity-40'
        )}
        style={{ backgroundColor: color }}
      />
      <span className={cn('text-sm', checked ? 'text-[rgb(var(--text))]' : 'text-[rgb(var(--muted))]')}>
        {name}
      </span>
      <span className="ml-auto text-xs text-white/25 opacity-0 group-hover:opacity-100">⌥</span>
    </button>
  );
}
