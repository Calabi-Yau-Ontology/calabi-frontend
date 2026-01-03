'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarLayout from '@/components/layout/CalendarLayout';
import MonthGrid from '@/components/month/MonthGrid';
import EventModal from '@/components/modal/EventModal';
import DayEventsModal from '@/components/modal/DayEventsModal';
import CalendarModal from '@/components/modal/CalendarModal';

import { addMonths, formatYearMonth, getTodayYearMonth } from '@/lib/date/monthNav';
import { type CalendarItem } from '@/data/mock.calendars';
import { type CalendarEvent } from '@/data/mock.events';
import { getLabels, type Language } from '@/lib/i18n';
import { fetchMe } from '@/lib/auth/api';
import { clearAuthSession, getAuthToken, setAuthSession } from '@/lib/auth/storage';
import { createEvent, deleteEvent, fetchEvents, updateEvent } from '@/lib/events/api';
import { createCalendar, deleteCalendar, fetchCalendars, updateCalendar } from '@/lib/calendars/api';
import { updateUserPreferences } from '@/lib/user/preferences';

export default function HomePage() {
  const router = useRouter();
  const [ym, setYm] = useState(() => getTodayYearMonth());
  const [calendars, setCalendars] = useState<CalendarItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [language, setLanguage] = useState<Language>('ko');
  const [authReady, setAuthReady] = useState(false);

  // 모달 상태
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<'view' | 'create'>('view');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [createDateKey, setCreateDateKey] = useState<string | null>(null);
  const [createEndDateKey, setCreateEndDateKey] = useState<string | null>(null);

  const [dayListOpen, setDayListOpen] = useState(false);
  const [dayListDateKey, setDayListDateKey] = useState<string | null>(null);
  const [dayListEvents, setDayListEvents] = useState<CalendarEvent[]>([]);

  const labels = useMemo(() => getLabels(language), [language]);
  const title = useMemo(() => formatYearMonth(ym, language), [ym, language]);
  const dateInputLang = language === 'en' ? 'en-US' : 'ko-KR';
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tempClearToken, setTempClearToken] = useState(0);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarModalMode, setCalendarModalMode] = useState<'create' | 'edit'>('create');
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);

  // create
  const onCreate = async (draft: Omit<CalendarEvent, 'id'>) => {
    try {
      const created = await createEvent(draft);
      setEvents((prev) => [created, ...prev]);
      setTempClearToken((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to create event', error);
    }
  };

  // update
  const onUpdate = async (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => {
    try {
      const existing = events.find((e) => e.id === id);
      const categoryId = patch.categoryId ?? existing?.categoryId ?? getDefaultCategoryId();
      const updated = await updateEvent(id, patch, categoryId);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (error) {
      console.error('Failed to update event', error);
    }
  };

  // delete
  const onDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  const getDefaultCategoryId = () =>
    calendars.find((c) => c.isDefault)?.id ??
    calendars.find((c) => c.checked)?.id ??
    calendars[0]?.id ??
    '';

  const onToggleCalendar = async (id: string) => {
    const target = calendars.find((c) => c.id === id);
    if (!target) return;
    const nextChecked = !target.checked;
    try {
      const updated = await updateCalendar(id, { checked: nextChecked });
      setCalendars((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (error) {
      console.error('Failed to toggle calendar', error);
    }
  };

  const onAddCalendar = () => {
    setCalendarModalMode('create');
    setEditingCalendarId(null);
    setCalendarModalOpen(true);
  };

  const onEditCalendar = (id: string) => {
    setCalendarModalMode('edit');
    setEditingCalendarId(id);
    setCalendarModalOpen(true);
  };

  const onCreateCalendar = async (draft: Omit<CalendarItem, 'id'>) => {
    try {
      const created = await createCalendar(draft);
      setCalendars((prev) => [created, ...prev]);
    } catch (error) {
      console.error('Failed to create calendar', error);
    }
  };

  const onUpdateCalendar = async (id: string, patch: Partial<Omit<CalendarItem, 'id'>>) => {
    try {
      const updated = await updateCalendar(id, patch);
      setCalendars((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (error) {
      console.error('Failed to update calendar', error);
    }
  };

  const onDeleteCalendar = async (id: string) => {
    try {
      await deleteCalendar(id);
      setCalendars((prev) => prev.filter((c) => c.id !== id));
      setEvents((prev) => prev.filter((e) => e.categoryId !== id));
    } catch (error) {
      console.error('Failed to delete calendar', error);
    }
  };

  const onLogout = () => {
    clearAuthSession();
    router.replace('/home');
  };

  const onChangeTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    if (authReady) {
      updateUserPreferences({ theme: next, language }).catch((error) => {
        console.error('Failed to update user preferences', error);
      });
    }
  };

  const onChangeLanguage = (next: Language) => {
    setLanguage(next);
    if (authReady) {
      updateUserPreferences({ theme, language: next }).catch((error) => {
        console.error('Failed to update user preferences', error);
      });
    }
  };

  // MonthGrid로 내려줄 핸들러들
  const onClickDate = (dateKey: string) => {
    setEventModalMode('create');
    setCreateDateKey(dateKey);
    setCreateEndDateKey(null);
    setSelectedEventId(null);
    setEventModalOpen(true);
  };

  const onClickTempRange = (startDateKey: string, endDateKey: string) => {
    const [start, end] =
      startDateKey <= endDateKey ? [startDateKey, endDateKey] : [endDateKey, startDateKey];
    setEventModalMode('create');
    setCreateDateKey(start);
    setCreateEndDateKey(end);
    setSelectedEventId(null);
    setEventModalOpen(true);
  };

  const onClickEvent = (eventId: string) => {
    setEventModalMode('view');
    setSelectedEventId(eventId);
    setCreateDateKey(null);
    setEventModalOpen(true);
  };

  const onClickMore = (dateKey: string, events: CalendarEvent[]) => {
    setDayListDateKey(dateKey);
    setDayListEvents(events);
    setDayListOpen(true);
  };

  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((e) => e.id === selectedEventId) ?? null : null),
    [selectedEventId, events]
  );

  useEffect(() => {
    let active = true;
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return () => {
        active = false;
      };
    }

    fetchMe(token)
      .then((user) => {
        if (!active) return;
        setAuthSession(token, user);
        setAuthReady(true);
      })
      .catch(() => {
        if (!active) return;
        clearAuthSession();
        router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    fetchCalendars()
      .then((items) => {
        if (!active) return;
        setCalendars(items);
      })
      .catch((error) => {
        console.error('Failed to load calendars', error);
      });

    return () => {
      active = false;
    };
  }, [authReady]);

  useEffect(() => {
    if (!authReady || calendars.length === 0) return;
    let active = true;
    const fallbackCategoryId = getDefaultCategoryId();
    fetchEvents(fallbackCategoryId)
      .then((items) => {
        if (!active) return;
        setEvents(items);
      })
      .catch((error) => {
        console.error('Failed to load events', error);
      });

    return () => {
      active = false;
    };
  }, [authReady, calendars]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('calabi-theme') : null;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('calabi-lang') : null;
    if (saved === 'ko' || saved === 'en') setLanguage(saved);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('calabi-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = dateInputLang;
    localStorage.setItem('calabi-lang', language);
  }, [dateInputLang, language]);

  if (!authReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[rgb(var(--bg))] text-sm text-white/70">
        로그인 확인 중...
      </div>
    );
  }

  return (
    <CalendarLayout
      title={title}
      onPrevMonth={() => setYm((prev) => addMonths(prev, -1))}
      onNextMonth={() => setYm((prev) => addMonths(prev, 1))}
      onToday={() => setYm(getTodayYearMonth())}
      calendars={calendars}
      onToggleCalendar={onToggleCalendar}
      onAddCalendar={onAddCalendar}
      onEditCalendar={onEditCalendar}
      searchQuery={searchQuery}
      onChangeSearch={setSearchQuery}
      theme={theme}
      onChangeTheme={onChangeTheme}
      language={language}
      onChangeLanguage={onChangeLanguage}
      onLogout={onLogout}
      labels={labels}
    >
      <MonthGrid
        year={ym.year}
        month={ym.month}
        events={events}
        calendars={calendars}
        searchQuery={searchQuery}
        onClickDate={onClickDate}   
        onClickEvent={onClickEvent} 
        onClickMore={onClickMore}
        onClickTempRange={onClickTempRange}
        clearTempToken={tempClearToken}
        labels={labels}
      />

      <EventModal
        open={eventModalOpen}
        mode={eventModalMode}
        event={selectedEvent}
        defaultDateKey={createDateKey}
        defaultEndDateKey={createEndDateKey}
        calendars={calendars}
        onClose={() => setEventModalOpen(false)}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        labels={labels}
        dateInputLang={dateInputLang}
      />

      <CalendarModal
        open={calendarModalOpen}
        mode={calendarModalMode}
        calendar={editingCalendarId ? calendars.find((c) => c.id === editingCalendarId) : null}
        onClose={() => setCalendarModalOpen(false)}
        onCreate={onCreateCalendar}
        onUpdate={onUpdateCalendar}
        onDelete={onDeleteCalendar}
        labels={labels}
      />

      <DayEventsModal
        open={dayListOpen}
        dateKey={dayListDateKey}
        events={dayListEvents}
        calendars={calendars}
        onClose={() => setDayListOpen(false)}
        onClickEvent={(e) => {
          setDayListOpen(false);
          onClickEvent(e.id);
        }}
        labels={labels}
      />
    </CalendarLayout>
  );
}
