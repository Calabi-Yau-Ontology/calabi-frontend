'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarLayout from '@/components/layout/CalendarLayout';
import MonthGrid from '@/components/month/MonthGrid';
import EventModal from '@/components/modal/EventModal';
import DayEventsModal from '@/components/modal/DayEventsModal';
import CategoryModal from '@/components/modal/CategoryModal';

import { addMonths, formatYearMonth, getTodayYearMonth } from '@/lib/date/monthNav';
import { type CategoryItem } from '@/types/category';
import { type CalendarEvent } from '@/types/event';
import { getLabels, type Language } from '@/lib/i18n';
import { fetchMe } from '@/lib/auth/api';
import { clearAuthSession, getAuthToken, setAuthSession } from '@/lib/auth/storage';
import { createEvent, deleteEvent, fetchEvents, updateEvent } from '@/lib/events/api';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/lib/categories/api';
import { updateUserPreferences } from '@/lib/user/preferences';
import { runConsistencyCheck } from '@/lib/suggestions/api';
import { loadConsistencyCache, saveConsistencyCache } from '@/lib/suggestions/storage';
import type {
  ConsistencyCacheEntry,
  ConsistencyPendingEntry,
} from '@/types/suggestions';

export default function HomePage() {
  const router = useRouter();
  const [ym, setYm] = useState(() => getTodayYearMonth());
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [language, setLanguage] = useState<Language>('ko');
  const [authReady, setAuthReady] = useState(false);

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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tempClearToken, setTempClearToken] = useState(0);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [consistencyReady, setConsistencyReady] = useState<Record<string, ConsistencyCacheEntry>>({});
  const [consistencyPending, setConsistencyPending] = useState<Record<string, ConsistencyPendingEntry>>({});
  const skipConsistencyRef = useRef<Set<string>>(new Set());
  const ignoredConsistencyRef = useRef<Set<string>>(new Set());
  const consistencyRequestRef = useRef<Record<string, string>>({});

  const clearConsistencyEntry = (eventId: string) => {
    setConsistencyReady((prev) => {
      if (!prev[eventId]) return prev;
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
    setConsistencyPending((prev) => {
      if (!prev[eventId]) return prev;
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
    ignoredConsistencyRef.current.delete(eventId);
    delete consistencyRequestRef.current[eventId];
  };

  const startConsistencyCheck = async (event: CalendarEvent) => {
    const title = event.title?.trim();
    if (!title) return;
    const requestId = `${event.id}-${Date.now()}`;
    consistencyRequestRef.current[event.id] = requestId;
    ignoredConsistencyRef.current.delete(event.id);
    setConsistencyPending((prev) => ({
      ...prev,
      [event.id]: { sourceTitle: title, startedAt: Date.now() },
    }));
    setConsistencyReady((prev) => {
      if (!prev[event.id]) return prev;
      const next = { ...prev };
      delete next[event.id];
      return next;
    });

    try {
      const response = await runConsistencyCheck(title);
      if (consistencyRequestRef.current[event.id] !== requestId) return;
      if (ignoredConsistencyRef.current.has(event.id)) return;

      setConsistencyReady((prev) => ({
        ...prev,
        [event.id]: {
          sourceTitle: title,
          createdAt: Date.now(),
          results: response.results ?? [],
        },
      }));
    } catch (error) {
      console.error('Failed to run consistency check', error);
    } finally {
      setConsistencyPending((prev) => {
        if (!prev[event.id]) return prev;
        const next = { ...prev };
        delete next[event.id];
        return next;
      });
    }
  };

  const onIgnoreConsistency = (eventId: string) => {
    ignoredConsistencyRef.current.add(eventId);
    clearConsistencyEntry(eventId);
  };

  const onApplyConsistency = async (eventId: string, nextTitle: string) => {
    try {
      skipConsistencyRef.current.add(eventId);
      await onUpdate(eventId, { title: nextTitle });
      clearConsistencyEntry(eventId);
    } catch (error) {
      console.error('Failed to apply consistency suggestions', error);
      skipConsistencyRef.current.delete(eventId);
    }
  };

  // create
  const onCreate = async (draft: Omit<CalendarEvent, 'id'>) => {
    try {
      const created = await createEvent(draft);
      setEvents((prev) => [created, ...prev]);
      setTempClearToken((prev) => prev + 1);
      startConsistencyCheck(created);
    } catch (error) {
      console.error('Failed to create event', error);
    }
  };

  // update
  const onUpdate = async (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => {
    try {
      const existing = events.find((e) => e.id === id);
      const categoryId = patch.categoryId ?? existing?.categoryId ?? getDefaultCategoryId();
      const updated = await updateEvent(id, patch, categoryId);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      const prevTitle = existing?.title ?? '';
      const nextTitle = updated.title ?? '';
      const didChangeTitle = prevTitle.trim() !== nextTitle.trim();
      if (skipConsistencyRef.current.has(id)) {
        skipConsistencyRef.current.delete(id);
      } else if (didChangeTitle) {
        startConsistencyCheck(updated);
      }
    } catch (error) {
      console.error('Failed to update event', error);
    }
  };

  // delete
  const onDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      clearConsistencyEntry(id);
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  const getDefaultCategoryId = () =>
    categories.find((c) => c.isDefault)?.id ??
    categories.find((c) => c.checked)?.id ??
    categories[0]?.id ??
    '';

  const onToggleCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    const nextChecked = !target.checked;
    try {
      const updated = await updateCategory(id, { checked: nextChecked });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (error) {
      console.error('Failed to toggle category', error);
    }
  };

  const onAddCategory = () => {
    setCategoryModalMode('create');
    setEditingCategoryId(null);
    setCategoryModalOpen(true);
  };

  const onEditCategory = (id: string) => {
    setCategoryModalMode('edit');
    setEditingCategoryId(id);
    setCategoryModalOpen(true);
  };

  const onCreateCategory = async (draft: Omit<CategoryItem, 'id'>) => {
    try {
      const created = await createCategory(draft);
      setCategories((prev) => [created, ...prev]);
    } catch (error) {
      console.error('Failed to create category', error);
    }
  };

  const onUpdateCategory = async (id: string, patch: Partial<Omit<CategoryItem, 'id'>>) => {
    try {
      const updated = await updateCategory(id, patch);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (error) {
      console.error('Failed to update category', error);
    }
  };

  const onDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setEvents((prev) => prev.filter((e) => e.categoryId !== id));
    } catch (error) {
      console.error('Failed to delete category', error);
    }
  };

  const onLogout = () => {
    clearAuthSession();
    router.replace('/home');
  };

  const onChangeTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    if (authReady) {
      updateUserPreferences({ theme: next, language }).catch((error) => {
        console.error('Failed to update user preferences', error);
      });
    }
  };

  const onChangeLanguage = (next: Language) => {
    setLanguage(next);
    if (authReady) {
      updateUserPreferences({ theme, language: next }).catch((error) => {
        console.error('Failed to update user preferences', error);
      });
    }
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
    let active = true;
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return () => {
        active = false;
      };
    }

    fetchMe(token)
      .then((user) => {
        if (!active) return;
        setAuthSession(token, user);
        setAuthReady(true);
      })
      .catch(() => {
        if (!active) return;
        clearAuthSession();
        router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    let active = true;
    fetchCategories()
      .then((items) => {
        if (!active) return;
        setCategories(items);
      })
      .catch((error) => {
        console.error('Failed to load categories', error);
      });

    return () => {
      active = false;
    };
  }, [authReady]);

  useEffect(() => {
    const cached = loadConsistencyCache();
    setConsistencyReady(cached);
  }, []);

  useEffect(() => {
    saveConsistencyCache(consistencyReady);
  }, [consistencyReady]);

  useEffect(() => {
    if (!authReady || categories.length === 0) return;
    let active = true;
    const fallbackCategoryId = getDefaultCategoryId();
    fetchEvents(fallbackCategoryId)
      .then((items) => {
        if (!active) return;
        setEvents(items);
      })
      .catch((error) => {
        console.error('Failed to load events', error);
      });

    return () => {
      active = false;
    };
  }, [authReady, categories]);

  useEffect(() => {
    if (events.length === 0) return;
    const ids = new Set(events.map((e) => e.id));
    setConsistencyReady((prev) => {
      const next: Record<string, ConsistencyCacheEntry> = {};
      Object.entries(prev).forEach(([id, entry]) => {
        if (ids.has(id)) next[id] = entry;
      });
      return next;
    });
    setConsistencyPending((prev) => {
      const next: Record<string, ConsistencyPendingEntry> = {};
      Object.entries(prev).forEach(([id, entry]) => {
        if (ids.has(id)) next[id] = entry;
      });
      return next;
    });
  }, [events]);

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

  if (!authReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[rgb(var(--bg))] text-sm text-white/70">
        로그인 확인 중...
      </div>
    );
  }

  return (
    <CalendarLayout
      title={title}
      onPrevMonth={() => setYm((prev) => addMonths(prev, -1))}
      onNextMonth={() => setYm((prev) => addMonths(prev, 1))}
      onToday={() => setYm(getTodayYearMonth())}
      categories={categories}
      onToggleCategory={onToggleCategory}
      onAddCategory={onAddCategory}
      onEditCategory={onEditCategory}
      searchQuery={searchQuery}
      onChangeSearch={setSearchQuery}
      theme={theme}
      onChangeTheme={onChangeTheme}
      language={language}
      onChangeLanguage={onChangeLanguage}
      onLogout={onLogout}
      labels={labels}
    >
      <MonthGrid
        year={ym.year}
        month={ym.month}
        events={events}
        categories={categories}
        searchQuery={searchQuery}
        onClickDate={onClickDate}   
        onClickEvent={onClickEvent} 
        onClickMore={onClickMore}
        onClickTempRange={onClickTempRange}
        clearTempToken={tempClearToken}
        labels={labels}
        consistencyReady={consistencyReady}
        consistencyPending={consistencyPending}
        onIgnoreConsistency={onIgnoreConsistency}
        onApplyConsistency={onApplyConsistency}
      />

      <EventModal
        open={eventModalOpen}
        mode={eventModalMode}
        event={selectedEvent}
        defaultDateKey={createDateKey}
        defaultEndDateKey={createEndDateKey}
        categories={categories}
        onClose={() => setEventModalOpen(false)}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        labels={labels}
        dateInputLang={dateInputLang}
      />

      <CategoryModal
        open={categoryModalOpen}
        mode={categoryModalMode}
        category={editingCategoryId ? categories.find((c) => c.id === editingCategoryId) : null}
        onClose={() => setCategoryModalOpen(false)}
        onCreate={onCreateCategory}
        onUpdate={onUpdateCategory}
        onDelete={onDeleteCategory}
        labels={labels}
      />

      <DayEventsModal
        open={dayListOpen}
        dateKey={dayListDateKey}
        events={dayListEvents}
        categories={categories}
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
