import { MOCK_PERSONAS } from "@/lib/auth/session";
import type { CommandCenterRole } from "@/types";

export interface MockMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaType: "increase" | "decrease" | "neutral";
  contextText: string;
}

export const MOCK_FOUNDATION_METRICS: MockMetric[] = [
  {
    id: "rev",
    label: "Net Active Volume",
    value: "$4,820,500",
    delta: "+18.4%",
    deltaType: "increase",
    contextText: "vs last billing cycle",
  },
  {
    id: "bkg",
    label: "Active Expeditions",
    value: "42",
    delta: "+6",
    deltaType: "increase",
    contextText: "in flight or transit",
  },
  {
    id: "vip",
    label: "High Priority Despatch",
    value: "9",
    delta: "-2",
    deltaType: "decrease",
    contextText: "pending team review",
  },
  {
    id: "assets",
    label: "Fleet Readiness",
    value: "94.2%",
    delta: "+1.1%",
    deltaType: "increase",
    contextText: "operational status",
  },
];

export function getMockUserByRole(role: CommandCenterRole) {
  return MOCK_PERSONAS[role] ?? null;
}

export * from "./customers";
export * from "./bookings";
export * from "./payments";
export * from "./trips";
export * from "./concierge-requests";
export * from "./conversations";
export * from "./vendors";
export * from "./vendor-staff";
export * from "./assets";
export * from "./availability";
export * from "./availability-exceptions";
export * from "./availability-slots";
export * from "./allocation";
