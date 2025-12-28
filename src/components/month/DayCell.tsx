import { cn } from '@/lib/ui/cn';
import type { DayCellData } from '@/lib/date/monthGrid';

type Props = {
  day: DayCellData;
};

export default function DayCell({ day }: Props) {
  return (
    <div
      className={cn(
        'relative h-28 border-r border-b border-white/10 px-2 py-1',
        !day.isCurrentMonth && 'bg-white/2'
      )}
    >
      <div
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
          day.isToday
            ? 'bg-blue-500 text-white'
            : day.isCurrentMonth
            ? 'text-white/85'
            : 'text-white/35'
        )}
      >
        {day.date.getDate()}
      </div>
    </div>
  );
}
