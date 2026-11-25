import {
  type AuthorizedActor,
  type CreateCustomerPriceParams,
  type CustomerPriceConfig,
  type CustomerPriceFilterOptions,
  type CustomerPriceMode,
  hasCommandCenterPermission,
} from "@/types";

export class CustomerPriceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerPriceValidationError";
  }
}

export class UnauthorizedCustomerPriceAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedCustomerPriceAccessError";
  }
}

export const INITIAL_CUSTOMER_PRICES: CustomerPriceConfig[] = [
  {
    id: "cpc_001",
    serviceId: "srv_aviation_01",
    serviceName: "Private Jet Charter · Europe",
    serviceCategory: "aviation",
    vendorServiceId: "vs_aerojet_charter",
    vendorServiceName: "Charter Flight Operations",
    assetId: "ast_001",
    assetName: "Cessna Citation Latitude",
    priceMode: "FIXED",
    xofAmount: 3250000,
    validFrom: "2026-01-01T00:00:00Z",
    validTo: "2026-06-30T23:59:59Z",
    validityDisplay: "Jan 01, 2026 – Jun 30, 2026",
    active: true,
    version: 1,
    createdAt: "2025-12-20T10:00:00Z",
    updatedAt: "2025-12-20T10:00:00Z",
  },
  {
    id: "cpc_002",
    serviceId: "srv_yacht_01",
    serviceName: "Day Yacht Charter · Côte d'Azur",
    serviceCategory: "yacht",
    vendorServiceId: "vs_azure_yacht",
    vendorServiceName: "Riviera Motor Yacht Charter",
    assetId: "ast_003",
    assetName: "Sunseeker Predator 74",
    priceMode: "TIERED",
    xofAmount: 6800000,
    validFrom: "2026-05-01T00:00:00Z",
    validTo: "2026-10-31T23:59:59Z",
    validityDisplay: "May 01, 2026 – Oct 31, 2026",
    active: true,
    version: 1,
    createdAt: "2026-03-10T11:00:00Z",
    updatedAt: "2026-03-10T11:00:00Z",
  },
  {
    id: "cpc_003",
    serviceId: "srv_chauffeur_01",
    serviceName: "Executive Chauffeur Transfer",
    serviceCategory: "chauffeur",
    vendorServiceId: "vs_monaco_transport",
    vendorServiceName: "Executive Chauffeur Fleet",
    priceMode: "FIXED",
    xofAmount: 145000,
    validFrom: "2026-01-01T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    validityDisplay: "Jan 01, 2026 – Dec 31, 2026",
    active: true,
    version: 1,
    createdAt: "2025-12-22T14:00:00Z",
    updatedAt: "2025-12-22T14:00:00Z",
  },
  {
    id: "cpc_004",
    serviceId: "srv_dining_01",
    serviceName: "Private Chef & Dining Experience",
    serviceCategory: "dining",
    priceMode: "DYNAMIC_BASE",
    xofAmount: 480000,
    validFrom: "2026-01-01T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    validityDisplay: "Jan 01, 2026 – Dec 31, 2026",
    active: true,
    version: 1,
    createdAt: "2026-01-05T09:30:00Z",
    updatedAt: "2026-01-05T09:30:00Z",
  },
  {
    id: "cpc_005",
    serviceId: "srv_security_01",
    serviceName: "VIP Close Protection Detachment",
    serviceCategory: "security",
    priceMode: "ESTIMATED_QUOTE",
    xofAmount: 1200000,
    validFrom: "2026-01-01T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    validityDisplay: "Jan 01, 2026 – Dec 31, 2026",
    active: false,
    version: 1,
    createdAt: "2026-02-15T16:00:00Z",
    updatedAt: "2026-02-15T16:00:00Z",
  },
  {
    id: "cpc_006",
    serviceId: "srv_expeditions_01",
    serviceName: "High Alpine Heli-Ski Expedition",
    serviceCategory: "experiences",
    priceMode: "TIERED",
    xofAmount: 4500000,
    validFrom: "2026-12-01T00:00:00Z",
    validTo: "2027-04-30T23:59:59Z",
    validityDisplay: "Dec 01, 2026 – Apr 30, 2027",
    active: true,
    version: 1,
    createdAt: "2026-04-01T12:00:00Z",
    updatedAt: "2026-04-01T12:00:00Z",
  },
  {
    id: "cpc_007",
    serviceId: "srv_aviation_02",
    serviceName: "Long-Range Heavy Jet Global Corridor",
    serviceCategory: "aviation",
    assetId: "ast_002",
    assetName: "Gulfstream G650ER",
    priceMode: "DYNAMIC_BASE",
    xofAmount: 8900000,
    validFrom: "2026-01-01T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    validityDisplay: "Jan 01, 2026 – Dec 31, 2026",
    active: false,
    version: 1,
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
];

export class CustomerPriceRepository {
  private prices: CustomerPriceConfig[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetDefaults();
  }

  public resetDefaults(): void {
    this.prices = JSON.parse(JSON.stringify(INITIAL_CUSTOMER_PRICES));
    this.notify();
  }

  public resetToDefault(): void {
    this.resetDefaults();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error("CustomerPriceRepository listener error:", err);
      }
    }
  }

  private checkActor(actor: AuthorizedActor | null | undefined): AuthorizedActor {
    if (!actor || !actor.role) {
      throw new UnauthorizedCustomerPriceAccessError(
        "Authentication required: Actor context missing.",
      );
    }

    // Vendor and Customer personas strictly denied from accessing confidential customer prices
    if (actor.role === "VENDOR") {
      throw new UnauthorizedCustomerPriceAccessError(
        "Unauthorized: Customer price configurations and XTREME selling margins are confidential and cannot be accessed by vendor partners.",
      );
    }

    if (
      !hasCommandCenterPermission(actor.role, "view:finance") &&
      !hasCommandCenterPermission(actor.role, "manage:finance") &&
      actor.role !== "SUPER_ADMIN"
    ) {
      throw new UnauthorizedCustomerPriceAccessError(
        `Actor role "${actor.role}" does not have permission to access customer prices.`,
      );
    }

    return actor;
  }

  private validateXofAmount(amount: number): number {
    if (typeof amount !== "number" || Number.isNaN(amount) || !Number.isFinite(amount)) {
      throw new CustomerPriceValidationError("XOF amount must be a valid finite number.");
    }
    if (amount <= 0) {
      throw new CustomerPriceValidationError("XOF amount must be greater than zero.");
    }
    if (!Number.isInteger(amount)) {
      throw new CustomerPriceValidationError(
        "XOF is a zero-decimal integer currency. Fractional minor units are not permitted.",
      );
    }
    return amount;
  }

  public listCustomerPrices(
    actor: AuthorizedActor | null | undefined,
    filters?: CustomerPriceFilterOptions,
  ): CustomerPriceConfig[] {
    this.checkActor(actor);

    return this.prices
      .filter((p) => {
        if (
          filters?.serviceCategory &&
          filters.serviceCategory !== "ALL" &&
          p.serviceCategory !== filters.serviceCategory
        ) {
          return false;
        }
        if (
          filters?.active !== undefined &&
          filters.active !== "ALL" &&
          p.active !== filters.active
        ) {
          return false;
        }
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchService = p.serviceName.toLowerCase().includes(q);
          const matchVendorService = p.vendorServiceName?.toLowerCase().includes(q) || false;
          const matchAsset = p.assetName?.toLowerCase().includes(q) || false;
          const matchMode = p.priceMode.toLowerCase().includes(q);
          if (!matchService && !matchVendorService && !matchAsset && !matchMode) return false;
        }
        return true;
      })
      .map((p) => structuredClone(p));
  }

  public getCustomerPriceById(
    actor: AuthorizedActor | null | undefined,
    priceId: string,
  ): CustomerPriceConfig | undefined {
    this.checkActor(actor);
    const p = this.prices.find(
      (item) => item.id === priceId || item.id.toLowerCase() === priceId.toLowerCase(),
    );
    return p ? structuredClone(p) : undefined;
  }

  public createCustomerPrice(
    actor: AuthorizedActor | null | undefined,
    params: CreateCustomerPriceParams,
  ): CustomerPriceConfig {
    const validActor = this.checkActor(actor);

    if (
      !hasCommandCenterPermission(validActor.role, "manage:finance") &&
      validActor.role !== "SUPER_ADMIN"
    ) {
      throw new UnauthorizedCustomerPriceAccessError(
        `Actor role "${validActor.role}" does not have permission to create customer price configurations.`,
      );
    }

    if (!params.serviceId || !params.serviceId.trim()) {
      throw new CustomerPriceValidationError("Service reference is required.");
    }
    if (!params.priceMode) {
      throw new CustomerPriceValidationError("Price mode is required.");
    }

    const cleanXof = this.validateXofAmount(params.xofAmount);

    if (!params.validFrom || !params.validTo) {
      throw new CustomerPriceValidationError("Both validFrom and validTo dates are required.");
    }
    const fromMs = Date.parse(params.validFrom);
    const toMs = Date.parse(params.validTo);
    if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
      throw new CustomerPriceValidationError("Validity dates must be valid ISO date-time strings.");
    }
    if (fromMs >= toMs) {
      throw new CustomerPriceValidationError("validFrom date must strictly precede validTo date.");
    }

    const fromDate = new Date(params.validFrom);
    const toDate = new Date(params.validTo);
    const validityDisplay = `${fromDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} – ${toDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`;

    const now = new Date().toISOString();
    const id = `cpc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newConfig: CustomerPriceConfig = {
      id,
      serviceId: params.serviceId.trim(),
      serviceName: params.serviceName.trim() || params.serviceId.trim(),
      serviceCategory: params.serviceCategory,
      vendorServiceId: params.vendorServiceId?.trim() || undefined,
      vendorServiceName: params.vendorServiceName?.trim() || undefined,
      assetId: params.assetId?.trim() || undefined,
      assetName: params.assetName?.trim() || undefined,
      priceMode: params.priceMode,
      xofAmount: cleanXof,
      validFrom: params.validFrom,
      validTo: params.validTo,
      validityDisplay,
      active: params.active ?? true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.prices.unshift(newConfig);
    this.notify();
    return structuredClone(newConfig);
  }

  public toggleCustomerPriceActive(
    actor: AuthorizedActor | null | undefined,
    priceId: string,
    active?: boolean,
  ): CustomerPriceConfig {
    const validActor = this.checkActor(actor);

    if (
      !hasCommandCenterPermission(validActor.role, "manage:finance") &&
      validActor.role !== "SUPER_ADMIN"
    ) {
      throw new UnauthorizedCustomerPriceAccessError(
        `Actor role "${validActor.role}" does not have permission to update customer price configurations.`,
      );
    }

    const index = this.prices.findIndex(
      (p) => p.id === priceId || p.id.toLowerCase() === priceId.toLowerCase(),
    );
    if (index === -1) {
      throw new CustomerPriceValidationError(
        `Customer price configuration "${priceId}" was not found.`,
      );
    }

    const existing = this.prices[index];
    const nextActive = active !== undefined ? active : !existing.active;

    const updated: CustomerPriceConfig = {
      ...existing,
      active: nextActive,
      updatedAt: new Date().toISOString(),
    };

    this.prices[index] = updated;
    this.notify();
    return structuredClone(updated);
  }
}

export const customerPriceRepository = new CustomerPriceRepository();
