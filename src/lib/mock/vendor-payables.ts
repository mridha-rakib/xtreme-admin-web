import type {
  AuthorizedActor,
  PayableStatus,
  UpdateVendorPayableParams,
  VendorPayable,
  VendorPayableFilterOptions,
} from "@/types";
import { hasCommandCenterPermission } from "@/types";

export class VendorPayableValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VendorPayableValidationError";
  }
}

export class UnauthorizedPayableAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedPayableAccessError";
  }
}

export class StalePayableVersionConflictError extends Error {
  constructor(expected: number, actual: number) {
    super(
      `Stale payable version conflict (409): Expected version ${expected}, but authoritative record is at version ${actual}. Please refresh and re-evaluate.`,
    );
    this.name = "StalePayableVersionConflictError";
  }
}

export const INITIAL_VENDOR_PAYABLES: VendorPayable[] = [
  {
    id: "pay_018",
    bookingId: "bkg_018",
    bookingReference: "XC-261124-018",
    serviceId: "srv_chauffeur_01",
    serviceName: "Executive Chauffeur Transfer",
    serviceCategory: "chauffeur",
    vendorId: "vnd_005",
    vendorName: "Monaco Chauffeur Prestige",
    amountDue: 140,
    amountPaid: 140,
    currency: "USD",
    status: "PAID",
    payoutReference: "WIRE-20261123-018",
    payoutMethod: "Bank Wire / SWIFT",
    notes: "Settled via corporate wire upon passenger trip completion verification.",
    snapshotFxRate: 612.5,
    snapshotFxPair: "USD/XOF",
    amountDueXof: 85750,
    amountPaidXof: 85750,
    version: 1,
    createdAt: "2026-11-23T18:30:00Z",
    updatedAt: "2026-11-23T19:00:00Z",
  },
  {
    id: "pay_017",
    bookingId: "bkg_017",
    bookingReference: "XC-261124-017",
    serviceId: "srv_dining_01",
    serviceName: "Private Chef & Dining Experience",
    serviceCategory: "dining",
    vendorId: "vnd_riviera_02",
    vendorName: "Riviera Luxury Estates & Villas",
    amountDue: 520,
    amountPaid: 250,
    currency: "EUR",
    status: "PROCESSING",
    payoutReference: "SEPA-20261122-017",
    payoutMethod: "SEPA Corporate Transfer",
    notes: "Initial deposit disbursement released. Balance queued for final kitchen close-out.",
    snapshotFxRate: 655.957,
    snapshotFxPair: "EUR/XOF",
    amountDueXof: 341098,
    amountPaidXof: 163989,
    version: 1,
    createdAt: "2026-11-22T15:00:00Z",
    updatedAt: "2026-11-22T16:00:00Z",
  },
  {
    id: "pay_016",
    bookingId: "bkg_016",
    bookingReference: "XC-261124-016",
    serviceId: "srv_yacht_01",
    serviceName: "Day Yacht Charter · Côte d'Azur",
    serviceCategory: "yacht",
    vendorId: "vnd_azure_01",
    vendorName: "Côte d'Azur Marine",
    amountDue: 1900,
    amountPaid: 0,
    currency: "USD",
    status: "PENDING",
    payoutMethod: "Direct Wire",
    notes: "Awaiting customer final invoice settlement before payout release.",
    snapshotFxRate: 612.5,
    snapshotFxPair: "USD/XOF",
    amountDueXof: 1163750,
    amountPaidXof: 0,
    version: 1,
    createdAt: "2026-11-23T09:30:00Z",
    updatedAt: "2026-11-23T09:30:00Z",
  },
  {
    id: "pay_015",
    bookingId: "bkg_015",
    bookingReference: "XC-261124-015",
    serviceId: "srv_aviation_01",
    serviceName: "Private Jet Charter · Europe",
    serviceCategory: "aviation",
    vendorId: "vnd_aerojet_99",
    vendorName: "AeroJet Aviation Partners",
    amountDue: 280,
    amountPaid: 280,
    currency: "USD",
    status: "PAID",
    payoutReference: "WIRE-20261121-015",
    payoutMethod: "Bank Wire / SWIFT",
    notes: "Ramp handling and ground handling fees verified and disbursed.",
    snapshotFxRate: 612.5,
    snapshotFxPair: "USD/XOF",
    amountDueXof: 171500,
    amountPaidXof: 171500,
    version: 1,
    createdAt: "2026-11-21T12:00:00Z",
    updatedAt: "2026-11-21T14:00:00Z",
  },
  {
    id: "pay_014",
    bookingId: "bkg_014",
    bookingReference: "XC-261124-014",
    serviceId: "srv_aviation_01",
    serviceName: "Private Jet Charter · Europe",
    serviceCategory: "aviation",
    vendorId: "vnd_aerojet_99",
    vendorName: "AeroJet Aviation Partners",
    amountDue: 3500,
    amountPaid: 0,
    currency: "USD",
    status: "ON_HOLD",
    payoutMethod: "Bank Wire / SWIFT",
    notes: "Payout held pending fuel surcharge reconciliation against aircraft flight log.",
    snapshotFxRate: 612.5,
    snapshotFxPair: "USD/XOF",
    amountDueXof: 2143750,
    amountPaidXof: 0,
    version: 1,
    createdAt: "2026-11-20T10:00:00Z",
    updatedAt: "2026-11-20T10:00:00Z",
  },
];

const ALLOWED_STATUS_TRANSITIONS: Record<PayableStatus, PayableStatus[]> = {
  PENDING: ["PROCESSING", "ON_HOLD"],
  PROCESSING: ["PAID", "FAILED", "ON_HOLD"],
  ON_HOLD: ["PENDING", "PROCESSING"],
  FAILED: ["PENDING", "PROCESSING"],
  PAID: [], // Terminal state
};

export class VendorPayableRepository {
  private payables: VendorPayable[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetDefaults();
  }

  public resetDefaults(): void {
    this.payables = JSON.parse(JSON.stringify(INITIAL_VENDOR_PAYABLES));
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
        console.error("VendorPayableRepository listener error:", err);
      }
    }
  }

  private checkActor(actor: AuthorizedActor | null | undefined): AuthorizedActor {
    if (!actor || !actor.role) {
      throw new UnauthorizedPayableAccessError("Authentication required: Actor context missing.");
    }
    return actor;
  }

  public listPayables(
    actor: AuthorizedActor | null | undefined,
    filters?: VendorPayableFilterOptions,
  ): VendorPayable[] {
    const validActor = this.checkActor(actor);

    // Vendor tenant isolation: Vendor persona only sees own payables
    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedPayableAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      if (
        filters?.vendorId &&
        filters.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedPayableAccessError(
          "Unauthorized: Cross-vendor payable directory access is prohibited.",
        );
      }

      return this.payables
        .filter((p) => {
          if (p.vendorId.toLowerCase() !== validActor.vendorId?.toLowerCase()) {
            return false;
          }
          if (filters?.status && filters.status !== "ALL" && p.status !== filters.status) {
            return false;
          }
          if (filters?.search?.trim()) {
            const q = filters.search.toLowerCase().trim();
            const matchRef = p.bookingReference.toLowerCase().includes(q);
            const matchService = p.serviceName.toLowerCase().includes(q);
            const matchPayoutRef = p.payoutReference?.toLowerCase().includes(q) || false;
            if (!matchRef && !matchService && !matchPayoutRef) return false;
          }
          return true;
        })
        .map((p) => structuredClone(p));
    }

    // Admin / Super Admin / Concierge
    return this.payables
      .filter((p) => {
        if (
          filters?.vendorId &&
          filters.vendorId !== "ALL" &&
          p.vendorId.toLowerCase() !== filters.vendorId.toLowerCase()
        ) {
          return false;
        }
        if (filters?.status && filters.status !== "ALL" && p.status !== filters.status) {
          return false;
        }
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matchRef = p.bookingReference.toLowerCase().includes(q);
          const matchVendor = p.vendorName.toLowerCase().includes(q);
          const matchService = p.serviceName.toLowerCase().includes(q);
          const matchPayoutRef = p.payoutReference?.toLowerCase().includes(q) || false;
          if (!matchRef && !matchVendor && !matchService && !matchPayoutRef) return false;
        }
        return true;
      })
      .map((p) => structuredClone(p));
  }

  public getPayableById(
    actor: AuthorizedActor | null | undefined,
    payableId: string,
  ): VendorPayable | undefined {
    const validActor = this.checkActor(actor);
    const payable = this.payables.find(
      (p) => p.id === payableId || p.id.toLowerCase() === payableId.toLowerCase(),
    );
    if (!payable) return undefined;

    // Tenant check
    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedPayableAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      if (payable.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()) {
        throw new UnauthorizedPayableAccessError(
          "Unauthorized: Cannot access payable belonging to another vendor organization.",
        );
      }
    }

    return structuredClone(payable);
  }

  public updateVendorPayable(
    actor: AuthorizedActor | null | undefined,
    params: UpdateVendorPayableParams,
  ): VendorPayable {
    const validActor = this.checkActor(actor);

    // Vendor persona is strictly read-only
    if (validActor.role === "VENDOR") {
      throw new UnauthorizedPayableAccessError(
        "Unauthorized: Vendor partners have read-only access to payables and cannot update payout disbursement records.",
      );
    }

    if (
      !hasCommandCenterPermission(validActor.role, "manage:finance") &&
      validActor.role !== "SUPER_ADMIN" &&
      validActor.role !== "ADMIN"
    ) {
      throw new UnauthorizedPayableAccessError(
        `Role "${validActor.role}" is not authorized to update vendor payables. Financial management permissions required.`,
      );
    }

    const payableIndex = this.payables.findIndex((p) => p.id === params.payableId);
    if (payableIndex === -1) {
      throw new VendorPayableValidationError(`Payable not found: "${params.payableId}".`);
    }

    const currentPayable = this.payables[payableIndex];

    // Optimistic concurrency check
    if (params.expectedVersion !== undefined && currentPayable.version !== params.expectedVersion) {
      throw new StalePayableVersionConflictError(params.expectedVersion, currentPayable.version);
    }

    // Atomic mutation: clone candidate first
    const candidate: VendorPayable = structuredClone(currentPayable);

    // Status transition validation
    if (params.status && params.status !== candidate.status) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[candidate.status] || [];
      if (!allowed.includes(params.status)) {
        throw new VendorPayableValidationError(
          `Illegal status transition from "${candidate.status}" to "${params.status}". Allowed next statuses: ${allowed.length ? allowed.join(", ") : "none (terminal state)"}.`,
        );
      }
      candidate.status = params.status;
    }

    if (params.amountPaid !== undefined) {
      if (
        typeof params.amountPaid !== "number" ||
        Number.isNaN(params.amountPaid) ||
        !Number.isFinite(params.amountPaid)
      ) {
        throw new VendorPayableValidationError("Amount paid must be a valid finite number.");
      }
      if (params.amountPaid < 0) {
        throw new VendorPayableValidationError("Amount paid cannot be negative.");
      }
      if (params.amountPaid > candidate.amountDue) {
        throw new VendorPayableValidationError(
          `Amount paid (${params.amountPaid} ${candidate.currency}) exceeds total amount due (${candidate.amountDue} ${candidate.currency}).`,
        );
      }
      candidate.amountPaid = params.amountPaid;
      candidate.amountPaidXof = Math.round(params.amountPaid * (candidate.snapshotFxRate || 1));
    }

    if (params.payoutReference !== undefined) {
      candidate.payoutReference = params.payoutReference.trim() || undefined;
    }
    if (params.notes !== undefined) {
      candidate.notes = params.notes.trim() || undefined;
    }

    candidate.version += 1;
    candidate.updatedAt = new Date().toISOString();

    // Replace atomically
    this.payables[payableIndex] = candidate;
    this.notify();
    return structuredClone(candidate);
  }
}

export const vendorPayableRepository = new VendorPayableRepository();
