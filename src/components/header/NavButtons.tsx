export default function NavButtons() {
  return (
    <div className="flex items-center gap-2">
      <button className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10">
        ‹
      </button>
      <button className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10">
        ›
      </button>
      <button className="ml-2 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10">
        오늘
      </button>
    </div>
  );
}