"use client";

import { useEffect, useMemo, useState } from 'react';
import ModalShell from './ModalShell';
import type { CategoryItem, CategorySource } from '@/types/category';
import type { Labels } from '@/lib/i18n';

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  category?: CategoryItem | null;
  onClose: () => void;
  onCreate: (draft: Omit<CategoryItem, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Omit<CategoryItem, 'id'>>) => void;
  onDelete: (id: string) => void;
  labels: Labels;
};

type Draft = {
  name: string;
  source: CategorySource;
  color: string;
  checked: boolean;
};

const DEFAULT_COLOR = '#3b82f6';
const DEFAULT_SOURCE: CategorySource = '기타';

export default function CategoryModal({
  open,
  mode,
  category,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  labels,
}: Props) {
  const [draft, setDraft] = useState<Draft>({
    name: '',
    source: DEFAULT_SOURCE,
    color: DEFAULT_COLOR,
    checked: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && category) {
      setDraft({
        name: category.name,
        source: category.source,
        color: category.color,
        checked: category.checked,
      });
      setError(null);
      return;
    }

    setDraft({
      name: '',
      source: DEFAULT_SOURCE,
      color: DEFAULT_COLOR,
      checked: true,
    });
    setError(null);
  }, [open, mode, category]);

  const title = useMemo(
    () => (mode === 'create' ? labels.modals.category.titleCreate : labels.modals.category.titleEdit),
    [mode, labels]
  );

  const submit = () => {
    if (!draft.name.trim()) {
      setError(labels.modals.category.nameError);
      return;
    }

    if (mode === 'create') {
      onCreate({
        name: draft.name.trim(),
        source: draft.source,
        color: draft.color,
        checked: draft.checked,
      });
      onClose();
      return;
    }

    if (category?.id) {
      onUpdate(category.id, {
        name: draft.name.trim(),
        source: draft.source,
        color: draft.color,
        checked: draft.checked,
      });
      onClose();
    }
  };

  const remove = () => {
    if (!category?.id) return;
    onDelete(category.id);
    onClose();
  };

  return (
    <ModalShell open={open} title={title} onClose={onClose} closeLabel={labels.modals.close}>
      <div className="space-y-3">
        <div className="grid gap-2">
          <label className="text-sm text-white/70">{labels.modals.category.nameLabel}</label>
          <input
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            placeholder={labels.modals.category.namePlaceholder}
          />
          <div className="min-h-[16px] text-xs text-red-300">{error ?? ''}</div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-white/70">{labels.modals.category.colorLabel}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={draft.color}
              onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))}
              className="h-9 w-12 rounded-md border border-white/10 bg-white/5 p-1"
            />
            <input
              value={draft.color}
              onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))}
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={draft.checked}
            onChange={(e) => setDraft((p) => ({ ...p, checked: e.target.checked }))}
          />
          {labels.modals.category.defaultVisible}
        </label>

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            onClick={submit}
          >
            {labels.modals.category.save}
          </button>
          <button
            type="button"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            onClick={onClose}
          >
            {labels.modals.category.cancel}
          </button>
        </div>

        {mode === 'edit' && category?.id && (
          <button
            type="button"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            onClick={remove}
          >
            {labels.modals.category.delete}
          </button>
        )}
      </div>
    </ModalShell>
  );
}
