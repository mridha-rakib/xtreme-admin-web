import { AssetValidationError, assetRepository } from "@/lib/mock/assets";
import { beforeEach, describe, expect, it } from "vitest";

describe("AssetRepository Unit & Multi-Tenant Tests", () => {
  beforeEach(() => {
    assetRepository.resetDefaults();
  });

  it("lists all assets with initial seed data across XTREME and vendors", () => {
    const all = assetRepository.listAssets();
    expect(all.length).toBe(7);

    const xtremeAssets = all.filter((a) => a.ownerType === "XTREME");
    const vendorAssets = all.filter((a) => a.ownerType === "VENDOR");
    expect(xtremeAssets.length).toBe(3);
    expect(vendorAssets.length).toBe(4);
  });

  it("enforces strict multi-tenant isolation when filtered by vendorId", () => {
    const aerojetAssets = assetRepository.listAssets({ vendorId: "vnd_aerojet_99" });
    expect(aerojetAssets.length).toBe(2);
    expect(aerojetAssets.every((a) => a.vendorId === "vnd_aerojet_99")).toBe(true);
    expect(aerojetAssets.map((a) => a.code)).toEqual(
      expect.arrayContaining(["AST-AJ-01", "AST-AJ-02"]),
    );

    const azureAssets = assetRepository.listAssets({ vendorId: "vnd_azure_01" });
    expect(azureAssets.length).toBe(2);
    expect(azureAssets.every((a) => a.vendorId === "vnd_azure_01")).toBe(true);
    expect(azureAssets.map((a) => a.code)).toEqual(
      expect.arrayContaining(["AST-CY-01", "AST-CY-02"]),
    );

    // Cross-vendor isolation: aerojet cannot see azure or xtreme assets
    expect(aerojetAssets.map((a) => a.code)).not.toContain("AST-CY-01");
    expect(aerojetAssets.map((a) => a.code)).not.toContain("AST-XT-01");
  });

  it("filters assets by status and query", () => {
    const activeAssets = assetRepository.listAssets({ status: "ACTIVE" });
    expect(activeAssets.length).toBe(4);
    expect(activeAssets.every((a) => a.status === "ACTIVE")).toBe(true);

    const maintenanceAssets = assetRepository.listAssets({ status: "MAINTENANCE" });
    expect(maintenanceAssets.length).toBe(2);
    expect(maintenanceAssets.every((a) => a.status === "MAINTENANCE")).toBe(true);

    const searchJet = assetRepository.listAssets({ search: "Citation" });
    expect(searchJet.length).toBe(1);
    expect(searchJet[0].name).toBe("Cessna Citation Latitude");
  });

  it("validates required fields on asset creation", () => {
    expect(() =>
      assetRepository.createAsset({
        name: "",
        code: "AST-TEST-01",
        category: "Jet",
        destination: "Nice",
        capacity: 8,
        ownerType: "XTREME",
      }),
    ).toThrow(AssetValidationError);

    expect(() =>
      assetRepository.createAsset({
        name: "Test Jet",
        code: "",
        category: "Jet",
        destination: "Nice",
        capacity: 8,
        ownerType: "XTREME",
      }),
    ).toThrow(AssetValidationError);

    expect(() =>
      assetRepository.createAsset({
        name: "Test Jet",
        code: "AST-TEST-01",
        category: "Jet",
        destination: "Nice",
        capacity: 0,
        ownerType: "XTREME",
      }),
    ).toThrow(AssetValidationError);
  });

  it("rejects duplicate asset codes", () => {
    expect(() =>
      assetRepository.createAsset({
        name: "Duplicate Citation",
        code: "AST-AJ-01", // Already exists
        category: "Light Jet",
        destination: "Nice",
        capacity: 8,
        ownerType: "VENDOR",
        vendorId: "vnd_aerojet_99",
      }),
    ).toThrow(/already exists/i);
  });

  it("creates a new asset successfully", () => {
    const created = assetRepository.createAsset({
      name: "Bombardier Global 7500",
      code: "AST-AJ-03",
      category: "Ultra Long Range Jet",
      destination: "Geneva / London",
      capacity: 16,
      status: "ACTIVE",
      ownerType: "VENDOR",
      vendorId: "vnd_aerojet_99",
      vendorName: "AeroJet Aviation Partners",
      description: "Brand new flagship aircraft.",
    });

    expect(created.id).toMatch(/^ast_/);
    expect(created.name).toBe("Bombardier Global 7500");
    expect(created.code).toBe("AST-AJ-03");

    const found = assetRepository.getAssetById(created.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Bombardier Global 7500");
  });

  it("enforces operational preservation rule when updating status to MAINTENANCE or INACTIVE", () => {
    // When status changes to MAINTENANCE, returns operational notice that commitments remain active
    const result = assetRepository.updateAsset("ast_001", {
      status: "MAINTENANCE",
    });

    expect(result.asset.status).toBe("MAINTENANCE");
    expect(result.operationalNotice).toBeDefined();
    expect(result.operationalNotice).toContain("Operational rule applied");
    expect(result.operationalNotice).toContain("never silently cancelled");
  });
});
