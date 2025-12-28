type Props = {
  days: string[];
};

export default function WeekdayRow({ days }: Props) {
  return (
    <div className="grid grid-cols-7 border-b border-white/10">
      {days.map((d) => (
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
