import { cn } from '@/lib/ui/cn';

type Props = {
  title: string;
  color: string; // hex like "#ff2d55"
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

// hex -> rgba
function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function EventItem({ title, color, onClick }: Props) {
  const bg = hexToRgba(color, 0.28);          // 네온 느낌 핵심: 반투명 배경
  const border = hexToRgba(color, 0.45);      // 얇은 테두리
  const glow = `0 0 0 1px ${hexToRgba(color, 0.20)}, 0 2px 10px ${hexToRgba(
    color,
    0.12
  )}`; // 아주 약한 글로우

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full',
        'h-[18px]',                 // 얇게
        'rounded-[9px]',            // 알약 모양
        'px-2',
        'text-[11px] leading-[18px]', // 글자 크기/라인고정(세로 정렬)
        // 'truncate text-center',
        'truncate text-left',
        'text-white/90',
        'focus:outline-none focus:ring-2 focus:ring-white/10'
      )}
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        boxShadow: glow,
      }}
      title={title}
    >
      {title}
    </button>
  );
}
