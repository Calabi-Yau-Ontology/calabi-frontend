export type DayCellData = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export function getMonthGrid(year: number, month: number): DayCellData[] {
  // month: 0-based
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0(Sun) ~ 6(Sat)

  // grid 시작 날짜 (일요일 기준)
  const gridStart = new Date(year, month, 1 - startDay);

  const today = new Date();
  const cells: DayCellData[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    );

    cells.push({
      date: d,
      isCurrentMonth: d.getMonth() === month,
      isToday:
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate(),
    });
  }

  return cells;
}
