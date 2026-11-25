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
