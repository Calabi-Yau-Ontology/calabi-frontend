type Props = {
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  labels: {
    header: {
      today: string;
      prevMonth: string;
      nextMonth: string;
    };
  };
};

export default function NavButtons({ onPrev, onNext, onToday, labels }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10"
        aria-label={labels.header.prevMonth}
        type="button"
      >
        ‹
      </button>
      <button
        onClick={onNext}
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10"
        aria-label={labels.header.nextMonth}
        type="button"
      >
        ›
      </button>
      <button
        onClick={onToday}
        className="ml-2 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
        aria-label={labels.header.today}
        type="button"
      >
        {labels.header.today}
      </button>
    </div>
  );
}
