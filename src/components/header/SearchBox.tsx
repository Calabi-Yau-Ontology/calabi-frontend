export default function SearchBox() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5">
      <span className="text-white/40">⌕</span>
      <input
        className="w-48 bg-transparent text-sm text-white/80 placeholder:text-white/35 focus:outline-none"
        placeholder="검색"
        aria-label="이벤트 검색"
      />
    </div>
  );
}
