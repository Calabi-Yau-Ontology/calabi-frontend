type Props = {
  views: string[];
};

export default function ViewSwitcher({ views }: Props) {
  const activeIndex = 2;

  return (
    <div className="flex items-center rounded-md border border-white/10 bg-white/5 p-1">
      {views.map((v, idx) => (
        <button
          key={v}
          className={[
            'px-2 py-1 text-sm rounded-[6px]',
            idx === activeIndex ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/10',
          ].join(' ')}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
