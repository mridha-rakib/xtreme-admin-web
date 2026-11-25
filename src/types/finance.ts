export type PayableStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "ON_HOLD";

export interface VendorPayable {
  id: string;
  bookingId: string;
  bookingReference: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  vendorId: string;
  vendorName: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: PayableStatus;
  payoutReference?: string;
  payoutMethod?: string;
  notes?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateVendorPayableParams {
  payableId: string;
  amountPaid?: number;
  status: PayableStatus;
  payoutReference?: string;
  notes?: string;
  expectedVersion?: number;
}

export interface VendorPayableFilterOptions {
  search?: string;
  status?: PayableStatus | "ALL";
  vendorId?: string;
}

export interface FinancialSummaryMetrics {
  customerRevenueXof: number;
  vendorCostXof: number;
  grossMarginXof: number;
  grossMarginPercentage: number;
  paymentsReceivedXof: number;
  refundsIssuedXof: number;
  outstandingCustomerBalanceXof: number;
  vendorAmountDueXof: number;
}

export type FinancialDateRange =
  | "THIS_MONTH"
  | "LAST_30_DAYS"
  | "THIS_QUARTER"
  | "YTD"
  | "ALL_TIME";
