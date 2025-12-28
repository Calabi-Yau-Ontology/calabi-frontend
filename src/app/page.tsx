'use client';

import { useMemo, useState } from 'react';
import CalendarLayout from '@/components/layout/CalendarLayout';
import MonthGrid from '@/components/month/MonthGrid';
import { addMonths, formatYearMonthKR, getTodayYearMonth } from '@/lib/date/monthNav';
import { MOCK_CALENDARS } from '@/data/mock.calendars';
import { MOCK_EVENTS } from '@/data/mock.events';

export default function HomePage() {
  const [ym, setYm] = useState(() => getTodayYearMonth());
  const [calendars, setCalendars] = useState(() => MOCK_CALENDARS);
  const [searchQuery, setSearchQuery] = useState('');

  const title = useMemo(() => formatYearMonthKR(ym), [ym]);

  const onToggleCalendar = (id: string) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

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
      />
    </CalendarLayout>
  );
}
