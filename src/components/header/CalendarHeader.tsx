import NavButtons from './NavButtons';
import SearchBox from './SearchBox';
import type { Labels } from '@/lib/i18n';

type Props = {
  title: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;

  searchQuery: string;
  onChangeSearch: (v: string) => void;
  labels: Labels;
};

export default function CalendarHeader({
  title,
  onPrevMonth,
  onNextMonth,
  onToday,
  searchQuery,
  onChangeSearch,
  labels,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3">
      <div className="flex items-center gap-3">
        <NavButtons
          onPrev={onPrevMonth}
          onNext={onNextMonth}
          onToday={onToday}
          labels={labels}
        />
      </div>

      <div className="text-base font-semibold text-white/85">{title}</div>

      <div className="flex items-center gap-3">
        <SearchBox
          value={searchQuery}
          onChange={onChangeSearch}
          placeholder={labels.header.searchPlaceholder}
          ariaLabel={labels.header.searchAria}
        />
      </div>
    </div>
  );
}
