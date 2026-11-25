import { expect, test } from "@playwright/test";

test.describe("Batch 9: Finance, FX & Catalog (CC-FIN-01 through CC-CAT-01)", () => {
  test.beforeEach(async ({ page }) => {
    // Reset all mock repositories and authenticate as SUPER_ADMIN
    await page.goto("/qa");
    await page
      .getByRole("button", { name: "Reset Finance, FX & Catalog to Initial Defaults" })
      .click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  });

  test("Journey A: Vendor Payables List & Summary (CC-FIN-01)", async ({ page }) => {
    await page.goto("/finance/vendor-payables");
    await expect(page.getByRole("heading", { name: "Vendor Payables" })).toBeVisible();

    // Verify manual tracking notice
    await expect(
      page.getByText("Manual payout tracking only · Automated disbursement disabled"),
    ).toBeVisible();

    // Verify sub-navigation tabs
    await expect(page.getByRole("link", { name: "Vendor Payables" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Financial Summary" })).toBeVisible();
    await expect(page.getByRole("link", { name: "FX Rates" })).toBeVisible();

    // Verify KPI summary metrics
    await expect(page.getByText("Total Obligation Due")).toBeVisible();
    await expect(page.getByText("Disbursed to Date")).toBeVisible();
    await expect(page.getByText("Pending Disbursement")).toBeVisible();

    // Verify table items
    await expect(page.getByText("XC-261124-018").first()).toBeVisible();
    await expect(
      page.locator("table").getByText("Monaco Chauffeur Prestige").first(),
    ).toBeVisible();
  });

  test("Journey B: Vendor Payable Detail & Update Tracking (CC-FIN-02)", async ({ page }) => {
    await page.goto("/finance/vendor-payables/pay_016");
    await expect(page.getByRole("heading", { name: "Payable pay_016" })).toBeVisible();

    // Verify UI-API-02 banner
    await expect(
      page.getByText("UI-API-02 Reconciled: Payable context anchored to booking ledger"),
    ).toBeVisible();

    // Verify Booking ledger context
    await expect(page.getByText("XC-261124-016").first()).toBeVisible();
    await expect(page.getByText("Day Yacht Charter · Côte d'Azur").first()).toBeVisible();
    await expect(page.getByText("Côte d'Azur Marine").first()).toBeVisible();

    // Update form
    await page.locator("#status-select").selectOption("PROCESSING");
    await page.locator("#amount-paid-input").fill("950");
    await page.locator("#payout-ref-input").fill("WIRE-SEPA-950");
    await page.getByRole("button", { name: "Save Payout Tracking Update" }).click();

    // Verify success banner
    await expect(page.getByText("Payable pay_016 successfully updated")).toBeVisible();
  });

  test("Journey C: Financial Summary & 7 Metrics (CC-FIN-03)", async ({ page }) => {
    await page.goto("/finance/summary");
    await expect(page.getByRole("heading", { name: "Financial Summary" })).toBeVisible();

    // Verify all 7 Canonical Metrics
    await expect(page.getByText("1. Customer Revenue")).toBeVisible();
    await expect(page.getByText("2. Vendor Cost")).toBeVisible();
    await expect(page.getByText("3. XTREME Gross Margin")).toBeVisible();
    await expect(page.getByText("4. Payments Received")).toBeVisible();
    await expect(page.getByText("5. Refunds Issued")).toBeVisible();
    await expect(page.getByText("6. Outstanding Customer Balance")).toBeVisible();
    await expect(page.getByText("7. Vendor Amount Due")).toBeVisible();

    // Verify category contribution breakdown table
    await expect(page.getByText("Revenue & Margin Contribution by Service Category")).toBeVisible();
    await expect(page.getByText("Private Jet Aviation")).toBeVisible();
    await expect(page.getByText("Superyacht Charters")).toBeVisible();
  });

  test("Journey D: FX Rates & Manual Override (CC-FX-01)", async ({ page }) => {
    await page.goto("/finance/fx-rates");
    await expect(page.getByRole("heading", { name: "FX Rates & Manual Override" })).toBeVisible();

    // Verify primary currency pairs
    await expect(page.getByText("USD/XOF").first()).toBeVisible();
    await expect(page.getByText("EUR/XOF").first()).toBeVisible();

    // Verify immutability banner
    await expect(page.getByText("Immutable Historical Snapshots")).toBeVisible();

    // Open Manual Override modal for USD/XOF
    await page.getByRole("button", { name: "Manual Override" }).first().click();
    await expect(page.getByText("Manual FX Override: USD/XOF")).toBeVisible();

    // Fill override form
    await page.locator("#override-rate-field").fill("620.5");
    await page.locator("#override-reason-field").fill("Treasury liquidity hedge margin");
    await page.getByRole("button", { name: "Save Override" }).click();

    // Verify override applied
    await expect(page.getByText("Manual override saved for USD/XOF")).toBeVisible();
    await expect(page.getByText("1 USD = 620.5 XOF")).toBeVisible();

    // Clear override
    await page.getByRole("button", { name: "Clear Override (Reset to Auto)" }).click();
    await expect(page.getByText("Cleared manual override for USD/XOF")).toBeVisible();
  });

  test("Journey E: Catalog Directory & Strict Scope Boundary (CC-CAT-01)", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();

    // Verify seeded categories in table
    await expect(page.locator("table").getByText("Aviation & Air Charter").first()).toBeVisible();
    await expect(page.locator("table").getByText("Marine & Yachting").first()).toBeVisible();
    await expect(page.getByText("/aviation")).toBeVisible();

    // Click + Add Category and verify strict scope boundary notice
    await page.getByRole("button", { name: "+ Add Category" }).click();
    await expect(page.getByText("Add Category Scope Notice")).toBeVisible();
    await expect(page.getByText("Phase 4.9 Scope Confirmation")).toBeVisible();
    await page.getByRole("button", { name: "Understood" }).click();
    await expect(page.getByText("Add Category Scope Notice")).not.toBeVisible();
  });

  test("Journey F: Multi-Tenant Vendor persona security", async ({ page }) => {
    // Switch to VENDOR role
    await page.goto("/qa");
    await page.getByRole("button", { name: "VENDOR", exact: true }).click();

    // 1. Can view own payables
    await page.goto("/finance/vendor-payables");
    await expect(page.getByRole("heading", { name: "Vendor Payables" })).toBeVisible();
    await expect(page.getByText("AeroJet Aviation Partners").first()).toBeVisible();

    // 2. Cannot see Financial Summary (403 Access Restricted)
    await page.goto("/finance/summary");
    await expect(page.getByText("Access Restricted (403)")).toBeVisible();

    // 3. Cannot see FX Rates (403 Access Restricted)
    await page.goto("/finance/fx-rates");
    await expect(page.getByText("Access Restricted (403)")).toBeVisible();
  });
});
