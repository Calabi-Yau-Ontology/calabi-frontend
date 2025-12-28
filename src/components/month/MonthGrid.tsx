import WeekdayRow from './WeekdayRow';
import DayCell from './DayCell';
import { getMonthGrid } from '@/lib/date/monthGrid';

type Props = {
  year: number;
  month: number; // 0-based
};

export default function MonthGrid({ year, month }: Props) {
  const days = getMonthGrid(year, month);

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <WeekdayRow />
      <div className="grid grid-cols-7">
        {days.map((d, idx) => (
          <DayCell key={idx} day={d} />
        ))}
      </div>
    </div>
  );
}
