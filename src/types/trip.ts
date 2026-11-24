export type TripStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Trip {
  id: string;
  reference: string;
  title: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  destination: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
  datesDisplay: string;
  linkedBookingIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripParams {
  customerId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status?: TripStatus;
  notes?: string;
}

export interface UpdateTripParams {
  title?: string;
  destination?: string;
  status?: TripStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
}
