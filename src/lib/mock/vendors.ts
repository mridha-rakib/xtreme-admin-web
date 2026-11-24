import type {
  CreateVendorParams,
  UpdateVendorParams,
  VendorOrganization,
  VendorOrganizationStatus,
} from "@/types/vendor";

export class VendorValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VendorValidationError";
  }
}

export class UnauthorizedVendorAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedVendorAccessError";
  }
}

export const INITIAL_VENDORS: VendorOrganization[] = [
  {
    id: "vnd_aerojet_99",
    displayName: "AeroJet Aviation Partners",
    legalName: "AeroJet Aviation Worldwide Inc.",
    status: "ACTIVE",
    contactEmail: "ops@aerojet-partners.internal",
    contactPhone: "+12125550190",
    createdAt: "2026-01-15T08:00:00Z",
    updatedAt: "2026-11-20T14:30:00Z",
  },
  {
    id: "vnd_azure_01",
    displayName: "Côte d'Azur Marine",
    legalName: "Riviera Maritime Holdings SAS",
    status: "MAINTENANCE",
    contactEmail: "charters@cotedazur-marine.internal",
    contactPhone: "+33493550199",
    createdAt: "2026-02-10T09:00:00Z",
    updatedAt: "2026-11-22T10:15:00Z",
  },
  {
    id: "vnd_alps_02",
    displayName: "St. Moritz Alpine Heli",
    legalName: "Alpenflug Transport AG",
    status: "INACTIVE",
    contactEmail: "dispatch@alpenflug.internal",
    contactPhone: "+41818300120",
    createdAt: "2026-03-01T11:00:00Z",
    updatedAt: "2026-11-18T16:45:00Z",
  },
  {
    id: "vnd_004",
    displayName: "Chamonix High Alpine Guides",
    legalName: "Compagnie des Guides de Chamonix SARL",
    status: "ACTIVE",
    contactEmail: "guides@chamonix-alpine.internal",
    contactPhone: "+33450530088",
    createdAt: "2026-04-12T07:30:00Z",
    updatedAt: "2026-11-23T11:00:00Z",
  },
  {
    id: "vnd_005",
    displayName: "Monaco Chauffeur Prestige",
    legalName: "Monaco Prestige Transport SAM",
    status: "MAINTENANCE",
    contactEmail: "fleet@monaco-prestige.internal",
    contactPhone: "+37793150000",
    createdAt: "2026-05-18T13:20:00Z",
    updatedAt: "2026-11-21T09:40:00Z",
  },
  {
    id: "vnd_006",
    displayName: "Santorini Island Catamarans",
    legalName: "Aegean Nautical Ventures Ltd",
    status: "INACTIVE",
    contactEmail: "yachts@santorini-catamarans.internal",
    contactPhone: "+302286012345",
    createdAt: "2026-06-05T15:00:00Z",
    updatedAt: "2026-11-19T17:10:00Z",
  },
  {
    id: "vnd_007",
    displayName: "Amalfi Coast Helicopter Shuttle",
    legalName: "Costiera Elicotteri SpA",
    status: "ACTIVE",
    contactEmail: "flights@amalfi-heli.internal",
    contactPhone: "+390818780000",
    createdAt: "2026-07-22T08:15:00Z",
    updatedAt: "2026-11-24T08:00:00Z",
  },
];

export class VendorRepository {
  private vendors: VendorOrganization[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.vendors = JSON.parse(JSON.stringify(INITIAL_VENDORS));
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

  public listVendors(filter?: {
    status?: VendorOrganizationStatus | "ALL";
    search?: string;
  }): VendorOrganization[] {
    return this.vendors.filter((v) => {
      const matchSearch =
        !filter?.search ||
        v.displayName.toLowerCase().includes(filter.search.toLowerCase()) ||
        v.legalName?.toLowerCase().includes(filter.search.toLowerCase()) ||
        v.contactEmail?.toLowerCase().includes(filter.search.toLowerCase()) ||
        v.contactPhone?.includes(filter.search);

      const matchStatus = !filter?.status || filter.status === "ALL" || v.status === filter.status;

      return matchSearch && matchStatus;
    });
  }

  public getVendorById(id: string): VendorOrganization | undefined {
    return this.vendors.find((v) => v.id.toLowerCase() === id.toLowerCase() || v.id === id);
  }

  public getAuthenticatedVendor(vendorId?: string): VendorOrganization | undefined {
    if (!vendorId) return undefined;
    return this.getVendorById(vendorId);
  }

  private validateFields(
    displayName: string,
    legalName?: string,
    contactEmail?: string,
    contactPhone?: string,
    status?: string,
  ): void {
    if (!displayName || !displayName.trim()) {
      throw new VendorValidationError("Display name is required.");
    }
    if (displayName.trim().length > 180) {
      throw new VendorValidationError("Display name cannot exceed 180 characters.");
    }
    if (legalName && legalName.trim().length > 220) {
      throw new VendorValidationError("Legal name cannot exceed 220 characters.");
    }
    if (contactEmail?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail.trim())) {
        throw new VendorValidationError("Invalid contact email format.");
      }
    }
    if (contactPhone?.trim()) {
      const cleanPhone = contactPhone.trim();
      const phoneRegex = /^\+[1-9]\d{6,14}$/;
      if (!phoneRegex.test(cleanPhone)) {
        throw new VendorValidationError(
          "Invalid contact phone format. Must be a valid E.164 phone number (e.g. +12125550190).",
        );
      }
    }
    if (status && !["ACTIVE", "MAINTENANCE", "INACTIVE"].includes(status)) {
      throw new VendorValidationError(`Invalid vendor organization status: ${status}`);
    }
  }

  public createVendor(params: CreateVendorParams): VendorOrganization {
    this.validateFields(
      params.displayName,
      params.legalName,
      params.contactEmail,
      params.contactPhone,
      params.status,
    );

    const now = new Date().toISOString();
    const seq = (this.vendors.length + 1).toString().padStart(3, "0");
    const id = `vnd_${Date.now().toString(36)}_${seq}`;

    const newVendor: VendorOrganization = {
      id,
      displayName: params.displayName.trim(),
      legalName: params.legalName?.trim() || undefined,
      status: params.status || "ACTIVE",
      contactEmail: params.contactEmail?.trim() || undefined,
      contactPhone: params.contactPhone?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.vendors.push(newVendor);
    this.notify();
    return newVendor;
  }

  public updateVendor(id: string, params: UpdateVendorParams): VendorOrganization {
    const existing = this.getVendorById(id);
    if (!existing) {
      throw new VendorValidationError(`Vendor organization not found: ${id}`);
    }

    const displayName =
      params.displayName !== undefined ? params.displayName : existing.displayName;
    const legalName = params.legalName !== undefined ? params.legalName : existing.legalName;
    const contactEmail =
      params.contactEmail !== undefined ? params.contactEmail : existing.contactEmail;
    const contactPhone =
      params.contactPhone !== undefined ? params.contactPhone : existing.contactPhone;
    const status = params.status !== undefined ? params.status : existing.status;

    this.validateFields(displayName, legalName, contactEmail, contactPhone, status);

    existing.displayName = displayName.trim();
    existing.legalName = legalName?.trim() || undefined;
    existing.contactEmail = contactEmail?.trim() || undefined;
    existing.contactPhone = contactPhone?.trim() || undefined;
    existing.status = status;
    existing.updatedAt = new Date().toISOString();

    this.notify();
    return existing;
  }

  public resetDefaults(): void {
    this.vendors = JSON.parse(JSON.stringify(INITIAL_VENDORS));
    this.notify();
  }
}

export const vendorRepository = new VendorRepository();
