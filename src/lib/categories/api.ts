import { api } from '@/lib/api/client';
import { getAuthToken } from '@/lib/auth/storage';
import type { CategoryItem, CategorySource } from '@/types/category';

type BackendCategory = {
  id: string;
  name: string;
  color: string;
  isVisible?: boolean;
  isDefault?: boolean;
};

type CategoryPayload = {
  name?: string;
  color?: string;
  isVisible?: boolean;
  isDefault?: boolean;
};

const DEFAULT_SOURCE: CategorySource = '기타';

const getAuthTokenOrThrow = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Missing auth token');
  }
  return token;
};

const toCategoryItem = (category: BackendCategory): CategoryItem => ({
  id: category.id,
  source: DEFAULT_SOURCE,
  name: category.name,
  color: category.color,
  checked: category.isVisible ?? true,
  isDefault: category.isDefault ?? false,
});

const toPayload = (draft: Partial<Omit<CategoryItem, 'id'>>): CategoryPayload => {
  const payload: CategoryPayload = {};
  if (draft.name !== undefined) payload.name = draft.name;
  if (draft.color !== undefined) payload.color = draft.color;
  if (draft.checked !== undefined) payload.isVisible = draft.checked;
  if (draft.isDefault !== undefined) payload.isDefault = draft.isDefault;
  return payload;
};

export const fetchCategories = async () => {
  const token = getAuthTokenOrThrow();
  const categories = await api.get<BackendCategory[]>('/categories', { authToken: token });
  return categories.map((category) => toCategoryItem(category));
};

export const createCategory = async (draft: Omit<CategoryItem, 'id'>) => {
  const token = getAuthTokenOrThrow();
  const created = await api.post<BackendCategory>('/categories', toPayload(draft), {
    authToken: token,
  });
  return toCategoryItem(created);
};

export const updateCategory = async (
  id: string,
  patch: Partial<Omit<CategoryItem, 'id'>>
) => {
  const token = getAuthTokenOrThrow();
  const updated = await api.patch<BackendCategory>(`/categories/${id}`, toPayload(patch), {
    authToken: token,
  });
  return toCategoryItem(updated);
};

export const deleteCategory = async (id: string) => {
  const token = getAuthTokenOrThrow();
  await api.delete<{ deleted: boolean }>(`/categories/${id}`, { authToken: token });
  return id;
};
