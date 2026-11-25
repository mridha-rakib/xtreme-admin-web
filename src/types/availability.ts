export type AvailabilityTargetType = "ASSET" | "CATEGORY";

export interface AvailabilityRule {
  id: string;
  target: string;
  targetType: AvailabilityTargetType;
  targetId?: string;
  weekday: string;
  timeWindow: string;
  timezone: string;
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
  timeWindow: string;
  timezone: string;
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
  timeWindow?: string;
  timezone?: string;
  capacity?: number;
  active?: boolean;
  vendorId?: string;
  notes?: string;
}
