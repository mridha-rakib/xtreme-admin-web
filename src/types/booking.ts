export type BookingLifecycleStatus =
  | "DRAFT"
  | "PENDING_VENDOR"
  | "PENDING_ADMIN"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type VendorDecisionStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type PaymentLifecycleStatus =
  | "PENDING"
  | "PAYMENT_DUE"
  | "AUTHORIZED"
  | "CAPTURED"
  | "REFUNDED"
  | "FAILED";

export type ChangeRequestState =
  | "NONE"
  | "PENDING_MODIFICATION"
  | "PENDING_CANCELLATION"
  | "RESOLVED"
  | "REJECTED";

export type AssignmentState = "UNASSIGNED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";

export type BookingMode = "CONCIERGE_ASSISTED" | "CUSTOMER_DIRECT";

export type ServiceCategory =
  | "aviation"
  | "chauffeur"
  | "yacht"
  | "dining"
  | "security"
  | "experiences";

export interface BookingChangeRequest {
  id: string;
  bookingId: string;
  type: "MODIFICATION" | "CANCELLATION";
  requestedChanges: string;
  vendorDecision: VendorDecisionStatus;
  vendorNotes?: string;
  status: "PENDING_ADMIN" | "RESOLVED" | "REJECTED";
  createdAt: string;
  createdDisplay: string;
  proposedSchedule?: string;
  proposedScheduleDisplay?: string;
  proposedDestination?: string;
  resolution?: {
    decision: "APPROVE" | "REJECT";
    reason: string;
    resolvedBy: string;
    resolvedAt: string;
  };
}

export interface Booking {
  id: string;
  reference: string;
  version: number;
  lifecycleStatus: BookingLifecycleStatus;
  vendorDecision: VendorDecisionStatus;
  paymentStatus: PaymentLifecycleStatus;
  changeRequestStatus: ChangeRequestState;
  assignmentStatus: AssignmentState;
  assignedStaffName?: string;
  bookingMode: BookingMode;

  // Customer context
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerLocation: string;

  // Service context
  serviceId: string;
  serviceName: string;
  serviceCategory: ServiceCategory;
  vendorServiceId: string;
  vendorServiceName: string;

  // Schedule & Trip
  tripId?: string;
  destination: string;
  schedule: string;
  scheduleDisplay: string;

  // Financials (isolated from operational confirmation)
  priceAmount: number;
  currency: string;
  paymentSummaryDisplay: string;

  // Authoritative physical asset allocation
  allocation?: AssetAllocationData;

  // Dynamic service details
  dynamicFields: Record<string, string>;
  customerNotes?: string;

  // Audit timestamps
  createdAt: string;
  updatedAt: string;
}

export interface AssetAllocationData {
  assetId: string;
  assetCode: string;
  assetName: string;
  vendorId?: string;
  allocatedStartsAt: string;
  allocatedEndsAt: string;
  requestedCapacity?: number;
  notes?: string;
}

export interface CreateBookingParams {
  customerId: string;
  serviceId: string;
  vendorServiceId: string;
  tripId?: string;
  destination: string;
  schedule: string;
  dynamicFields: Record<string, string>;
  customerNotes?: string;
  currency?: string;
}

export interface ResolveChangeRequestParams {
  bookingId: string;
  requestId: string;
  expectedVersion: number;
  decision: "APPROVE" | "REJECT";
  reason: string;
  resolvedByRole: "SUPER_ADMIN" | "ADMIN";
}

export interface CreateChangeRequestParams {
  bookingId: string;
  type: "MODIFICATION" | "CANCELLATION";
  reason: string;
  requestedChanges: string;
  proposedSchedule?: string;
  proposedDestination?: string;
  submittedByRole?: string;
}

export interface BookingFilterOptions {
  search?: string;
  status?: BookingLifecycleStatus | "All";
  serviceCategory?: ServiceCategory | "All";
  page?: number;
  pageSize?: number;
}

export interface BookingListResult {
  items: Booking[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
