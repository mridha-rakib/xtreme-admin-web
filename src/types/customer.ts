export type CustomerMembershipTier = "All" | "Platinum" | "Gold" | "Silver" | "VIP Black";
export type CustomerStatus = "All" | "Active" | "Inactive" | "Suspended";
export type CustomerRegion =
  | "All"
  | "New York, US"
  | "Los Angeles, US"
  | "London, UK"
  | "Paris, FR"
  | "Zurich, CH"
  | "Tokyo, JP"
  | "Dubai, UAE";

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  verificationStatus: "Verified" | "Unverified" | "Pending";
  preferredLanguage: string;
  membershipTier: "Platinum" | "Gold" | "Silver" | "VIP Black";
  location: string;
  lastBookingDate: string;
  totalBookings: number;
  status: "Active" | "Inactive" | "Suspended";
}

export interface CustomerFilterParams {
  search?: string;
  membershipTier?: CustomerMembershipTier;
  status?: CustomerStatus;
  region?: CustomerRegion;
  page?: number;
  pageSize?: number;
}

export interface PaginatedCustomersResult {
  items: Customer[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
