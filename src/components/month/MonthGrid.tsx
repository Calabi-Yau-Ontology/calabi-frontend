"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import WeekdayRow from './WeekdayRow';
import DayCell from './DayCell';
import EventItem from './EventItem';
import { getMonthGrid } from '@/lib/date/monthGrid';
import type { CalendarEvent } from '@/types/event';
import type { CategoryItem } from '@/types/category';
import { parseYmd, clampDate, toYmd } from '@/lib/date/ymd';
import { filterVisibleEvents, isMultiDayEvent } from '@/lib/events/filters';
import type { Labels } from '@/lib/i18n';
import type {
  ConsistencyCacheEntry,
  ConsistencyPendingEntry,
  ConsistencyRecommendation,
} from '@/types/suggestions';

type Props = {
  year: number;
  month: number; // 0-based
  events: CalendarEvent[];
  categories: CategoryItem[];
  searchQuery: string;
  onClickDate: (dateKey: string) => void;
  onClickEvent: (eventId: string) => void;
  onClickMore: (dateKey: string, events: CalendarEvent[]) => void;
  onClickTempRange: (startDateKey: string, endDateKey: string) => void;
  clearTempToken?: number;
  labels: Labels;
  consistencyReady: Record<string, ConsistencyCacheEntry>;
  consistencyPending: Record<string, ConsistencyPendingEntry>;
  onIgnoreConsistency: (eventId: string) => void;
  onApplyConsistency: (eventId: string, newTitle: string) => void;
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
  categories,
  searchQuery,
  onClickDate,
  onClickEvent,
  onClickMore,
  onClickTempRange,
  clearTempToken,
  labels,
  consistencyReady,
  consistencyPending,
  onIgnoreConsistency,
  onApplyConsistency,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [dragStartKey, setDragStartKey] = useState<string | null>(null);
  const [dragEndKey, setDragEndKey] = useState<string | null>(null);
  const [tempEvent, setTempEvent] = useState<CalendarEvent | null>(null);
  const [suppressClick, setSuppressClick] = useState(false);
  const [tempPressing, setTempPressing] = useState(false);
  const [popover, setPopover] = useState<{ eventId: string; rect: DOMRect } | null>(null);
  const [selectionByEventId, setSelectionByEventId] = useState<Record<string, Record<number, string>>>({});
  const [activeResultIndex, setActiveResultIndex] = useState<number | null>(null);
  const hidePopoverTimer = useRef<number | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const clearOnLeaveRef = useRef<Set<string>>(new Set());

  const days = getMonthGrid(year, month); // length 42
  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  const enabledCategoryIds = new Set(categories.filter((c) => c.checked).map((c) => c.id));
  const colorByCategoryId = new Map(categories.map((c) => [c.id, c.color] as const));
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const visibleEvents = filterVisibleEvents(events, enabledCategoryIds, searchQuery).filter((e) => {
    const start = parseYmd(e.startDate);
    const end = e.endDate ? parseYmd(e.endDate) : start;
    return !(end < monthStart || start > monthEnd);
  });

  const buildTempEvent = useCallback((startKey: string, endKey: string) => {
    const [startDate, endDate] = startKey <= endKey ? [startKey, endKey] : [endKey, startKey];
    const categoryId = categories.find((c) => c.checked)?.id ?? categories[0]?.id ?? 'temp';
    return {
      id: TEMP_EVENT_ID,
      categoryId,
      title: labels.month.tempEventTitle,
      startDate,
      endDate: startDate === endDate ? undefined : endDate,
    } satisfies CalendarEvent;
  }, [categories, labels]);

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

  const clearHideTimer = () => {
    if (hidePopoverTimer.current !== null) {
      window.clearTimeout(hidePopoverTimer.current);
      hidePopoverTimer.current = null;
    }
  };

  const scheduleHidePopover = () => {
    clearHideTimer();
    const eventId = popover?.eventId ?? null;
    const shouldClear = eventId ? clearOnLeaveRef.current.has(eventId) : false;
    hidePopoverTimer.current = window.setTimeout(() => {
      if (eventId && shouldClear) {
        clearOnLeaveRef.current.delete(eventId);
        handleIgnoreConsistency(eventId);
        return;
      }
      setPopover(null);
    }, 120);
  };

  const hasActionableSuggestion = (entry: ConsistencyCacheEntry) =>
    entry.results.some((result) => {
      if (!result.span) return false;
      const spanText = entry.sourceTitle.slice(result.span.start, result.span.end);
      const surfaces = [result.mostRecent?.surface, result.mostFrequent?.surface].filter(
        Boolean
      ) as string[];
      return surfaces.some((surface) => surface !== spanText);
    });

  const handleEventHover = (eventId: string, anchor: HTMLElement) => {
    if (!consistencyReady[eventId] && !consistencyPending[eventId]) return;
    const readyEntry = consistencyReady[eventId];
    const hasNoResults = Boolean(readyEntry && readyEntry.results.length === 0);
    const actionable = readyEntry ? hasActionableSuggestion(readyEntry) : false;
    if (readyEntry && !actionable && !hasNoResults) {
      onIgnoreConsistency(eventId);
      return;
    }
    if (hasNoResults) {
      clearOnLeaveRef.current.add(eventId);
    }
    clearHideTimer();
    setPopover({ eventId, rect: anchor.getBoundingClientRect() });
  };

  const handleEventLeave = () => {
    scheduleHidePopover();
  };

  const handlePopoverEnter = () => {
    clearHideTimer();
  };

  const handlePopoverLeave = () => {
    scheduleHidePopover();
  };

  const toggleSelection = (
    eventId: string,
    index: number,
    surface: string
  ) => {
    setSelectionByEventId((prev) => {
      const current = prev[eventId] ?? {};
      const next = { ...current };
      if (next[index] === surface) {
        delete next[index];
      } else {
        next[index] = surface;
      }
      return { ...prev, [eventId]: next };
    });
  };

  const buildNextTitle = (
    sourceTitle: string,
    results: ConsistencyRecommendation[],
    selections: Record<number, string>
  ) => {
    const replacements = results
      .map((result, index) => {
        const surface = selections[index];
        const span = result.span ?? null;
        if (!surface || !span) return null;
        return { start: span.start, end: span.end, surface };
      })
      .filter((item): item is { start: number; end: number; surface: string } => Boolean(item))
      .sort((a, b) => b.start - a.start);

    let nextTitle = sourceTitle;
    for (const item of replacements) {
      nextTitle = `${nextTitle.slice(0, item.start)}${item.surface}${nextTitle.slice(item.end)}`;
    }
    return nextTitle;
  };

  const handleIgnoreConsistency = (eventId: string) => {
    clearOnLeaveRef.current.delete(eventId);
    onIgnoreConsistency(eventId);
    setSelectionByEventId((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
    setPopover(null);
  };

  const handleApplyConsistency = (eventId: string) => {
    const entry = consistencyReady[eventId];
    if (!entry) return;
    const selections = selectionByEventId[eventId] ?? {};
    const nextTitle = buildNextTitle(entry.sourceTitle, entry.results, selections);
    if (nextTitle === entry.sourceTitle) {
      handleIgnoreConsistency(eventId);
      return;
    }
    onApplyConsistency(eventId, nextTitle);
    setSelectionByEventId((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
    setPopover(null);
  };

  const readyIds: Record<string, true> = useMemo(() => {
    const entries: Record<string, true> = {};
    Object.keys(consistencyReady).forEach((id) => {
      entries[id] = true;
    });
    return entries;
  }, [consistencyReady]);

  const pendingIds: Record<string, true> = useMemo(() => {
    const entries: Record<string, true> = {};
    Object.keys(consistencyPending).forEach((id) => {
      entries[id] = true;
    });
    return entries;
  }, [consistencyPending]);

  const activePopover = popover ? consistencyReady[popover.eventId] ?? null : null;
  const isPopoverPending = popover ? Boolean(consistencyPending[popover.eventId]) : false;
  const popoverSelections = popover ? selectionByEventId[popover.eventId] ?? {} : {};
  const hasSelections = Object.keys(popoverSelections).length > 0;
  let popoverStyle: CSSProperties | undefined;

  useEffect(() => {
    setActiveResultIndex(null);
  }, [popover?.eventId]);

  const activeResultsWithIndex = useMemo(
    () => (activePopover ? activePopover.results.map((result, index) => ({ result, index })) : []),
    [activePopover]
  );

  const displayResults = useMemo(() => {
    if (activeResultIndex === null) return activeResultsWithIndex;
    return activeResultsWithIndex.filter(({ index }) => index === activeResultIndex);
  }, [activeResultsWithIndex, activeResultIndex]);

  const highlightedSourceTitle = useMemo<ReactNode>(() => {
    if (!activePopover) return null;
    const sourceTitle = activePopover.sourceTitle;
    const spans = activeResultsWithIndex
      .filter(({ result }) => result.span)
      .sort((a, b) => a.result.span!.start - b.result.span!.start);
    if (spans.length === 0) return sourceTitle;

    const parts: ReactNode[] = [];
    let cursor = 0;
    spans.forEach(({ result, index }) => {
      const span = result.span!;
      if (span.start > cursor) {
        parts.push(sourceTitle.slice(cursor, span.start));
      }
      const text = sourceTitle.slice(span.start, span.end);
      const isActive = activeResultIndex === index;
      parts.push(
        <span
          key={`span-${index}-${span.start}`}
          className={[
            'rounded-sm px-1',
            'cursor-pointer',
            isActive ? 'bg-white/35 text-white' : 'bg-white/20 text-white/95',
          ].join(' ')}
          onMouseEnter={() => setActiveResultIndex(index)}
        >
          {text}
        </span>
      );
      cursor = span.end;
    });
    if (cursor < sourceTitle.length) {
      parts.push(sourceTitle.slice(cursor));
    }
    return parts;
  }, [activePopover, activeResultsWithIndex, activeResultIndex]);

  if (popover && typeof window !== 'undefined') {
    const rect = popover.rect;
    const width = 320;
    const padding = 12;
    const estimatedHeight = 220;
    const centerX = rect.left + rect.width / 2;
    const left = Math.min(
      window.innerWidth - width - padding,
      Math.max(padding, centerX - width / 2)
    );
    const placeAbove = rect.bottom + estimatedHeight > window.innerHeight;
    const top = placeAbove ? rect.top - 8 : rect.bottom + 8;
    popoverStyle = {
      left,
      top,
      width,
      transform: placeAbove ? 'translateY(-100%)' : 'translateY(0)',
    };
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <WeekdayRow days={labels.month.weekdays} />

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
                    colorByCategoryId={colorByCategoryId}
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
                    moreLabel={labels.month.moreItems}
                    consistencyReady={readyIds}
                    consistencyPending={pendingIds}
                    onEventHover={handleEventHover}
                    onEventLeave={handleEventLeave}
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
                        const hasReady = Boolean(readyIds[seg.event.id]);
                        const hasPending = Boolean(pendingIds[seg.event.id]);
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
                            color={colorByCategoryId.get(seg.event.categoryId) ?? '#999999'}
                            onClick={(ev) => {
                              ev?.stopPropagation?.();
                              if (isTemp) return;
                              onClickEvent(seg.event.id);
                            }}
                            onMouseEnter={(ev) => {
                              if (isTemp) return;
                              if (!hasReady && !hasPending) return;
                              handleEventHover(seg.event.id, ev.currentTarget);
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
                              if (!isTemp && (hasReady || hasPending)) {
                                handleEventLeave();
                                return;
                              }
                              if (!isTemp) return;
                              if (!tempPressing) return;
                              ev.stopPropagation();
                              setTempEvent(null);
                              setTempPressing(false);
                            }}
                            variant={isTemp ? 'draft' : 'normal'}
                            highlight={!isTemp && hasReady}
                            style={draftStyle}
                            />
                        </div>
                        );
                    })
                    )}
                </div>

                {maxHiddenCount > 0 && (
                    <div className="mt-[2px] text-center text-[10px] leading-4 text-white/55">
                    {labels.month.moreRows(maxHiddenCount)}
                    </div>
                )}
                </div>
            </div>
          );
        })}
      </div>

      {popover &&
        (activePopover || isPopoverPending) &&
        popoverStyle &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-50 rounded-xl border border-white/10 bg-[rgb(var(--panel))] p-3 text-xs text-white/80 shadow-xl"
            style={popoverStyle}
            onMouseEnter={handlePopoverEnter}
            onMouseLeave={handlePopoverLeave}
          >
            <div className="mb-2 text-xs font-semibold text-white/85">
              {labels.suggestions.resultsTitle}
            </div>

            {activePopover && (
              <div className="mb-2 rounded-md border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-white/70">
                {highlightedSourceTitle}
              </div>
            )}

            {isPopoverPending && (
              <div className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-white/70">
                {labels.suggestions.analyzing}
              </div>
            )}

            {!isPopoverPending && activePopover?.results.length === 0 && (
              <div className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-white/60">
                {labels.suggestions.noResults}
              </div>
            )}

            {!isPopoverPending &&
              displayResults.map(({ result, index }) => {
                const options = [];
                if (result.mostRecent) {
                  options.push({
                    key: 'recent',
                    label: labels.suggestions.mostRecent,
                    surface: result.mostRecent.surface,
                  });
                }
                if (
                  result.mostFrequent &&
                  result.mostFrequent.surface !== result.mostRecent?.surface
                ) {
                  options.push({
                    key: 'frequent',
                    label: labels.suggestions.mostFrequent,
                    surface: result.mostFrequent.surface,
                  });
                }
                const selectedSurface = popoverSelections[index];
                const spanAvailable = Boolean(result.span);

                return (
                  <div
                    key={`${result.canonicalName}-${index}`}
                    className="mb-2 rounded-md border border-white/10 bg-white/5 px-2 py-2"
                  >
                    <div className="text-[11px] text-white/70">
                      {result.inputSurface ?? result.canonicalName}
                    </div>
                    {!spanAvailable && (
                      <div className="mt-1 text-[10px] text-white/40">
                        {labels.suggestions.noSpan}
                      </div>
                    )}
                    <div className="mt-1 flex flex-col gap-1">
                      {options.length === 0 && (
                        <div className="text-[10px] text-white/45">
                          {labels.suggestions.noResults}
                        </div>
                      )}
                      {options.map((option) => {
                        const isSelected = selectedSurface === option.surface;
                        return (
                          <div
                            key={`${option.key}-${option.surface}`}
                            className="flex items-center gap-2"
                          >
                            <span className="text-[10px] text-white/45">
                              {option.label}
                            </span>
                            <button
                              type="button"
                              disabled={!spanAvailable}
                              className={[
                                'rounded-md border px-2 py-1 text-[10px]',
                                !spanAvailable && 'cursor-not-allowed text-white/35',
                                spanAvailable && isSelected
                                  ? 'border-white/30 bg-white/15 text-white'
                                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              onClick={() => {
                                if (!spanAvailable) return;
                                toggleSelection(popover.eventId, index, option.surface);
                              }}
                            >
                              {option.surface}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                className="text-[11px] text-white/60 hover:text-white/85"
                onClick={() => handleIgnoreConsistency(popover.eventId)}
              >
                {labels.suggestions.ignore}
              </button>
              {!isPopoverPending && (
                <button
                  type="button"
                  className={[
                    'rounded-md border px-2 py-1 text-[11px]',
                    hasSelections
                      ? 'border-white/30 bg-white/15 text-white'
                      : 'border-white/10 bg-white/5 text-white/35',
                  ].join(' ')}
                  onClick={() => handleApplyConsistency(popover.eventId)}
                  disabled={!hasSelections}
                >
                  {labels.suggestions.apply}
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
