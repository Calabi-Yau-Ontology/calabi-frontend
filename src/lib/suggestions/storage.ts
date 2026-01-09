import type { ConsistencyCacheEntry } from '@/types/suggestions';

const STORAGE_KEY = 'calabi-consistency-cache';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type ConsistencyStoragePayload = {
  version: 1;
  entries: Record<string, ConsistencyCacheEntry>;
};

const isValidEntry = (entry: ConsistencyCacheEntry) =>
  typeof entry?.createdAt === 'number' &&
  entry.createdAt > 0 &&
  Array.isArray(entry.results);

export const loadConsistencyCache = (): Record<string, ConsistencyCacheEntry> => {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Partial<ConsistencyStoragePayload>;
    const entries = parsed.entries ?? {};
    const now = Date.now();
    const filtered: Record<string, ConsistencyCacheEntry> = {};

    Object.entries(entries).forEach(([eventId, entry]) => {
      if (!entry || !isValidEntry(entry)) return;
      if (now - entry.createdAt > ONE_DAY_MS) return;
      filtered[eventId] = entry;
    });

    return filtered;
  } catch {
    return {};
  }
};

export const saveConsistencyCache = (
  entries: Record<string, ConsistencyCacheEntry>
) => {
  if (typeof window === 'undefined') return;
  const payload: ConsistencyStoragePayload = {
    version: 1,
    entries,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const removeConsistencyCacheEntry = (eventId: string) => {
  if (typeof window === 'undefined') return;
  const current = loadConsistencyCache();
  if (!current[eventId]) return;
  delete current[eventId];
  saveConsistencyCache(current);
};
