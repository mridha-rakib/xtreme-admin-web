import { customerRepository } from "@/lib/mock/customers";
import { tripRepository } from "@/lib/mock/trips";
import type {
  ConciergeRequest,
  ConciergeRequestStatus,
  ConciergeRequestType,
  CreateConciergeRequestParams,
  UpdateConciergeRequestParams,
} from "@/types/concierge";

export class ConciergeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConciergeValidationError";
  }
}

export const INITIAL_CONCIERGE_REQUESTS: ConciergeRequest[] = [
  {
    id: "cr_001",
    reference: "CR-261124-01",
    customerId: "cus_001",
    customerName: "Olivia Carter",
    customerEmail: "olivia.carter@demo.com",
    tripId: "TRIP-261124-04",
    tripReference: "TRIP-261124-04",
    serviceName: "Airport Transfer · JFK",
    type: "PLAN_TRIP",
    typeDisplay: "Plan Trip",
    status: "OPEN",
    assignedStaffName: "Elena Rostova",
    details:
      "Coordinate arrival helicopter from JFK to Manhattan and arrange VIP luggage transfer.",
    conversationId: "conv_001",
    createdAt: "2026-11-23T10:00:00Z",
    updatedAt: "2026-11-24T09:15:00Z",
    updatedDisplay: "Nov 24 · 09:15",
  },
  {
    id: "cr_002",
    reference: "CR-261124-02",
    customerId: "cus_002",
    customerName: "Ethan Mitchell",
    customerEmail: "ethan.mitchell@demo.com",
    tripId: "TRIP-261124-02",
    tripReference: "TRIP-261124-02",
    serviceName: "Private Chef · Hamptons",
    type: "SERVICE_REQUEST",
    typeDisplay: "Service Request",
    status: "IN_PROGRESS",
    assignedStaffName: "Marcus Vance",
    details: "Arrange sommelier and wine pairing for 6 guests at Southampton estate.",
    conversationId: "conv_002",
    createdAt: "2026-11-22T14:00:00Z",
    updatedAt: "2026-11-24T08:30:00Z",
    updatedDisplay: "Nov 24 · 08:30",
  },
  {
    id: "cr_003",
    reference: "CR-261124-03",
    customerId: "cus_003",
    customerName: "Sophia Reed",
    customerEmail: "sophia.reed@demo.com",
    tripId: "TRIP-261124-01",
    tripReference: "TRIP-261124-01",
    serviceName: "Luxury Yacht Charter",
    type: "SPECIAL_REQUEST",
    typeDisplay: "Special Request",
    status: "COMPLETED",
    assignedStaffName: "Elena Rostova",
    details: "Reserve private salon and security escort for afternoon museum tour.",
    conversationId: "conv_003",
    createdAt: "2026-11-15T11:00:00Z",
    updatedAt: "2026-11-16T17:45:00Z",
    updatedDisplay: "Nov 16 · 17:45",
  },
];

export class ConciergeRequestRepository {
  private requests: ConciergeRequest[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.requests = JSON.parse(JSON.stringify(INITIAL_CONCIERGE_REQUESTS));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const fn of this.listeners) {
      fn();
    }
  }

  public listRequests(filter?: {
    type?: ConciergeRequestType | "ALL";
    status?: ConciergeRequestStatus | "ALL";
    search?: string;
  }): ConciergeRequest[] {
    return this.requests.filter((r) => {
      const matchSearch =
        !filter?.search ||
        r.reference.toLowerCase().includes(filter.search.toLowerCase()) ||
        r.customerName.toLowerCase().includes(filter.search.toLowerCase()) ||
        r.details.toLowerCase().includes(filter.search.toLowerCase());

      const matchType = !filter?.type || filter.type === "ALL" || r.type === filter.type;
      const matchStatus = !filter?.status || filter.status === "ALL" || r.status === filter.status;

      return matchSearch && matchType && matchStatus;
    });
  }

  public getRequestById(id: string): ConciergeRequest | undefined {
    return this.requests.find(
      (r) =>
        r.id.toLowerCase() === id.toLowerCase() || r.reference.toLowerCase() === id.toLowerCase(),
    );
  }

  public createRequest(params: CreateConciergeRequestParams): ConciergeRequest {
    if (!params.customerId) {
      throw new ConciergeValidationError("Customer selection is required.");
    }
    if (!params.type) {
      throw new ConciergeValidationError("Request type is required.");
    }
    if (!params.details || !params.details.trim()) {
      throw new ConciergeValidationError("Request details are required.");
    }

    const customer = customerRepository.getCustomerById(params.customerId);
    if (!customer) {
      throw new ConciergeValidationError(
        "Selected customer does not exist in the customer repository.",
      );
    }
    const customerName = `${customer.firstName} ${customer.lastName}`;
    const customerEmail = customer.email;

    let tripReference: string | undefined;
    if (params.tripId) {
      const trip = tripRepository.getTripById(params.tripId);
      if (!trip) {
        throw new ConciergeValidationError("Selected trip does not exist in the trip repository.");
      }
      if (trip.customerId !== params.customerId) {
        throw new ConciergeValidationError(
          "The selected trip does not belong to the selected customer.",
        );
      }
      tripReference = trip.reference || params.tripId;
    }

    const seq = (this.requests.length + 1).toString().padStart(2, "0");
    const ref = `CR-261124-${seq}`;
    const now = new Date();
    const updatedDisplay = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const typeDisplayMap: Record<ConciergeRequestType, string> = {
      PLAN_TRIP: "Plan Trip",
      SERVICE_REQUEST: "Service Request",
      SPECIAL_REQUEST: "Special Request",
    };

    const newRequest: ConciergeRequest = {
      id: ref.toLowerCase().replace("-", "_"),
      reference: ref,
      customerId: params.customerId,
      customerName,
      customerEmail,
      tripId: params.tripId,
      tripReference,
      serviceName: params.serviceName?.trim() || undefined,
      type: params.type,
      typeDisplay: typeDisplayMap[params.type] || params.type,
      status: "OPEN",
      assignedStaffName: params.assignedStaffName || "Elena Rostova",
      details: params.details.trim(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      updatedDisplay,
    };

    this.requests.unshift(newRequest);
    this.notify();
    return newRequest;
  }

  public updateRequest(id: string, params: UpdateConciergeRequestParams): ConciergeRequest {
    const request = this.getRequestById(id);
    if (!request) {
      throw new ConciergeValidationError(`Concierge request not found: ${id}`);
    }

    if (params.status) request.status = params.status;
    if (params.assignedStaffName !== undefined)
      request.assignedStaffName = params.assignedStaffName.trim();
    if (params.details !== undefined) request.details = params.details.trim();

    const now = new Date();
    request.updatedAt = now.toISOString();
    request.updatedDisplay = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    this.notify();
    return request;
  }

  public resetDefaults(): void {
    this.requests = JSON.parse(JSON.stringify(INITIAL_CONCIERGE_REQUESTS));
    this.notify();
  }
}

export const conciergeRequestRepository = new ConciergeRequestRepository();
