export type FxPair = "USD/XOF" | "EUR/XOF";
export type FxSource = "AUTO" | "MANUAL";

export interface FxRateRecord {
  id: string;
  pair: FxPair;
  baseCurrency: "USD" | "EUR";
  quoteCurrency: "XOF";
  rate: number;
  source: FxSource;
  effectiveTimestamp: string;
  lastAutoRate: number;
  lastAutoTimestamp: string;
  overrideRate?: number;
  overriddenBy?: string;
  overrideTimestamp?: string;
  overrideReason?: string;
  version: number;
  updatedAt: string;
}

export interface FxRateAuditEntry {
  id: string;
  pair: FxPair;
  rate: number;
  source: FxSource;
  changedBy: string;
  reason?: string;
  timestamp: string;
}

export interface ManualFxOverrideParams {
  pair: FxPair;
  rate: number;
  reason: string;
}
