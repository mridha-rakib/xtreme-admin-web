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
  | "CHAUFFEUR"
  | "OPS"
  | "MANAGER"
  | "SECURITY"
  | "COORDINATOR"
  | "CAPTAIN"
  | string;

export interface VendorStaff {
  id: string;
  vendorId: string;
  name: string;
  email: string;
  staffType: VendorStaffType;
  employeeCode: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorStaffParams {
  vendorId: string;
  name: string;
  email: string;
  staffType: VendorStaffType;
  employeeCode: string;
  active?: boolean;
}

export interface UpdateVendorStaffParams {
  name?: string;
  email?: string;
  staffType?: VendorStaffType;
  employeeCode?: string;
  active?: boolean;
}
