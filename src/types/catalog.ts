export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  parentName?: string;
  localizedNames: {
    en: string;
    fr: string;
  };
  sortOrder: number;
  active: boolean;
  serviceCount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogFilterOptions {
  search?: string;
  parentId?: string | "ALL";
  active?: boolean | "ALL";
  language?: "ALL" | "en" | "fr";
  sort?: "order" | "name" | "updated";
}
