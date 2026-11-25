import type {
  Asset,
  AssetOwnerType,
  AssetStatus,
  CreateAssetParams,
  UpdateAssetParams,
} from "@/types/asset";

export class AssetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetValidationError";
  }
}

export const INITIAL_ASSETS: Asset[] = [
  {
    id: "ast_001",
    name: "Cessna Citation Latitude",
    code: "AST-AJ-01",
    category: "Light Jet",
    destination: "Nice / Cannes / Monaco",
    capacity: 8,
    status: "ACTIVE",
    ownerType: "VENDOR",
    vendorId: "vnd_aerojet_99",
    vendorName: "AeroJet Aviation Partners",
    description:
      "Configured for executive regional European hops with high cruise speed and spacious cabin.",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-11-20T10:00:00Z",
  },
  {
    id: "ast_002",
    name: "Gulfstream G650ER",
    code: "AST-AJ-02",
    category: "Heavy Jet",
    destination: "Geneva / Alps",
    capacity: 14,
    status: "MAINTENANCE",
    ownerType: "VENDOR",
    vendorId: "vnd_aerojet_99",
    vendorName: "AeroJet Aviation Partners",
    description:
      "Scheduled 100-hour engine inspection. Blocks new flight allocations; existing commitments preserved.",
    createdAt: "2026-02-14T09:30:00Z",
    updatedAt: "2026-11-22T14:00:00Z",
  },
  {
    id: "ast_003",
    name: "Sunseeker Predator 74",
    code: "AST-CY-01",
    category: "Superyacht",
    destination: "Saint-Tropez / Monaco",
    capacity: 12,
    status: "ACTIVE",
    ownerType: "VENDOR",
    vendorId: "vnd_azure_01",
    vendorName: "Côte d'Azur Marine",
    description: "High performance motor yacht with professional 3-person crew and tender.",
    createdAt: "2026-03-01T11:00:00Z",
    updatedAt: "2026-11-18T16:30:00Z",
  },
  {
    id: "ast_004",
    name: "Riva 66 Ribelle",
    code: "AST-CY-02",
    category: "Motor Yacht",
    destination: "Cannes / Antibes",
    capacity: 8,
    status: "INACTIVE",
    ownerType: "VENDOR",
    vendorId: "vnd_azure_01",
    vendorName: "Côte d'Azur Marine",
    description:
      "Winter drydock decommissioning. New bookings barred; legacy bookings flagged for Operations review.",
    createdAt: "2026-04-12T10:00:00Z",
    updatedAt: "2026-11-15T09:00:00Z",
  },
  {
    id: "ast_005",
    name: "Mercedes-Maybach S680",
    code: "AST-XT-01",
    category: "Luxury Sedan",
    destination: "Paris Metropolitan",
    capacity: 4,
    status: "ACTIVE",
    ownerType: "XTREME",
    vendorName: "XTREME Fleet",
    description:
      "Flagship executive chauffeur vehicle featuring rear executive seating and whisper acoustic glass.",
    createdAt: "2026-01-05T07:00:00Z",
    updatedAt: "2026-11-24T08:00:00Z",
  },
  {
    id: "ast_006",
    name: "Eurocopter EC130 T2",
    code: "AST-XT-02",
    category: "Helicopter",
    destination: "Monaco / Nice Heliport",
    capacity: 6,
    status: "ACTIVE",
    ownerType: "XTREME",
    vendorName: "XTREME Fleet",
    description:
      "Point-to-point transfers connecting Nice Côte d'Azur Airport (NCE) with Monaco Heliport.",
    createdAt: "2026-05-18T13:45:00Z",
    updatedAt: "2026-11-23T11:20:00Z",
  },
  {
    id: "ast_007",
    name: "Rolls-Royce Phantom VIII",
    code: "AST-XT-03",
    category: "Ultra Luxury Sedan",
    destination: "London / Mayfair",
    capacity: 4,
    status: "MAINTENANCE",
    ownerType: "XTREME",
    vendorName: "XTREME Fleet",
    description:
      "Periodic suspension alignment. Existing bookings maintained; unavailable for new dispatch.",
    createdAt: "2026-06-01T15:00:00Z",
    updatedAt: "2026-11-21T17:10:00Z",
  },
];

export interface AssetFilterOptions {
  vendorId?: string;
  ownerType?: AssetOwnerType;
  status?: AssetStatus | "ALL";
  search?: string;
}

export class AssetRepository {
  private assets: Asset[];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.assets = JSON.parse(JSON.stringify(INITIAL_ASSETS));
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

  public listAssets(filters?: AssetFilterOptions): Asset[] {
    return this.assets.filter((a) => {
      // Vendor isolation: When vendorId filter is provided, strictly limit to that vendor
      if (filters?.vendorId && a.vendorId !== filters.vendorId) {
        return false;
      }

      if (filters?.ownerType && a.ownerType !== filters.ownerType) {
        return false;
      }

      if (filters?.status && filters.status !== "ALL" && a.status !== filters.status) {
        return false;
      }

      if (filters?.search?.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchName = a.name.toLowerCase().includes(query);
        const matchCode = a.code.toLowerCase().includes(query);
        const matchCategory = a.category.toLowerCase().includes(query);
        const matchDest = a.destination.toLowerCase().includes(query);
        const matchOwner = (a.vendorName || a.ownerType).toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchCategory && !matchDest && !matchOwner) {
          return false;
        }
      }

      return true;
    });
  }

  public getAssetById(id: string): Asset | undefined {
    return this.assets.find(
      (a) =>
        a.id.toLowerCase() === id.toLowerCase() ||
        a.id === id ||
        a.code.toLowerCase() === id.toLowerCase(),
    );
  }

  public createAsset(params: CreateAssetParams): Asset {
    if (!params.name || !params.name.trim()) {
      throw new AssetValidationError("Asset display name is required.");
    }
    if (!params.code || !params.code.trim()) {
      throw new AssetValidationError("Asset code is required.");
    }
    if (
      params.capacity === undefined ||
      params.capacity <= 0 ||
      Number.isNaN(Number(params.capacity))
    ) {
      throw new AssetValidationError("Configured capacity must be a positive number.");
    }

    // Check duplicate code
    const duplicate = this.assets.find(
      (a) => a.code.trim().toLowerCase() === params.code.trim().toLowerCase(),
    );
    if (duplicate) {
      throw new AssetValidationError(`Asset with code "${params.code}" already exists.`);
    }

    const now = new Date().toISOString();
    const id = `ast_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const newAsset: Asset = {
      id,
      name: params.name.trim(),
      code: params.code.trim().toUpperCase(),
      category: params.category?.trim() || "General Asset",
      destination: params.destination?.trim() || "Global / Multiple",
      capacity: Number(params.capacity),
      status: params.status || "ACTIVE",
      ownerType: params.ownerType,
      vendorId: params.ownerType === "VENDOR" ? params.vendorId : undefined,
      vendorName:
        params.ownerType === "VENDOR"
          ? params.vendorName ||
            (params.vendorId === "vnd_aerojet_99"
              ? "AeroJet Aviation Partners"
              : "Vendor Organization")
          : "XTREME Fleet",
      description: params.description?.trim() || "",
      createdAt: now,
      updatedAt: now,
    };

    this.assets.unshift(newAsset);
    this.notify();
    return newAsset;
  }

  public updateAsset(
    id: string,
    params: UpdateAssetParams,
  ): { asset: Asset; operationalNotice?: string } {
    const existing = this.getAssetById(id);
    if (!existing) {
      throw new AssetValidationError(`Asset with ID "${id}" was not found.`);
    }

    if (params.name !== undefined) {
      if (!params.name.trim()) {
        throw new AssetValidationError("Asset display name cannot be empty.");
      }
      existing.name = params.name.trim();
    }

    if (params.code !== undefined) {
      if (!params.code.trim()) {
        throw new AssetValidationError("Asset code cannot be empty.");
      }
      const duplicate = this.assets.find(
        (a) => a.id !== existing.id && a.code.toLowerCase() === params.code?.trim().toLowerCase(),
      );
      if (duplicate) {
        throw new AssetValidationError(`Asset with code "${params.code}" is already in use.`);
      }
      existing.code = params.code.trim().toUpperCase();
    }

    if (params.capacity !== undefined) {
      if (params.capacity <= 0 || Number.isNaN(Number(params.capacity))) {
        throw new AssetValidationError("Capacity must be a positive number.");
      }
      existing.capacity = Number(params.capacity);
    }

    if (params.category !== undefined) {
      existing.category = params.category.trim();
    }

    if (params.destination !== undefined) {
      existing.destination = params.destination.trim();
    }

    if (params.description !== undefined) {
      existing.description = params.description.trim();
    }

    if (params.ownerType !== undefined) {
      existing.ownerType = params.ownerType;
      if (params.ownerType === "XTREME") {
        existing.vendorId = undefined;
        existing.vendorName = "XTREME Fleet";
      } else {
        existing.vendorId = params.vendorId || existing.vendorId;
        existing.vendorName = params.vendorName || existing.vendorName;
      }
    }

    let operationalNotice: string | undefined;
    if (params.status !== undefined && params.status !== existing.status) {
      const oldStatus = existing.status;
      existing.status = params.status;

      // Operational preservation rule:
      // Status change to MAINTENANCE/INACTIVE blocks new allocations.
      // Existing confirmed commitments remain and require explicit Operations resolution; they are never silently cancelled.
      if (params.status === "MAINTENANCE" || params.status === "INACTIVE") {
        operationalNotice =
          "Operational rule applied: Status change blocks new allocations. Existing confirmed commitments remain active and require explicit Operations resolution; they are never silently cancelled.";
      }
    }

    existing.updatedAt = new Date().toISOString();
    this.notify();
    return { asset: existing, operationalNotice };
  }

  public resetDefaults(): void {
    this.assets = JSON.parse(JSON.stringify(INITIAL_ASSETS));
    this.notify();
  }
}

export const assetRepository = new AssetRepository();
