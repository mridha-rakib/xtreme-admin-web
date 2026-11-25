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
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetDefaults();
  }

  public resetDefaults(): void {
    this.rates = JSON.parse(JSON.stringify(INITIAL_FX_RATES));
    this.auditLog = JSON.parse(JSON.stringify(INITIAL_FX_AUDIT));
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
    if (actor.role === "VENDOR") {
      throw new UnauthorizedFxAccessError(
        "Unauthorized: Vendor partners do not have access to FX treasury configurations.",
      );
    }
    return actor;
  }

  public listRates(actor?: AuthorizedActor | null): FxRateRecord[] {
    if (actor) {
      this.checkActor(actor);
    }
    return this.rates.map((r) => structuredClone(r));
  }

  public getRateByPair(pair: FxPair, actor?: AuthorizedActor | null): FxRateRecord | undefined {
    if (actor) {
      this.checkActor(actor);
    }
    const record = this.rates.find((r) => r.pair === pair);
    return record ? structuredClone(record) : undefined;
  }

  public getAuditLog(actor?: AuthorizedActor | null): FxRateAuditEntry[] {
    if (actor) {
      this.checkActor(actor);
    }
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

  public convert(amount: number, fromCurrency: string, toCurrency: string): number {
    const from = fromCurrency.toUpperCase().trim();
    const to = toCurrency.toUpperCase().trim();
    if (from === to) return amount;

    if (from === "USD" && to === "XOF") {
      const record = this.rates.find((r) => r.pair === "USD/XOF");
      const rate = record ? record.rate : 612.5;
      return Math.round(amount * rate);
    }
    if (from === "EUR" && to === "XOF") {
      const record = this.rates.find((r) => r.pair === "EUR/XOF");
      const rate = record ? record.rate : 655.957;
      return Math.round(amount * rate);
    }
    if (from === "XOF" && to === "USD") {
      const record = this.rates.find((r) => r.pair === "USD/XOF");
      const rate = record ? record.rate : 612.5;
      return Number((amount / rate).toFixed(2));
    }
    if (from === "XOF" && to === "EUR") {
      const record = this.rates.find((r) => r.pair === "EUR/XOF");
      const rate = record ? record.rate : 655.957;
      return Number((amount / rate).toFixed(2));
    }

    return amount;
  }
}

export const fxRateRepository = new FxRateRepository();
