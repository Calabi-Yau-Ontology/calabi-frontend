import type { CalendarItem } from '@/data/mock.calendars';
import CalendarToggleItem from './CalendarToggleItem';
import Image from 'next/image';
import Link from 'next/link';
import type { Labels, Language } from '@/lib/i18n';

type Props = {
  calendars: CalendarItem[];
  onToggleCalendar: (id: string) => void;
  onAddCalendar: () => void;
  onEditCalendar: (id: string) => void;
  theme: 'dark' | 'light';
  onChangeTheme: (next: 'dark' | 'light') => void;
  language: Language;
  onChangeLanguage: (next: Language) => void;
  labels: Labels;
};

export default function Sidebar({
  calendars,
  onToggleCalendar,
  onAddCalendar,
  onEditCalendar,
  theme,
  onChangeTheme,
  language,
  onChangeLanguage,
  labels,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-3 py-3">
        <Link
          href="/home"
          role="button"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold tracking-wide text-white/85 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          aria-label={labels.sidebar.homeAria}
        >
          <Image src="/logo.png" alt="Calabi logo" width={40} height={40} className="h-10 w-10" />
          <span>Calabi</span>
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-3">
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-white/45">
            <span>{labels.sidebar.categories}</span>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10"
              onClick={onAddCalendar}
              aria-label={labels.sidebar.addCategoryAria}
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
              editLabel={labels.modals.event.edit}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="mb-2 text-xs font-semibold tracking-wide text-white/45">
          {labels.sidebar.settings}
        </div>
        <div className="space-y-3">
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
              {labels.sidebar.themeLight}
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
              {labels.sidebar.themeDark}
            </button>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold tracking-wide text-white/40">
              {labels.sidebar.language}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeLanguage('ko')}
                className={[
                  'rounded-md border px-2 py-1 text-xs',
                  language === 'ko'
                    ? 'border-white/30 bg-white/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
                ].join(' ')}
              >
                {labels.sidebar.languageKo}
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage('en')}
                className={[
                  'rounded-md border px-2 py-1 text-xs',
                  language === 'en'
                    ? 'border-white/30 bg-white/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
                ].join(' ')}
              >
                {labels.sidebar.languageEn}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-3 text-xs text-white/35">
        Calabi · Frontend
      </div>
    </div>
  );
}
