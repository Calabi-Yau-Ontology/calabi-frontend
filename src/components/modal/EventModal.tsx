'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ModalShell from './ModalShell';
import type { CalendarEvent } from '@/types/event';
import type { CategoryItem } from '@/types/category';
import { validateEventDraft, type EventDraft } from '@/lib/validation/eventValidation';
import type { Labels } from '@/lib/i18n';
import { fetchAutocomplete } from '@/lib/suggestions/api';
import type { AutocompleteSuggestion } from '@/types/suggestions';

type Props = {
  open: boolean;
  mode: 'view' | 'create';
  event?: CalendarEvent | null;
  defaultDateKey?: string | null;
  defaultEndDateKey?: string | null;
  categories: CategoryItem[];
  onClose: () => void;

  // ✅ Phase5: 실제 반영을 위해 콜백 추가
  onCreate: (draft: Omit<CalendarEvent, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => void;
  onDelete: (id: string) => void;
  labels: Labels;
  dateInputLang: string;
};


export default function EventModal({
  open,
  mode,
  event,
  defaultDateKey,
  defaultEndDateKey,
  categories,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  labels,
  dateInputLang,
}: Props) {
  const getDefaultCategoryId = () =>
    categories.find((c) => c.isDefault)?.id ??
    categories.find((c) => c.checked)?.id ??
    categories[0]?.id ??
    '';
  const [uiMode, setUiMode] = useState<'view' | 'edit' | 'create'>('view');
  const [draft, setDraft] = useState<EventDraft>({
    categoryId: getDefaultCategoryId(),
    title: '',
    startDate: defaultDateKey ?? '',
    endDate: undefined,
    description: '',
    allDay: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autocompleteItems, setAutocompleteItems] = useState<AutocompleteSuggestion[]>([]);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(0);
  const [titleFocused, setTitleFocused] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const lastAutocompleteApplyRef = useRef<{
    appliedTitle: string;
    fragment: string;
    expiresAt: number;
  } | null>(null);
  const isEnglishDate = dateInputLang.toLowerCase().startsWith('en');

  const extractFragment = (title: string) => {
    const match = title.match(/(\S+)$/);
    if (!match) return { fragment: '', startIndex: title.length };
    const fragment = match[1];
    return { fragment, startIndex: title.length - fragment.length };
  };

  const applySuggestion = (
    surface: string,
    baseTitle?: string,
    keepFocus = true
  ) => {
    const sourceTitle = baseTitle ?? draft.title;
    const { startIndex, fragment } = extractFragment(sourceTitle);
    const nextTitle = `${sourceTitle.slice(0, startIndex)}${surface}`;
    lastAutocompleteApplyRef.current = {
      appliedTitle: nextTitle,
      fragment,
      expiresAt: Date.now() + 500,
    };
    setDraft((p) => ({ ...p, title: nextTitle }));
    setAutocompleteOpen(false);
    setActiveAutocompleteIndex(0);
    if (keepFocus) {
      requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });
    }
  };

  const handleTitleChange = (value: string) => {
    const pending = lastAutocompleteApplyRef.current;
    if (pending && Date.now() <= pending.expiresAt) {
      const extra = value.startsWith(pending.appliedTitle)
        ? value.slice(pending.appliedTitle.length)
        : null;
      if (extra && pending.fragment.startsWith(extra)) {
        lastAutocompleteApplyRef.current = null;
        setDraft((p) => ({ ...p, title: pending.appliedTitle }));
        return;
      }
    }
    lastAutocompleteApplyRef.current = null;
    setDraft((p) => ({ ...p, title: value }));
  };

  useEffect(() => {
    if (!open) {
      setAutocompleteItems([]);
      setAutocompleteOpen(false);
      setAutocompleteLoading(false);
      setActiveAutocompleteIndex(0);
      return;
    }

    if (mode === 'create') {
      const normalizedEnd =
        defaultEndDateKey && defaultDateKey && defaultEndDateKey !== defaultDateKey
          ? defaultEndDateKey
          : undefined;
      const nextStart = defaultDateKey ?? '';
      setUiMode('create');
      setDraft({
        categoryId: getDefaultCategoryId(),
        title: '',
        startDate: nextStart,
        endDate: normalizedEnd,
        description: '',
        allDay: true,
      });
      setErrors({});
      return;
    }

    // view 모드로 열릴 때
    setUiMode('view');
    if (event) {
      setDraft({
        categoryId: event.categoryId,
        title: event.title ?? '',
        startDate: event.startDate,
        endDate: event.endDate,
        description: event.description ?? '',
        allDay: event.allDay ?? true,
      });
      setErrors({});
    }
  }, [open, mode, event, defaultDateKey, defaultEndDateKey, categories]);

  useEffect(() => {
    if (!open || uiMode === 'view') return;
    const { fragment } = extractFragment(draft.title);
    if (!fragment) {
      setAutocompleteItems([]);
      setAutocompleteOpen(false);
      setActiveAutocompleteIndex(0);
      return;
    }

    let active = true;
    setAutocompleteLoading(true);
    const timer = window.setTimeout(() => {
      fetchAutocomplete(fragment, 5)
        .then((res) => {
          if (!active) return;
          const nextItems = res.suggestions ?? [];
          setAutocompleteItems(nextItems);
          setActiveAutocompleteIndex(0);
          setAutocompleteOpen(nextItems.length > 1);
        })
        .catch(() => {
          if (!active) return;
          setAutocompleteItems([]);
          setAutocompleteOpen(false);
          setActiveAutocompleteIndex(0);
        })
        .finally(() => {
          if (!active) return;
          setAutocompleteLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draft.title, open, uiMode]);

  const ghostSuffix = useMemo(() => {
    if (!titleFocused || autocompleteLoading) return '';
    if (autocompleteItems.length !== 1) return '';
    const { fragment } = extractFragment(draft.title);
    if (!fragment) return '';
    const suggestion = autocompleteItems[0]?.surface ?? '';
    if (!suggestion.startsWith(fragment)) return '';
    return suggestion.slice(fragment.length);
  }, [titleFocused, autocompleteLoading, autocompleteItems, draft.title]);

  const headerTitle = useMemo(() => {
    if (uiMode === 'create') return labels.modals.event.newTitle;
    return labels.modals.event.title;
  }, [uiMode, labels]);

  const category = categories.find((c) => c.id === draft.categoryId);

  const submit = () => {
    const nextErrors = validateEventDraft(draft, labels.validation);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // endDate가 startDate와 같으면 굳이 저장 안 해도 됨(선택)
    const normalized: Omit<CalendarEvent, 'id'> = {
      categoryId: draft.categoryId,
      title: draft.title.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate?.trim() ? draft.endDate : undefined,
      description: draft.description?.trim() ? draft.description : undefined,
      allDay: draft.allDay ?? true,
    };

    if (uiMode === 'create') {
      onCreate(normalized);
      onClose();
      return;
    }

    if (uiMode === 'edit' && event?.id) {
      onUpdate(event.id, normalized);
      setUiMode('view');
    }
  };

  const startEdit = () => setUiMode('edit');

  const remove = () => {
    if (!event?.id) return;
    onDelete(event.id);
    onClose();
  };



  return (
    <ModalShell open={open} title={headerTitle} onClose={onClose} closeLabel={labels.modals.close}>
      {/* VIEW */}
      {uiMode === 'view' && event ? (
        <div className="space-y-3">
          <div className="text-lg font-semibold text-white/90">{event.title}</div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <span
              className="h-2.5 w-2.5 rounded-sm border border-white/10"
              style={{ backgroundColor: category?.color ?? '#999' }}
            />
            <span>{category?.name ?? event.categoryId}</span>
          </div>

          <div className="text-sm text-white/70">
            {event.startDate}
            {event.endDate && event.endDate !== event.startDate ? ` ~ ${event.endDate}` : ''}
          </div>

          {event.description && (
            <div className="whitespace-pre-wrap rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              {event.description}
            </div>
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              onClick={startEdit}
            >
              {labels.modals.event.edit}
            </button>
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              onClick={remove}
            >
              {labels.modals.event.delete}
            </button>
          </div>
        </div>
      ) : (
        /* CREATE / EDIT */
        <div className="space-y-3">
          <div className="grid gap-2">
            <label className="text-sm text-white/70">{labels.modals.event.titleLabel}</label>
            <div className="relative">
              {ghostSuffix && (
                <div className="absolute inset-0 z-0 pointer-events-none flex items-center px-3 py-2 text-sm">
                  <span className="text-transparent">{draft.title}</span>
                  <span className="text-white/35">{ghostSuffix}</span>
                </div>
              )}
              <input
                ref={titleInputRef}
                value={draft.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onFocus={() => {
                  setTitleFocused(true);
                  if (autocompleteItems.length > 1) setAutocompleteOpen(true);
                }}
                onBlur={() => {
                  setTitleFocused(false);
                  window.setTimeout(() => setAutocompleteOpen(false), 120);
                }}
                onKeyDown={(e) => {
                  if (autocompleteLoading) return;
                  if (e.key === 'Tab') {
                    if (autocompleteItems.length === 1 && ghostSuffix) {
                      e.preventDefault();
                      applySuggestion(autocompleteItems[0].surface, e.currentTarget.value);
                      return;
                    }
                    if (autocompleteItems.length > 1) {
                      e.preventDefault();
                      setAutocompleteOpen(true);
                      setActiveAutocompleteIndex((prev) =>
                        autocompleteItems.length === 0 ? 0 : (prev + 1) % autocompleteItems.length
                      );
                      return;
                    }
                  }
                  if (e.key === 'Enter' && autocompleteOpen && autocompleteItems.length > 1) {
                    const target = autocompleteItems[activeAutocompleteIndex];
                    if (!target) return;
                    e.preventDefault();
                    applySuggestion(target.surface, e.currentTarget.value);
                  }
                }}
                className="relative z-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
                placeholder={labels.modals.event.titlePlaceholder}
              />

              {autocompleteOpen && autocompleteItems.length > 1 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-white/10 bg-[rgb(var(--panel))] shadow-lg">
                  <div className="px-2 py-1 text-[10px] text-white/45">
                    {labels.suggestions.autocompleteTitle}
                  </div>
                  {autocompleteLoading && (
                    <div className="px-2 pb-2 text-[11px] text-white/55">...</div>
                  )}
                  {!autocompleteLoading && autocompleteItems.length === 0 && (
                    <div className="px-2 pb-2 text-[11px] text-white/55">
                      {labels.suggestions.autocompleteEmpty}
                    </div>
                  )}
                  {!autocompleteLoading &&
                    autocompleteItems.map((item, index) => {
                      const isActive = index === activeAutocompleteIndex;
                      return (
                      <button
                        key={`${item.surface}-${item.conceptName ?? 'unknown'}`}
                        type="button"
                        className={[
                          'flex w-full items-center justify-between px-2 py-1.5 text-left text-[11px]',
                          isActive
                            ? 'bg-white/10 text-white'
                            : 'text-white/80 hover:bg-white/10',
                        ].join(' ')}
                        onClick={() =>
                          applySuggestion(item.surface, titleInputRef.current?.value)
                        }
                      >
                        <span>{item.surface}</span>
                        {item.usageCount !== undefined && (
                          <span className="text-[10px] text-white/45">
                            {item.usageCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="min-h-[16px] text-xs text-red-300">
              {errors.title ?? ''}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">{labels.modals.event.categoryLabel}</label>
            <select
              value={draft.categoryId}
              onChange={(e) => setDraft((p) => ({ ...p, categoryId: e.target.value }))}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="min-h-[16px] text-xs text-red-300">
              {errors.categoryId ?? ''}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm text-white/70">{labels.modals.event.startLabel}</label>
            <input
              type="date"
              value={draft.startDate ?? ''}
              onChange={(e) =>
                setDraft((p) => {
                  const nextStart = e.target.value;
                  const nextEnd =
                    p.endDate && nextStart && p.endDate < nextStart ? undefined : p.endDate;
                  return { ...p, startDate: nextStart, endDate: nextEnd };
                })
              }
              lang={dateInputLang}
              placeholder={isEnglishDate ? 'YY.MM.DD' : undefined}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            />
              <div className="min-h-[16px] text-xs text-red-300">
                {errors.startDate ?? ''}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-white/70">{labels.modals.event.endLabel}</label>
            <input
              type="date"
              value={draft.endDate ?? ''}
              min={draft.startDate ?? undefined}
              onChange={(e) =>
                setDraft((p) => ({ ...p, endDate: e.target.value || undefined }))
              }
              lang={dateInputLang}
              placeholder={isEnglishDate ? 'YY.MM.DD' : undefined}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            />
              <div className="min-h-[16px] text-xs text-red-300">
                {errors.endDate ?? ''}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/70">{labels.modals.event.descriptionLabel}</label>
            <textarea
              value={draft.description ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              className="min-h-[90px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
              placeholder={labels.modals.event.descriptionPlaceholder}
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={submit}
            >
              {labels.modals.event.save}
            </button>
            <button
              type="button"
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={() => {
                // create는 그냥 닫기, edit은 view로 돌아가기
                if (uiMode === 'edit') setUiMode('view');
                else onClose();
              }}
            >
              {labels.modals.event.cancel}
            </button>
          </div>

          {uiMode === 'edit' && event?.id && (
            <button
              type="button"
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              onClick={remove}
            >
              {labels.modals.event.delete}
            </button>
          )}
        </div>
      )}
    </ModalShell>
  );
}
