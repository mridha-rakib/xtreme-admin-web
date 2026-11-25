import {
  APPROVED_VENDOR_STAFF_TYPES,
  type AssociateVendorStaffParams,
  type AuthorizedActor,
  type OperationalIdentity,
  type UpdateVendorStaffParams,
  type VendorStaff,
  type VendorStaffType,
  hasCommandCenterPermission,
} from "@/types";

export class VendorStaffValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VendorStaffValidationError";
  }
}

export class UnauthorizedStaffAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedStaffAccessError";
  }
}

/**
 * Pre-registered verified operational identities directory.
 * Independent Admin-owned operational identity fixtures.
 */
export const INITIAL_OPERATIONAL_IDENTITIES: OperationalIdentity[] = [
  {
    id: "ident_001",
    name: "Marcus Vance",
    email: "marcus.vance@aerojet.internal",
    phone: "+12125550142",
    eligibleRoles: ["PILOT", "CAPTAIN"],
  },
  {
    id: "ident_002",
    name: "Dmitri Volkov",
    email: "dmitri.volkov@aerojet.internal",
    phone: "+12125550143",
    eligibleRoles: ["OPS", "COORDINATOR"],
  },
  {
    id: "ident_003",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@aerojet.internal",
    phone: "+12125550144",
    eligibleRoles: ["MANAGER", "OPS"],
  },
  {
    id: "ident_004",
    name: "Tom Alvarez",
    email: "tom.alvarez@aerojet.internal",
    phone: "+12125550145",
    eligibleRoles: ["CHAUFFEUR"],
  },
  {
    id: "ident_005",
    name: "Elena Rostova",
    email: "elena.rostova@aerojet.internal",
    phone: "+12125550146",
    eligibleRoles: ["SECURITY", "OPS"],
  },
  {
    id: "ident_006",
    name: "Alexander Wright",
    email: "alex.wright@aerojet.internal",
    phone: "+12125550147",
    eligibleRoles: ["PILOT"],
  },
  {
    id: "ident_007",
    name: "Lucas Bennett",
    email: "lucas.bennett@aerojet.internal",
    phone: "+12125550148",
    eligibleRoles: ["OPS", "COORDINATOR"],
  },
  {
    id: "ident_008",
    name: "Claire Delacroix",
    email: "claire.delacroix@cotedazur.internal",
    phone: "+33493550201",
    eligibleRoles: ["OPS", "MANAGER"],
  },
  {
    id: "ident_009",
    name: "Jean-Luc Picard",
    email: "jeanluc@cotedazur.internal",
    phone: "+33493550202",
    eligibleRoles: ["PILOT", "CAPTAIN"],
  },
  // Unassociated eligible identities available for new onboarding
  {
    id: "ident_010",
    name: "Captain Henri Dubois",
    email: "henri.dubois@aviation-crew.internal",
    phone: "+33612345678",
    eligibleRoles: ["PILOT", "CAPTAIN"],
  },
  {
    id: "ident_011",
    name: "Guillaume Mercier",
    email: "g.mercier@riviera-ops.internal",
    phone: "+33698765432",
    eligibleRoles: ["OPS", "COORDINATOR", "MANAGER"],
  },
  {
    id: "ident_012",
    name: "Matteo Rossi",
    email: "matteo.rossi@med-maritime.internal",
    phone: "+39061234567",
    eligibleRoles: ["CAPTAIN", "CHAUFFEUR"],
  },
  {
    id: "ident_013",
    name: "Sven Lindholm",
    email: "sven.lindholm@alpine-security.internal",
    phone: "+41791234567",
    eligibleRoles: ["SECURITY", "OPS"],
  },
];

export const INITIAL_VENDOR_STAFF: VendorStaff[] = [
  // Staff for AeroJet Aviation Partners (vnd_aerojet_99)
  {
    id: "stf_001",
    identityId: "ident_001",
    vendorId: "vnd_aerojet_99",
    name: "Marcus Vance",
    email: "marcus.vance@aerojet.internal",
    phone: "+12125550142",
    staffType: "PILOT",
    employeeCode: "AJ-1042",
    active: true,
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-11-20T10:00:00Z",
  },
  {
    id: "stf_002",
    identityId: "ident_002",
    vendorId: "vnd_aerojet_99",
    name: "Dmitri Volkov",
    email: "dmitri.volkov@aerojet.internal",
    phone: "+12125550143",
    staffType: "OPS",
    employeeCode: "AJ-1043",
    active: false,
    createdAt: "2026-02-15T11:00:00Z",
    updatedAt: "2026-11-15T12:00:00Z",
  },
  {
    id: "stf_003",
    identityId: "ident_003",
    vendorId: "vnd_aerojet_99",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@aerojet.internal",
    phone: "+12125550144",
    staffType: "MANAGER",
    employeeCode: "AJ-1044",
    active: true,
    createdAt: "2026-03-10T08:30:00Z",
    updatedAt: "2026-11-22T14:15:00Z",
  },
  {
    id: "stf_004",
    identityId: "ident_004",
    vendorId: "vnd_aerojet_99",
    name: "Tom Alvarez",
    email: "tom.alvarez@aerojet.internal",
    phone: "+12125550145",
    staffType: "CHAUFFEUR",
    employeeCode: "AJ-1045",
    active: false,
    createdAt: "2026-04-05T10:00:00Z",
    updatedAt: "2026-10-30T16:00:00Z",
  },
  {
    id: "stf_005",
    identityId: "ident_005",
    vendorId: "vnd_aerojet_99",
    name: "Elena Rostova",
    email: "elena.rostova@aerojet.internal",
    phone: "+12125550146",
    staffType: "SECURITY",
    employeeCode: "AJ-1046",
    active: true,
    createdAt: "2026-05-01T07:45:00Z",
    updatedAt: "2026-11-23T09:00:00Z",
  },
  {
    id: "stf_006",
    identityId: "ident_006",
    vendorId: "vnd_aerojet_99",
    name: "Alexander Wright",
    email: "alex.wright@aerojet.internal",
    phone: "+12125550147",
    staffType: "PILOT",
    employeeCode: "AJ-1047",
    active: true,
    createdAt: "2026-06-12T13:10:00Z",
    updatedAt: "2026-11-24T08:30:00Z",
  },
  {
    id: "stf_007",
    identityId: "ident_007",
    vendorId: "vnd_aerojet_99",
    name: "Lucas Bennett",
    email: "lucas.bennett@aerojet.internal",
    phone: "+12125550148",
    staffType: "OPS",
    employeeCode: "AJ-1048",
    active: false,
    createdAt: "2026-07-08T14:20:00Z",
    updatedAt: "2026-11-19T11:00:00Z",
  },

  // Staff for Côte d'Azur Marine (vnd_azure_01)
  {
    id: "stf_008",
    identityId: "ident_008",
    vendorId: "vnd_azure_01",
    name: "Claire Delacroix",
    email: "claire.delacroix@cotedazur.internal",
    phone: "+33493550201",
    staffType: "OPS",
    employeeCode: "CY-2001",
    active: true,
    createdAt: "2026-02-12T09:30:00Z",
    updatedAt: "2026-11-10T11:00:00Z",
  },
  {
    id: "stf_009",
    identityId: "ident_009",
    vendorId: "vnd_azure_01",
    name: "Jean-Luc Picard",
    email: "jeanluc@cotedazur.internal",
    phone: "+33493550202",
    staffType: "PILOT",
    employeeCode: "CY-2002",
    active: false,
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-10-25T14:00:00Z",
  },
];

export interface StaffFilterOptions {
  vendorId?: string;
  active?: boolean | "ALL";
  search?: string;
}

export class VendorStaffRepository {
  private staff: VendorStaff[];
  private identities: OperationalIdentity[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.staff = JSON.parse(JSON.stringify(INITIAL_VENDOR_STAFF));
    this.identities = JSON.parse(JSON.stringify(INITIAL_OPERATIONAL_IDENTITIES));
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

  private checkActor(actor: AuthorizedActor | null | undefined): AuthorizedActor {
    if (!actor || !actor.role) {
      throw new UnauthorizedStaffAccessError("Authentication required: Actor context missing.");
    }
    return actor;
  }

  /**
   * Retrieves verified eligible operational identities.
   * Access is strictly restricted to Admin, Super Admin, or Vendor in scope.
   * Concierge or unauthorized roles are denied.
   */
  public listEligibleIdentities(actor: AuthorizedActor | null | undefined): OperationalIdentity[] {
    const validActor = this.checkActor(actor);
    if (
      !hasCommandCenterPermission(validActor.role, "view:vendors") &&
      !hasCommandCenterPermission(validActor.role, "manage:vendors") &&
      validActor.role !== "VENDOR"
    ) {
      throw new UnauthorizedStaffAccessError(
        `Actor role "${validActor.role}" does not have permission to view operational identities directory.`,
      );
    }
    return this.identities.map((i) => structuredClone(i));
  }

  public getIdentityById(
    actor: AuthorizedActor | null | undefined,
    id: string,
  ): OperationalIdentity | undefined {
    const validActor = this.checkActor(actor);
    if (
      !hasCommandCenterPermission(validActor.role, "view:vendors") &&
      !hasCommandCenterPermission(validActor.role, "manage:vendors") &&
      validActor.role !== "VENDOR"
    ) {
      throw new UnauthorizedStaffAccessError(
        `Actor role "${validActor.role}" does not have permission to view operational identity records.`,
      );
    }
    const found = this.identities.find(
      (i) => i.id.toLowerCase() === id.toLowerCase() || i.id === id,
    );
    return found ? structuredClone(found) : undefined;
  }

  /**
   * Lists staff scoped to actor authorization context.
   * Vendor actors can only list their own staff.
   */
  public listStaff(
    actor: AuthorizedActor | null | undefined,
    filter?: StaffFilterOptions,
  ): VendorStaff[] {
    const validActor = this.checkActor(actor);

    let effectiveVendorId: string | undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedStaffAccessError(
          "Vendor actor has no associated vendor organization membership.",
        );
      }
      if (filter?.vendorId && filter.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()) {
        throw new UnauthorizedStaffAccessError(
          "Unauthorized: Cross-vendor staff directory access is prohibited.",
        );
      }
      effectiveVendorId = validActor.vendorId;
    } else if (hasCommandCenterPermission(validActor.role, "view:vendors")) {
      effectiveVendorId = filter?.vendorId;
    } else {
      throw new UnauthorizedStaffAccessError(
        `Actor role "${validActor.role}" does not have permission to view vendor staff.`,
      );
    }

    return this.staff
      .filter((s) => {
        if (effectiveVendorId && s.vendorId.toLowerCase() !== effectiveVendorId.toLowerCase()) {
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
      })
      .map((s) => structuredClone(s));
  }

  public listStaffByVendor(
    actor: AuthorizedActor | null | undefined,
    vendorId: string,
  ): VendorStaff[] {
    return this.listStaff(actor, { vendorId });
  }

  /**
   * Retrieves a staff record by ID with actor scope enforcement.
   */
  public getStaffById(
    actor: AuthorizedActor | null | undefined,
    id: string,
  ): VendorStaff | undefined {
    const validActor = this.checkActor(actor);

    const record = this.staff.find((s) => s.id.toLowerCase() === id.toLowerCase() || s.id === id);
    if (!record) return undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedStaffAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      if (record.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()) {
        throw new UnauthorizedStaffAccessError(
          "Unauthorized: Cannot access staff record from another organization.",
        );
      }
    } else if (!hasCommandCenterPermission(validActor.role, "view:vendors")) {
      throw new UnauthorizedStaffAccessError(
        `Actor role "${validActor.role}" does not have permission to access staff records.`,
      );
    }

    return structuredClone(record);
  }

  /**
   * Associates an eligible operational identity to a vendor organization.
   */
  public associateStaff(
    actor: AuthorizedActor | null | undefined,
    params: AssociateVendorStaffParams,
  ): VendorStaff {
    const validActor = this.checkActor(actor);

    // Determine target vendorId strictly from actor context if vendor
    let targetVendorId: string;
    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedStaffAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      targetVendorId = validActor.vendorId;
    } else if (hasCommandCenterPermission(validActor.role, "manage:vendors")) {
      if (!params.vendorId) {
        throw new VendorStaffValidationError("Target vendor organization ID is required.");
      }
      targetVendorId = params.vendorId;
    } else {
      throw new UnauthorizedStaffAccessError(
        `Actor role "${validActor.role}" does not have permission to associate vendor staff.`,
      );
    }

    // Resolve operational identity
    if (!params.identityId || !params.identityId.trim()) {
      throw new VendorStaffValidationError("Operational identity ID is required.");
    }
    const identity = this.identities.find(
      (i) => i.id.toLowerCase() === params.identityId.trim().toLowerCase(),
    );
    if (!identity) {
      throw new VendorStaffValidationError(
        `Pre-registered verified operational identity "${params.identityId}" was not found in verified registry.`,
      );
    }

    // Validate staffType runtime enum
    if (!APPROVED_VENDOR_STAFF_TYPES.includes(params.staffType)) {
      throw new VendorStaffValidationError(
        `Invalid staff type "${params.staffType}". Approved roles: ${APPROVED_VENDOR_STAFF_TYPES.join(", ")}.`,
      );
    }

    // Verify identity eligibility for this operational role
    if (!identity.eligibleRoles.includes(params.staffType)) {
      throw new VendorStaffValidationError(
        `Identity "${identity.name}" is not certified or eligible for staff role "${params.staffType}". Certified roles: ${identity.eligibleRoles.join(", ")}.`,
      );
    }

    // Prevent duplicate association for the same vendor organization
    const duplicateIdentity = this.staff.find(
      (s) =>
        s.vendorId.toLowerCase() === targetVendorId.toLowerCase() &&
        s.identityId.toLowerCase() === identity.id.toLowerCase(),
    );
    if (duplicateIdentity) {
      throw new VendorStaffValidationError(
        `Operational identity "${identity.name}" is already associated with this vendor organization ("${targetVendorId}").`,
      );
    }

    // Validate employee code
    if (!params.employeeCode || !params.employeeCode.trim()) {
      throw new VendorStaffValidationError("Employee code is required.");
    }
    const cleanCode = params.employeeCode.trim().toUpperCase();
    const duplicateCode = this.staff.find(
      (s) =>
        s.vendorId.toLowerCase() === targetVendorId.toLowerCase() &&
        s.employeeCode.toUpperCase() === cleanCode,
    );
    if (duplicateCode) {
      throw new VendorStaffValidationError(
        `Employee code "${cleanCode}" is already in use for this organization.`,
      );
    }

    const now = new Date().toISOString();
    const id = `stf_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    // Build complete record with canonical identity attributes (no fabricated emails)
    const newStaff: VendorStaff = {
      id,
      identityId: identity.id,
      vendorId: targetVendorId,
      name: identity.name,
      email: identity.email,
      phone: identity.phone,
      staffType: params.staffType,
      employeeCode: cleanCode,
      active: params.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    this.staff.push(newStaff);
    this.notify();
    return structuredClone(newStaff);
  }

  /**
   * Updates an existing staff association record with ownership and domain validation.
   */
  public updateStaff(
    actor: AuthorizedActor | null | undefined,
    id: string,
    params: UpdateVendorStaffParams,
  ): VendorStaff {
    const validActor = this.checkActor(actor);

    const index = this.staff.findIndex(
      (s) => s.id.toLowerCase() === id.toLowerCase() || s.id === id,
    );
    if (index === -1) {
      throw new VendorStaffValidationError(`Vendor staff with ID "${id}" was not found.`);
    }
    const existing = this.staff[index];

    // Authorization check
    if (validActor.role === "VENDOR") {
      if (
        !validActor.vendorId ||
        existing.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedStaffAccessError(
          "Unauthorized: Vendor actor cannot mutate staff records of other organizations.",
        );
      }
    } else if (!hasCommandCenterPermission(validActor.role, "manage:vendors")) {
      throw new UnauthorizedStaffAccessError(
        `Actor role "${validActor.role}" does not have permission to update vendor staff.`,
      );
    }

    // Candidate construction
    let candidateStaffType = existing.staffType;
    if (params.staffType !== undefined) {
      if (!APPROVED_VENDOR_STAFF_TYPES.includes(params.staffType)) {
        throw new VendorStaffValidationError(`Invalid staff type: ${params.staffType}`);
      }
      const identity = this.identities.find((i) => i.id === existing.identityId);
      if (identity && !identity.eligibleRoles.includes(params.staffType)) {
        throw new VendorStaffValidationError(
          `Identity "${identity.name}" is not certified for role "${params.staffType}".`,
        );
      }
      candidateStaffType = params.staffType;
    }

    let candidateEmployeeCode = existing.employeeCode;
    if (params.employeeCode !== undefined) {
      if (!params.employeeCode.trim()) {
        throw new VendorStaffValidationError("Employee code cannot be empty.");
      }
      const cleanCode = params.employeeCode.trim().toUpperCase();
      const duplicate = this.staff.find(
        (s) =>
          s.id !== existing.id &&
          s.vendorId.toLowerCase() === existing.vendorId.toLowerCase() &&
          s.employeeCode.toUpperCase() === cleanCode,
      );
      if (duplicate) {
        throw new VendorStaffValidationError(
          `Employee code "${cleanCode}" is already in use for this organization.`,
        );
      }
      candidateEmployeeCode = cleanCode;
    }

    const candidateActive = params.active !== undefined ? Boolean(params.active) : existing.active;
    const candidatePhone =
      params.phone !== undefined ? params.phone.trim() || undefined : existing.phone;

    // Apply immutable identity references
    const updatedRecord: VendorStaff = {
      ...existing,
      staffType: candidateStaffType,
      employeeCode: candidateEmployeeCode,
      active: candidateActive,
      phone: candidatePhone,
      updatedAt: new Date().toISOString(),
    };

    this.staff[index] = updatedRecord;
    this.notify();
    return structuredClone(updatedRecord);
  }

  public resetDefaults(): void {
    this.staff = JSON.parse(JSON.stringify(INITIAL_VENDOR_STAFF));
    this.identities = JSON.parse(JSON.stringify(INITIAL_OPERATIONAL_IDENTITIES));
    this.notify();
  }
}

export const vendorStaffRepository = new VendorStaffRepository();
