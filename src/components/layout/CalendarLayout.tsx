import Sidebar from '@/components/sidebar/Sidebar';
import CalendarHeader from '@/components/header/CalendarHeader';
import type { CalendarItem } from '@/data/mock.calendars';
import type { Labels, Language } from '@/lib/i18n';

type Props = {
  title: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;

  calendars: CalendarItem[];
  onToggleCalendar: (id: string) => void;
  onAddCalendar: () => void;
  onEditCalendar: (id: string) => void;

  searchQuery: string;
  onChangeSearch: (v: string) => void;
  theme: 'dark' | 'light';
  onChangeTheme: (next: 'dark' | 'light') => void;
  language: Language;
  onChangeLanguage: (next: Language) => void;
  onLogout: () => void;
  labels: Labels;

  children: React.ReactNode;
};

export default function CalendarLayout({
  title, onPrevMonth, onNextMonth, onToday,
  calendars, onToggleCalendar, onAddCalendar, onEditCalendar,
  searchQuery, onChangeSearch,
  theme, onChangeTheme,
  language, onChangeLanguage,
  onLogout,
  labels,
  children,
}: Props) {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="flex h-full">
        <aside className="w-[260px] shrink-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--panel))]">
          <Sidebar
            calendars={calendars}
            onToggleCalendar={onToggleCalendar}
            onAddCalendar={onAddCalendar}
            onEditCalendar={onEditCalendar}
            theme={theme}
            onChangeTheme={onChangeTheme}
            language={language}
            onChangeLanguage={onChangeLanguage}
            onLogout={onLogout}
            labels={labels}
          />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-[rgb(var(--panel-2))]">
          <CalendarHeader
            title={title}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
            onToday={onToday}
            searchQuery={searchQuery}
            onChangeSearch={onChangeSearch}
            labels={labels}
          />
          <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
