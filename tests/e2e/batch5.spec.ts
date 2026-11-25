import { expect, test } from "@playwright/test";

test.describe("Batch 5 E2E Integration: Vendor Management & Scoped Staff Workspace", () => {
  test.beforeEach(async ({ page }) => {
    // Deterministic reset to initial defaults
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Vendors & Staff to Initial Defaults" }).click();
    // Default session is Super Admin
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  });

  test("Journey A: Vendor Organization Creation (CC-VEN-01 -> CC-VEN-03 -> CC-VEN-02 -> CC-VEN-01)", async ({
    page,
  }) => {
    await page.goto("/vendors");

    await expect(page.getByRole("heading", { name: "Vendors List" })).toBeVisible();
    await expect(page.getByText("AeroJet Aviation Partners")).toBeVisible();
    await expect(page.getByText("Côte d'Azur Marine")).toBeVisible();

    // Click Create vendor
    await page.getByRole("link", { name: "Create vendor" }).click();
    await expect(page).toHaveURL("/vendors/create");
    await expect(page.getByRole("heading", { name: "Create / Edit Vendor" })).toBeVisible();

    // Fill form
    await page.getByLabel(/Display name/).fill("St. Tropez Heli Charter");
    await page.getByLabel("Legal name").fill("St. Tropez Heli Services SAS");
    await page.getByLabel("Contact email").fill("dispatch@st-tropez-heli.internal");
    await page.getByLabel("Contact phone").fill("+33494550100");
    await page.getByLabel("Status").selectOption("ACTIVE");

    // Submit
    await page.getByRole("button", { name: "Save" }).click();

    // Expect redirect to newly created Vendor Detail
    await expect(page).toHaveURL(/\/vendors\/vnd_/);
    await expect(page.getByRole("heading", { name: "Vendor Detail" })).toBeVisible();
    await expect(page.getByText("St. Tropez Heli Charter", { exact: true })).toBeVisible();
    await expect(page.getByText("St. Tropez Heli Services SAS")).toBeVisible();
    await expect(page.getByText("+33494550100")).toBeVisible();

    // Navigate back to list and verify new entry exists
    await page.getByRole("link", { name: "← Back to Vendors" }).click();
    await expect(page).toHaveURL("/vendors");
    await expect(page.getByText("St. Tropez Heli Charter", { exact: true })).toBeVisible();
  });

  test("Journey B: Vendor Organization Editing (CC-VEN-02 -> CC-VEN-03 -> CC-VEN-02)", async ({
    page,
  }) => {
    await page.goto("/vendors/vnd_aerojet_99");

    await expect(page.getByRole("heading", { name: "Vendor Detail" })).toBeVisible();
    await expect(page.getByText("AeroJet Aviation Worldwide Inc.")).toBeVisible();

    // Click Edit vendor
    await page.getByRole("link", { name: "Edit vendor" }).click();
    await expect(page).toHaveURL("/vendors/vnd_aerojet_99/edit");

    // Update Legal name and Status
    await page.getByLabel("Legal name").fill("AeroJet Aviation Global Holdings Inc.");
    await page.getByLabel("Status").selectOption("MAINTENANCE");

    await page.getByRole("button", { name: "Save" }).click();

    // Verify updated detail
    await expect(page).toHaveURL("/vendors/vnd_aerojet_99");
    await expect(page.getByText("AeroJet Aviation Global Holdings Inc.")).toBeVisible();
    await expect(page.getByText("MAINTENANCE")).toBeVisible();
  });

  test("Journey C: Vendor Self-Service Workspace (CC-VEN-04 -> CC-VEN-05)", async ({ page }) => {
    // Sign in as Vendor A (Arman K. - AeroJet)
    await page.goto("/qa");
    await page.getByRole("button", { name: "Vendor A: Arman K. (AeroJet Aviation)" }).click();

    // Navigate to My Vendor Organization
    await page.goto("/vendor/organization");
    await expect(page.getByRole("heading", { name: "My Vendor Organization" })).toBeVisible();
    await expect(page.getByText("AeroJet Aviation Partners", { exact: true })).toBeVisible();
    await expect(page.getByText("ops@aerojet-partners.internal")).toBeVisible();

    // Verify operational footnote
    await expect(
      page.getByText(
        "Authenticated Vendor organization is resolved server-side. No free vendor_id switcher is exposed.",
      ),
    ).toBeVisible();

    // Click Vendor Staff link to open own staff workspace
    await page.getByRole("link", { name: "Open ›" }).first().click();
    await expect(page).toHaveURL("/vendor/staff");
    await expect(page.getByRole("heading", { name: "Vendor Staff" })).toBeVisible();
    await expect(page.getByText("Marcus Vance")).toBeVisible();
    await expect(page.getByText("AJ-1042")).toBeVisible();
    await expect(page.getByText("Own Vendor staff associations only.")).toBeVisible();
  });

  test("Journey D: Multi-Tenant Isolation between Vendor A and Vendor B", async ({ page }) => {
    // 1. Authenticate as Vendor A (AeroJet)
    await page.goto("/qa");
    await page.getByRole("button", { name: "Vendor A: Arman K. (AeroJet Aviation)" }).click();

    // Check staff
    await page.goto("/vendor/staff");
    await expect(page.getByText("Marcus Vance")).toBeVisible();
    await expect(page.getByText("Claire Delacroix")).not.toBeVisible();

    // 2. Switch to Vendor B (Côte d'Azur Marine)
    await page.goto("/qa");
    await page
      .getByRole("button", { name: "Vendor B: Claire Delacroix (Côte d'Azur Marine)" })
      .click();

    // Check organization
    await page.goto("/vendor/organization");
    await expect(page.getByText("Côte d'Azur Marine", { exact: true })).toBeVisible();
    await expect(page.getByText("AeroJet Aviation Partners", { exact: true })).not.toBeVisible();

    // Check staff
    await page.goto("/vendor/staff");
    await expect(page.getByText("Claire Delacroix")).toBeVisible();
    await expect(page.getByText("CY-2001")).toBeVisible();
    await expect(page.getByText("Marcus Vance")).not.toBeVisible();
  });

  test("Negative Scenarios: Not Found Boundaries and Validation Errors", async ({ page }) => {
    // Non-existent vendor detail
    await page.goto("/vendors/vnd_invalid_9999");
    await expect(page.getByText("Vendor Organization Not Found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Vendors List" })).toBeVisible();

    // Non-existent vendor edit
    await page.goto("/vendors/vnd_invalid_9999/edit");
    await expect(page.getByText("Vendor Organization Not Found")).toBeVisible();

    // Form validation failure on empty display name
    await page.goto("/vendors/create");
    await page.getByLabel("Legal name").fill("Some Legal Corp");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Display name is required.")).toBeVisible();

    // Scope guard callouts on future destinations
    await page.goto("/vendors/vnd_aerojet_99");
    await page.getByRole("button", { name: "Open ›" }).first().click();
    await expect(
      page.getByText(/scheduled for a future planned phase/i),
    ).toBeVisible();
  });
});
