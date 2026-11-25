import {
  AssetValidationError,
  UnauthorizedAssetAccessError,
  assetRepository,
} from "@/lib/mock/assets";
import type { AuthorizedActor } from "@/types";
import { beforeEach, describe, expect, it } from "vitest";

const ADMIN_ACTOR: AuthorizedActor = {
  id: "usr_admin",
  name: "Command Center Admin",
  email: "admin@xtreme.internal",
  role: "ADMIN",
};

const VENDOR_A_ACTOR: AuthorizedActor = {
  id: "usr_vendor_a",
  name: "Arman K.",
  email: "arman@aerojet-partners.internal",
  role: "VENDOR",
  vendorId: "vnd_aerojet_99",
};

const VENDOR_B_ACTOR: AuthorizedActor = {
  id: "usr_vendor_b",
  name: "Claire Delacroix",
  email: "claire@cotedazur.internal",
  role: "VENDOR",
  vendorId: "vnd_azure_01",
};

describe("AssetRepository Scoped Multi-Tenant Authorization & Validation Tests", () => {
  beforeEach(() => {
    assetRepository.resetDefaults();
  });

  it("requires authenticated actor context for all operations", () => {
    expect(() => assetRepository.listAssets(null)).toThrow(UnauthorizedAssetAccessError);
    expect(() => assetRepository.getAssetById(null, "ast_001")).toThrow(
      UnauthorizedAssetAccessError,
    );
    expect(() =>
      assetRepository.createAsset(null, {
        name: "Unauthorized Jet",
        code: "AST-UNAUTH-01",
        category: "Jet",
        destination: "Nice / Cannes / Monaco",
        capacity: 8,
        ownerType: "XTREME",
      }),
    ).toThrow(UnauthorizedAssetAccessError);
  });

  it("lists all assets for Admin actors and scopes Vendor actors strictly to their own assets", () => {
    const adminAssets = assetRepository.listAssets(ADMIN_ACTOR);
    expect(adminAssets.length).toBe(7);

    const vendorAAssets = assetRepository.listAssets(VENDOR_A_ACTOR);
    expect(vendorAAssets.length).toBe(2);
    expect(vendorAAssets.every((a) => a.vendorId === "vnd_aerojet_99")).toBe(true);

    const vendorBAssets = assetRepository.listAssets(VENDOR_B_ACTOR);
    expect(vendorBAssets.length).toBe(2);
    expect(vendorBAssets.every((a) => a.vendorId === "vnd_azure_01")).toBe(true);
  });

  it("strictly prevents Vendor actors from viewing or mutating other vendors or XTREME assets", () => {
    // ast_003 is owned by Côte d'Azur (Vendor B)
    expect(() => assetRepository.getAssetById(VENDOR_A_ACTOR, "ast_003")).toThrow(
      UnauthorizedAssetAccessError,
    );

    // ast_005 is owned by XTREME Fleet
    expect(() => assetRepository.getAssetById(VENDOR_A_ACTOR, "ast_005")).toThrow(
      UnauthorizedAssetAccessError,
    );

    // Vendor A attempting to update Vendor B asset throws
    expect(() =>
      assetRepository.updateAsset(VENDOR_A_ACTOR, "ast_003", {
        name: "Hacked Jet",
      }),
    ).toThrow(UnauthorizedAssetAccessError);
  });

  it("validates capacity contract: strictly positive finite integers", () => {
    expect(() =>
      assetRepository.createAsset(ADMIN_ACTOR, {
        name: "Invalid Fractional Capacity Jet",
        code: "AST-FRAC-01",
        category: "Jet",
        destination: "Nice / Cannes / Monaco",
        capacity: 4.5, // Non-integer
        ownerType: "XTREME",
      }),
    ).toThrow(/positive.*integer/i);

    expect(() =>
      assetRepository.createAsset(ADMIN_ACTOR, {
        name: "Invalid Zero Capacity Jet",
        code: "AST-ZERO-01",
        category: "Jet",
        destination: "Nice / Cannes / Monaco",
        capacity: 0,
        ownerType: "XTREME",
      }),
    ).toThrow(/positive.*integer/i);

    expect(() =>
      assetRepository.createAsset(ADMIN_ACTOR, {
        name: "Invalid Negative Capacity Jet",
        code: "AST-NEG-01",
        category: "Jet",
        destination: "Nice / Cannes / Monaco",
        capacity: -5,
        ownerType: "XTREME",
      }),
    ).toThrow(/positive.*integer/i);

    expect(() =>
      assetRepository.createAsset(ADMIN_ACTOR, {
        name: "Invalid Infinite Capacity Jet",
        code: "AST-INF-01",
        category: "Jet",
        destination: "Nice / Cannes / Monaco",
        capacity: Number.POSITIVE_INFINITY,
        ownerType: "XTREME",
      }),
    ).toThrow(/positive.*integer/i);
  });

  it("validates destination against approved destinations list", () => {
    expect(() =>
      assetRepository.createAsset(ADMIN_ACTOR, {
        name: "Invalid Destination Jet",
        code: "AST-DEST-01",
        category: "Jet",
        destination: "Non-Approved Destination City",
        capacity: 8,
        ownerType: "XTREME",
      }),
    ).toThrow(/Approved destinations are/i);

    // Approved destination succeeds
    const created = assetRepository.createAsset(ADMIN_ACTOR, {
      name: "St. Moritz Helicopter",
      code: "AST-CH-99",
      category: "Helicopter",
      destination: "Zürich / St. Moritz",
      capacity: 5,
      ownerType: "XTREME",
    });
    expect(created.destination).toBe("Zürich / St. Moritz");
  });

  it("leaves original record untouched when validation fails during update", () => {
    const original = assetRepository.getAssetById(ADMIN_ACTOR, "ast_001");
    expect(original?.capacity).toBe(8);

    expect(() =>
      assetRepository.updateAsset(ADMIN_ACTOR, "ast_001", {
        capacity: 3.14, // Invalid fractional capacity
      }),
    ).toThrow(/positive.*integer/i);

    const afterFailedUpdate = assetRepository.getAssetById(ADMIN_ACTOR, "ast_001");
    expect(afterFailedUpdate?.capacity).toBe(8);
  });

  it("returns defensive snapshot copies preventing internal state mutation", () => {
    const asset = assetRepository.getAssetById(ADMIN_ACTOR, "ast_001");
    expect(asset).toBeDefined();

    if (asset) {
      asset.name = "Tampered Aircraft";
    }

    const fetchedAgain = assetRepository.getAssetById(ADMIN_ACTOR, "ast_001");
    expect(fetchedAgain?.name).toBe("Cessna Citation Latitude");
  });
});
