import { catalogRepository } from "@/lib/mock/catalog";
import type {
  AuthorizedActor,
  CatalogService,
  CreateServiceInput,
  ServiceFilterOptions,
  UpdateServiceInput,
} from "@/types";
import { hasCommandCenterPermission } from "@/types";

export class ServiceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceValidationError";
  }
}

export class UnauthorizedServiceAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedServiceAccessError";
  }
}

export class StaleServiceVersionConflictError extends Error {
  constructor(expected: number, actual: number) {
    super(
      `Stale service version conflict (409): Expected version ${expected}, but authoritative record is at version ${actual}. Please refresh and re-evaluate.`,
    );
    this.name = "StaleServiceVersionConflictError";
  }
}

export const INITIAL_CATALOG_SERVICES: CatalogService[] = [
  {
    id: "srv_aviation_01",
    categoryId: "cat_jet_charter",
    categoryName: "Private Jet Charter",
    name: "Private Jet Charter · Europe",
    slug: "private-jet-charter-europe",
    template: "AIR_CHARTER",
    bookingMode: "QUOTE_REQUIRED",
    availabilityModel: "DURATION_BASED",
    paymentMode: "PREPAYMENT",
    description:
      "On-demand heavy and super-midsize private jet charters across European routes with discrete handling.",
    localizedDescriptions: {
      en: "On-demand heavy and super-midsize private jet charters across European routes with discrete handling.",
      fr: "Affrètement de jets privés long-courrier et super-intermédiaires en Europe avec salon VIP discret.",
    },
    active: true,
    customFieldCount: 4,
    version: 1,
    createdAt: "2025-10-15T09:00:00Z",
    updatedAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "srv_heli_01",
    categoryId: "cat_heli",
    categoryName: "Helicopter Transfers",
    name: "Alpine & Urban Helicopter Transfer",
    slug: "alpine-urban-helicopter-transfer",
    template: "AIR_CHARTER",
    bookingMode: "INSTANT_CONFIRMATION",
    availabilityModel: "SCHEDULED_SLOTS",
    paymentMode: "PREPAYMENT",
    description:
      "Rapid twin-engine point-to-point aerial transfers connecting regional hubs to alpine landing sites.",
    localizedDescriptions: {
      en: "Rapid twin-engine point-to-point aerial transfers connecting regional hubs to alpine landing sites.",
      fr: "Transferts rapides en hélicoptère biturbine reliant les métropoles aux altisurfaces alpines.",
    },
    active: true,
    customFieldCount: 0,
    version: 1,
    createdAt: "2025-10-20T10:00:00Z",
    updatedAt: "2026-02-12T16:00:00Z",
  },
  {
    id: "srv_yacht_01",
    categoryId: "cat_motor_yacht",
    categoryName: "Motor Yacht Charter",
    name: "Day Yacht Charter · Côte d'Azur",
    slug: "day-yacht-charter-cote-d-azur",
    template: "YACHT_CHARTER",
    bookingMode: "QUOTE_REQUIRED",
    availabilityModel: "PER_DIEM",
    paymentMode: "DEPOSIT_AND_BALANCE",
    description:
      "Luxury day and sunset charters departing Monaco, Cannes, and Saint-Tropez with full captain and stew service.",
    localizedDescriptions: {
      en: "Luxury day and sunset charters departing Monaco, Cannes, and Saint-Tropez with full captain and stew service.",
      fr: "Journées d'exception en mer au départ de Monaco, Cannes et Saint-Tropez avec équipage dédié.",
    },
    active: true,
    customFieldCount: 2,
    version: 1,
    createdAt: "2025-10-25T14:00:00Z",
    updatedAt: "2026-03-10T14:00:00Z",
  },
  {
    id: "srv_chauffeur_01",
    categoryId: "cat_chauffeur",
    categoryName: "Chauffeur & Ground Mobility",
    name: "Executive Chauffeur Transfer",
    slug: "executive-chauffeur-transfer",
    template: "CHAUFFEUR_TRANSFER",
    bookingMode: "INSTANT_CONFIRMATION",
    availabilityModel: "SCHEDULED_SLOTS",
    paymentMode: "PREPAYMENT",
    description:
      "Bespoke door-to-door transfer in luxury sedans and armored SUV motorcades with multilingual chauffeurs.",
    localizedDescriptions: {
      en: "Bespoke door-to-door transfer in luxury sedans and armored SUV motorcades with multilingual chauffeurs.",
      fr: "Transferts porte-à-porte sur mesure en berline de prestige et SUV blindé avec chauffeurs bilingues.",
    },
    active: true,
    customFieldCount: 2,
    version: 1,
    createdAt: "2025-11-01T08:00:00Z",
    updatedAt: "2026-01-20T09:00:00Z",
  },
  {
    id: "srv_dining_01",
    categoryId: "cat_dining",
    categoryName: "Fine Dining & Private Chefs",
    name: "Private Chef & Dining Experience",
    slug: "private-chef-dining-experience",
    template: "FINE_DINING",
    bookingMode: "QUOTE_REQUIRED",
    availabilityModel: "SCHEDULED_SLOTS",
    paymentMode: "DEPOSIT_AND_BALANCE",
    description:
      "Exclusive in-villa gastronomic dinners curated by Michelin-trained private chefs and master sommeliers.",
    localizedDescriptions: {
      en: "Exclusive in-villa gastronomic dinners curated by Michelin-trained private chefs and master sommeliers.",
      fr: "Dîners gastronomiques privés en villa orchestrés par des chefs étoilés et sommeliers experts.",
    },
    active: true,
    customFieldCount: 0,
    version: 1,
    createdAt: "2025-11-05T12:00:00Z",
    updatedAt: "2026-01-22T10:00:00Z",
  },
  {
    id: "srv_sec_01",
    categoryId: "cat_security",
    categoryName: "Close Protection & Security",
    name: "Executive Close Protection Detail",
    slug: "executive-close-protection-detail",
    template: "SECURITY_DETAIL",
    bookingMode: "MANUAL_APPROVAL",
    availabilityModel: "DURATION_BASED",
    paymentMode: "INVOICE_AFTER_COMPLETION",
    description:
      "Discrete VIP security and convoy escort by licensed security specialists for high-net-worth principals.",
    localizedDescriptions: {
      en: "Discrete VIP security and convoy escort by licensed security specialists for high-net-worth principals.",
      fr: "Protection rapprochée et escortes de convois sécurisés pour personnalités et dirigeants.",
    },
    active: true,
    customFieldCount: 0,
    version: 1,
    createdAt: "2025-11-10T16:00:00Z",
    updatedAt: "2026-02-01T15:00:00Z",
  },
];

export class ServiceRepository {
  private services: CatalogService[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetDefaults();
  }

  public resetDefaults(): void {
    this.services = JSON.parse(JSON.stringify(INITIAL_CATALOG_SERVICES));
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
        console.error("ServiceRepository listener error:", err);
      }
    }
  }

  private checkMutationPermission(actor: AuthorizedActor | null | undefined): AuthorizedActor {
    if (!actor || !actor.role) {
      throw new UnauthorizedServiceAccessError("Authentication required: Actor context missing.");
    }
    if (
      !hasCommandCenterPermission(actor.role, "manage:assets") &&
      actor.role !== "SUPER_ADMIN" &&
      actor.role !== "ADMIN"
    ) {
      throw new UnauthorizedServiceAccessError(
        `Role "${actor.role}" is not authorized to create or modify catalog services. Administrative authority or "manage:assets" required.`,
      );
    }
    return actor;
  }

  public listServices(filters?: ServiceFilterOptions): CatalogService[] {
    return this.services
      .filter((s) => {
        if (filters?.categoryId && filters.categoryId !== "ALL") {
          if (s.categoryId !== filters.categoryId) return false;
        }
        if (filters?.template && filters.template !== "ALL") {
          if (s.template !== filters.template) return false;
        }
        if (filters?.bookingMode && filters.bookingMode !== "ALL") {
          if (s.bookingMode !== filters.bookingMode) return false;
        }
        if (filters?.active !== undefined && filters.active !== "ALL") {
          if (s.active !== filters.active) return false;
        }
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchName = s.name.toLowerCase().includes(q);
          const matchSlug = s.slug.toLowerCase().includes(q);
          const matchCategory = s.categoryName.toLowerCase().includes(q);
          const matchEn = s.localizedDescriptions?.en?.toLowerCase().includes(q) || false;
          const matchFr = s.localizedDescriptions?.fr?.toLowerCase().includes(q) || false;
          if (!matchName && !matchSlug && !matchCategory && !matchEn && !matchFr) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters?.sort === "category") {
          return a.categoryName.localeCompare(b.categoryName);
        }
        if (filters?.sort === "updated") {
          return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
        }
        return a.name.localeCompare(b.name);
      })
      .map((s) => structuredClone(s));
  }

  public getServiceById(id: string): CatalogService | undefined {
    const s = this.services.find(
      (item) => item.id === id || item.id.toLowerCase() === id.toLowerCase(),
    );
    return s ? structuredClone(s) : undefined;
  }

  public createService(
    actor: AuthorizedActor | null | undefined,
    input: CreateServiceInput,
  ): CatalogService {
    this.checkMutationPermission(actor);

    if (!input.name || !input.name.trim()) {
      throw new ServiceValidationError("Service name is required.");
    }

    if (!input.categoryId || !input.categoryId.trim()) {
      throw new ServiceValidationError("Category is required.");
    }

    const category = catalogRepository.getCategoryById(input.categoryId);
    if (!category) {
      throw new ServiceValidationError(
        `Category "${input.categoryId}" does not exist in authoritative catalog.`,
      );
    }

    const slug = (
      input.slug?.trim() ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    ).toLowerCase();

    if (this.services.some((s) => s.slug === slug)) {
      throw new ServiceValidationError(`Service with slug "${slug}" already exists.`);
    }

    const now = new Date().toISOString();
    const newService: CatalogService = {
      id: `srv_${Date.now().toString(36)}`,
      categoryId: category.id,
      categoryName: category.name,
      name: input.name.trim(),
      slug,
      template: input.template,
      bookingMode: input.bookingMode,
      availabilityModel: input.availabilityModel,
      paymentMode: input.paymentMode,
      description: input.description?.trim() || undefined,
      localizedDescriptions: {
        en: input.localizedDescriptions?.en?.trim() || input.name.trim(),
        fr: input.localizedDescriptions?.fr?.trim() || input.name.trim(),
      },
      active: input.active !== undefined ? input.active : true,
      customFieldCount: 0,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.services.unshift(newService);
    this.notify();
    return structuredClone(newService);
  }

  public updateService(
    actor: AuthorizedActor | null | undefined,
    input: UpdateServiceInput,
  ): CatalogService {
    this.checkMutationPermission(actor);

    const index = this.services.findIndex((s) => s.id === input.serviceId);
    if (index === -1) {
      throw new ServiceValidationError(`Service not found: "${input.serviceId}".`);
    }

    const currentService = this.services[index];

    // Optimistic concurrency control
    if (input.expectedVersion !== undefined && currentService.version !== input.expectedVersion) {
      throw new StaleServiceVersionConflictError(input.expectedVersion, currentService.version);
    }

    const candidate: CatalogService = structuredClone(currentService);

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new ServiceValidationError("Service name cannot be blank.");
      }
      candidate.name = input.name.trim();
    }

    if (input.categoryId !== undefined) {
      const category = catalogRepository.getCategoryById(input.categoryId);
      if (!category) {
        throw new ServiceValidationError(`Category "${input.categoryId}" not found.`);
      }
      candidate.categoryId = category.id;
      candidate.categoryName = category.name;
    }

    if (input.slug !== undefined) {
      const slug = input.slug.toLowerCase().trim();
      if (!slug) {
        throw new ServiceValidationError("Slug cannot be blank.");
      }
      if (this.services.some((s) => s.id !== candidate.id && s.slug === slug)) {
        throw new ServiceValidationError(`Service with slug "${slug}" already exists.`);
      }
      candidate.slug = slug;
    }

    if (input.template !== undefined) candidate.template = input.template;
    if (input.bookingMode !== undefined) candidate.bookingMode = input.bookingMode;
    if (input.availabilityModel !== undefined)
      candidate.availabilityModel = input.availabilityModel;
    if (input.paymentMode !== undefined) candidate.paymentMode = input.paymentMode;

    if (input.description !== undefined) {
      candidate.description = input.description.trim() || undefined;
    }

    if (input.localizedDescriptions !== undefined) {
      candidate.localizedDescriptions = {
        en: input.localizedDescriptions.en?.trim() || candidate.name,
        fr: input.localizedDescriptions.fr?.trim() || candidate.name,
      };
    }

    if (input.active !== undefined) {
      candidate.active = input.active;
    }

    candidate.version += 1;
    candidate.updatedAt = new Date().toISOString();

    // Atomic replacement
    this.services[index] = candidate;
    this.notify();
    return structuredClone(candidate);
  }

  public toggleServiceActive(
    actor: AuthorizedActor | null | undefined,
    id: string,
    active?: boolean,
  ): CatalogService {
    this.checkMutationPermission(actor);

    const s = this.services.find((item) => item.id === id);
    if (!s) {
      throw new ServiceValidationError(`Service not found: "${id}".`);
    }

    s.active = active !== undefined ? active : !s.active;
    s.version += 1;
    s.updatedAt = new Date().toISOString();
    this.notify();
    return structuredClone(s);
  }

  /**
   * Internal synchronization method called when custom fields are added or removed.
   */
  public updateCustomFieldCount(serviceId: string, count: number): void {
    const s = this.services.find((item) => item.id === serviceId);
    if (s) {
      s.customFieldCount = count;
      s.updatedAt = new Date().toISOString();
      this.notify();
    }
  }
}

export const serviceRepository = new ServiceRepository();
