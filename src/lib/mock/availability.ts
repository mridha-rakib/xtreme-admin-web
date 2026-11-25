import {
  APPROVED_TIMEZONES,
  APPROVED_WEEKDAYS,
  type ApprovedTimezone,
  type AuthorizedActor,
  type AvailabilityRule,
  type CreateAvailabilityRuleParams,
  type UpdateAvailabilityRuleParams,
  hasCommandCenterPermission,
} from "@/types";

export class AvailabilityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilityValidationError";
  }
}

export class UnauthorizedAvailabilityAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedAvailabilityAccessError";
  }
}

export const INITIAL_AVAILABILITY_RULES: AvailabilityRule[] = [
  {
    id: "avl_001",
    target: "Cessna Citation Latitude (AST-AJ-01)",
    targetType: "ASSET",
    targetId: "ast_001",
    weekday: "Mon - Fri",
    timeWindow: "06:00 - 22:00",
    startTime: "06:00",
    endTime: "22:00",
    timezone: "Europe/Paris",
    timezoneDisplay: "Europe/Paris (UTC+1)",
    capacity: 8,
    active: false,
    vendorId: "vnd_aerojet_99",
    notes: "Weekday chartered flight schedule covering Côte d'Azur regional corridors.",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-11-20T10:00:00Z",
  },
  {
    id: "avl_002",
    target: "Gulfstream G650ER (AST-AJ-02)",
    targetType: "ASSET",
    targetId: "ast_002",
    weekday: "Daily",
    timeWindow: "24 Hours",
    startTime: "00:00",
    endTime: "24:00",
    timezone: "Europe/Zurich",
    timezoneDisplay: "Europe/Zurich (UTC+1)",
    capacity: 14,
    active: true,
    vendorId: "vnd_aerojet_99",
    notes: "Long-range availability subject to 24h maintenance pre-clearing.",
    createdAt: "2026-02-01T09:00:00Z",
    updatedAt: "2026-11-22T14:00:00Z",
  },
  {
    id: "avl_003",
    target: "Sunseeker Predator 74 (AST-CY-01)",
    targetType: "ASSET",
    targetId: "ast_003",
    weekday: "Fri - Sun",
    timeWindow: "08:00 - 20:00",
    startTime: "08:00",
    endTime: "20:00",
    timezone: "Europe/Paris",
    timezoneDisplay: "Europe/Paris (UTC+1)",
    capacity: 12,
    active: false,
    vendorId: "vnd_azure_01",
    notes: "Weekend charter slots departing Port de Saint-Tropez.",
    createdAt: "2026-03-05T11:00:00Z",
    updatedAt: "2026-11-18T16:30:00Z",
  },
  {
    id: "avl_004",
    target: "Riva 66 Ribelle (AST-CY-02)",
    targetType: "ASSET",
    targetId: "ast_004",
    weekday: "Saturday - Sunday",
    timeWindow: "09:00 - 18:00",
    startTime: "09:00",
    endTime: "18:00",
    timezone: "Europe/Paris",
    timezoneDisplay: "Europe/Paris (UTC+1)",
    capacity: 8,
    active: true,
    vendorId: "vnd_azure_01",
    notes: "Day cruise window along French Riviera coastal waters.",
    createdAt: "2026-04-10T10:00:00Z",
    updatedAt: "2026-11-15T09:00:00Z",
  },
  {
    id: "avl_005",
    target: "Mercedes-Maybach S680 (AST-XT-01)",
    targetType: "ASSET",
    targetId: "ast_005",
    weekday: "Daily",
    timeWindow: "24 Hours",
    startTime: "00:00",
    endTime: "24:00",
    timezone: "Europe/Paris",
    timezoneDisplay: "Europe/Paris (UTC+1)",
    capacity: 4,
    active: false,
    notes: "Continuous Paris metropolitan executive on-demand availability.",
    createdAt: "2026-01-10T07:00:00Z",
    updatedAt: "2026-11-24T08:00:00Z",
  },
  {
    id: "avl_006",
    target: "Eurocopter EC130 T2 (AST-XT-02)",
    targetType: "ASSET",
    targetId: "ast_006",
    weekday: "Mon - Sat",
    timeWindow: "07:00 - 19:00",
    startTime: "07:00",
    endTime: "19:00",
    timezone: "Europe/Paris",
    timezoneDisplay: "Europe/Paris (UTC+1)",
    capacity: 6,
    active: true,
    notes: "Daylight visual flight rules (VFR) heli-transfer corridor.",
    createdAt: "2026-05-20T13:45:00Z",
    updatedAt: "2026-11-23T11:20:00Z",
  },
  {
    id: "avl_007",
    target: "Rolls-Royce Phantom VIII (AST-XT-03)",
    targetType: "ASSET",
    targetId: "ast_007",
    weekday: "Mon - Fri",
    timeWindow: "08:00 - 22:00",
    startTime: "08:00",
    endTime: "22:00",
    timezone: "Europe/London",
    timezoneDisplay: "Europe/London (UTC+0)",
    capacity: 4,
    active: false,
    notes: "Greater London Mayfair/Belgravia operational service rule.",
    createdAt: "2026-06-05T15:00:00Z",
    updatedAt: "2026-11-21T17:10:00Z",
  },
];

export interface AvailabilityFilterOptions {
  vendorId?: string;
  active?: boolean | "ALL";
  search?: string;
}

export class AvailabilityRepository {
  private rules: AvailabilityRule[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.rules = JSON.parse(JSON.stringify(INITIAL_AVAILABILITY_RULES));
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
      throw new UnauthorizedAvailabilityAccessError(
        "Authentication required: Actor context missing.",
      );
    }
    return actor;
  }

  private validateTimezone(tz: string): ApprovedTimezone {
    if (!APPROVED_TIMEZONES.includes(tz as ApprovedTimezone)) {
      throw new AvailabilityValidationError(
        `Invalid canonical IANA timezone: "${tz}". Approved identifiers: ${APPROVED_TIMEZONES.join(", ")}.`,
      );
    }
    return tz as ApprovedTimezone;
  }

  private validateCapacity(capacity: number | unknown): number {
    if (typeof capacity !== "number" || !Number.isFinite(capacity) || !Number.isInteger(capacity)) {
      throw new AvailabilityValidationError("Capacity must be a finite integer.");
    }
    if (capacity <= 0) {
      throw new AvailabilityValidationError(
        "Capacity must be a positive integer greater than zero.",
      );
    }
    return capacity;
  }

  private validateTimeFormat(time: string, label: string): string {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!time || !timeRegex.test(time.trim())) {
      throw new AvailabilityValidationError(
        `${label} must be formatted as HH:mm (e.g. 08:00 or 22:00).`,
      );
    }
    return time.trim();
  }

  public listRules(
    actor: AuthorizedActor | null | undefined,
    filters?: AvailabilityFilterOptions,
  ): AvailabilityRule[] {
    const validActor = this.checkActor(actor);

    // Vendor self-service scope
    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedAvailabilityAccessError(
          "Vendor actor has no associated vendor organization membership.",
        );
      }
      if (
        filters?.vendorId &&
        filters.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedAvailabilityAccessError(
          "Unauthorized: Cross-vendor availability rule query is prohibited.",
        );
      }

      return this.rules
        .filter((r) => {
          if (r.vendorId?.toLowerCase() !== validActor.vendorId?.toLowerCase()) {
            return false;
          }
          if (
            filters?.active !== undefined &&
            filters.active !== "ALL" &&
            r.active !== filters.active
          ) {
            return false;
          }
          if (filters?.search?.trim()) {
            const query = filters.search.toLowerCase().trim();
            const matchTarget = r.target.toLowerCase().includes(query);
            const matchWeekday = r.weekday.toLowerCase().includes(query);
            if (!matchTarget && !matchWeekday) return false;
          }
          return true;
        })
        .map((r) => structuredClone(r));
    }

    // Admin / Concierge access
    if (
      hasCommandCenterPermission(validActor.role, "view:assets") ||
      hasCommandCenterPermission(validActor.role, "manage:assets")
    ) {
      return this.rules
        .filter((r) => {
          if (filters?.vendorId && r.vendorId?.toLowerCase() !== filters.vendorId.toLowerCase()) {
            return false;
          }
          if (
            filters?.active !== undefined &&
            filters.active !== "ALL" &&
            r.active !== filters.active
          ) {
            return false;
          }
          if (filters?.search?.trim()) {
            const query = filters.search.toLowerCase().trim();
            const matchTarget = r.target.toLowerCase().includes(query);
            const matchWeekday = r.weekday.toLowerCase().includes(query);
            const matchTime = r.timeWindow.toLowerCase().includes(query);
            const matchZone = r.timezone.toLowerCase().includes(query);
            if (!matchTarget && !matchWeekday && !matchTime && !matchZone) {
              return false;
            }
          }
          return true;
        })
        .map((r) => structuredClone(r));
    }

    throw new UnauthorizedAvailabilityAccessError(
      `Actor role "${validActor.role}" does not have permission to view availability rules.`,
    );
  }

  public getRuleById(
    actor: AuthorizedActor | null | undefined,
    id: string,
  ): AvailabilityRule | undefined {
    const validActor = this.checkActor(actor);

    const rule = this.rules.find((r) => r.id.toLowerCase() === id.toLowerCase() || r.id === id);
    if (!rule) return undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedAvailabilityAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      if (rule.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()) {
        throw new UnauthorizedAvailabilityAccessError(
          "Unauthorized: Vendor actor cannot access availability rules of other organizations.",
        );
      }
    } else if (
      !hasCommandCenterPermission(validActor.role, "view:assets") &&
      !hasCommandCenterPermission(validActor.role, "manage:assets")
    ) {
      throw new UnauthorizedAvailabilityAccessError(
        `Actor role "${validActor.role}" does not have permission to access availability rules.`,
      );
    }

    return structuredClone(rule);
  }

  public createRule(
    actor: AuthorizedActor | null | undefined,
    params: CreateAvailabilityRuleParams,
  ): AvailabilityRule {
    const validActor = this.checkActor(actor);

    let effectiveVendorId: string | undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedAvailabilityAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      effectiveVendorId = validActor.vendorId;
    } else if (hasCommandCenterPermission(validActor.role, "manage:assets")) {
      effectiveVendorId = params.vendorId;
    } else {
      throw new UnauthorizedAvailabilityAccessError(
        `Actor role "${validActor.role}" does not have permission to create availability rules.`,
      );
    }

    if (!params.target || !params.target.trim()) {
      throw new AvailabilityValidationError("Target asset or category is required.");
    }
    if (!params.weekday || !params.weekday.trim()) {
      throw new AvailabilityValidationError("Weekday specification is required.");
    }
    const cleanStartTime = this.validateTimeFormat(params.startTime, "Start time");
    const cleanEndTime = this.validateTimeFormat(params.endTime, "End time");
    if (cleanStartTime >= cleanEndTime) {
      throw new AvailabilityValidationError(
        `startTime ("${cleanStartTime}") must precede endTime ("${cleanEndTime}").`,
      );
    }
    const canonicalTimezone = this.validateTimezone(params.timezone);
    const validCapacity = this.validateCapacity(params.capacity);

    const timezoneDisplay =
      canonicalTimezone === "Europe/Paris" || canonicalTimezone === "Europe/Zurich"
        ? `${canonicalTimezone} (UTC+1)`
        : canonicalTimezone === "Europe/London" || canonicalTimezone === "UTC"
          ? `${canonicalTimezone} (UTC+0)`
          : `${canonicalTimezone} (UTC-5)`;

    const timeWindow = `${cleanStartTime} - ${cleanEndTime}`;

    const now = new Date().toISOString();
    const id = `avl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const candidate: AvailabilityRule = {
      id,
      target: params.target.trim(),
      targetType: params.targetType || "ASSET",
      targetId: params.targetId,
      weekday: params.weekday.trim(),
      timeWindow,
      startTime: cleanStartTime,
      endTime: cleanEndTime,
      timezone: canonicalTimezone,
      timezoneDisplay,
      capacity: validCapacity,
      active: params.active ?? true,
      vendorId: effectiveVendorId,
      notes: params.notes?.trim() || "",
      createdAt: now,
      updatedAt: now,
    };

    this.rules.unshift(candidate);
    this.notify();
    return structuredClone(candidate);
  }

  public updateRule(
    actor: AuthorizedActor | null | undefined,
    id: string,
    params: UpdateAvailabilityRuleParams,
  ): AvailabilityRule {
    const validActor = this.checkActor(actor);

    const index = this.rules.findIndex(
      (r) => r.id.toLowerCase() === id.toLowerCase() || r.id === id,
    );
    if (index === -1) {
      throw new AvailabilityValidationError(`Availability rule with ID "${id}" was not found.`);
    }
    const existing = this.rules[index];

    // Authorization check
    if (validActor.role === "VENDOR") {
      if (
        !validActor.vendorId ||
        existing.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedAvailabilityAccessError(
          "Unauthorized: Vendor actors cannot mutate availability rules of other organizations.",
        );
      }
    } else if (!hasCommandCenterPermission(validActor.role, "manage:assets")) {
      throw new UnauthorizedAvailabilityAccessError(
        `Actor role "${validActor.role}" does not have permission to update availability rules.`,
      );
    }

    // Construct and validate candidate
    const candidateTarget = params.target !== undefined ? params.target.trim() : existing.target;
    if (!candidateTarget) {
      throw new AvailabilityValidationError("Target cannot be empty.");
    }

    const candidateWeekday =
      params.weekday !== undefined ? params.weekday.trim() : existing.weekday;

    const candidateStartTime =
      params.startTime !== undefined
        ? this.validateTimeFormat(params.startTime, "Start time")
        : existing.startTime;
    const candidateEndTime =
      params.endTime !== undefined
        ? this.validateTimeFormat(params.endTime, "End time")
        : existing.endTime;

    const candidateTimezone =
      params.timezone !== undefined ? this.validateTimezone(params.timezone) : existing.timezone;

    const candidateCapacity =
      params.capacity !== undefined ? this.validateCapacity(params.capacity) : existing.capacity;

    const candidateActive = params.active !== undefined ? Boolean(params.active) : existing.active;

    const timezoneDisplay =
      candidateTimezone === "Europe/Paris" || candidateTimezone === "Europe/Zurich"
        ? `${candidateTimezone} (UTC+1)`
        : candidateTimezone === "Europe/London" || candidateTimezone === "UTC"
          ? `${candidateTimezone} (UTC+0)`
          : `${candidateTimezone} (UTC-5)`;

    const updatedRecord: AvailabilityRule = {
      ...existing,
      target: candidateTarget,
      weekday: candidateWeekday,
      startTime: candidateStartTime,
      endTime: candidateEndTime,
      timeWindow: `${candidateStartTime} - ${candidateEndTime}`,
      timezone: candidateTimezone,
      timezoneDisplay,
      capacity: candidateCapacity,
      active: candidateActive,
      notes: params.notes !== undefined ? params.notes.trim() : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    this.rules[index] = updatedRecord;
    this.notify();
    return structuredClone(updatedRecord);
  }

  public toggleRuleActive(
    actor: AuthorizedActor | null | undefined,
    id: string,
    active?: boolean,
  ): AvailabilityRule {
    const existing = this.getRuleById(actor, id);
    if (!existing) {
      throw new AvailabilityValidationError(`Availability rule with ID "${id}" was not found.`);
    }
    const nextActive = active !== undefined ? active : !existing.active;
    return this.updateRule(actor, id, { active: nextActive });
  }

  public resetDefaults(): void {
    this.rules = JSON.parse(JSON.stringify(INITIAL_AVAILABILITY_RULES));
    this.notify();
  }
}

export const availabilityRepository = new AvailabilityRepository();
