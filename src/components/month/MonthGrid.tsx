import WeekdayRow from './WeekdayRow';
import DayCell from './DayCell';
import EventItem from './EventItem';
import { getMonthGrid } from '@/lib/date/monthGrid';
import type { CalendarEvent } from '@/data/mock.events';
import type { CalendarItem } from '@/data/mock.calendars';
import { parseYmd, clampDate, toYmd } from '@/lib/date/ymd';

type Props = {
  year: number;
  month: number; // 0-based
  events: CalendarEvent[];
  calendars: CalendarItem[];
  searchQuery: string;
};

type Segment = {
  event: CalendarEvent;
  weekIndex: number;     // 0..5
  colStart: number;      // 1..7
  colEnd: number;        // 1..8 (grid end is exclusive)
};

const BAR_H = 18;  // EventItem h-[18px]
const BAR_GAP = 2; // lane 간격
const MAX_LANES = 3;

export default function MonthGrid({ year, month, events, calendars, searchQuery }: Props) {
  const days = getMonthGrid(year, month); // length 42
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  const enabledCalendarIds = new Set(calendars.filter((c) => c.checked).map((c) => c.id));
  const colorByCalendarId = new Map(calendars.map((c) => [c.id, c.color] as const));
  const q = searchQuery.trim().toLowerCase();

  // 멀티데이 이벤트만 뽑기 (+ 캘린더 필터 + 검색 필터)
  const multi = events
    .filter((e) => e.endDate && e.endDate !== e.startDate)
    .filter((e) => enabledCalendarIds.has(e.calendarId))
    .filter((e) => (q ? e.title.toLowerCase().includes(q) : true));

  // month grid 전체 범위(첫칸~마지막칸)
  const gridStart = weeks[0][0].date;
  const gridEnd = weeks[5][6].date;

  // week별로 쪼개진 segment 생성
  const segments: Segment[] = [];
  for (const ev of multi) {
    const s0 = parseYmd(ev.startDate);
    const e0 = parseYmd(ev.endDate!);

    // 그리드 범위 밖은 잘라냄
    const s = clampDate(s0, gridStart, gridEnd);
    const e = clampDate(e0, gridStart, gridEnd);

    for (let w = 0; w < 6; w++) {
      const weekStart = weeks[w][0].date;
      const weekEnd = weeks[w][6].date;

      // 이번 주와 겹치면 segment 생성
      if (e < weekStart || s > weekEnd) continue;

      const segStart = s < weekStart ? weekStart : s;
      const segEnd = e > weekEnd ? weekEnd : e;

      const startKey = toYmd(segStart);
      const endKey = toYmd(segEnd);

      const colStart = weeks[w].findIndex((d) => toYmd(d.date) === startKey) + 1; // 1..7
      const colEnd = weeks[w].findIndex((d) => toYmd(d.date) === endKey) + 2;     // end exclusive

      segments.push({ event: ev, weekIndex: w, colStart, colEnd });
    }
  }

  // week별 lane(겹침 방지) 배치: 아주 단순한 그리디
  const lanesByWeek: Array<Array<Segment[]>> = Array.from({ length: 6 }, () => []);
  const sorted = [...segments].sort((a, b) => {
        const aLen = a.colEnd - a.colStart;
        const bLen = b.colEnd - b.colStart;
        // 1) 더 긴 이벤트 우선(=긴 바가 위 레인)
        if (bLen !== aLen) return bLen - aLen;
        // 2) 시작이 빠른 것 우선
        if (a.colStart !== b.colStart) return a.colStart - b.colStart;
        // 3) 타이브레이크
        return a.event.id.localeCompare(b.event.id);
    });


  for (const seg of sorted) {
    const lanes = lanesByWeek[seg.weekIndex];
    let placed = false;

    for (const lane of lanes) {
      const last = lane[lane.length - 1];
      if (!last || last.colEnd <= seg.colStart) {
        lane.push(seg);
        placed = true;
        break;
      }
    }
    if (!placed) lanes.push([seg]);
  }

  const MAX_LANES = 3; // macOS처럼 적당히만 보여주고 나머진 +N 처리(추후 개선)

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <WeekdayRow />

      {/* Week rows */}
      <div className="grid grid-rows-6">
        {weeks.map((weekDays, w) => {
          const lanes = lanesByWeek[w] ?? [];
          const visibleLanes = lanes.slice(0, MAX_LANES);
          const hiddenCount = Math.max(0, lanes.length - visibleLanes.length);

          // 멀티데이 바 영역 높이(= DayCell에서 피해야 할 영역)
        //   const reservedTopPx = visibleLanes.length * (BAR_H + BAR_GAP) + (hiddenCount > 0 ? 16 : 0);
          const overlayHeight = visibleLanes.length * BAR_H + Math.max(0, visibleLanes.length - 1) * BAR_GAP;
          const reservedTopPx = overlayHeight + (hiddenCount > 0 ? 18 : 0);

          return (
            <div key={w} className="relative">
              {/* 기본 day cell grid */}
              <div className="grid grid-cols-7">
                {weekDays.map((d, idx) => (
                  <DayCell
                    key={`${w}-${idx}`}
                    day={d}
                    events={events}
                    calendars={calendars}
                    searchQuery={searchQuery}
                    reservedTopPx={reservedTopPx}
                    />
                ))}
              </div>

              {/* 멀티데이 오버레이 (주 단위) */}
              <div className="pointer-events-none absolute left-0 right-0 top-[28px] px-2">
                <div className="relative" style={{ height: overlayHeight }}>
                    {visibleLanes.map((lane, laneIdx) =>
                    lane.map((seg) => {
                        const top = laneIdx * (BAR_H + BAR_GAP);
                        const colSpan = seg.colEnd - seg.colStart;

                        return (
                        <div
                            key={`${seg.event.id}-${laneIdx}-${seg.colStart}-${seg.colEnd}`}
                            className="pointer-events-auto absolute"
                            style={{
                            top,
                            left: `${((seg.colStart - 1) / 7) * 100}%`,
                            width: `${(colSpan / 7) * 100}%`,
                            height: BAR_H,
                            paddingRight: 2, // 살짝만 여유(선택)
                            }}
                        >
                            <EventItem
                            title={seg.event.title}
                            color={colorByCalendarId.get(seg.event.calendarId) ?? '#999999'}
                            onClick={() => console.log('open event:', seg.event.id)}
                            />
                        </div>
                        );
                    })
                    )}
                </div>

                {hiddenCount > 0 && (
                    <div className="mt-[2px] text-center text-[10px] leading-4 text-white/55">
                    +{hiddenCount}줄 더
                    </div>
                )}
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
