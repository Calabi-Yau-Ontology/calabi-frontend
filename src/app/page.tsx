'use client';

import { useMemo, useState } from 'react';
import CalendarLayout from '@/components/layout/CalendarLayout';
import MonthGrid from '@/components/month/MonthGrid';
import { addMonths, formatYearMonthKR, getTodayYearMonth } from '@/lib/date/monthNav';

export default function HomePage() {
  const [ym, setYm] = useState(() => getTodayYearMonth());

  const title = useMemo(() => formatYearMonthKR(ym), [ym]);

  return (
    <CalendarLayout
      title={title}
      onPrevMonth={() => setYm((prev) => addMonths(prev, -1))}
      onNextMonth={() => setYm((prev) => addMonths(prev, 1))}
      onToday={() => setYm(getTodayYearMonth())}
    >
      <MonthGrid year={ym.year} month={ym.month} />
    </CalendarLayout>
  );
}
