import type { CalendarItem } from '@/data/mock.calendars';
import CalendarToggleItem from './CalendarToggleItem';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  calendars: CalendarItem[];
  onToggleCalendar: (id: string) => void;
  onAddCalendar: () => void;
  onEditCalendar: (id: string) => void;
  theme: 'dark' | 'light';
  onChangeTheme: (next: 'dark' | 'light') => void;
};

export default function Sidebar({
  calendars,
  onToggleCalendar,
  onAddCalendar,
  onEditCalendar,
  theme,
  onChangeTheme,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-3 py-3">
        <Link
          href="/home"
          role="button"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold tracking-wide text-white/85 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          aria-label="홈으로 이동"
        >
          <Image src="/logo.png" alt="Calabi logo" width={40} height={40} className="h-10 w-10" />
          <span>Calabi</span>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-3">
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-white/45">
            <span>카테고리</span>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10"
              onClick={onAddCalendar}
              aria-label="카테고리 추가"
            >
              +
            </button>
          </div>
        </div>
        <div className="space-y-1 px-2">
          {calendars.map((it) => (
            <CalendarToggleItem
              key={it.id}
              name={it.name}
              color={it.color}
              checked={it.checked}
              onToggle={() => onToggleCalendar(it.id)}
              onEdit={() => onEditCalendar(it.id)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="mb-2 text-xs font-semibold tracking-wide text-white/45">설정</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChangeTheme('light')}
            className={[
              'rounded-md border px-2 py-1 text-xs',
              theme === 'light'
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
            ].join(' ')}
          >
            라이트
          </button>
          <button
            type="button"
            onClick={() => onChangeTheme('dark')}
            className={[
              'rounded-md border px-2 py-1 text-xs',
              theme === 'dark'
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
            ].join(' ')}
          >
            다크
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 p-3 text-xs text-white/35">
        Calabi · Frontend
      </div>
    </div>
  );
}
