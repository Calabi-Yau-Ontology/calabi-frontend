export type YearMonth = { year: number; month: number }; // month: 0-based

export function getTodayYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function addMonths(ym: YearMonth, diff: number): YearMonth {
  const d = new Date(ym.year, ym.month + diff, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function formatYearMonthKR(ym: YearMonth): string {
  return `${ym.year}년 ${ym.month + 1}월`;
}
