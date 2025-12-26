const views = ['일', '주', '월', '년'] as const;

export default function ViewSwitcher() {
  const active = '월';

  return (
    <div className="flex items-center rounded-md border border-white/10 bg-white/5 p-1">
      {views.map((v) => (
        <button
          key={v}
          className={[
            'px-2 py-1 text-sm rounded-[6px]',
            v === active ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/10',
          ].join(' ')}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
