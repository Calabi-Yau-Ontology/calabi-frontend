const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function WeekdayRow() {
  return (
    <div className="grid grid-cols-7 border-b border-white/10">
      {DAYS.map((d) => (
        <div
          key={d}
          className="px-2 py-2 text-center text-xs text-white/45"
        >
          {d}
        </div>
      ))}
    </div>
  );
}
