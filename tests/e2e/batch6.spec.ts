import { expect, test } from "@playwright/test";

test.describe("Batch 6 E2E Integration: Asset Lifecycle & Availability Rules", () => {
  test.beforeEach(async ({ page }) => {
    // Deterministic reset to initial defaults
    await page.goto("/qa");
    await page
      .getByRole("button", { name: "Reset Assets & Availability to Initial Defaults" })
      .click();
    // Default session is Super Admin
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  });

  test("Journey A: Asset Creation (CC-AST-01 -> CC-AST-03 -> CC-AST-02 -> CC-AST-01)", async ({
    page,
  }) => {
    await page.goto("/assets");

    await expect(page.getByRole("heading", { name: "Assets List" })).toBeVisible();
    await expect(page.getByText("Cessna Citation Latitude")).toBeVisible();
    await expect(page.getByText("AST-AJ-01")).toBeVisible();

    // Click Create asset
    await page.getByRole("link", { name: "Create asset" }).click();
    await expect(page).toHaveURL("/assets/create");
    await expect(page.getByRole("heading", { name: "Create / Edit Asset" })).toBeVisible();

    // Fill form
    await page.getByLabel(/Asset Display Name/).fill("Dassault Falcon 8X");
    await page.getByLabel(/Internal Asset Code/).fill("AST-AJ-99");
    await page.getByLabel(/Destination \/ Operating Area/).fill("Paris Le Bourget / Nice");
    await page.getByLabel(/Asset Type \/ Category/).fill("Ultra Long Range Jet");
    await page.getByLabel(/Capacity/).fill("14");
    await page.getByLabel(/Description \/ Notes/).fill("Flagship tri-jet business aircraft.");
    await page.getByLabel(/Status/).selectOption("ACTIVE");

    // Submit
    await page.getByRole("button", { name: "Save asset" }).click();

    // Expect redirect to newly created Asset Detail
    await expect(page).toHaveURL(/\/assets\/ast_/);
    await expect(page.getByRole("heading", { name: "Asset Detail" })).toBeVisible();
    await expect(page.getByText("Dassault Falcon 8X").first()).toBeVisible();
    await expect(page.getByText("AST-AJ-99").first()).toBeVisible();
    await expect(page.getByText("14 passengers / configured capacity")).toBeVisible();

    // Navigate back to list and verify new entry exists
    await page.getByRole("button", { name: "Back to Assets" }).click();
    await expect(page).toHaveURL("/assets");
    await expect(page.getByText("Dassault Falcon 8X").first()).toBeVisible();
    await expect(page.getByText("AST-AJ-99").first()).toBeVisible();
  });

  test("Journey B: Asset Maintenance & Booking Preservation (CC-AST-02 -> CC-AST-03 -> CC-AST-02)", async ({
    page,
  }) => {
    await page.goto("/assets/ast_001");

    await expect(page.getByRole("heading", { name: "Asset Detail" })).toBeVisible();
    await expect(page.getByText("Cessna Citation Latitude").first()).toBeVisible();

    // Click Edit asset
    await page.getByRole("link", { name: "Edit asset" }).click();
    await expect(page).toHaveURL("/assets/ast_001/edit");

    // Change status to MAINTENANCE
    await page.getByLabel(/Status/).selectOption("MAINTENANCE");
    await page.getByRole("button", { name: "Save asset" }).click();

    // Verify operational notice and redirection back to detail
    await expect(page).toHaveURL("/assets/ast_001");
    await expect(page.getByText("MAINTENANCE", { exact: true })).toBeVisible();

    // Verify operational rule card callouts
    await expect(
      page.getByText("Status change to MAINTENANCE/INACTIVE blocks new allocations."),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Existing confirmed commitments remain and require explicit Operations resolution; they are never silently cancelled.",
      ),
    ).toBeVisible();
  });

  test("Journey C: Vendor Staff Association & Edit (CC-VEN-05 -> CC-VEN-06 -> CC-VEN-05)", async ({
    page,
  }) => {
    // Authenticate as Vendor A
    await page.goto("/qa");
    await page.getByRole("button", { name: "Vendor A: Arman K. (AeroJet Aviation)" }).click();

    await page.goto("/vendor/staff");
    await expect(page.getByRole("heading", { name: "Vendor Staff" })).toBeVisible();
    await expect(page.getByText("Marcus Vance")).toBeVisible();

    // Click View on Marcus Vance
    await page
      .locator("tr", { hasText: "Marcus Vance" })
      .getByRole("link", { name: "View ›" })
      .click();
    await expect(page).toHaveURL("/vendor/staff/stf_001/edit");
    await expect(
      page.getByRole("heading", { name: "Associate / Manage Vendor Staff" }),
    ).toBeVisible();

    // Verify Scope Rule Callout
    await expect(page.getByText("Scope rule")).toBeVisible();
    await expect(
      page.getByText(
        "Associates or updates Vendor-linked operational Staff within the authenticated Vendor's own scope. This does not provision arbitrary Customer accounts.",
      ),
    ).toBeVisible();

    // Update staff role to CAPTAIN and active status to No
    await page.getByLabel(/Staff Role \/ Type/).selectOption("CAPTAIN");
    await page.getByLabel(/Active Status/).selectOption("no");

    await page.getByRole("button", { name: "Save changes" }).click();

    // Verify return to list with updated role and inactive indicator
    await expect(page).toHaveURL("/vendor/staff");
    await expect(page.getByText("CAPTAIN")).toBeVisible();
  });

  test("Journey D: Multi-Tenant Asset Isolation between Vendor A and Vendor B", async ({
    page,
  }) => {
    // 1. Authenticate as Vendor A (AeroJet Aviation)
    await page.goto("/qa");
    await page.getByRole("button", { name: "Vendor A: Arman K. (AeroJet Aviation)" }).click();

    // Navigate to assets
    await page.goto("/assets");
    await expect(page.getByRole("heading", { name: "Assets List" })).toBeVisible();

    // Must see AeroJet assets
    await expect(page.getByText("Cessna Citation Latitude")).toBeVisible();
    await expect(page.getByText("AST-AJ-01")).toBeVisible();
    await expect(page.getByText("Gulfstream G650ER")).toBeVisible();

    // Must NOT see Côte d'Azur Marine or XTREME fleet assets
    await expect(page.getByText("Sunseeker Predator 74")).not.toBeVisible();
    await expect(page.getByText("AST-CY-01")).not.toBeVisible();
    await expect(page.getByText("Mercedes-Maybach S680")).not.toBeVisible();

    // 2. Authenticate as Vendor B (Côte d'Azur Marine)
    await page.goto("/qa");
    await page
      .getByRole("button", { name: "Vendor B: Claire Delacroix (Côte d'Azur Marine)" })
      .click();

    await page.goto("/assets");
    // Must see Côte d'Azur assets
    await expect(page.getByText("Sunseeker Predator 74")).toBeVisible();
    await expect(page.getByText("AST-CY-01")).toBeVisible();

    // Must NOT see AeroJet assets
    await expect(page.getByText("Cessna Citation Latitude")).not.toBeVisible();
    await expect(page.getByText("AST-AJ-01")).not.toBeVisible();
  });

  test("Journey E: Availability Rules Overview & Rule Creation (CC-AVL-01)", async ({ page }) => {
    await page.goto("/availability");

    await expect(page.getByRole("heading", { name: "Availability Rules" })).toBeVisible();
    await expect(
      page.getByText("Configuration only. No direct active-allocation write controls are exposed."),
    ).toBeVisible();

    // Check table rows
    await expect(page.getByText("Cessna Citation Latitude (AST-AJ-01)")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mon - Fri" }).first()).toBeVisible();
    await expect(page.getByText("06:00 - 22:00")).toBeVisible();

    // Click Create rule button
    await page.getByRole("button", { name: "Create rule" }).click();

    // Verify modal appears
    await expect(page.getByRole("heading", { name: "Create Availability Rule" })).toBeVisible();

    // Fill rule form
    await page.getByLabel(/Target Asset or Category/).fill("VIP Helicopter Shuttles");
    await page.getByLabel(/Weekday/).fill("Saturday - Sunday");
    await page.getByLabel(/Time Window/).fill("10:00 - 18:00");
    await page.getByLabel(/Timezone/).fill("Europe/Paris (UTC+1)");
    await page.getByLabel(/Capacity Window/).fill("4");
    await page.getByRole("button", { name: "Save Rule" }).click();

    // Verify modal closes and new rule appears
    await expect(page.getByText("VIP Helicopter Shuttles")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Saturday - Sunday" }).first()).toBeVisible();
  });
});
