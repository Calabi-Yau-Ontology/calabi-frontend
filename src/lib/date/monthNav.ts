export type YearMonth = { year: number; month: number }; // month: 0-based

export function getTodayYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function addMonths(ym: YearMonth, diff: number): YearMonth {
  const d = new Date(ym.year, ym.month + diff, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function formatYearMonth(ym: YearMonth, language: 'ko' | 'en'): string {
  const date = new Date(ym.year, ym.month, 1);
  const locale = language === 'en' ? 'en-US' : 'ko-KR';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(date);
}
