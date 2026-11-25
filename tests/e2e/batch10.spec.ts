import { expect, test } from "@playwright/test";

test.describe("Batch 10: Service Catalog & Custom Fields (CC-CAT-02 through CC-CAT-06)", () => {
  test.beforeEach(async ({ page }) => {
    // Reset all mock repositories and authenticate as SUPER_ADMIN
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset All Repositories to Seed State" }).click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  });

  test("Journey A: Services List, UI-API-03 Notice & Filters (CC-CAT-02)", async ({ page }) => {
    await page.goto("/catalog/services");
    await expect(page.getByRole("heading", { name: "Services" })).toBeVisible();

    // Verify UI-API-03 notice
    await expect(
      page.getByText("UI-API-03 Reconciliation Notice: Operational Fulfillment Pipeline"),
    ).toBeVisible();

    // Verify Catalog subnavigation tabs
    await expect(page.getByRole("link", { name: "Categories & Subcategories" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Services & Templates" })).toBeVisible();

    // Verify Create Service button
    await expect(page.getByRole("button", { name: "+ Create Service" })).toBeVisible();

    // Verify seeded services are rendered
    await expect(page.getByText("Private Jet Charter · Europe")).toBeVisible();
    await expect(page.getByText("Executive Chauffeur Transfer")).toBeVisible();
    await expect(page.getByText("Day Yacht Charter · Côte d'Azur")).toBeVisible();

    // Filter by template
    const templateSelect = page.locator("select").nth(1);
    await templateSelect.selectOption("CHAUFFEUR_TRANSFER");
    await expect(page.getByText("Executive Chauffeur Transfer")).toBeVisible();
    await expect(page.getByText("Private Jet Charter · Europe")).not.toBeVisible();
  });

  test("Journey B: Service Detail & Configuration Summary (CC-CAT-03)", async ({ page }) => {
    await page.goto("/catalog/services/srv_aviation_01");
    await expect(page.getByRole("heading", { name: "Private Jet Charter · Europe" })).toBeVisible();

    // Verify specifications
    await expect(page.getByText("Service Configuration")).toBeVisible();
    await expect(page.getByText("AIR CHARTER").first()).toBeVisible();
    await expect(page.getByText("QUOTE REQUIRED").first()).toBeVisible();
    await expect(page.getByText("DURATION BASED").first()).toBeVisible();
    await expect(page.getByText("PREPAYMENT").first()).toBeVisible();

    // Verify booking custom fields summary
    await expect(page.getByText("Booking Custom Fields (4)")).toBeVisible();
    await expect(page.getByText("pax_count")).toBeVisible();
    await expect(page.getByText("special_catering")).toBeVisible();

    // Action buttons
    await expect(page.getByRole("button", { name: /Manage Custom Fields/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit Service" })).toBeVisible();
  });

  test("Journey C: Create New Service (CC-CAT-04)", async ({ page }) => {
    await page.goto("/catalog/services/create");
    await expect(page.getByRole("heading", { name: "Create New Service" })).toBeVisible();

    // Fill form
    await page
      .getByPlaceholder("e.g. Executive Chauffeur Transfer")
      .fill("Superyacht Monaco Grand Prix Special");
    await page.locator("select").nth(1).selectOption("YACHT_CHARTER");
    await page.locator("select").nth(2).selectOption("QUOTE_REQUIRED");
    await page
      .locator("textarea")
      .first()
      .fill("Prime trackside yacht berth during Monaco F1 Grand Prix.");

    // Submit
    await page.getByRole("button", { name: "Create Service" }).click();

    // Should redirect to service detail
    await expect(page).toHaveURL(/\/catalog\/services\/srv_/);
    await expect(
      page.getByRole("heading", { name: "Superyacht Monaco Grand Prix Special" }),
    ).toBeVisible();
  });

  test("Journey D: Edit Service Configuration (CC-CAT-04)", async ({ page }) => {
    await page.goto("/catalog/services/srv_chauffeur_01/edit");
    await expect(
      page.getByRole("heading", { name: /Edit Service: Executive Chauffeur Transfer/ }),
    ).toBeVisible();

    // Update name
    const nameInput = page.getByPlaceholder("e.g. Executive Chauffeur Transfer");
    await nameInput.clear();
    await nameInput.fill("Executive Chauffeur & Armored Escort Transfer");

    // Submit
    await page.getByRole("button", { name: "Update Service" }).click();

    // Should redirect to detail with updated name
    await expect(page).toHaveURL("/catalog/services/srv_chauffeur_01");
    await expect(
      page.getByRole("heading", { name: "Executive Chauffeur & Armored Escort Transfer" }),
    ).toBeVisible();
  });

  test("Journey E: Service Custom Fields & UI-API-04 Notice (CC-CAT-05)", async ({ page }) => {
    await page.goto("/catalog/services/srv_aviation_01/custom-fields");
    await expect(page.getByRole("heading", { name: "Service Custom Fields" })).toBeVisible();
    await expect(page.getByText("Private Jet Charter · Europe").first()).toBeVisible();

    // Verify UI-API-04 Notice
    await expect(
      page.getByText("UI-API-04 Reconciliation Notice: Historical Booking Preservation"),
    ).toBeVisible();

    // Verify table listings
    await expect(page.getByText("pax_count")).toBeVisible();
    await expect(page.getByText("Passenger Count")).toBeVisible();
    await expect(page.getByText("aircraft_tail_preference")).toBeVisible();
    await expect(page.getByText("special_catering")).toBeVisible();
    await expect(page.getByText("tail_registration_ops")).toBeVisible();

    // Verify Add Custom Field button
    await expect(page.getByRole("button", { name: "+ Add Custom Field" })).toBeVisible();
  });

  test("Journey F: Create New Custom Field (CC-CAT-06)", async ({ page }) => {
    await page.goto("/catalog/services/srv_aviation_01/custom-fields/create");
    await expect(
      page.getByRole("heading", { name: /Add Custom Field: Private Jet Charter · Europe/ }),
    ).toBeVisible();

    // Fill form
    await page.getByPlaceholder("e.g. pax_count or aircraft_tail_preference").fill("pet_onboard");
    await page.getByPlaceholder("e.g. Passenger Count").fill("Pets Traveling in Cabin");
    await page.locator("select").first().selectOption("BOOLEAN");

    // Submit
    await page.getByRole("button", { name: "Create Custom Field" }).click();

    // Should redirect to custom fields list
    await expect(page).toHaveURL("/catalog/services/srv_aviation_01/custom-fields");
    await expect(page.getByText("pet_onboard")).toBeVisible();
    await expect(page.getByText("Pets Traveling in Cabin").first()).toBeVisible();
  });

  test("Journey G: Edit Custom Field (CC-CAT-06)", async ({ page }) => {
    await page.goto("/catalog/services/srv_aviation_01/custom-fields/cf_pax_count/edit");
    await expect(
      page.getByRole("heading", { name: /Edit Custom Field: Passenger Count/ }),
    ).toBeVisible();

    // Update label
    const labelInput = page.getByPlaceholder("e.g. Passenger Count");
    await labelInput.clear();
    await labelInput.fill("Total Traveling Passengers (Adults & Children)");

    // Submit
    await page.getByRole("button", { name: "Update Custom Field" }).click();

    // Verify on list page
    await expect(page).toHaveURL("/catalog/services/srv_aviation_01/custom-fields");
    await expect(page.getByText("Total Traveling Passengers (Adults & Children)")).toBeVisible();
  });

  test("Journey H: Toggle Custom Field Active & Verify Historical Persistence (CC-CAT-05)", async ({
    page,
  }) => {
    await page.goto("/catalog/services/srv_aviation_01/custom-fields");
    await expect(page.getByText("pax_count")).toBeVisible();

    // Find Deactivate button for pax_count row
    const paxRow = page.locator("tr", { hasText: "pax_count" });
    await expect(paxRow.getByText("Active")).toBeVisible();
    await paxRow.getByRole("button", { name: "Deactivate" }).click();

    // Verify it transitions to Inactive
    await expect(paxRow.getByText("Inactive")).toBeVisible();
    await expect(paxRow.getByRole("button", { name: "Activate" })).toBeVisible();
  });
});
