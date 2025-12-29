type Props = {
  value: string;              // 항상 string
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel: string;
};

export default function SearchBox({ value, onChange, placeholder, ariaLabel }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5">
      <span className="text-white/40">⌕</span>
      <input
        value={value ?? ''}  // undefined 방지 (항상 string)
        onChange={(e) => onChange(e.target.value)}
        className="w-48 bg-transparent text-sm text-white/80 placeholder:text-white/35 focus:outline-none"
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  );
}
