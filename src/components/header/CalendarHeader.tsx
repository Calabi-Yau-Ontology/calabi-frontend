import NavButtons from './NavButtons';
import ViewSwitcher from './ViewSwitcher';
import SearchBox from './SearchBox';

type Props = {
  title: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

export default function CalendarHeader({
  title,
  onPrevMonth,
  onNextMonth,
  onToday,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3">
      <div className="flex items-center gap-3">
        <NavButtons onPrev={onPrevMonth} onNext={onNextMonth} onToday={onToday} />
      </div>

      <div className="text-base font-semibold text-white/85">{title}</div>

      <div className="flex items-center gap-3">
        <ViewSwitcher />
        <SearchBox />
      </div>
    </div>
  );
}
