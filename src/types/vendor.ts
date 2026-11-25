export type VendorOrganizationStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

export interface VendorOrganization {
  id: string;
  displayName: string;
  legalName?: string;
  status: VendorOrganizationStatus;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorParams {
  displayName: string;
  legalName?: string;
  status?: VendorOrganizationStatus;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateVendorParams {
  displayName?: string;
  legalName?: string;
  status?: VendorOrganizationStatus;
  contactEmail?: string;
  contactPhone?: string;
}

export type VendorStaffType =
  | "PILOT"
  | "CAPTAIN"
  | "CHAUFFEUR"
  | "OPS"
  | "MANAGER"
  | "COORDINATOR"
  | "SECURITY";

export const APPROVED_VENDOR_STAFF_TYPES: readonly VendorStaffType[] = [
  "PILOT",
  "CAPTAIN",
  "CHAUFFEUR",
  "OPS",
  "MANAGER",
  "COORDINATOR",
  "SECURITY",
] as const;

export interface OperationalIdentity {
  id: string;
  name: string;
  email: string;
  phone?: string;
  eligibleRoles: VendorStaffType[];
}

export interface VendorStaff {
  id: string;
  identityId: string;
  vendorId: string;
  name: string;
  email: string;
  phone?: string;
  staffType: VendorStaffType;
  employeeCode: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssociateVendorStaffParams {
  identityId: string;
  vendorId?: string; // Derived from actor if actor is VENDOR
  staffType: VendorStaffType;
  employeeCode: string;
  active?: boolean;
}

export interface UpdateVendorStaffParams {
  staffType?: VendorStaffType;
  employeeCode?: string;
  active?: boolean;
  phone?: string;
}
