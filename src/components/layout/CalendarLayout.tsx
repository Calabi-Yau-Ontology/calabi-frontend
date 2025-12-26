import Sidebar from '@/components/sidebar/Sidebar';
import CalendarHeader from '@/components/header/CalendarHeader';

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="flex h-full">
        <aside className="w-[260px] shrink-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--panel))]">
          <Sidebar />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-[rgb(var(--panel-2))]">
          <CalendarHeader />
          <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
