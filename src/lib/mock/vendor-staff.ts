import type { CreateVendorStaffParams, VendorStaff } from "@/types/vendor";

export class VendorStaffValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VendorStaffValidationError";
  }
}

export const INITIAL_VENDOR_STAFF: VendorStaff[] = [
  // Staff for AeroJet Aviation Partners (vnd_aerojet_99)
  {
    id: "stf_001",
    vendorId: "vnd_aerojet_99",
    name: "Marcus Vance",
    email: "marcus.vance@aerojet.internal",
    staffType: "PILOT",
    employeeCode: "AJ-1042",
    active: true,
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-11-20T10:00:00Z",
  },
  {
    id: "stf_002",
    vendorId: "vnd_aerojet_99",
    name: "Dmitri Volkov",
    email: "dmitri.volkov@aerojet.internal",
    staffType: "OPS",
    employeeCode: "AJ-1043",
    active: false,
    createdAt: "2026-02-15T11:00:00Z",
    updatedAt: "2026-11-15T12:00:00Z",
  },
  {
    id: "stf_003",
    vendorId: "vnd_aerojet_99",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@aerojet.internal",
    staffType: "MANAGER",
    employeeCode: "AJ-1044",
    active: true,
    createdAt: "2026-03-10T08:30:00Z",
    updatedAt: "2026-11-22T14:15:00Z",
  },
  {
    id: "stf_004",
    vendorId: "vnd_aerojet_99",
    name: "Tom Alvarez",
    email: "tom.alvarez@aerojet.internal",
    staffType: "CHAUFFEUR",
    employeeCode: "AJ-1045",
    active: false,
    createdAt: "2026-04-05T10:00:00Z",
    updatedAt: "2026-10-30T16:00:00Z",
  },
  {
    id: "stf_005",
    vendorId: "vnd_aerojet_99",
    name: "Elena Rostova",
    email: "elena.rostova@aerojet.internal",
    staffType: "SECURITY",
    employeeCode: "AJ-1046",
    active: true,
    createdAt: "2026-05-01T07:45:00Z",
    updatedAt: "2026-11-23T09:00:00Z",
  },
  {
    id: "stf_006",
    vendorId: "vnd_aerojet_99",
    name: "Alexander Wright",
    email: "alex.wright@aerojet.internal",
    staffType: "PILOT",
    employeeCode: "AJ-1047",
    active: true,
    createdAt: "2026-06-12T13:10:00Z",
    updatedAt: "2026-11-24T08:30:00Z",
  },
  {
    id: "stf_007",
    vendorId: "vnd_aerojet_99",
    name: "Lucas Bennett",
    email: "lucas.bennett@aerojet.internal",
    staffType: "OPS",
    employeeCode: "AJ-1048",
    active: false,
    createdAt: "2026-07-08T14:20:00Z",
    updatedAt: "2026-11-19T11:00:00Z",
  },

  // Staff for Côte d'Azur Marine (vnd_azure_01)
  {
    id: "stf_008",
    vendorId: "vnd_azure_01",
    name: "Claire Delacroix",
    email: "claire.delacroix@cotedazur.internal",
    staffType: "OPS",
    employeeCode: "CY-2001",
    active: true,
    createdAt: "2026-02-12T09:30:00Z",
    updatedAt: "2026-11-10T11:00:00Z",
  },
  {
    id: "stf_009",
    vendorId: "vnd_azure_01",
    name: "Jean-Luc Picard",
    email: "jeanluc@cotedazur.internal",
    staffType: "PILOT",
    employeeCode: "CY-2002",
    active: false,
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-10-25T14:00:00Z",
  },
];

export class VendorStaffRepository {
  private staff: VendorStaff[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.staff = JSON.parse(JSON.stringify(INITIAL_VENDOR_STAFF));
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

  public listStaffByVendor(
    vendorId: string,
    filter?: { active?: boolean | "ALL"; search?: string },
  ): VendorStaff[] {
    if (!vendorId) return [];

    return this.staff.filter((s) => {
      if (s.vendorId.toLowerCase() !== vendorId.toLowerCase()) {
        return false;
      }

      const matchSearch =
        !filter?.search ||
        s.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        s.email.toLowerCase().includes(filter.search.toLowerCase()) ||
        s.employeeCode.toLowerCase().includes(filter.search.toLowerCase()) ||
        s.staffType.toLowerCase().includes(filter.search.toLowerCase());

      const matchActive =
        filter?.active === undefined || filter.active === "ALL" || s.active === filter.active;

      return matchSearch && matchActive;
    });
  }

  public getStaffById(id: string): VendorStaff | undefined {
    return this.staff.find((s) => s.id.toLowerCase() === id.toLowerCase() || s.id === id);
  }

  public createStaff(params: CreateVendorStaffParams): VendorStaff {
    if (!params.vendorId) {
      throw new VendorStaffValidationError("Vendor ID is required.");
    }
    if (!params.name || !params.name.trim()) {
      throw new VendorStaffValidationError("Staff name is required.");
    }
    if (!params.employeeCode || !params.employeeCode.trim()) {
      throw new VendorStaffValidationError("Employee code is required.");
    }

    const now = new Date().toISOString();
    const id = `stf_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newStaff: VendorStaff = {
      id,
      vendorId: params.vendorId,
      name: params.name.trim(),
      email:
        params.email?.trim() || `${params.name.toLowerCase().replace(/\s+/g, ".")}@vendor.internal`,
      staffType: params.staffType || "OPS",
      employeeCode: params.employeeCode.trim(),
      active: params.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    this.staff.push(newStaff);
    this.notify();
    return newStaff;
  }

  public resetDefaults(): void {
    this.staff = JSON.parse(JSON.stringify(INITIAL_VENDOR_STAFF));
    this.notify();
  }
}

export const vendorStaffRepository = new VendorStaffRepository();
