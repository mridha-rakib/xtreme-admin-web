import {
  APPROVED_DESTINATIONS,
  type Asset,
  type AssetOwnerType,
  type AssetStatus,
  type AuthorizedActor,
  type CreateAssetParams,
  type UpdateAssetParams,
  hasCommandCenterPermission,
} from "@/types";
import { vendorRepository } from "./vendors";

export class AssetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssetValidationError";
  }
}

export class UnauthorizedAssetAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedAssetAccessError";
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

  private checkActor(actor: AuthorizedActor | null | undefined): AuthorizedActor {
    if (!actor || !actor.role) {
      throw new UnauthorizedAssetAccessError("Authentication required: Actor context missing.");
    }
    return actor;
  }

  /**
   * Internal lookup used exclusively for allocation service and integrity verification.
   */
  public getAssetByIdInternal(id: string): Asset | undefined {
    return this.assets.find(
      (a) =>
        a.id.toLowerCase() === id.toLowerCase() ||
        a.id === id ||
        a.code.toLowerCase() === id.toLowerCase(),
    );
  }

  /**
   * Lists physical assets within the actor's authorized scope.
   * Administrative personas view all assets across the global fleet.
   * Vendor personas view strictly their own vendor assets.
   */
  public listAssets(
    actor: AuthorizedActor | null | undefined,
    filters?: AssetFilterOptions,
  ): Asset[] {
    const validActor = this.checkActor(actor);

    // Vendor self-service scope
    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedAssetAccessError(
          "Vendor actor has no associated vendor organization membership.",
        );
      }
      if (
        filters?.vendorId &&
        filters.vendorId.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedAssetAccessError(
          "Unauthorized: Cross-vendor asset directory access is prohibited.",
        );
      }
      if (filters?.ownerType && filters.ownerType === "XTREME") {
        throw new UnauthorizedAssetAccessError(
          "Unauthorized: Vendor actors cannot query XTREME internal fleet assets.",
        );
      }

      return this.assets
        .filter((a) => {
          if (
            a.ownerType !== "VENDOR" ||
            a.vendorId?.toLowerCase() !== validActor.vendorId?.toLowerCase()
          ) {
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
            if (!matchName && !matchCode && !matchCategory && !matchDest) return false;
          }
          return true;
        })
        .map((a) => structuredClone(a));
    }

    // Administrative access
    if (
      hasCommandCenterPermission(validActor.role, "view:assets") ||
      hasCommandCenterPermission(validActor.role, "manage:assets")
    ) {
      return this.assets
        .filter((a) => {
          if (filters?.vendorId && a.vendorId?.toLowerCase() !== filters.vendorId.toLowerCase()) {
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
        })
        .map((a) => structuredClone(a));
    }

    throw new UnauthorizedAssetAccessError(
      `Actor role "${validActor.role}" does not have permission to view asset inventory.`,
    );
  }

  /**
   * Retrieves an asset by ID with scope enforcement.
   */
  public getAssetById(actor: AuthorizedActor | null | undefined, id: string): Asset | undefined {
    const validActor = this.checkActor(actor);

    const asset = this.getAssetByIdInternal(id);
    if (!asset) return undefined;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedAssetAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      if (
        asset.ownerType !== "VENDOR" ||
        asset.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedAssetAccessError(
          `Unauthorized: Vendor actor cannot access asset "${id}" belonging to another organization or XTREME fleet.`,
        );
      }
    } else if (
      !hasCommandCenterPermission(validActor.role, "view:assets") &&
      !hasCommandCenterPermission(validActor.role, "manage:assets")
    ) {
      throw new UnauthorizedAssetAccessError(
        `Actor role "${validActor.role}" does not have permission to access asset records.`,
      );
    }

    return structuredClone(asset);
  }

  private validateCapacity(capacity: number | unknown): number {
    if (typeof capacity !== "number" || !Number.isFinite(capacity) || !Number.isInteger(capacity)) {
      throw new AssetValidationError("Asset capacity must be a positive finite integer.");
    }
    if (capacity <= 0) {
      throw new AssetValidationError(
        "Asset capacity must be a positive integer greater than zero.",
      );
    }
    if (capacity > 500) {
      throw new AssetValidationError(
        "Asset capacity exceeds certified operational limits (maximum 500 passengers).",
      );
    }
    return capacity;
  }

  private validateDestination(destination: string): string {
    if (!destination || !destination.trim()) {
      throw new AssetValidationError("Destination / operating area is required.");
    }
    const clean = destination.trim();
    // Validate against approved destination list
    const isApproved = APPROVED_DESTINATIONS.some((d) => d.toLowerCase() === clean.toLowerCase());
    if (!isApproved) {
      throw new AssetValidationError(
        `Invalid destination: "${destination}". Approved destinations are: ${APPROVED_DESTINATIONS.join(", ")}.`,
      );
    }
    return clean;
  }

  /**
   * Creates a new physical asset with authorization, canonical vendor name resolution, and complete validation.
   */
  public createAsset(actor: AuthorizedActor | null | undefined, params: CreateAssetParams): Asset {
    const validActor = this.checkActor(actor);

    let effectiveOwnerType: AssetOwnerType;
    let effectiveVendorId: string | undefined;
    let resolvedVendorName: string;

    if (validActor.role === "VENDOR") {
      if (!validActor.vendorId) {
        throw new UnauthorizedAssetAccessError(
          "Vendor actor has no associated vendor organization.",
        );
      }
      if (params.ownerType === "XTREME") {
        throw new UnauthorizedAssetAccessError(
          "Vendor actors cannot create assets owned by the internal XTREME fleet.",
        );
      }
      effectiveOwnerType = "VENDOR";
      effectiveVendorId = validActor.vendorId;

      // Canonical lookup for vendor name
      const vendorOrg = vendorRepository.getVendorById(validActor, validActor.vendorId);
      resolvedVendorName = vendorOrg?.displayName || "Vendor Organization";
    } else if (hasCommandCenterPermission(validActor.role, "manage:assets")) {
      effectiveOwnerType = params.ownerType;
      if (effectiveOwnerType === "VENDOR") {
        if (!params.vendorId) {
          throw new AssetValidationError(
            "Target vendor organization ID is required for vendor-owned assets.",
          );
        }
        effectiveVendorId = params.vendorId;
        const vendorOrg = vendorRepository.getVendorById(validActor, params.vendorId);
        if (!vendorOrg) {
          throw new AssetValidationError(
            `Vendor organization "${params.vendorId}" does not exist in registry.`,
          );
        }
        resolvedVendorName = vendorOrg.displayName;
      } else {
        effectiveVendorId = undefined;
        resolvedVendorName = "XTREME Fleet";
      }
    } else {
      throw new UnauthorizedAssetAccessError(
        `Actor role "${validActor.role}" does not have permission to create fleet assets.`,
      );
    }

    // Validate string fields
    if (!params.name || !params.name.trim()) {
      throw new AssetValidationError("Asset display name is required.");
    }
    if (params.name.trim().length > 180) {
      throw new AssetValidationError("Asset display name cannot exceed 180 characters.");
    }
    if (!params.code || !params.code.trim()) {
      throw new AssetValidationError("Asset code is required.");
    }

    const cleanCode = params.code.trim().toUpperCase();
    const cleanDestination = this.validateDestination(params.destination);
    const validCapacity = this.validateCapacity(params.capacity);

    // Code uniqueness check across entire fleet
    const duplicate = this.assets.find((a) => a.code.toUpperCase() === cleanCode);
    if (duplicate) {
      throw new AssetValidationError(`Asset with code "${cleanCode}" already exists.`);
    }

    const status: AssetStatus = params.status || "ACTIVE";
    if (!["ACTIVE", "MAINTENANCE", "INACTIVE"].includes(status)) {
      throw new AssetValidationError(`Invalid asset status: "${params.status}".`);
    }

    const now = new Date().toISOString();
    const id = `ast_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const candidate: Asset = {
      id,
      name: params.name.trim(),
      code: cleanCode,
      category: params.category?.trim() || "General Asset",
      destination: cleanDestination,
      capacity: validCapacity,
      status,
      ownerType: effectiveOwnerType,
      vendorId: effectiveVendorId,
      vendorName: resolvedVendorName,
      description: params.description?.trim() || "",
      createdAt: now,
      updatedAt: now,
    };

    this.assets.unshift(candidate);
    this.notify();
    return structuredClone(candidate);
  }

  /**
   * Updates an existing physical asset with authorization, complete candidate validation,
   * and operational preservation rule compliance.
   */
  public updateAsset(
    actor: AuthorizedActor | null | undefined,
    id: string,
    params: UpdateAssetParams,
  ): { asset: Asset; operationalNotice?: string } {
    const validActor = this.checkActor(actor);

    const index = this.assets.findIndex(
      (a) => a.id.toLowerCase() === id.toLowerCase() || a.id === id,
    );
    if (index === -1) {
      throw new AssetValidationError(`Asset with ID "${id}" was not found.`);
    }
    const existing = this.assets[index];

    // Authorization check
    if (validActor.role === "VENDOR") {
      if (
        !validActor.vendorId ||
        existing.ownerType !== "VENDOR" ||
        existing.vendorId?.toLowerCase() !== validActor.vendorId.toLowerCase()
      ) {
        throw new UnauthorizedAssetAccessError(
          "Unauthorized: Vendor actor cannot mutate assets belonging to other organizations or XTREME fleet.",
        );
      }
      if (params.ownerType && params.ownerType !== "VENDOR") {
        throw new UnauthorizedAssetAccessError(
          "Unauthorized: Vendor actors cannot reassign asset ownership away from their vendor organization.",
        );
      }
    } else if (!hasCommandCenterPermission(validActor.role, "manage:assets")) {
      throw new UnauthorizedAssetAccessError(
        `Actor role "${validActor.role}" does not have permission to update asset records.`,
      );
    }

    // Construct and validate candidate
    let candidateName = existing.name;
    if (params.name !== undefined) {
      if (!params.name.trim()) {
        throw new AssetValidationError("Asset display name cannot be empty.");
      }
      if (params.name.trim().length > 180) {
        throw new AssetValidationError("Asset display name cannot exceed 180 characters.");
      }
      candidateName = params.name.trim();
    }

    let candidateCode = existing.code;
    if (params.code !== undefined) {
      if (!params.code.trim()) {
        throw new AssetValidationError("Asset code cannot be empty.");
      }
      const cleanCode = params.code.trim().toUpperCase();
      const duplicate = this.assets.find(
        (a) => a.id !== existing.id && a.code.toUpperCase() === cleanCode,
      );
      if (duplicate) {
        throw new AssetValidationError(`Asset code "${cleanCode}" is already in use.`);
      }
      candidateCode = cleanCode;
    }

    let candidateCapacity = existing.capacity;
    if (params.capacity !== undefined) {
      candidateCapacity = this.validateCapacity(params.capacity);
    }

    let candidateDestination = existing.destination;
    if (params.destination !== undefined) {
      candidateDestination = this.validateDestination(params.destination);
    }

    const candidateCategory =
      params.category !== undefined ? params.category.trim() : existing.category;
    const candidateDescription =
      params.description !== undefined ? params.description.trim() : existing.description;

    let candidateStatus = existing.status;
    let operationalNotice: string | undefined;

    if (params.status !== undefined) {
      if (!["ACTIVE", "MAINTENANCE", "INACTIVE"].includes(params.status)) {
        throw new AssetValidationError(`Invalid asset status: "${params.status}".`);
      }
      candidateStatus = params.status;

      if (candidateStatus !== existing.status) {
        if (candidateStatus === "MAINTENANCE" || candidateStatus === "INACTIVE") {
          operationalNotice =
            "Operational rule applied: Status change blocks new allocations. Existing confirmed commitments remain active and require explicit Operations resolution; they are never silently cancelled.";
        }
      }
    }

    // Owner type resolution
    let candidateOwnerType = existing.ownerType;
    let candidateVendorId = existing.vendorId;
    let candidateVendorName = existing.vendorName;

    if (params.ownerType !== undefined) {
      candidateOwnerType = params.ownerType;
      if (params.ownerType === "XTREME") {
        candidateVendorId = undefined;
        candidateVendorName = "XTREME Fleet";
      } else if (params.ownerType === "VENDOR") {
        candidateVendorId = params.vendorId || existing.vendorId;
        if (!candidateVendorId) {
          throw new AssetValidationError("Target vendorId is required for vendor-owned assets.");
        }
        const vendorOrg = vendorRepository.getVendorById(validActor, candidateVendorId);
        candidateVendorName =
          vendorOrg?.displayName || existing.vendorName || "Vendor Organization";
      }
    }

    // Commit only after complete validation
    const updatedRecord: Asset = {
      ...existing,
      name: candidateName,
      code: candidateCode,
      category: candidateCategory,
      destination: candidateDestination,
      capacity: candidateCapacity,
      status: candidateStatus,
      ownerType: candidateOwnerType,
      vendorId: candidateVendorId,
      vendorName: candidateVendorName,
      description: candidateDescription,
      updatedAt: new Date().toISOString(),
    };

    this.assets[index] = updatedRecord;
    this.notify();
    return {
      asset: structuredClone(updatedRecord),
      operationalNotice,
    };
  }

  public resetDefaults(): void {
    this.assets = JSON.parse(JSON.stringify(INITIAL_ASSETS));
    this.notify();
  }
}

export const assetRepository = new AssetRepository();
