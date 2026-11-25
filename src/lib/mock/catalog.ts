import type { AuthorizedActor, CatalogCategory, CatalogFilterOptions } from "@/types";
import { hasCommandCenterPermission } from "@/types";

export class CatalogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogValidationError";
  }
}

export class UnauthorizedCatalogAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedCatalogAccessError";
  }
}

export const INITIAL_CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "cat_aviation",
    name: "Aviation & Air Charter",
    slug: "aviation",
    localizedNames: {
      en: "Aviation & Air Charter",
      fr: "Aviation & Affrètement Aérien",
    },
    sortOrder: 1,
    active: true,
    serviceCount: 4,
    description: "Private jet charter, tarmac fast track, helicopter hops, and flight operations.",
    createdAt: "2025-10-01T08:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "cat_jet_charter",
    name: "Private Jet Charter",
    slug: "private-jet-charter",
    parentId: "cat_aviation",
    parentName: "Aviation & Air Charter",
    localizedNames: {
      en: "Private Jet Charter",
      fr: "Affrètement de Jets Privés",
    },
    sortOrder: 1,
    active: true,
    serviceCount: 3,
    description: "Light, midsize, and heavy global charter corridors with dedicated flight crew.",
    createdAt: "2025-10-05T09:00:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "cat_heli",
    name: "Helicopter Transfers",
    slug: "helicopter-transfers",
    parentId: "cat_aviation",
    parentName: "Aviation & Air Charter",
    localizedNames: {
      en: "Helicopter Transfers",
      fr: "Transferts en Hélicoptère",
    },
    sortOrder: 2,
    active: true,
    serviceCount: 1,
    description: "Urban and alpine point-to-point aerial shuttle connections.",
    createdAt: "2025-10-10T14:00:00Z",
    updatedAt: "2026-02-12T16:00:00Z",
  },
  {
    id: "cat_yacht",
    name: "Marine & Yachting",
    slug: "marine-yachting",
    localizedNames: {
      en: "Marine & Yachting",
      fr: "Nautisme & Yachts",
    },
    sortOrder: 2,
    active: true,
    serviceCount: 3,
    description: "Superyacht day charters, coastal cruising, and tender transport.",
    createdAt: "2025-10-01T08:00:00Z",
    updatedAt: "2026-03-01T12:00:00Z",
  },
  {
    id: "cat_motor_yacht",
    name: "Motor Yacht Charter",
    slug: "motor-yacht-charter",
    parentId: "cat_yacht",
    parentName: "Marine & Yachting",
    localizedNames: {
      en: "Motor Yacht Charter",
      fr: "Location de Yachts à Moteur",
    },
    sortOrder: 1,
    active: true,
    serviceCount: 2,
    description: "High-performance luxury motor yachts with full onboard crew.",
    createdAt: "2025-10-12T10:00:00Z",
    updatedAt: "2026-03-10T14:00:00Z",
  },
  {
    id: "cat_chauffeur",
    name: "Chauffeur & Ground Mobility",
    slug: "chauffeur-ground",
    localizedNames: {
      en: "Chauffeur & Ground Mobility",
      fr: "Chauffeur & Mobilité Terrestre",
    },
    sortOrder: 3,
    active: true,
    serviceCount: 2,
    description: "Executive sedan transfers, armored motorcades, and regional hops.",
    createdAt: "2025-10-01T08:00:00Z",
    updatedAt: "2026-01-20T09:00:00Z",
  },
  {
    id: "cat_dining",
    name: "Fine Dining & Private Chefs",
    slug: "fine-dining",
    localizedNames: {
      en: "Fine Dining & Private Chefs",
      fr: "Haute Gastronomie & Chefs Privés",
    },
    sortOrder: 4,
    active: true,
    serviceCount: 2,
    description: "Michelin-caliber private dining, sommelier pairings, and culinary events.",
    createdAt: "2025-10-01T08:00:00Z",
    updatedAt: "2026-01-22T10:00:00Z",
  },
  {
    id: "cat_security",
    name: "Close Protection & Security",
    slug: "security-protection",
    localizedNames: {
      en: "Close Protection & Security",
      fr: "Protection Rapprochée & Sécurité",
    },
    sortOrder: 5,
    active: true,
    serviceCount: 1,
    description: "Certified security detachments, route reconnaissance, and discrete VIP details.",
    createdAt: "2025-10-01T08:00:00Z",
    updatedAt: "2026-02-01T15:00:00Z",
  },
  {
    id: "cat_expeditions",
    name: "Alpine Expeditions & Sports",
    slug: "alpine-expeditions",
    localizedNames: {
      en: "Alpine Expeditions & Sports",
      fr: "Expéditions Alpines & Sports",
    },
    sortOrder: 6,
    active: false,
    serviceCount: 1,
    description: "High alpine heli-ski adventures and guided mountain expeditions.",
    createdAt: "2025-10-01T08:00:00Z",
    updatedAt: "2026-04-01T12:00:00Z",
  },
];

export class CatalogRepository {
  private categories: CatalogCategory[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetDefaults();
  }

  public resetDefaults(): void {
    this.categories = JSON.parse(JSON.stringify(INITIAL_CATALOG_CATEGORIES));
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch (err) {
        console.error("CatalogRepository listener error:", err);
      }
    }
  }

  /**
   * Public active categories projection accessible without administrative privileges.
   */
  public listPublicCategories(filters?: CatalogFilterOptions): CatalogCategory[] {
    return this.categories
      .filter((c) => {
        if (!c.active) return false;
        if (filters?.parentId && filters.parentId !== "ALL") {
          if (filters.parentId === "ROOT") {
            if (c.parentId) return false;
          } else if (c.parentId !== filters.parentId) {
            return false;
          }
        }
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(q);
          const matchSlug = c.slug.toLowerCase().includes(q);
          const matchEn = c.localizedNames.en.toLowerCase().includes(q);
          const matchFr = c.localizedNames.fr.toLowerCase().includes(q);
          if (!matchName && !matchSlug && !matchEn && !matchFr) return false;
        }
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => structuredClone(c));
  }

  /**
   * List categories with role authorization checks.
   * Administrative personas receive full catalog management visibility.
   * Vendor and Concierge personas receive only the public active categories projection.
   */
  public listCategories(
    actorOrFilters?: AuthorizedActor | CatalogFilterOptions | null,
    maybeFilters?: CatalogFilterOptions,
  ): CatalogCategory[] {
    let actor: AuthorizedActor | null | undefined;
    let filters: CatalogFilterOptions | undefined;

    if (actorOrFilters && "role" in actorOrFilters) {
      actor = actorOrFilters as AuthorizedActor;
      filters = maybeFilters;
    } else {
      filters = actorOrFilters as CatalogFilterOptions;
    }

    if (actor && (actor.role === "VENDOR" || actor.role === "CONCIERGE")) {
      return this.listPublicCategories(filters);
    }

    return this.categories
      .filter((c) => {
        if (filters?.parentId && filters.parentId !== "ALL") {
          if (filters.parentId === "ROOT") {
            if (c.parentId) return false;
          } else if (c.parentId !== filters.parentId) {
            return false;
          }
        }
        if (filters?.active !== undefined && filters.active !== "ALL") {
          if (c.active !== filters.active) return false;
        }
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(q);
          const matchSlug = c.slug.toLowerCase().includes(q);
          const matchEn = c.localizedNames.en.toLowerCase().includes(q);
          const matchFr = c.localizedNames.fr.toLowerCase().includes(q);
          if (!matchName && !matchSlug && !matchEn && !matchFr) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters?.sort === "name") {
          return a.name.localeCompare(b.name);
        }
        if (filters?.sort === "updated") {
          return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
        }
        return a.sortOrder - b.sortOrder;
      })
      .map((c) => structuredClone(c));
  }

  public getCategoryById(id: string): CatalogCategory | undefined {
    const c = this.categories.find(
      (item) => item.id === id || item.id.toLowerCase() === id.toLowerCase(),
    );
    return c ? structuredClone(c) : undefined;
  }

  public toggleCategoryActive(
    actor: AuthorizedActor | null | undefined,
    id: string,
    active?: boolean,
  ): CatalogCategory {
    if (!actor || !actor.role) {
      throw new UnauthorizedCatalogAccessError("Authentication required: Actor context missing.");
    }

    if (
      !hasCommandCenterPermission(actor.role, "manage:assets") &&
      actor.role !== "SUPER_ADMIN" &&
      actor.role !== "ADMIN"
    ) {
      throw new UnauthorizedCatalogAccessError(
        `Role "${actor.role}" is not authorized to modify catalog categories. Permission "manage:assets" or administrative authority required.`,
      );
    }

    const cat = this.categories.find((item) => item.id === id);
    if (!cat) {
      throw new CatalogValidationError(`Category not found: "${id}".`);
    }

    cat.active = active !== undefined ? active : !cat.active;
    cat.updatedAt = new Date().toISOString();
    this.notify();
    return structuredClone(cat);
  }
}

export const catalogRepository = new CatalogRepository();
