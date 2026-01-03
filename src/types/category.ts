export type CategorySource = string;

export type CategoryItem = {
  id: string;
  source: CategorySource;
  name: string;
  color: string;
  checked: boolean;
  isDefault?: boolean;
};
