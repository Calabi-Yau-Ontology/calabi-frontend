'use client';

import { useEffect, useMemo, useState } from 'react';
import CalendarLayout from '@/components/layout/CalendarLayout';
import MonthGrid from '@/components/month/MonthGrid';
import EventModal from '@/components/modal/EventModal';
import DayEventsModal from '@/components/modal/DayEventsModal';
import CalendarModal from '@/components/modal/CalendarModal';

import { addMonths, formatYearMonth, getTodayYearMonth } from '@/lib/date/monthNav';
import { MOCK_CALENDARS, type CalendarItem } from '@/data/mock.calendars';
import { MOCK_EVENTS, type CalendarEvent } from '@/data/mock.events';
import { getLabels, type Language } from '@/lib/i18n';

export default function HomePage() {
  const [ym, setYm] = useState(() => getTodayYearMonth());
  const [calendars, setCalendars] = useState(() => MOCK_CALENDARS);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [language, setLanguage] = useState<Language>('ko');

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
  const [events, setEvents] = useState<CalendarEvent[]>(() => MOCK_EVENTS);
  const [tempClearToken, setTempClearToken] = useState(0);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarModalMode, setCalendarModalMode] = useState<'create' | 'edit'>('create');
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);

  // create
  const onCreate = (draft: Omit<CalendarEvent, 'id'>) => {
    const id = `e_${Date.now()}`;
    setEvents((prev) => [{ id, ...draft }, ...prev]);
    setTempClearToken((prev) => prev + 1);
  };

  // update
  const onUpdate = (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  // delete
  const onDelete = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const onToggleCalendar = (id: string) => {
    setCalendars((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)));
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

  const onCreateCalendar = (draft: Omit<CalendarItem, 'id'>) => {
    const id = `cal_${Date.now()}`;
    setCalendars((prev) => [{ id, ...draft }, ...prev]);
  };

  const onUpdateCalendar = (id: string, patch: Partial<Omit<CalendarItem, 'id'>>) => {
    setCalendars((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const onDeleteCalendar = (id: string) => {
    setCalendars((prev) => prev.filter((c) => c.id !== id));
    setEvents((prev) => prev.filter((e) => e.calendarId !== id));
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
      onChangeTheme={setTheme}
      language={language}
      onChangeLanguage={setLanguage}
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
