export type AvailabilityTargetType = "ASSET" | "CATEGORY";

export const APPROVED_TIMEZONES = [
  "Europe/Paris",
  "Europe/Zurich",
  "Europe/London",
  "America/New_York",
  "UTC",
] as const;

export type ApprovedTimezone = (typeof APPROVED_TIMEZONES)[number];

export const APPROVED_WEEKDAYS = [
  "Mon - Fri",
  "Daily",
  "Fri - Sun",
  "Saturday - Sunday",
  "Mon - Sat",
] as const;

export interface AvailabilityRule {
  id: string;
  target: string;
  targetType: AvailabilityTargetType;
  targetId?: string;
  weekday: string;
  timeWindow: string;
  startTime: string; // e.g. "06:00"
  endTime: string; // e.g. "22:00"
  timezone: ApprovedTimezone; // Canonical IANA identifier, e.g. "Europe/Paris"
  timezoneDisplay: string; // e.g. "Europe/Paris (UTC+1)"
  capacity: number;
  active: boolean;
  vendorId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityRuleParams {
  target: string;
  targetType?: AvailabilityTargetType;
  targetId?: string;
  weekday: string;
  startTime: string;
  endTime: string;
  timezone: ApprovedTimezone;
  capacity: number;
  active?: boolean;
  vendorId?: string;
  notes?: string;
}

export interface UpdateAvailabilityRuleParams {
  target?: string;
  targetType?: AvailabilityTargetType;
  targetId?: string;
  weekday?: string;
  startTime?: string;
  endTime?: string;
  timezone?: ApprovedTimezone;
  capacity?: number;
  active?: boolean;
  vendorId?: string;
  notes?: string;
}

export type AvailabilityExceptionType = "UNAVAILABLE" | "AVAILABLE_OVERRIDE" | "CAPACITY_OVERRIDE";

export const APPROVED_EXCEPTION_TYPES: AvailabilityExceptionType[] = [
  "UNAVAILABLE",
  "AVAILABLE_OVERRIDE",
  "CAPACITY_OVERRIDE",
];

export interface AvailabilityException {
  id: string;
  target: string;
  targetType: AvailabilityTargetType;
  targetId?: string;
  vendorId?: string;
  startsAt: string;
  endsAt: string;
  startsDisplay?: string;
  endsDisplay?: string;
  type: AvailabilityExceptionType;
  capacityOverride?: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilityExceptionParams {
  target: string;
  targetType?: AvailabilityTargetType;
  targetId?: string;
  vendorId?: string;
  startsAt: string;
  endsAt: string;
  type: AvailabilityExceptionType;
  capacityOverride?: number;
  reason: string;
}

export interface UpdateAvailabilityExceptionParams {
  target?: string;
  targetType?: AvailabilityTargetType;
  targetId?: string;
  vendorId?: string;
  startsAt?: string;
  endsAt?: string;
  type?: AvailabilityExceptionType;
  capacityOverride?: number;
  reason?: string;
}

export type AvailabilitySlotStatus = "OPEN" | "CLOSED";

export const APPROVED_SLOT_STATUSES: AvailabilitySlotStatus[] = ["OPEN", "CLOSED"];

export interface AvailabilitySlot {
  id: string;
  target: string;
  targetType: AvailabilityTargetType;
  targetId?: string;
  vendorId?: string;
  startsAt: string;
  endsAt: string;
  startsDisplay?: string;
  endsDisplay?: string;
  capacity: number;
  status: AvailabilitySlotStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAvailabilitySlotParams {
  target: string;
  targetType?: AvailabilityTargetType;
  targetId?: string;
  vendorId?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status?: AvailabilitySlotStatus;
  notes?: string;
}

export interface UpdateAvailabilitySlotParams {
  target?: string;
  targetType?: AvailabilityTargetType;
  targetId?: string;
  vendorId?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
  status?: AvailabilitySlotStatus;
  notes?: string;
}
