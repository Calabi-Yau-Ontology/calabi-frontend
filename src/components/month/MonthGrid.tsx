"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import WeekdayRow from './WeekdayRow';
import DayCell from './DayCell';
import EventItem from './EventItem';
import { getMonthGrid } from '@/lib/date/monthGrid';
import type { CalendarEvent } from '@/data/mock.events';
import type { CalendarItem } from '@/data/mock.calendars';
import { parseYmd, clampDate, toYmd } from '@/lib/date/ymd';
import { filterVisibleEvents, isMultiDayEvent } from '@/lib/events/filters';

type Props = {
  year: number;
  month: number; // 0-based
  events: CalendarEvent[];
  calendars: CalendarItem[];
  searchQuery: string;
  onClickDate: (dateKey: string) => void;
  onClickEvent: (eventId: string) => void;
  onClickMore: (dateKey: string, events: CalendarEvent[]) => void;
  onClickTempRange: (startDateKey: string, endDateKey: string) => void;
  clearTempToken?: number;
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
const TEMP_EVENT_ID = 'temp-drag';

const toDayIndex = (d: Date) =>
  Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

const diffDays = (startKey: string, endKey: string) =>
  toDayIndex(parseYmd(endKey)) - toDayIndex(parseYmd(startKey));

export default function MonthGrid({
  year,
  month,
  events,
  calendars,
  searchQuery,
  onClickDate,
  onClickEvent,
  onClickMore,
  onClickTempRange,
  clearTempToken,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [dragStartKey, setDragStartKey] = useState<string | null>(null);
  const [dragEndKey, setDragEndKey] = useState<string | null>(null);
  const [tempEvent, setTempEvent] = useState<CalendarEvent | null>(null);
  const [suppressClick, setSuppressClick] = useState(false);
  const [tempPressing, setTempPressing] = useState(false);

  const days = getMonthGrid(year, month); // length 42
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  const enabledCalendarIds = new Set(calendars.filter((c) => c.checked).map((c) => c.id));
  const colorByCalendarId = new Map(calendars.map((c) => [c.id, c.color] as const));
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const visibleEvents = filterVisibleEvents(events, enabledCalendarIds, searchQuery).filter((e) => {
    const start = parseYmd(e.startDate);
    const end = e.endDate ? parseYmd(e.endDate) : start;
    return !(end < monthStart || start > monthEnd);
  });

  const buildTempEvent = useCallback((startKey: string, endKey: string) => {
    const [startDate, endDate] = startKey <= endKey ? [startKey, endKey] : [endKey, startKey];
    const calendarId = calendars.find((c) => c.checked)?.id ?? calendars[0]?.id ?? 'temp';
    return {
      id: TEMP_EVENT_ID,
      calendarId,
      title: '일정',
      startDate,
      endDate: startDate === endDate ? undefined : endDate,
    } satisfies CalendarEvent;
  }, [calendars]);

  const displayEvents = useMemo(() => {
    if (!tempEvent) return visibleEvents;
    const start = parseYmd(tempEvent.startDate);
    const end = parseYmd(tempEvent.endDate ?? tempEvent.startDate);
    if (end < monthStart || start > monthEnd) return visibleEvents;
    return [tempEvent, ...visibleEvents];
  }, [tempEvent, visibleEvents, monthStart, monthEnd]);

  const multi = displayEvents.filter(isMultiDayEvent);

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

  useEffect(() => {
    if (!dragging) return;

    const onMouseUp = () => {
      if (dragStartKey && dragEndKey) {
        const isRange = dragStartKey !== dragEndKey;
        if (isRange) setTempEvent(buildTempEvent(dragStartKey, dragEndKey));
        else setTempEvent(null);
        if (isRange) {
          setSuppressClick(true);
          setTimeout(() => setSuppressClick(false), 0);
        }
      }
      setDragging(false);
    };

    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [dragging, dragStartKey, dragEndKey, buildTempEvent]);

  useEffect(() => {
    if (!tempPressing) return;
    const onMouseUp = () => setTempPressing(false);
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [tempPressing]);

  useEffect(() => {
    if (clearTempToken === undefined) return;
    setTempEvent(null);
    setTempPressing(false);
  }, [clearTempToken]);

  const onDragStart = (dateKey: string) => {
    setDragging(true);
    setDragStartKey(dateKey);
    setDragEndKey(dateKey);
    setTempEvent(null);
    setTempPressing(false);
  };

  const onDragEnter = (dateKey: string) => {
    if (!dragging || !dragStartKey) return;
    setDragEndKey(dateKey);
    if (dragStartKey !== dateKey) {
      setTempEvent(buildTempEvent(dragStartKey, dateKey));
    }
  };

  const handleClickDate = (dateKey: string) => {
    setTempEvent(null);
    setTempPressing(false);
    onClickDate(dateKey);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <WeekdayRow />

      {/* Week rows */}
      <div className="grid grid-rows-6">
        {weeks.map((weekDays, w) => {
          const lanes = lanesByWeek[w] ?? [];
          const visibleLanes = lanes.slice(0, MAX_LANES);

          const perDayVisible = Array.from({ length: 7 }, () => 0);
          const perDayHidden = Array.from({ length: 7 }, () => 0);

          for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const col = dayIdx + 1;

            for (let laneIdx = 0; laneIdx < lanes.length; laneIdx++) {
              const lane = lanes[laneIdx];
              const covers = lane.some((seg) => seg.colStart <= col && seg.colEnd > col);
              if (!covers) continue;

              if (laneIdx < MAX_LANES) perDayVisible[dayIdx] += 1;
              else perDayHidden[dayIdx] += 1;
            }
          }

          // 멀티데이 바 영역 높이(= DayCell에서 피해야 할 영역)
        //   const reservedTopPx = visibleLanes.length * (BAR_H + BAR_GAP) + (hiddenCount > 0 ? 16 : 0);
          const overlayHeight = visibleLanes.length * BAR_H + Math.max(0, visibleLanes.length - 1) * BAR_GAP;
          const maxHiddenCount = Math.max(0, ...perDayHidden);

          return (
            <div key={w} className="relative">
              {/* 기본 day cell grid */}
              <div className="grid grid-cols-7">
                {weekDays.map((d, idx) => (
                  <DayCell
                    key={`${w}-${idx}`}
                    day={d}
                    events={displayEvents}
                    colorByCalendarId={colorByCalendarId}
                    reservedTopPx={
                      perDayVisible[idx] > 0 || perDayHidden[idx] > 0
                        ? perDayVisible[idx] * BAR_H +
                          Math.max(0, perDayVisible[idx] - 1) * BAR_GAP +
                          (perDayHidden[idx] > 0 ? 18 : 0)
                        : 0
                    }
                    onClickDate={handleClickDate}
                    onClickEvent={onClickEvent}
                    onClickMore={onClickMore}
                    onDragStart={onDragStart}
                    onDragEnter={onDragEnter}
                    suppressClick={suppressClick}
                    isDragging={dragging}
                    />
                ))}
              </div>

              {/* 멀티데이 오버레이 (주 단위) */}
              <div className="pointer-events-none absolute left-0 right-0 top-[28px] px-0">
                <div className="relative" style={{ height: overlayHeight }}>
                    {visibleLanes.map((lane, laneIdx) =>
                    lane.map((seg) => {
                        const top = laneIdx * (BAR_H + BAR_GAP);
                        const colSpan = seg.colEnd - seg.colStart;

                        const isTemp = seg.event.id === TEMP_EVENT_ID;
                        const tempStart = seg.event.startDate;
                        const tempEnd = seg.event.endDate ?? seg.event.startDate;
                        const segmentStartKey = toYmd(weeks[w][seg.colStart - 1].date);
                        const totalDays = diffDays(tempStart, tempEnd) + 1;
                        const segmentDays = seg.colEnd - seg.colStart;
                        const offsetDays = diffDays(tempStart, segmentStartKey);
                        const positionRatio =
                          totalDays > segmentDays ? offsetDays / (totalDays - segmentDays) : 0;
                        const draftStyle =
                          isTemp && totalDays > 0 && segmentDays > 0
                            ? {
                                backgroundSize: `${(totalDays / segmentDays) * 100}% 100%`,
                                backgroundPositionX: `${Math.min(
                                  1,
                                  Math.max(0, positionRatio)
                                ) * 100}%`,
                                backgroundRepeat: 'no-repeat',
                              }
                            : undefined;

                        return (
                        <div
                            key={`${seg.event.id}-${laneIdx}-${seg.colStart}-${seg.colEnd}`}
                            className="pointer-events-auto absolute"
                            style={{
                            top,
                            left: `${((seg.colStart - 1) / 7) * 100}%`,
                            width: `${(colSpan / 7) * 100}%`,
                            height: BAR_H,
                            paddingRight: 0,
                            }}
                        >
                            <EventItem
                            title={seg.event.title}
                            color={colorByCalendarId.get(seg.event.calendarId) ?? '#999999'}
                            onClick={(ev) => {
                              ev?.stopPropagation?.();
                              if (isTemp) return;
                              onClickEvent(seg.event.id);
                            }}
                            onMouseDown={(ev) => {
                              if (!isTemp) return;
                              ev.stopPropagation();
                              setTempPressing(true);
                            }}
                            onMouseUp={(ev) => {
                              if (!isTemp) return;
                              if (!tempPressing) return;
                              ev.stopPropagation();
                              onClickTempRange(tempStart, tempEnd);
                              setTempPressing(false);
                            }}
                            onMouseLeave={(ev) => {
                              if (!isTemp) return;
                              if (!tempPressing) return;
                              ev.stopPropagation();
                              setTempEvent(null);
                              setTempPressing(false);
                            }}
                            variant={isTemp ? 'draft' : 'normal'}
                            style={draftStyle}
                            />
                        </div>
                        );
                    })
                    )}
                </div>

                {maxHiddenCount > 0 && (
                    <div className="mt-[2px] text-center text-[10px] leading-4 text-white/55">
                    +{maxHiddenCount}줄 더
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
