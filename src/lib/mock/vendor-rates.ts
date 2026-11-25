import {
  type AuthorizedActor,
  type CreateVendorRateParams,
  type VendorRate,
  type VendorRateFilterOptions,
  type VendorRateStatus,
  hasCommandCenterPermission,
} from "@/types";

export class VendorRateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VendorRateValidationError";
  }
}

export class UnauthorizedVendorRateAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedVendorRateAccessError";
  }
}

export class StaleRateVersionConflictError extends Error {
  constructor(expected: number, actual: number) {
    super(
      `Stale vendor rate version conflict (409): Expected version ${expected}, but authoritative record is at version ${actual}. Please refresh and re-evaluate.`,
    );
    this.name = "StaleRateVersionConflictError";
  }
}

export const INITIAL_VENDOR_RATES: VendorRate[] = [
  {
    id: "rate_aj_01",
    vendorId: "vnd_aerojet_99",
    vendorName: "AeroJet Aviation Partners",
    vendorServiceId: "vs_aerojet_charter",
    vendorServiceName: "Charter Flight Operations",
    assetId: "ast_001",
    assetName: "Cessna Citation Latitude",
    version: 1,
    amount: 4200,
    currency: "USD",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: "2026-06-30T23:59:59Z",
    validityDisplay: "Jan 01, 2026 – Jun 30, 2026",
    status: "APPROVED",
    submittedBy: "Arman K. (AeroJet)",
    submittedAt: "2025-12-15T10:00:00Z",
    decisionReason: "Base seasonal charter tariff approved by Operations Director.",
    decisionBy: "Command Center Admin",
    decisionAt: "2025-12-18T14:30:00Z",
    createdAt: "2025-12-15T10:00:00Z",
    updatedAt: "2025-12-18T14:30:00Z",
  },
  {
    id: "rate_aj_02",
    vendorId: "vnd_aerojet_99",
    vendorName: "AeroJet Aviation Partners",
    vendorServiceId: "vs_aerojet_charter",
    vendorServiceName: "Charter Flight Operations",
    assetId: "ast_001",
    assetName: "Cessna Citation Latitude",
    version: 2,
    amount: 4600,
    currency: "USD",
    validFrom: "2026-07-01T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    validityDisplay: "Jul 01, 2026 – Dec 31, 2026",
    status: "PENDING",
    submittedBy: "Arman K. (AeroJet)",
    submittedAt: "2026-11-20T08:00:00Z",
    createdAt: "2026-11-20T08:00:00Z",
    updatedAt: "2026-11-20T08:00:00Z",
  },
  {
    id: "rate_aj_03",
    vendorId: "vnd_aerojet_99",
    vendorName: "AeroJet Aviation Partners",
    vendorServiceId: "vs_tarmac_escort",
    vendorServiceName: "Tarmac Escort & Fast Track",
    version: 1,
    amount: 350,
    currency: "USD",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    validityDisplay: "Jan 01, 2026 – Dec 31, 2026",
    status: "APPROVED",
    submittedBy: "Arman K. (AeroJet)",
    submittedAt: "2025-12-10T12:00:00Z",
    decisionReason: "Standard ramp handling agreement.",
    decisionBy: "Command Center Admin",
    decisionAt: "2025-12-12T09:15:00Z",
    createdAt: "2025-12-10T12:00:00Z",
    updatedAt: "2025-12-12T09:15:00Z",
  },
  {
    id: "rate_cy_01",
    vendorId: "vnd_azure_01",
    vendorName: "Côte d'Azur Marine",
    vendorServiceId: "vs_azure_yacht",
    vendorServiceName: "Riviera Motor Yacht Charter",
    assetId: "ast_003",
    assetName: "Sunseeker Predator 74",
    version: 1,
    amount: 8500,
    currency: "EUR",
    validFrom: "2026-05-01T00:00:00Z",
    validTo: "2026-10-31T23:59:59Z",
    validityDisplay: "May 01, 2026 – Oct 31, 2026",
    status: "APPROVED",
    submittedBy: "Jean-Paul B. (Côte d'Azur)",
    submittedAt: "2026-03-01T14:00:00Z",
    decisionReason:
      "High season Mediterranean day charter tariff verified against fuel surcharge index.",
    decisionBy: "Command Center Admin",
    decisionAt: "2026-03-05T16:00:00Z",
    createdAt: "2026-03-01T14:00:00Z",
    updatedAt: "2026-03-05T16:00:00Z",
  },
  {
    id: "rate_cy_02",
    vendorId: "vnd_azure_01",
    vendorName: "Côte d'Azur Marine",
    vendorServiceId: "vs_azure_yacht",
    vendorServiceName: "Riviera Motor Yacht Charter",
    assetId: "ast_003",
    assetName: "Sunseeker Predator 74",
    version: 2,
    amount: 11000,
    currency: "EUR",
    validFrom: "2026-07-15T00:00:00Z",
    validTo: "2026-08-31T23:59:59Z",
    validityDisplay: "Jul 15, 2026 – Aug 31, 2026",
    status: "REJECTED",
    submittedBy: "Jean-Paul B. (Côte d'Azur)",
    submittedAt: "2026-06-01T10:00:00Z",
    decisionReason: "Mid-season spike exceeds authorized partnership cap (+15% limit breached).",
    decisionBy: "Command Center Admin",
    decisionAt: "2026-06-03T11:20:00Z",
    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-06-03T11:20:00Z",
  },
  {
    id: "rate_mcp_01",
    vendorId: "vnd_005",
    vendorName: "Monaco Chauffeur Prestige",
    vendorServiceId: "vs_monaco_transport",
    vendorServiceName: "Executive Chauffeur Fleet",
    version: 1,
    amount: 180,
    currency: "EUR",
    validFrom: "2026-01-01T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    validityDisplay: "Jan 01, 2026 – Dec 31, 2026",
    status: "APPROVED",
    submittedBy: "Fleet Manager (Monaco Prestige)",
    submittedAt: "2025-12-20T09:00:00Z",
    decisionReason: "Annual flat rate for Côte d'Azur regional transfer hops.",
    decisionBy: "Command Center Admin",
    decisionAt: "2025-12-22T15:00:00Z",
    createdAt: "2025-12-20T09:00:00Z",
    updatedAt: "2025-12-22T15:00:00Z",
  },
  {
    id: "rate_mcp_02",
    vendorId: "vnd_005",
    vendorName: "Monaco Chauffeur Prestige",
    vendorServiceId: "vs_monaco_transport",
    vendorServiceName: "Executive Chauffeur Fleet",
    version: 2,
    amount: 220,
    currency: "EUR",
    validFrom: "2027-01-01T00:00:00Z",
    validTo: "2027-12-31T23:59:59Z",
    validityDisplay: "Jan 01, 2027 – Dec 31, 2027",
    status: "PENDING",
    submittedBy: "Fleet Manager (Monaco Prestige)",
    submittedAt: "2026-11-22T11:00:00Z",
    createdAt: "2026-11-22T11:00:00Z",
    updatedAt: "2026-11-22T11:00:00Z",
  },
];

export class VendorRateRepository {
  private rates: VendorRate[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetDefaults();
  }

  public resetDefaults(): void {
    this.rates = JSON.parse(JSON.stringify(INITIAL_VENDOR_RATES));
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
        console.error("VendorRateRepository listener error:", err);
      }
    }
  }

  private checkActor(actor: AuthorizedActor | null | undefined): AuthorizedActor {
    if (!actor || !actor.role) {
      throw new UnauthorizedVendorRateAccessError(
        "Authentication required: Actor context missing.",
      );
    }
    return actor;
  }

  private validateAmount(amount: number, currency: string): number {
    if (typeof amount !== "number" || Number.isNaN(amount) || !Number.isFinite(amount)) {
      throw new VendorRateValidationError("Rate amount must be a valid finite number.");
    }
    if (amount <= 0) {
      throw new VendorRateValidationError("Rate amount must be greater than zero.");
    }

    const cur = currency.toUpperCase().trim();
    if (cur === "XOF") {
      if (!Number.isInteger(amount)) {
        throw new VendorRateValidationError(
          "XOF is a zero-decimal integer currency. Fractional minor units are not permitted.",
        );
      }
    } else {
      // 2 decimal places max for USD, EUR, GBP
      const str = amount.toString();
      const dotIdx = str.indexOf(".");
      if (dotIdx !== -1 && str.length - dotIdx - 1 > 2) {
        throw new VendorRateValidationError(
          `Currency ${cur} supports a maximum of 2 decimal places.`,
        );
      }
    }

    return amount;
  }

  private validateCurrency(currency: string): string {
    const supported = ["USD", "EUR", "XOF", "GBP"];
    const cur = (currency || "").toUpperCase().trim();
    if (!supported.includes(cur)) {
      throw new VendorRateValidationError(
        `Unsupported currency "${currency}". Supported currencies: ${supported.join(", ")}.`,
      );
    }
    return cur;
  }

  private validateValidity(validFrom: string, validTo: string): { from: string; to: string } {
    if (!validFrom || !validTo) {
      throw new VendorRateValidationError("Both validFrom and validTo dates are required.");
    }
    const fromMs = Date.parse(validFrom);
    const toMs = Date.parse(validTo);
    if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
      throw new VendorRateValidationError("Validity dates must be valid ISO date-time strings.");
    }
    if (fromMs >= toMs) {
      throw new VendorRateValidationError("validFrom date must strictly precede validTo date.");
    }
    return { from: validFrom, to: validTo };
  }

  public listVendorRates(
    actor: AuthorizedActor | null | undefined,
    filters?: VendorRateFilterOptions,
  ): VendorRate[] {
    const validActor = this.checkActor(actor);

    // Vendor actor isolation
    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedVendorRateAccessError(
          "Vendor actor has no associated vendor organization membership.",
        );
      }
      if (
        filters?.vendorId &&
        filters.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedVendorRateAccessError(
          "Unauthorized: Cross-vendor rate directory access is prohibited.",
        );
      }

      return this.rates
        .filter((r) => {
          if (r.vendorId.toLowerCase() !== validActor.vendorId?.toLowerCase()) {
            return false;
          }
          if (filters?.status && filters.status !== "ALL" && r.status !== filters.status) {
            return false;
          }
          if (filters?.search?.trim()) {
            const q = filters.search.toLowerCase().trim();
            const matchService = r.vendorServiceName.toLowerCase().includes(q);
            const matchAsset = r.assetName?.toLowerCase().includes(q) || false;
            const matchStatus = r.status.toLowerCase().includes(q);
            if (!matchService && !matchAsset && !matchStatus) return false;
          }
          return true;
        })
        .map((r) => structuredClone(r));
    }

    // Command Center Admin / Super Admin access
    if (
      hasCommandCenterPermission(validActor.role, "view:finance") ||
      hasCommandCenterPermission(validActor.role, "manage:finance") ||
      validActor.role === "SUPER_ADMIN"
    ) {
      return this.rates
        .filter((r) => {
          if (filters?.vendorId && r.vendorId.toLowerCase() !== filters.vendorId.toLowerCase()) {
            return false;
          }
          if (filters?.status && filters.status !== "ALL" && r.status !== filters.status) {
            return false;
          }
          if (filters?.search?.trim()) {
            const q = filters.search.toLowerCase().trim();
            const matchService = r.vendorServiceName.toLowerCase().includes(q);
            const matchVendor = r.vendorName.toLowerCase().includes(q);
            const matchAsset = r.assetName?.toLowerCase().includes(q) || false;
            const matchStatus = r.status.toLowerCase().includes(q);
            if (!matchService && !matchVendor && !matchAsset && !matchStatus) return false;
          }
          return true;
        })
        .map((r) => structuredClone(r));
    }

    throw new UnauthorizedVendorRateAccessError(
      `Actor role "${validActor.role}" does not have permission to access vendor rates.`,
    );
  }

  public getVendorRateById(
    actor: AuthorizedActor | null | undefined,
    rateId: string,
  ): VendorRate | undefined {
    const validActor = this.checkActor(actor);
    const rate = this.rates.find(
      (r) => r.id === rateId || r.id.toLowerCase() === rateId.toLowerCase(),
    );
    if (!rate) return undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedVendorRateAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      if (rate.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()) {
        throw new UnauthorizedVendorRateAccessError(
          "Unauthorized: Vendor actor cannot view confidential rates belonging to another vendor organization.",
        );
      }
    } else if (
      !hasCommandCenterPermission(validActor.role, "view:finance") &&
      !hasCommandCenterPermission(validActor.role, "manage:finance") &&
      validActor.role !== "SUPER_ADMIN"
    ) {
      throw new UnauthorizedVendorRateAccessError(
        `Actor role "${validActor.role}" does not have permission to view vendor rate details.`,
      );
    }

    return structuredClone(rate);
  }

  public submitVendorRate(
    actor: AuthorizedActor | null | undefined,
    params: CreateVendorRateParams,
  ): VendorRate {
    const validActor = this.checkActor(actor);

    let effectiveVendorId: string;
    let effectiveVendorName: string;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedVendorRateAccessError(
          "Vendor actor has no associated organization membership.",
        );
      }
      effectiveVendorId = validActor.vendorId;
      effectiveVendorName = params.vendorName || "Vendor Organization";
    } else if (
      hasCommandCenterPermission(validActor.role, "manage:finance") ||
      validActor.role === "SUPER_ADMIN"
    ) {
      if (!params.vendorId) {
        throw new VendorRateValidationError(
          "vendorId is required when creating a vendor rate on behalf.",
        );
      }
      effectiveVendorId = params.vendorId;
      effectiveVendorName = params.vendorName || "Vendor Organization";
    } else {
      throw new UnauthorizedVendorRateAccessError(
        `Actor role "${validActor.role}" does not have permission to submit vendor rates.`,
      );
    }

    if (!params.vendorServiceId || !params.vendorServiceId.trim()) {
      throw new VendorRateValidationError("Vendor service is required.");
    }

    const cleanCurrency = this.validateCurrency(params.currency);
    const cleanAmount = this.validateAmount(params.amount, cleanCurrency);
    const { from, to } = this.validateValidity(params.validFrom, params.validTo);

    // Calculate version number: next version for this vendor service and asset
    const priorRates = this.rates.filter(
      (r) =>
        r.vendorId.toLowerCase() === effectiveVendorId.toLowerCase() &&
        r.vendorServiceId.toLowerCase() === params.vendorServiceId.toLowerCase() &&
        (r.assetId || "") === (params.assetId || ""),
    );
    const highestVersion = priorRates.reduce((max, r) => Math.max(max, r.version), 0);
    const nextVersion = highestVersion + 1;

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const validityDisplay = `${fromDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} – ${toDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}`;

    const now = new Date().toISOString();
    const id = `rate_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    // Authoritative submission lifecycle: ALWAYS starts in PENDING status
    const newRate: VendorRate = {
      id,
      vendorId: effectiveVendorId,
      vendorName: effectiveVendorName,
      vendorServiceId: params.vendorServiceId.trim(),
      vendorServiceName: params.vendorServiceName.trim() || params.vendorServiceId.trim(),
      assetId: params.assetId?.trim() || undefined,
      assetName: params.assetName?.trim() || undefined,
      version: nextVersion,
      amount: cleanAmount,
      currency: cleanCurrency,
      validFrom: from,
      validTo: to,
      validityDisplay,
      status: "PENDING",
      submittedBy: validActor.name || validActor.email || "Vendor Partner",
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.rates.unshift(newRate);
    this.notify();
    return structuredClone(newRate);
  }

  public approveVendorRate(
    actor: AuthorizedActor | null | undefined,
    rateId: string,
    decisionReasonOrVersion?: string | number,
    expectedVersionOrReason?: number | string,
  ): VendorRate {
    const validActor = this.checkActor(actor);

    // Vendor persona strictly forbidden from approving own or other rates
    if (validActor.role === "VENDOR") {
      throw new UnauthorizedVendorRateAccessError(
        "Unauthorized: Vendor may view own rate but cannot approve or reject it. Decisions require authoritative Command Center Administrator authority.",
      );
    }

    if (
      !hasCommandCenterPermission(validActor.role, "manage:finance") &&
      validActor.role !== "SUPER_ADMIN"
    ) {
      throw new UnauthorizedVendorRateAccessError(
        `Actor role "${validActor.role}" does not have permission to approve vendor rates.`,
      );
    }

    let decisionReason: string | undefined;
    let expectedVersion: number | undefined;

    if (typeof decisionReasonOrVersion === "number") {
      expectedVersion = decisionReasonOrVersion;
      if (typeof expectedVersionOrReason === "string") {
        decisionReason = expectedVersionOrReason;
      }
    } else {
      decisionReason = decisionReasonOrVersion;
      if (typeof expectedVersionOrReason === "number") {
        expectedVersion = expectedVersionOrReason;
      }
    }

    const index = this.rates.findIndex(
      (r) => r.id === rateId || r.id.toLowerCase() === rateId.toLowerCase(),
    );
    if (index === -1) {
      throw new VendorRateValidationError(`Vendor rate with ID "${rateId}" was not found.`);
    }

    const existing = this.rates[index];

    if (existing.status !== "PENDING") {
      throw new VendorRateValidationError(
        `Cannot approve rate "${rateId}" in status "${existing.status}". Only PENDING rates can be approved.`,
      );
    }

    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw new StaleRateVersionConflictError(expectedVersion, existing.version);
    }

    const now = new Date().toISOString();
    const approved: VendorRate = {
      ...existing,
      status: "APPROVED",
      version: existing.version + 1,
      decisionReason: decisionReason?.trim() || "Approved by Command Center Administrator.",
      decisionBy: validActor.name || validActor.email || "Command Center Admin",
      decisionAt: now,
      updatedAt: now,
    };

    this.rates[index] = approved;
    this.notify();
    return structuredClone(approved);
  }

  public rejectVendorRate(
    actor: AuthorizedActor | null | undefined,
    rateId: string,
    decisionReasonOrVersion: string | number,
    expectedVersionOrReason?: number | string,
  ): VendorRate {
    const validActor = this.checkActor(actor);

    // Vendor persona strictly forbidden from rejecting rates
    if (validActor.role === "VENDOR") {
      throw new UnauthorizedVendorRateAccessError(
        "Unauthorized: Vendor may view own rate but cannot approve or reject it. Decisions require authoritative Command Center Administrator authority.",
      );
    }

    if (
      !hasCommandCenterPermission(validActor.role, "manage:finance") &&
      validActor.role !== "SUPER_ADMIN"
    ) {
      throw new UnauthorizedVendorRateAccessError(
        `Actor role "${validActor.role}" does not have permission to reject vendor rates.`,
      );
    }

    let decisionReason: string | undefined;
    let expectedVersion: number | undefined;

    if (typeof decisionReasonOrVersion === "number") {
      expectedVersion = decisionReasonOrVersion;
      if (typeof expectedVersionOrReason === "string") {
        decisionReason = expectedVersionOrReason;
      }
    } else {
      decisionReason = decisionReasonOrVersion;
      if (typeof expectedVersionOrReason === "number") {
        expectedVersion = expectedVersionOrReason;
      }
    }

    if (!decisionReason || !decisionReason.trim()) {
      throw new VendorRateValidationError("Rejection decision notes/reason are required.");
    }

    const index = this.rates.findIndex(
      (r) => r.id === rateId || r.id.toLowerCase() === rateId.toLowerCase(),
    );
    if (index === -1) {
      throw new VendorRateValidationError(`Vendor rate with ID "${rateId}" was not found.`);
    }

    const existing = this.rates[index];

    if (existing.status !== "PENDING") {
      throw new VendorRateValidationError(
        `Cannot reject rate "${rateId}" in status "${existing.status}". Only PENDING rates can be rejected.`,
      );
    }

    if (expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw new StaleRateVersionConflictError(expectedVersion, existing.version);
    }

    const now = new Date().toISOString();
    const rejected: VendorRate = {
      ...existing,
      status: "REJECTED",
      version: existing.version + 1,
      decisionReason: decisionReason.trim(),
      decisionBy: validActor.name || validActor.email || "Command Center Admin",
      decisionAt: now,
      updatedAt: now,
    };

    this.rates[index] = rejected;
    this.notify();
    return structuredClone(rejected);
  }
}

export const vendorRateRepository = new VendorRateRepository();
