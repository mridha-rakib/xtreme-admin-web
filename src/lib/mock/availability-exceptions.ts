import {
  APPROVED_EXCEPTION_TYPES,
  type AuthorizedActor,
  type AvailabilityException,
  type AvailabilityExceptionType,
  type CreateAvailabilityExceptionParams,
  type UpdateAvailabilityExceptionParams,
  hasCommandCenterPermission,
} from "@/types";

export class AvailabilityExceptionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilityExceptionValidationError";
  }
}

export class UnauthorizedExceptionAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedExceptionAccessError";
  }
}

export const INITIAL_AVAILABILITY_EXCEPTIONS: AvailabilityException[] = [
  {
    id: "ex_001",
    target: "Sunseeker Predator 74 (AST-CY-01)",
    targetType: "ASSET",
    targetId: "ast_003",
    vendorId: "vnd_azure_01",
    startsAt: "2026-12-24T00:00:00Z",
    endsAt: "2026-12-26T23:59:59Z",
    startsDisplay: "Dec 24, 2026 · 00:00",
    endsDisplay: "Dec 26, 2026 · 23:59",
    type: "UNAVAILABLE",
    reason: "Holiday maintenance & marina closure",
    createdAt: "2026-11-20T10:00:00Z",
    updatedAt: "2026-11-20T10:00:00Z",
  },
  {
    id: "ex_002",
    target: "Cessna Citation Latitude (AST-AJ-01)",
    targetType: "ASSET",
    targetId: "ast_001",
    vendorId: "vnd_aerojet_99",
    startsAt: "2026-12-15T00:00:00Z",
    endsAt: "2026-12-18T23:59:59Z",
    startsDisplay: "Dec 15, 2026 · 00:00",
    endsDisplay: "Dec 18, 2026 · 23:59",
    type: "CAPACITY_OVERRIDE",
    capacityOverride: 6,
    reason: "Auxiliary fuel tank installation reducing certified passenger payload",
    createdAt: "2026-11-21T11:30:00Z",
    updatedAt: "2026-11-21T11:30:00Z",
  },
  {
    id: "ex_003",
    target: "Mercedes-Maybach S680 (AST-XT-01)",
    targetType: "ASSET",
    targetId: "ast_005",
    startsAt: "2026-12-31T18:00:00Z",
    endsAt: "2027-01-01T06:00:00Z",
    startsDisplay: "Dec 31, 2026 · 18:00",
    endsDisplay: "Jan 01, 2027 · 06:00",
    type: "AVAILABLE_OVERRIDE",
    reason: "New Year's Eve approved extended night corridor",
    createdAt: "2026-11-22T09:15:00Z",
    updatedAt: "2026-11-22T09:15:00Z",
  },
  {
    id: "ex_004",
    target: "Eurocopter EC130 T2 (AST-XT-02)",
    targetType: "ASSET",
    targetId: "ast_006",
    startsAt: "2026-12-01T08:00:00Z",
    endsAt: "2026-12-03T18:00:00Z",
    startsDisplay: "Dec 01, 2026 · 08:00",
    endsDisplay: "Dec 03, 2026 · 18:00",
    type: "UNAVAILABLE",
    reason: "Rotor blade certified calibration and mandatory FAA/EASA inspection",
    createdAt: "2026-11-22T14:00:00Z",
    updatedAt: "2026-11-22T14:00:00Z",
  },
  {
    id: "ex_005",
    target: "Riva 66 Ribelle (AST-CY-02)",
    targetType: "ASSET",
    targetId: "ast_004",
    vendorId: "vnd_azure_01",
    startsAt: "2026-11-15T00:00:00Z",
    endsAt: "2027-03-31T23:59:59Z",
    startsDisplay: "Nov 15, 2026 · 00:00",
    endsDisplay: "Mar 31, 2027 · 23:59",
    type: "UNAVAILABLE",
    reason: "Winter drydock decommissioning period",
    createdAt: "2026-11-10T12:00:00Z",
    updatedAt: "2026-11-10T12:00:00Z",
  },
];

export interface ExceptionFilterOptions {
  vendorId?: string;
  type?: AvailabilityExceptionType | "ALL";
  search?: string;
}

export class AvailabilityExceptionRepository {
  private exceptions: AvailabilityException[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.exceptions = JSON.parse(JSON.stringify(INITIAL_AVAILABILITY_EXCEPTIONS));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const fn of this.listeners) {
      fn();
    }
  }

  private checkActor(actor: AuthorizedActor | null | undefined): AuthorizedActor {
    if (!actor || !actor.role) {
      throw new UnauthorizedExceptionAccessError("Authentication required: Actor context missing.");
    }
    return actor;
  }

  private validateType(type: string): AvailabilityExceptionType {
    if (!APPROVED_EXCEPTION_TYPES.includes(type as AvailabilityExceptionType)) {
      throw new AvailabilityExceptionValidationError(
        `Invalid exception type "${type}". Approved types: ${APPROVED_EXCEPTION_TYPES.join(", ")}.`,
      );
    }
    return type as AvailabilityExceptionType;
  }

  public listExceptionsInternal(targetId?: string): AvailabilityException[] {
    if (!targetId) return this.exceptions.map((e) => structuredClone(e));
    return this.exceptions
      .filter(
        (e) =>
          e.targetId?.toLowerCase() === targetId.toLowerCase() ||
          e.target.toLowerCase().includes(targetId.toLowerCase()),
      )
      .map((e) => structuredClone(e));
  }

  public listExceptions(
    actor: AuthorizedActor | null | undefined,
    filters?: ExceptionFilterOptions,
  ): AvailabilityException[] {
    const validActor = this.checkActor(actor);

    // Vendor self-service scope
    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedExceptionAccessError(
          "Vendor actor has no associated vendor organization membership.",
        );
      }
      if (
        filters?.vendorId &&
        filters.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedExceptionAccessError(
          "Unauthorized: Cross-vendor availability exception query is prohibited.",
        );
      }

      return this.exceptions
        .filter((e) => {
          if (e.vendorId?.toLowerCase() !== validActor.vendorId?.toLowerCase()) {
            return false;
          }
          if (filters?.type && filters.type !== "ALL" && e.type !== filters.type) {
            return false;
          }
          if (filters?.search?.trim()) {
            const query = filters.search.toLowerCase().trim();
            const matchTarget = e.target.toLowerCase().includes(query);
            const matchReason = e.reason.toLowerCase().includes(query);
            const matchType = e.type.toLowerCase().includes(query);
            if (!matchTarget && !matchReason && !matchType) return false;
          }
          return true;
        })
        .map((e) => structuredClone(e));
    }

    // Admin / Super Admin access
    if (
      hasCommandCenterPermission(validActor.role, "view:assets") ||
      hasCommandCenterPermission(validActor.role, "manage:assets")
    ) {
      return this.exceptions
        .filter((e) => {
          if (filters?.vendorId && e.vendorId?.toLowerCase() !== filters.vendorId.toLowerCase()) {
            return false;
          }
          if (filters?.type && filters.type !== "ALL" && e.type !== filters.type) {
            return false;
          }
          if (filters?.search?.trim()) {
            const query = filters.search.toLowerCase().trim();
            const matchTarget = e.target.toLowerCase().includes(query);
            const matchReason = e.reason.toLowerCase().includes(query);
            const matchType = e.type.toLowerCase().includes(query);
            if (!matchTarget && !matchReason && !matchType) return false;
          }
          return true;
        })
        .map((e) => structuredClone(e));
    }

    throw new UnauthorizedExceptionAccessError(
      `Actor role "${validActor.role}" does not have permission to view availability exceptions.`,
    );
  }

  public getExceptionById(
    actor: AuthorizedActor | null | undefined,
    id: string,
  ): AvailabilityException | undefined {
    const validActor = this.checkActor(actor);

    const record = this.exceptions.find(
      (e) => e.id.toLowerCase() === id.toLowerCase() || e.id === id,
    );
    if (!record) return undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedExceptionAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      if (record.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()) {
        throw new UnauthorizedExceptionAccessError(
          "Unauthorized: Cannot access availability exceptions belonging to another organization.",
        );
      }
    } else if (
      !hasCommandCenterPermission(validActor.role, "view:assets") &&
      !hasCommandCenterPermission(validActor.role, "manage:assets")
    ) {
      throw new UnauthorizedExceptionAccessError(
        `Actor role "${validActor.role}" does not have permission to access availability exceptions.`,
      );
    }

    return structuredClone(record);
  }

  public createException(
    actor: AuthorizedActor | null | undefined,
    params: CreateAvailabilityExceptionParams,
  ): AvailabilityException {
    const validActor = this.checkActor(actor);

    let effectiveVendorId: string | undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedExceptionAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      effectiveVendorId = validActor.vendorId;
    } else if (hasCommandCenterPermission(validActor.role, "manage:assets")) {
      effectiveVendorId = params.vendorId;
    } else {
      throw new UnauthorizedExceptionAccessError(
        `Actor role "${validActor.role}" does not have permission to create availability exceptions.`,
      );
    }

    if (!params.target || !params.target.trim()) {
      throw new AvailabilityExceptionValidationError("Target asset or category is required.");
    }
    if (!params.startsAt || !params.startsAt.trim()) {
      throw new AvailabilityExceptionValidationError("Start date/time is required.");
    }
    if (!params.endsAt || !params.endsAt.trim()) {
      throw new AvailabilityExceptionValidationError("End date/time is required.");
    }

    const startMs = Date.parse(params.startsAt);
    const endMs = Date.parse(params.endsAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      throw new AvailabilityExceptionValidationError(
        "Invalid datetime format for startsAt or endsAt.",
      );
    }
    if (startMs >= endMs) {
      throw new AvailabilityExceptionValidationError(
        `Start date/time ("${params.startsAt}") must precede end date/time ("${params.endsAt}").`,
      );
    }

    const validExceptionType = this.validateType(params.type);

    if (validExceptionType === "CAPACITY_OVERRIDE") {
      if (
        params.capacityOverride === undefined ||
        params.capacityOverride === null ||
        typeof params.capacityOverride !== "number" ||
        !Number.isFinite(params.capacityOverride) ||
        params.capacityOverride < 0
      ) {
        throw new AvailabilityExceptionValidationError(
          "Capacity override must be a non-negative finite number when type is CAPACITY_OVERRIDE.",
        );
      }
    }

    if (!params.reason || !params.reason.trim()) {
      throw new AvailabilityExceptionValidationError(
        "Reason is required for availability exception.",
      );
    }

    const now = new Date().toISOString();
    const id = `ex_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const candidate: AvailabilityException = {
      id,
      target: params.target.trim(),
      targetType: params.targetType || "ASSET",
      targetId: params.targetId,
      vendorId: effectiveVendorId,
      startsAt: params.startsAt.trim(),
      endsAt: params.endsAt.trim(),
      startsDisplay: params.startsAt.replace("T", " · ").substring(0, 18),
      endsDisplay: params.endsAt.replace("T", " · ").substring(0, 18),
      type: validExceptionType,
      capacityOverride:
        validExceptionType === "CAPACITY_OVERRIDE" ? params.capacityOverride : undefined,
      reason: params.reason.trim(),
      createdAt: now,
      updatedAt: now,
    };

    this.exceptions.unshift(candidate);
    this.notify();
    return structuredClone(candidate);
  }

  public updateException(
    actor: AuthorizedActor | null | undefined,
    id: string,
    params: UpdateAvailabilityExceptionParams,
  ): AvailabilityException {
    const validActor = this.checkActor(actor);

    const index = this.exceptions.findIndex(
      (e) => e.id.toLowerCase() === id.toLowerCase() || e.id === id,
    );
    if (index === -1) {
      throw new AvailabilityExceptionValidationError(
        `Availability exception with ID "${id}" was not found.`,
      );
    }
    const existing = this.exceptions[index];

    // Authorization check
    if (validActor.role === "VENDOR") {
      if (
        !validActor.vendorId ||
        existing.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedExceptionAccessError(
          "Unauthorized: Vendor actors cannot mutate availability exceptions of other organizations.",
        );
      }
    } else if (!hasCommandCenterPermission(validActor.role, "manage:assets")) {
      throw new UnauthorizedExceptionAccessError(
        `Actor role "${validActor.role}" does not have permission to update availability exceptions.`,
      );
    }

    const candidateTarget = params.target !== undefined ? params.target.trim() : existing.target;
    if (!candidateTarget) {
      throw new AvailabilityExceptionValidationError("Target cannot be empty.");
    }

    const candidateStartsAt =
      params.startsAt !== undefined ? params.startsAt.trim() : existing.startsAt;
    const candidateEndsAt = params.endsAt !== undefined ? params.endsAt.trim() : existing.endsAt;

    const startMs = Date.parse(candidateStartsAt);
    const endMs = Date.parse(candidateEndsAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      throw new AvailabilityExceptionValidationError(
        "Invalid datetime format for startsAt or endsAt.",
      );
    }
    if (startMs >= endMs) {
      throw new AvailabilityExceptionValidationError(
        `Start date/time ("${candidateStartsAt}") must precede end date/time ("${candidateEndsAt}").`,
      );
    }

    const candidateType =
      params.type !== undefined ? this.validateType(params.type) : existing.type;

    let candidateCap = existing.capacityOverride;
    if (candidateType === "CAPACITY_OVERRIDE") {
      const overrideVal =
        params.capacityOverride !== undefined ? params.capacityOverride : existing.capacityOverride;
      if (
        overrideVal === undefined ||
        overrideVal === null ||
        typeof overrideVal !== "number" ||
        !Number.isFinite(overrideVal) ||
        overrideVal < 0
      ) {
        throw new AvailabilityExceptionValidationError(
          "Capacity override must be a non-negative finite number when type is CAPACITY_OVERRIDE.",
        );
      }
      candidateCap = overrideVal;
    } else {
      candidateCap = undefined;
    }

    const candidateReason = params.reason !== undefined ? params.reason.trim() : existing.reason;
    if (!candidateReason) {
      throw new AvailabilityExceptionValidationError("Reason cannot be empty.");
    }

    const updatedRecord: AvailabilityException = {
      ...existing,
      target: candidateTarget,
      startsAt: candidateStartsAt,
      endsAt: candidateEndsAt,
      startsDisplay: candidateStartsAt.replace("T", " · ").substring(0, 18),
      endsDisplay: candidateEndsAt.replace("T", " · ").substring(0, 18),
      type: candidateType,
      capacityOverride: candidateCap,
      reason: candidateReason,
      updatedAt: new Date().toISOString(),
    };

    this.exceptions[index] = updatedRecord;
    this.notify();
    return structuredClone(updatedRecord);
  }

  public deleteException(actor: AuthorizedActor | null | undefined, id: string): boolean {
    const validActor = this.checkActor(actor);

    const index = this.exceptions.findIndex(
      (e) => e.id.toLowerCase() === id.toLowerCase() || e.id === id,
    );
    if (index === -1) {
      throw new AvailabilityExceptionValidationError(
        `Availability exception with ID "${id}" was not found.`,
      );
    }
    const existing = this.exceptions[index];

    if (validActor.role === "VENDOR") {
      if (
        !validActor.vendorId ||
        existing.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedExceptionAccessError(
          "Unauthorized: Vendor actors cannot delete availability exceptions of other organizations.",
        );
      }
    } else if (!hasCommandCenterPermission(validActor.role, "manage:assets")) {
      throw new UnauthorizedExceptionAccessError(
        `Actor role "${validActor.role}" does not have permission to delete availability exceptions.`,
      );
    }

    this.exceptions.splice(index, 1);
    this.notify();
    return true;
  }

  public resetDefaults(): void {
    this.exceptions = JSON.parse(JSON.stringify(INITIAL_AVAILABILITY_EXCEPTIONS));
    this.notify();
  }
}

export const availabilityExceptionRepository = new AvailabilityExceptionRepository();
