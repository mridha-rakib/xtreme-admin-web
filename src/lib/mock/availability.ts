import type {
  AvailabilityRule,
  CreateAvailabilityRuleParams,
  UpdateAvailabilityRuleParams,
} from "@/types/availability";

export class AvailabilityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilityValidationError";
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
    timezone: "Europe/Paris (UTC+1)",
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
    timezone: "Europe/Zurich (UTC+1)",
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
    timezone: "Europe/Paris (UTC+1)",
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
    timezone: "Europe/Paris (UTC+1)",
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
    timezone: "Europe/Paris (UTC+1)",
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
    timezone: "Europe/Paris (UTC+1)",
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
    timezone: "Europe/London (UTC+0)",
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

  public listRules(filters?: AvailabilityFilterOptions): AvailabilityRule[] {
    return this.rules.filter((r) => {
      if (filters?.vendorId && r.vendorId !== filters.vendorId) {
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
    });
  }

  public getRuleById(id: string): AvailabilityRule | undefined {
    return this.rules.find((r) => r.id.toLowerCase() === id.toLowerCase() || r.id === id);
  }

  public createRule(params: CreateAvailabilityRuleParams): AvailabilityRule {
    if (!params.target || !params.target.trim()) {
      throw new AvailabilityValidationError("Target asset or category is required.");
    }
    if (!params.weekday || !params.weekday.trim()) {
      throw new AvailabilityValidationError("Weekday specification is required.");
    }
    if (!params.timeWindow || !params.timeWindow.trim()) {
      throw new AvailabilityValidationError("Time window is required.");
    }
    if (!params.timezone || !params.timezone.trim()) {
      throw new AvailabilityValidationError("Timezone is required.");
    }
    if (
      params.capacity === undefined ||
      params.capacity <= 0 ||
      Number.isNaN(Number(params.capacity))
    ) {
      throw new AvailabilityValidationError("Configured capacity must be a positive number.");
    }

    const now = new Date().toISOString();
    const id = `avl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newRule: AvailabilityRule = {
      id,
      target: params.target.trim(),
      targetType: params.targetType || "ASSET",
      targetId: params.targetId,
      weekday: params.weekday.trim(),
      timeWindow: params.timeWindow.trim(),
      timezone: params.timezone.trim(),
      capacity: Number(params.capacity),
      active: params.active ?? true,
      vendorId: params.vendorId,
      notes: params.notes?.trim() || "",
      createdAt: now,
      updatedAt: now,
    };

    this.rules.unshift(newRule);
    this.notify();
    return newRule;
  }

  public updateRule(id: string, params: UpdateAvailabilityRuleParams): AvailabilityRule {
    const existing = this.getRuleById(id);
    if (!existing) {
      throw new AvailabilityValidationError(`Availability rule with ID "${id}" was not found.`);
    }

    if (params.target !== undefined) {
      if (!params.target.trim()) {
        throw new AvailabilityValidationError("Target cannot be empty.");
      }
      existing.target = params.target.trim();
    }

    if (params.weekday !== undefined) {
      existing.weekday = params.weekday.trim();
    }

    if (params.timeWindow !== undefined) {
      existing.timeWindow = params.timeWindow.trim();
    }

    if (params.timezone !== undefined) {
      existing.timezone = params.timezone.trim();
    }

    if (params.capacity !== undefined) {
      if (params.capacity <= 0 || Number.isNaN(Number(params.capacity))) {
        throw new AvailabilityValidationError("Capacity must be a positive number.");
      }
      existing.capacity = Number(params.capacity);
    }

    if (params.active !== undefined) {
      existing.active = Boolean(params.active);
    }

    if (params.notes !== undefined) {
      existing.notes = params.notes.trim();
    }

    existing.updatedAt = new Date().toISOString();
    this.notify();
    return existing;
  }

  public toggleRuleActive(id: string): AvailabilityRule {
    const existing = this.getRuleById(id);
    if (!existing) {
      throw new AvailabilityValidationError(`Availability rule with ID "${id}" was not found.`);
    }
    existing.active = !existing.active;
    existing.updatedAt = new Date().toISOString();
    this.notify();
    return existing;
  }

  public resetDefaults(): void {
    this.rules = JSON.parse(JSON.stringify(INITIAL_AVAILABILITY_RULES));
    this.notify();
  }
}

export const availabilityRepository = new AvailabilityRepository();
