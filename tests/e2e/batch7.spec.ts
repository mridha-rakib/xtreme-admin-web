import { expect, test } from "@playwright/test";

test.describe("Batch 7: Complete Availability Management (CC-AVL-02 through CC-AVL-06)", () => {
  test.beforeEach(async ({ page }) => {
    // Reset all mock repositories and authenticate as SUPER_ADMIN
    await page.goto("/qa");
    await page
      .getByRole("button", { name: "Reset Assets & Availability to Initial Defaults" })
      .click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  });

  test("Journey A: Create and view availability rule (CC-AVL-01 & CC-AVL-02)", async ({ page }) => {
    // 1. Visit /availability
    await page.goto("/availability");
    await expect(page.getByRole("heading", { name: "Availability Rules" })).toBeVisible();

    // 2. Click Create rule button
    await page.getByRole("link", { name: "Create rule" }).click();
    await expect(page).toHaveURL("/availability/rules/create");
    await expect(
      page.getByRole("heading", { name: "Create / Edit Availability Rule" }),
    ).toBeVisible();

    // Verify authoritative footnote
    await expect(
      page.getByText(
        "Target/ownership validation is authoritative; configuration cannot bypass existing reservations.",
      ),
    ).toBeVisible();

    // 3. Fill form
    await page.locator("#target-input").fill("Citation Sovereign (AST-AJ-99)");
    await page.locator("#weekday-input").selectOption("Daily");
    await page.locator("#start-time-input").fill("07:00");
    await page.locator("#end-time-input").fill("21:00");
    await page.locator("#capacity-input").fill("10");
    await page.locator("#timezone-select").selectOption("Europe/Paris");
    await page.locator("#notes-textarea").fill("High-availability summer schedule");

    // 4. Submit
    await page.getByRole("button", { name: "Save Rule" }).click();
    await expect(page).toHaveURL("/availability");

    // 5. Verify rule is listed
    await expect(page.getByText("Citation Sovereign (AST-AJ-99)")).toBeVisible();
    await expect(page.getByText("10 units")).toBeVisible();
  });

  test("Journey B: Edit existing availability rule (CC-AVL-02)", async ({ page }) => {
    await page.goto("/availability");
    await expect(page.getByText("Cessna Citation Latitude (AST-AJ-01)")).toBeVisible();

    // Click Open › for avl_001
    await page.locator('a[href="/availability/rules/avl_001/edit"]').click();
    await expect(page).toHaveURL("/availability/rules/avl_001/edit");

    // Update capacity
    await page.locator("#capacity-input").fill("15");
    await page.locator("#notes-textarea").fill("Updated winter seasonal capacity");

    await page.getByRole("button", { name: "Save Rule Changes" }).click();
    await expect(page).toHaveURL("/availability");

    await expect(page.getByText("15 units")).toBeVisible();
  });

  test("Journey C: View availability exceptions directory and filter by type (CC-AVL-03)", async ({
    page,
  }) => {
    await page.goto("/availability/exceptions");
    await expect(page.getByRole("heading", { name: "Availability Exceptions" })).toBeVisible();

    // Verify authoritative footnote
    await expect(
      page.getByText(
        "Exception types are UNAVAILABLE, AVAILABLE_OVERRIDE, CAPACITY_OVERRIDE. Existing confirmed commitments remain.",
      ),
    ).toBeVisible();

    // Verify initial exception items
    await expect(page.getByText("Sunseeker Predator 74 (AST-CY-01)")).toBeVisible();
    await expect(page.getByText("Holiday maintenance & marina closure")).toBeVisible();

    // Filter by UNAVAILABLE
    await page.getByRole("button", { name: "Unavailable", exact: true }).click();
    await expect(page.getByText("Holiday maintenance & marina closure")).toBeVisible();

    // Filter by CAPACITY_OVERRIDE
    await page.getByRole("button", { name: "Capacity Override", exact: true }).click();
    await expect(page.getByText("Cessna Citation Latitude (AST-AJ-01)")).toBeVisible();
    await expect(page.getByText("6 pax")).toBeVisible();
  });

  test("Journey D: Create and edit availability exception (CC-AVL-04)", async ({ page }) => {
    await page.goto("/availability/exceptions");
    await page.getByRole("link", { name: "+ Create Exception" }).click();
    await expect(page).toHaveURL("/availability/exceptions/create");

    // Verify footnote
    await expect(
      page.getByText("AVAILABLE_OVERRIDE never bypasses an active allocation conflict."),
    ).toBeVisible();

    // Fill form
    await page.locator("#target-input").fill("Mercedes-Maybach S680 (AST-XT-01)");
    await page.locator("#starts-at-input").fill("2026-12-10T08:00");
    await page.locator("#ends-at-input").fill("2026-12-12T18:00");
    await page.locator("#exception-type-select").selectOption("CAPACITY_OVERRIDE");
    await page.locator("#capacity-override-input").fill("2");
    await page.locator("#reason-input").fill("Diplomatic delegation luggage payload restriction");

    await page.getByRole("button", { name: "Save Exception" }).click();
    await expect(page).toHaveURL("/availability/exceptions");

    await expect(page.getByText("Diplomatic delegation luggage payload restriction")).toBeVisible();
    await expect(page.getByText("2 pax")).toBeVisible();

    // Edit ex_001
    await page.locator('a[href="/availability/exceptions/ex_001/edit"]').click();
    await expect(page).toHaveURL("/availability/exceptions/ex_001/edit");
    await page.locator("#reason-input").fill("Annual certified hull inspection & drydock");
    await page.getByRole("button", { name: "Save Exception Changes" }).click();
    await expect(page).toHaveURL("/availability/exceptions");
    await expect(page.getByText("Annual certified hull inspection & drydock")).toBeVisible();
  });

  test("Journey E: View availability slots directory and filter (CC-AVL-05)", async ({ page }) => {
    await page.goto("/availability/slots");
    await expect(page.getByRole("heading", { name: "Availability Slots" })).toBeVisible();

    // Verify footnote
    await expect(
      page.getByText(
        "Slot status is OPEN/CLOSED. Closing a slot rejects new allocations but does not cancel confirmed bookings.",
      ),
    ).toBeVisible();

    // Initial slots
    await expect(page.getByText("Morning Côte d'Azur regional flight window")).toBeVisible();

    // Filter by CLOSED
    await page.getByRole("button", { name: "Closed", exact: true }).click();
    await expect(
      page.getByText(
        "Crew duty time ceiling reached. New allocations rejected; existing commitments intact.",
      ),
    ).toBeVisible();

    // Filter by OPEN
    await page.getByRole("button", { name: "Open", exact: true }).click();
    await expect(page.getByText("Day charter slot departing Port de Cannes")).toBeVisible();
  });

  test("Journey F: Create and edit availability slot (CC-AVL-06)", async ({ page }) => {
    await page.goto("/availability/slots");
    await page.getByRole("link", { name: "+ Create Slot" }).click();
    await expect(page).toHaveURL("/availability/slots/create");

    // Verify footnote
    await expect(
      page.getByText("No direct active-allocation edit surface exists here."),
    ).toBeVisible();

    // Fill form
    await page.locator("#target-input").fill("Eurocopter EC130 T2 (AST-XT-02)");
    await page.locator("#starts-at-input").fill("2026-11-29T09:00");
    await page.locator("#ends-at-input").fill("2026-11-29T13:00");
    await page.locator("#capacity-input").fill("5");
    await page.locator("#status-select").selectOption("OPEN");
    await page.locator("#notes-input").fill("Alpine heli-skiing morning corridor");

    await page.getByRole("button", { name: "Save Slot" }).click();
    await expect(page).toHaveURL("/availability/slots");

    await expect(page.getByText("Alpine heli-skiing morning corridor")).toBeVisible();
    await expect(page.getByText("5 pax")).toBeVisible();

    // Edit slt_001
    await page.locator('a[href="/availability/slots/slt_001/edit"]').click();
    await expect(page).toHaveURL("/availability/slots/slt_001/edit");
    await page.locator("#status-select").selectOption("CLOSED");
    await page.locator("#notes-input").fill("Closed for unscheduled maintenance pre-check");
    await page.getByRole("button", { name: "Save Slot Changes" }).click();
    await expect(page).toHaveURL("/availability/slots");
    await expect(page.getByText("Closed for unscheduled maintenance pre-check")).toBeVisible();
  });

  test("Multi-Tenant Vendor Scoping: Vendor cannot view other vendor availability data", async ({
    page,
  }) => {
    // Sign in as Vendor A (AeroJet Aviation Partners)
    await page.goto("/qa");
    await page.getByRole("button", { name: "Vendor A: Arman K. (AeroJet Aviation)" }).click();

    // Check Availability Rules
    await page.goto("/availability");
    await expect(page.getByText("Cessna Citation Latitude (AST-AJ-01)")).toBeVisible();
    // Côte d'Azur Marine (Vendor B) yacht should NOT be visible
    await expect(page.getByText("Sunseeker Predator 74")).not.toBeVisible();

    // Check Exceptions
    await page.goto("/availability/exceptions");
    await expect(page.getByText("Cessna Citation Latitude (AST-AJ-01)")).toBeVisible();
    await expect(page.getByText("Sunseeker Predator 74")).not.toBeVisible();

    // Check Slots
    await page.goto("/availability/slots");
    await expect(page.getByText("Cessna Citation Latitude (AST-AJ-01)").first()).toBeVisible();
    await expect(page.getByText("Port de Cannes")).not.toBeVisible();
  });
});
