'use client';

import { useMemo, useState } from 'react';
import CalendarLayout from '@/components/layout/CalendarLayout';
import MonthGrid from '@/components/month/MonthGrid';
import EventModal from '@/components/modal/EventModal';
import DayEventsModal from '@/components/modal/DayEventsModal';

import { addMonths, formatYearMonthKR, getTodayYearMonth } from '@/lib/date/monthNav';
import { MOCK_CALENDARS } from '@/data/mock.calendars';
import { MOCK_EVENTS, type CalendarEvent } from '@/data/mock.events';

export default function HomePage() {
  const [ym, setYm] = useState(() => getTodayYearMonth());
  const [calendars, setCalendars] = useState(() => MOCK_CALENDARS);
  const [searchQuery, setSearchQuery] = useState('');

  // 모달 상태
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<'view' | 'create'>('view');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [createDateKey, setCreateDateKey] = useState<string | null>(null);

  const [dayListOpen, setDayListOpen] = useState(false);
  const [dayListDateKey, setDayListDateKey] = useState<string | null>(null);
  const [dayListEvents, setDayListEvents] = useState<CalendarEvent[]>([]);

  const title = useMemo(() => formatYearMonthKR(ym), [ym]);

  const onToggleCalendar = (id: string) => {
    setCalendars((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)));
  };

  // MonthGrid로 내려줄 핸들러들
  const onClickDate = (dateKey: string) => {
    setEventModalMode('create');
    setCreateDateKey(dateKey);
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
    () => (selectedEventId ? MOCK_EVENTS.find((e) => e.id === selectedEventId) ?? null : null),
    [selectedEventId]
  );

  return (
    <CalendarLayout
      title={title}
      onPrevMonth={() => setYm((prev) => addMonths(prev, -1))}
      onNextMonth={() => setYm((prev) => addMonths(prev, 1))}
      onToday={() => setYm(getTodayYearMonth())}
      calendars={calendars}
      onToggleCalendar={onToggleCalendar}
      searchQuery={searchQuery}
      onChangeSearch={setSearchQuery}
    >
      <MonthGrid
        year={ym.year}
        month={ym.month}
        events={MOCK_EVENTS}
        calendars={calendars}
        searchQuery={searchQuery}
        onClickDate={onClickDate}   
        onClickEvent={onClickEvent} 
        onClickMore={onClickMore}   
      />

      <EventModal
        open={eventModalOpen}
        mode={eventModalMode}
        event={selectedEvent}
        defaultDateKey={createDateKey}
        calendars={calendars}
        onClose={() => setEventModalOpen(false)}
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
      />
    </CalendarLayout>
  );
}
