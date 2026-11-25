import {
  APPROVED_SLOT_STATUSES,
  type AuthorizedActor,
  type AvailabilitySlot,
  type AvailabilitySlotStatus,
  type CreateAvailabilitySlotParams,
  type UpdateAvailabilitySlotParams,
  hasCommandCenterPermission,
} from "@/types";

export class AvailabilitySlotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilitySlotValidationError";
  }
}

export class UnauthorizedSlotAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedSlotAccessError";
  }
}

export const INITIAL_AVAILABILITY_SLOTS: AvailabilitySlot[] = [
  {
    id: "slt_001",
    target: "Cessna Citation Latitude (AST-AJ-01)",
    targetType: "ASSET",
    targetId: "ast_001",
    vendorId: "vnd_aerojet_99",
    startsAt: "2026-11-26T08:00:00Z",
    endsAt: "2026-11-26T12:00:00Z",
    startsDisplay: "Nov 26, 2026 · 08:00",
    endsDisplay: "Nov 26, 2026 · 12:00",
    capacity: 8,
    status: "OPEN",
    notes: "Morning Côte d'Azur regional flight window",
    createdAt: "2026-11-20T09:00:00Z",
    updatedAt: "2026-11-20T09:00:00Z",
  },
  {
    id: "slt_002",
    target: "Cessna Citation Latitude (AST-AJ-01)",
    targetType: "ASSET",
    targetId: "ast_001",
    vendorId: "vnd_aerojet_99",
    startsAt: "2026-11-26T14:00:00Z",
    endsAt: "2026-11-26T18:00:00Z",
    startsDisplay: "Nov 26, 2026 · 14:00",
    endsDisplay: "Nov 26, 2026 · 18:00",
    capacity: 8,
    status: "CLOSED",
    notes: "Crew duty time ceiling reached. New allocations rejected; existing commitments intact.",
    createdAt: "2026-11-20T09:30:00Z",
    updatedAt: "2026-11-22T10:00:00Z",
  },
  {
    id: "slt_003",
    target: "Sunseeker Predator 74 (AST-CY-01)",
    targetType: "ASSET",
    targetId: "ast_003",
    vendorId: "vnd_azure_01",
    startsAt: "2026-11-27T09:00:00Z",
    endsAt: "2026-11-27T17:00:00Z",
    startsDisplay: "Nov 27, 2026 · 09:00",
    endsDisplay: "Nov 27, 2026 · 17:00",
    capacity: 12,
    status: "OPEN",
    notes: "Day charter slot departing Port de Cannes",
    createdAt: "2026-11-21T10:00:00Z",
    updatedAt: "2026-11-21T10:00:00Z",
  },
  {
    id: "slt_004",
    target: "Sunseeker Predator 74 (AST-CY-01)",
    targetType: "ASSET",
    targetId: "ast_003",
    vendorId: "vnd_azure_01",
    startsAt: "2026-11-28T09:00:00Z",
    endsAt: "2026-11-28T17:00:00Z",
    startsDisplay: "Nov 28, 2026 · 09:00",
    endsDisplay: "Nov 28, 2026 · 17:00",
    capacity: 12,
    status: "CLOSED",
    notes: "Port authority private regatta restriction",
    createdAt: "2026-11-21T11:00:00Z",
    updatedAt: "2026-11-22T15:00:00Z",
  },
  {
    id: "slt_005",
    target: "Mercedes-Maybach S680 (AST-XT-01)",
    targetType: "ASSET",
    targetId: "ast_005",
    startsAt: "2026-11-26T00:00:00Z",
    endsAt: "2026-11-26T23:59:59Z",
    startsDisplay: "Nov 26, 2026 · 00:00",
    endsDisplay: "Nov 26, 2026 · 23:59",
    capacity: 4,
    status: "OPEN",
    notes: "Full-day Paris metropolitan executive on-call slot",
    createdAt: "2026-11-19T08:00:00Z",
    updatedAt: "2026-11-19T08:00:00Z",
  },
  {
    id: "slt_006",
    target: "Eurocopter EC130 T2 (AST-XT-02)",
    targetType: "ASSET",
    targetId: "ast_006",
    startsAt: "2026-11-27T10:00:00Z",
    endsAt: "2026-11-27T14:00:00Z",
    startsDisplay: "Nov 27, 2026 · 10:00",
    endsDisplay: "Nov 27, 2026 · 14:00",
    capacity: 6,
    status: "OPEN",
    notes: "Monaco Heliport shuttle schedule",
    createdAt: "2026-11-22T13:00:00Z",
    updatedAt: "2026-11-22T13:00:00Z",
  },
  {
    id: "slt_007",
    target: "Rolls-Royce Phantom VIII (AST-XT-03)",
    targetType: "ASSET",
    targetId: "ast_007",
    startsAt: "2026-11-27T12:00:00Z",
    endsAt: "2026-11-27T20:00:00Z",
    startsDisplay: "Nov 27, 2026 · 12:00",
    endsDisplay: "Nov 27, 2026 · 20:00",
    capacity: 4,
    status: "CLOSED",
    notes: "Fleet chauffeur certification session",
    createdAt: "2026-11-22T16:00:00Z",
    updatedAt: "2026-11-23T09:30:00Z",
  },
];

export interface SlotFilterOptions {
  vendorId?: string;
  status?: AvailabilitySlotStatus | "ALL";
  search?: string;
}

export class AvailabilitySlotRepository {
  private slots: AvailabilitySlot[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.slots = JSON.parse(JSON.stringify(INITIAL_AVAILABILITY_SLOTS));
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
      throw new UnauthorizedSlotAccessError("Authentication required: Actor context missing.");
    }
    return actor;
  }

  private validateCapacity(capacity: number | unknown): number {
    if (typeof capacity !== "number" || !Number.isFinite(capacity) || !Number.isInteger(capacity)) {
      throw new AvailabilitySlotValidationError("Capacity must be a finite integer.");
    }
    if (capacity <= 0) {
      throw new AvailabilitySlotValidationError("Capacity must be greater than zero.");
    }
    return capacity;
  }

  private validateStatus(status: string): AvailabilitySlotStatus {
    if (!APPROVED_SLOT_STATUSES.includes(status as AvailabilitySlotStatus)) {
      throw new AvailabilitySlotValidationError(
        `Invalid slot status "${status}". Approved statuses: ${APPROVED_SLOT_STATUSES.join(", ")}.`,
      );
    }
    return status as AvailabilitySlotStatus;
  }

  public listSlotsInternal(targetId?: string): AvailabilitySlot[] {
    if (!targetId) return this.slots.map((s) => structuredClone(s));
    return this.slots
      .filter(
        (s) =>
          s.targetId?.toLowerCase() === targetId.toLowerCase() ||
          s.target.toLowerCase().includes(targetId.toLowerCase()),
      )
      .map((s) => structuredClone(s));
  }

  public listSlots(
    actor: AuthorizedActor | null | undefined,
    filters?: SlotFilterOptions,
  ): AvailabilitySlot[] {
    const validActor = this.checkActor(actor);

    // Vendor self-service scope
    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedSlotAccessError(
          "Vendor actor has no associated vendor organization membership.",
        );
      }
      if (
        filters?.vendorId &&
        filters.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedSlotAccessError(
          "Unauthorized: Cross-vendor availability slot query is prohibited.",
        );
      }

      return this.slots
        .filter((s) => {
          if (s.vendorId?.toLowerCase() !== validActor.vendorId?.toLowerCase()) {
            return false;
          }
          if (filters?.status && filters.status !== "ALL" && s.status !== filters.status) {
            return false;
          }
          if (filters?.search?.trim()) {
            const query = filters.search.toLowerCase().trim();
            const matchTarget = s.target.toLowerCase().includes(query);
            const matchNotes = (s.notes || "").toLowerCase().includes(query);
            if (!matchTarget && !matchNotes) return false;
          }
          return true;
        })
        .map((s) => structuredClone(s));
    }

    // Admin / Super Admin access
    if (
      hasCommandCenterPermission(validActor.role, "view:assets") ||
      hasCommandCenterPermission(validActor.role, "manage:assets")
    ) {
      return this.slots
        .filter((s) => {
          if (filters?.vendorId && s.vendorId?.toLowerCase() !== filters.vendorId.toLowerCase()) {
            return false;
          }
          if (filters?.status && filters.status !== "ALL" && s.status !== filters.status) {
            return false;
          }
          if (filters?.search?.trim()) {
            const query = filters.search.toLowerCase().trim();
            const matchTarget = s.target.toLowerCase().includes(query);
            const matchNotes = (s.notes || "").toLowerCase().includes(query);
            if (!matchTarget && !matchNotes) return false;
          }
          return true;
        })
        .map((s) => structuredClone(s));
    }

    throw new UnauthorizedSlotAccessError(
      `Actor role "${validActor.role}" does not have permission to view availability slots.`,
    );
  }

  public getSlotById(
    actor: AuthorizedActor | null | undefined,
    id: string,
  ): AvailabilitySlot | undefined {
    const validActor = this.checkActor(actor);

    const record = this.slots.find((s) => s.id.toLowerCase() === id.toLowerCase() || s.id === id);
    if (!record) return undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedSlotAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      if (record.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()) {
        throw new UnauthorizedSlotAccessError(
          "Unauthorized: Cannot access availability slots belonging to another organization.",
        );
      }
    } else if (
      !hasCommandCenterPermission(validActor.role, "view:assets") &&
      !hasCommandCenterPermission(validActor.role, "manage:assets")
    ) {
      throw new UnauthorizedSlotAccessError(
        `Actor role "${validActor.role}" does not have permission to access availability slots.`,
      );
    }

    return structuredClone(record);
  }

  public createSlot(
    actor: AuthorizedActor | null | undefined,
    params: CreateAvailabilitySlotParams,
  ): AvailabilitySlot {
    const validActor = this.checkActor(actor);

    let effectiveVendorId: string | undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedSlotAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      effectiveVendorId = validActor.vendorId;
    } else if (hasCommandCenterPermission(validActor.role, "manage:assets")) {
      effectiveVendorId = params.vendorId;
    } else {
      throw new UnauthorizedSlotAccessError(
        `Actor role "${validActor.role}" does not have permission to create availability slots.`,
      );
    }

    if (!params.target || !params.target.trim()) {
      throw new AvailabilitySlotValidationError("Target asset or category is required.");
    }
    if (!params.startsAt || !params.startsAt.trim()) {
      throw new AvailabilitySlotValidationError("Start date/time is required.");
    }
    if (!params.endsAt || !params.endsAt.trim()) {
      throw new AvailabilitySlotValidationError("End date/time is required.");
    }

    const startMs = Date.parse(params.startsAt);
    const endMs = Date.parse(params.endsAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      throw new AvailabilitySlotValidationError("Invalid datetime format for startsAt or endsAt.");
    }
    if (startMs >= endMs) {
      throw new AvailabilitySlotValidationError(
        `Start date/time ("${params.startsAt}") must precede end date/time ("${params.endsAt}").`,
      );
    }

    const validCapacity = this.validateCapacity(params.capacity);
    const validStatus = params.status ? this.validateStatus(params.status) : "OPEN";

    const now = new Date().toISOString();
    const id = `slt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const candidate: AvailabilitySlot = {
      id,
      target: params.target.trim(),
      targetType: params.targetType || "ASSET",
      targetId: params.targetId,
      vendorId: effectiveVendorId,
      startsAt: params.startsAt.trim(),
      endsAt: params.endsAt.trim(),
      startsDisplay: params.startsAt.replace("T", " · ").substring(0, 18),
      endsDisplay: params.endsAt.replace("T", " · ").substring(0, 18),
      capacity: validCapacity,
      status: validStatus,
      notes: params.notes?.trim() || "",
      createdAt: now,
      updatedAt: now,
    };

    this.slots.unshift(candidate);
    this.notify();
    return structuredClone(candidate);
  }

  public updateSlot(
    actor: AuthorizedActor | null | undefined,
    id: string,
    params: UpdateAvailabilitySlotParams,
  ): AvailabilitySlot {
    const validActor = this.checkActor(actor);

    const index = this.slots.findIndex(
      (s) => s.id.toLowerCase() === id.toLowerCase() || s.id === id,
    );
    if (index === -1) {
      throw new AvailabilitySlotValidationError(`Availability slot with ID "${id}" was not found.`);
    }
    const existing = this.slots[index];

    // Authorization check
    if (validActor.role === "VENDOR") {
      if (
        !validActor.vendorId ||
        existing.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedSlotAccessError(
          "Unauthorized: Vendor actors cannot mutate availability slots of other organizations.",
        );
      }
    } else if (!hasCommandCenterPermission(validActor.role, "manage:assets")) {
      throw new UnauthorizedSlotAccessError(
        `Actor role "${validActor.role}" does not have permission to update availability slots.`,
      );
    }

    const candidateTarget = params.target !== undefined ? params.target.trim() : existing.target;
    if (!candidateTarget) {
      throw new AvailabilitySlotValidationError("Target cannot be empty.");
    }

    const candidateStartsAt =
      params.startsAt !== undefined ? params.startsAt.trim() : existing.startsAt;
    const candidateEndsAt = params.endsAt !== undefined ? params.endsAt.trim() : existing.endsAt;

    const startMs = Date.parse(candidateStartsAt);
    const endMs = Date.parse(candidateEndsAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      throw new AvailabilitySlotValidationError("Invalid datetime format for startsAt or endsAt.");
    }
    if (startMs >= endMs) {
      throw new AvailabilitySlotValidationError(
        `Start date/time ("${candidateStartsAt}") must precede end date/time ("${candidateEndsAt}").`,
      );
    }

    const candidateCapacity =
      params.capacity !== undefined ? this.validateCapacity(params.capacity) : existing.capacity;

    const candidateStatus =
      params.status !== undefined ? this.validateStatus(params.status) : existing.status;

    const updatedRecord: AvailabilitySlot = {
      ...existing,
      target: candidateTarget,
      startsAt: candidateStartsAt,
      endsAt: candidateEndsAt,
      startsDisplay: candidateStartsAt.replace("T", " · ").substring(0, 18),
      endsDisplay: candidateEndsAt.replace("T", " · ").substring(0, 18),
      capacity: candidateCapacity,
      status: candidateStatus,
      notes: params.notes !== undefined ? params.notes.trim() : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    this.slots[index] = updatedRecord;
    this.notify();
    return structuredClone(updatedRecord);
  }

  public toggleSlotStatus(
    actor: AuthorizedActor | null | undefined,
    id: string,
    status?: AvailabilitySlotStatus,
  ): AvailabilitySlot {
    const existing = this.getSlotById(actor, id);
    if (!existing) {
      throw new AvailabilitySlotValidationError(`Availability slot with ID "${id}" was not found.`);
    }
    const nextStatus = status || (existing.status === "OPEN" ? "CLOSED" : "OPEN");
    return this.updateSlot(actor, id, { status: nextStatus });
  }

  public deleteSlot(actor: AuthorizedActor | null | undefined, id: string): boolean {
    const validActor = this.checkActor(actor);

    const index = this.slots.findIndex(
      (s) => s.id.toLowerCase() === id.toLowerCase() || s.id === id,
    );
    if (index === -1) {
      throw new AvailabilitySlotValidationError(`Availability slot with ID "${id}" was not found.`);
    }
    const existing = this.slots[index];

    if (validActor.role === "VENDOR") {
      if (
        !validActor.vendorId ||
        existing.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedSlotAccessError(
          "Unauthorized: Vendor actors cannot delete availability slots of other organizations.",
        );
      }
    } else if (!hasCommandCenterPermission(validActor.role, "manage:assets")) {
      throw new UnauthorizedSlotAccessError(
        `Actor role "${validActor.role}" does not have permission to delete availability slots.`,
      );
    }

    this.slots.splice(index, 1);
    this.notify();
    return true;
  }

  public resetDefaults(): void {
    this.slots = JSON.parse(JSON.stringify(INITIAL_AVAILABILITY_SLOTS));
    this.notify();
  }
}

export const availabilitySlotRepository = new AvailabilitySlotRepository();
