type Props = {
  value: string;              // 항상 string
  onChange: (v: string) => void;
};

export default function SearchBox({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5">
      <span className="text-white/40">⌕</span>
      <input
        value={value ?? ''}  // undefined 방지 (항상 string)
        onChange={(e) => onChange(e.target.value)}
        className="w-48 bg-transparent text-sm text-white/80 placeholder:text-white/35 focus:outline-none"
        placeholder="검색"
        aria-label="이벤트 검색"
      />
    </div>
  );
}
