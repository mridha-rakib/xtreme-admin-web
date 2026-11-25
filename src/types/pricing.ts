import type { ServiceCategory } from "./booking";

export type VendorRateStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface VendorRate {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorServiceId: string;
  vendorServiceName: string;
  assetId?: string;
  assetName?: string;
  version: number;
  amount: number;
  currency: string; // e.g. "USD", "EUR", "XOF", "GBP"
  validFrom: string;
  validTo: string;
  validityDisplay: string;
  status: VendorRateStatus;
  submittedBy: string;
  submittedAt: string;
  decisionReason?: string;
  decisionBy?: string;
  decisionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerPriceMode = "FIXED" | "TIERED" | "DYNAMIC_BASE" | "ESTIMATED_QUOTE";

export const APPROVED_PRICE_MODES: CustomerPriceMode[] = [
  "FIXED",
  "TIERED",
  "DYNAMIC_BASE",
  "ESTIMATED_QUOTE",
];

export interface CustomerPriceConfig {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: ServiceCategory;
  vendorServiceId?: string;
  vendorServiceName?: string;
  assetId?: string;
  assetName?: string;
  priceMode: CustomerPriceMode;
  xofAmount: number; // Authoritative integer zero-decimal currency
  validFrom: string;
  validTo: string;
  validityDisplay: string;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRateParams {
  vendorServiceId: string;
  vendorServiceName: string;
  vendorId?: string;
  vendorName?: string;
  assetId?: string;
  assetName?: string;
  amount: number;
  currency: string;
  validFrom: string;
  validTo: string;
}

export interface ApproveVendorRateParams {
  rateId: string;
  decisionReason?: string;
  expectedVersion?: number;
}

export interface RejectVendorRateParams {
  rateId: string;
  decisionReason: string;
  expectedVersion?: number;
}

export interface CreateCustomerPriceParams {
  serviceId: string;
  serviceName: string;
  serviceCategory: ServiceCategory;
  vendorServiceId?: string;
  vendorServiceName?: string;
  assetId?: string;
  assetName?: string;
  priceMode: CustomerPriceMode;
  xofAmount: number;
  validFrom: string;
  validTo: string;
  active?: boolean;
}

export interface VendorRateFilterOptions {
  search?: string;
  status?: VendorRateStatus | "ALL";
  vendorId?: string;
}

export interface CustomerPriceFilterOptions {
  search?: string;
  serviceCategory?: ServiceCategory | "ALL";
  active?: boolean | "ALL";
}
