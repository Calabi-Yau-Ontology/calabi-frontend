import NavButtons from './NavButtons';
import ViewSwitcher from './ViewSwitcher';
import SearchBox from './SearchBox';

export default function CalendarHeader() {
  // Phase 0: 상태관리 없이 정적인 월 표시
  const title = '2025년 11월';

  return (
    <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3">
      <div className="flex items-center gap-3">
        <NavButtons />
      </div>

      <div className="text-base font-semibold text-white/85">{title}</div>

      <div className="flex items-center gap-3">
        <ViewSwitcher />
        <SearchBox />
      </div>
    </div>
  );
}
