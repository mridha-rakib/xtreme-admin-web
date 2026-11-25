import type {
  AuthorizedActor,
  FxPair,
  FxRateAuditEntry,
  FxRateRecord,
  ManualFxOverrideParams,
} from "@/types";

export class FxRateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FxRateValidationError";
  }
}

export class UnauthorizedFxAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedFxAccessError";
  }
}

export interface HistoricalFxSnapshot {
  snapshotId: string;
  pair: FxPair;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  validFrom: string;
  validTo: string;
  notes?: string;
}

/**
 * Authoritative immutable historical exchange rate snapshots used for
 * historical revenue recognition and financial reporting.
 */
export const INITIAL_HISTORICAL_SNAPSHOTS: HistoricalFxSnapshot[] = [
  {
    snapshotId: "fx_snap_usd_2025_2026",
    pair: "USD/XOF",
    baseCurrency: "USD",
    quoteCurrency: "XOF",
    rate: 612.5,
    validFrom: "2025-01-01T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    notes: "Authoritative historical fixing benchmark (USD/XOF)",
  },
  {
    snapshotId: "fx_snap_eur_2025_2026",
    pair: "EUR/XOF",
    baseCurrency: "EUR",
    quoteCurrency: "XOF",
    rate: 655.957,
    validFrom: "2025-01-01T00:00:00Z",
    validTo: "2026-12-31T23:59:59Z",
    notes: "Authoritative historical BCEAO statutory peg (EUR/XOF)",
  },
];

/**
 * Note: Initial AUTO rates represent simulated fictional development market data feed.
 */
export const INITIAL_FX_RATES: FxRateRecord[] = [
  {
    id: "fx_usd_xof",
    pair: "USD/XOF",
    baseCurrency: "USD",
    quoteCurrency: "XOF",
    rate: 612.5,
    source: "AUTO",
    effectiveTimestamp: "2026-11-25T00:00:00Z",
    lastAutoRate: 612.5,
    lastAutoTimestamp: "2026-11-25T00:00:00Z",
    version: 1,
    updatedAt: "2026-11-25T00:00:00Z",
  },
  {
    id: "fx_eur_xof",
    pair: "EUR/XOF",
    baseCurrency: "EUR",
    quoteCurrency: "XOF",
    rate: 655.957,
    source: "AUTO",
    effectiveTimestamp: "2026-11-25T00:00:00Z",
    lastAutoRate: 655.957,
    lastAutoTimestamp: "2026-11-25T00:00:00Z",
    version: 1,
    updatedAt: "2026-11-25T00:00:00Z",
  },
];

export const INITIAL_FX_AUDIT: FxRateAuditEntry[] = [
  {
    id: "fxa_001",
    pair: "USD/XOF",
    rate: 612.5,
    source: "AUTO",
    changedBy: "Market Feed (Automated Ingestion)",
    reason: "Daily official fixing published by Central Bank / Market Feed.",
    timestamp: "2026-11-25T00:00:00Z",
  },
  {
    id: "fxa_002",
    pair: "EUR/XOF",
    rate: 655.957,
    source: "AUTO",
    changedBy: "BCEAO Peg Rate",
    reason: "Canonical statutory pegged exchange rate for West African CFA Franc.",
    timestamp: "2026-11-25T00:00:00Z",
  },
];

export class FxRateRepository {
  private rates: FxRateRecord[] = [];
  private auditLog: FxRateAuditEntry[] = [];
  private historicalSnapshots: HistoricalFxSnapshot[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetDefaults();
  }

  public resetDefaults(): void {
    this.rates = JSON.parse(JSON.stringify(INITIAL_FX_RATES));
    this.auditLog = JSON.parse(JSON.stringify(INITIAL_FX_AUDIT));
    this.historicalSnapshots = JSON.parse(JSON.stringify(INITIAL_HISTORICAL_SNAPSHOTS));
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
        console.error("FxRateRepository listener error:", err);
      }
    }
  }

  private checkActor(actor: AuthorizedActor | null | undefined): AuthorizedActor {
    if (!actor || !actor.role) {
      throw new UnauthorizedFxAccessError("Authentication required: Actor context missing.");
    }
    if (actor.role === "VENDOR" || actor.role === "CONCIERGE") {
      throw new UnauthorizedFxAccessError(
        `Unauthorized: Role "${actor.role}" does not have access to FX treasury configurations.`,
      );
    }
    return actor;
  }

  public listRates(actor?: AuthorizedActor | null): FxRateRecord[] {
    this.checkActor(actor);
    return this.rates.map((r) => structuredClone(r));
  }

  public getRateByPair(pair: FxPair, actor?: AuthorizedActor | null): FxRateRecord | undefined {
    this.checkActor(actor);
    const record = this.rates.find((r) => r.pair === pair);
    return record ? structuredClone(record) : undefined;
  }

  public getAuditLog(actor?: AuthorizedActor | null): FxRateAuditEntry[] {
    this.checkActor(actor);
    return structuredClone(this.auditLog);
  }

  public setManualOverride(
    actor: AuthorizedActor | null | undefined,
    params: ManualFxOverrideParams,
  ): FxRateRecord {
    const validActor = this.checkActor(actor);

    // Strictly restricted to SUPER_ADMIN
    if (validActor.role !== "SUPER_ADMIN") {
      throw new UnauthorizedFxAccessError(
        `Role "${validActor.role}" is not authorized to set manual FX rate overrides. Super Admin authority is required.`,
      );
    }

    if (
      typeof params.rate !== "number" ||
      Number.isNaN(params.rate) ||
      !Number.isFinite(params.rate)
    ) {
      throw new FxRateValidationError("Override rate must be a valid finite number.");
    }
    if (params.rate <= 0) {
      throw new FxRateValidationError("Override rate must be strictly greater than zero.");
    }
    if (!params.reason || !params.reason.trim()) {
      throw new FxRateValidationError(
        "Operational justification reason is required for manual FX override.",
      );
    }

    const record = this.rates.find((r) => r.pair === params.pair);
    if (!record) {
      throw new FxRateValidationError(`Unsupported FX currency pair "${params.pair}".`);
    }

    const now = new Date().toISOString();
    record.rate = params.rate;
    record.source = "MANUAL";
    record.overrideRate = params.rate;
    record.overriddenBy = validActor.name || validActor.email || "Super Admin";
    record.overrideTimestamp = now;
    record.overrideReason = params.reason.trim();
    record.effectiveTimestamp = now;
    record.version += 1;
    record.updatedAt = now;

    this.auditLog.unshift({
      id: `fxa_${Date.now().toString(36)}`,
      pair: params.pair,
      rate: params.rate,
      source: "MANUAL",
      changedBy: validActor.name || validActor.email || "Super Admin",
      reason: params.reason.trim(),
      timestamp: now,
    });

    this.notify();
    return structuredClone(record);
  }

  public clearManualOverride(
    actor: AuthorizedActor | null | undefined,
    pair: FxPair,
  ): FxRateRecord {
    const validActor = this.checkActor(actor);

    if (validActor.role !== "SUPER_ADMIN") {
      throw new UnauthorizedFxAccessError(
        `Role "${validActor.role}" is not authorized to clear FX overrides. Super Admin authority is required.`,
      );
    }

    const record = this.rates.find((r) => r.pair === pair);
    if (!record) {
      throw new FxRateValidationError(`Unsupported FX currency pair "${pair}".`);
    }

    const now = new Date().toISOString();
    record.rate = record.lastAutoRate;
    record.source = "AUTO";
    record.overrideRate = undefined;
    record.overriddenBy = undefined;
    record.overrideTimestamp = undefined;
    record.overrideReason = undefined;
    record.effectiveTimestamp = now;
    record.version += 1;
    record.updatedAt = now;

    this.auditLog.unshift({
      id: `fxa_${Date.now().toString(36)}`,
      pair,
      rate: record.lastAutoRate,
      source: "AUTO",
      changedBy: validActor.name || validActor.email || "Super Admin",
      reason: "Reverted manual override back to authoritative automated market feed.",
      timestamp: now,
    });

    this.notify();
    return structuredClone(record);
  }

  /**
   * Real-time rate conversion using currently active rate records.
   * Rejects unsupported currencies with FxRateValidationError (no silent raw amount returns).
   */
  public convert(amount: number, fromCurrency: string, toCurrency: string): number {
    const from = fromCurrency.toUpperCase().trim();
    const to = toCurrency.toUpperCase().trim();
    if (from === to) return amount;

    const SUPPORTED = ["USD", "EUR", "XOF"];
    if (!SUPPORTED.includes(from) || !SUPPORTED.includes(to)) {
      throw new FxRateValidationError(
        `Unsupported FX currency conversion from "${from}" to "${to}". Supported currencies: ${SUPPORTED.join(", ")}.`,
      );
    }

    if (from === "USD" && to === "XOF") {
      const record = this.rates.find((r) => r.pair === "USD/XOF");
      if (!record) {
        throw new FxRateValidationError("Missing authoritative active FX rate for USD/XOF.");
      }
      return Math.round(amount * record.rate);
    }
    if (from === "EUR" && to === "XOF") {
      const record = this.rates.find((r) => r.pair === "EUR/XOF");
      if (!record) {
        throw new FxRateValidationError("Missing authoritative active FX rate for EUR/XOF.");
      }
      return Math.round(amount * record.rate);
    }
    if (from === "XOF" && to === "USD") {
      const record = this.rates.find((r) => r.pair === "USD/XOF");
      if (!record) {
        throw new FxRateValidationError("Missing authoritative active FX rate for USD/XOF.");
      }
      return Number((amount / record.rate).toFixed(2));
    }
    if (from === "XOF" && to === "EUR") {
      const record = this.rates.find((r) => r.pair === "EUR/XOF");
      if (!record) {
        throw new FxRateValidationError("Missing authoritative active FX rate for EUR/XOF.");
      }
      return Number((amount / record.rate).toFixed(2));
    }

    throw new FxRateValidationError(
      `Unsupported FX conversion path between "${from}" and "${to}".`,
    );
  }

  /**
   * Historical rate conversion against immutable historical exchange rate snapshots.
   */
  public convertHistorical(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    timestampIso?: string,
  ): { amount: number; rate: number; snapshotId?: string } {
    const from = fromCurrency.toUpperCase().trim();
    const to = toCurrency.toUpperCase().trim();
    if (from === to) {
      return { amount, rate: 1 };
    }

    const SUPPORTED = ["USD", "EUR", "XOF"];
    if (!SUPPORTED.includes(from) || !SUPPORTED.includes(to)) {
      throw new FxRateValidationError(
        `Unsupported FX currency conversion from "${from}" to "${to}". Supported currencies: ${SUPPORTED.join(", ")}.`,
      );
    }

    const tMs = timestampIso ? Date.parse(timestampIso) : Date.now();
    const pair = (from === "XOF" ? `${to}/XOF` : `${from}/XOF`) as FxPair;

    const snapshot = this.historicalSnapshots.find((s) => {
      if (s.pair !== pair) return false;
      const fromMs = Date.parse(s.validFrom);
      const toMs = Date.parse(s.validTo);
      return tMs >= fromMs && tMs <= toMs;
    });

    if (!snapshot) {
      throw new FxRateValidationError(
        `No authoritative historical FX snapshot found for pair "${pair}" at timestamp "${timestampIso || "now"}".`,
      );
    }

    if (from === "USD" && to === "XOF") {
      return {
        amount: Math.round(amount * snapshot.rate),
        rate: snapshot.rate,
        snapshotId: snapshot.snapshotId,
      };
    }
    if (from === "EUR" && to === "XOF") {
      return {
        amount: Math.round(amount * snapshot.rate),
        rate: snapshot.rate,
        snapshotId: snapshot.snapshotId,
      };
    }
    if (from === "XOF" && to === "USD") {
      return {
        amount: Number((amount / snapshot.rate).toFixed(2)),
        rate: snapshot.rate,
        snapshotId: snapshot.snapshotId,
      };
    }
    if (from === "XOF" && to === "EUR") {
      return {
        amount: Number((amount / snapshot.rate).toFixed(2)),
        rate: snapshot.rate,
        snapshotId: snapshot.snapshotId,
      };
    }

    throw new FxRateValidationError(
      `Unsupported conversion path "${from}" -> "${to}" at timestamp "${timestampIso}".`,
    );
  }
}

export const fxRateRepository = new FxRateRepository();
