import { expect, test } from "@playwright/test";

test.describe("Admin Web Batch 2 Booking Management Journeys & Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    // Reset customer and booking repositories to initial seeded defaults
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Customers to Initial Defaults" }).click();
  });

  test("Journey A: Booking Creation (Concierge Sign In -> Bookings List -> Create on Behalf -> Submit -> Detail -> List)", async ({
    page,
  }) => {
    // 1. Sign in as Concierge persona
    await page.goto("/auth/sign-in");
    await page.getByLabel("Identifier").fill("elena.concierge@xtremeconcierge.internal");
    await page.locator("#password-input").fill("xtreme2026");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/");

    // 2. Navigate to Bookings List (CC-BKG-01)
    await page.getByRole("link", { name: "Bookings" }).click();
    await page.waitForURL("/bookings");
    await expect(page.getByRole("heading", { name: "Bookings List" })).toBeVisible();

    // Verify initial bookings exist
    await expect(page.getByText("XC-261124-018")).toBeVisible();
    await expect(page.getByText("XC-261124-017")).toBeVisible();

    // 3. Click "Create on behalf" to open intake form (CC-BKG-03)
    await page.getByRole("link", { name: "Create on behalf" }).click();
    await page.waitForURL("/bookings/create");
    await expect(page.getByRole("heading", { name: "Create Booking on Behalf" })).toBeVisible();

    // Test form validation: empty destination
    await page.getByLabel("Destination").fill("");
    await page.getByRole("button", { name: "Create booking / request" }).click();
    await expect(page.getByText("Destination is required.")).toBeVisible();

    // Fill valid booking information
    await page.getByLabel("Destination").fill("Teterboro Private Aviation Terminal");
    await page.getByLabel("Customer notes").fill("VIP client with priority handling");
    await page.getByRole("button", { name: "Create booking / request" }).click();

    // 4. Land on new Booking Detail (CC-BKG-02)
    await page.waitForURL(/\/bookings\/bkg_\d+/);
    await expect(page.getByRole("heading", { name: "Booking Detail / Operations" })).toBeVisible();
    await expect(page.getByText("Booking reference:")).toBeVisible();
    await expect(page.getByText("· v1")).toBeVisible();
    await expect(page.getByText("Airport Transfer · JFK")).toBeVisible();

    // 5. Return to Bookings List and verify new booking is immediately visible
    await page.getByRole("link", { name: "← Back to Bookings List" }).click();
    await page.waitForURL("/bookings");
    await expect(page.getByText("Airport Transfer").first()).toBeVisible();
  });

  test("Journey B: Operational Review (Admin Sign In -> Bookings List -> Detail -> Operational States)", async ({
    page,
  }) => {
    // 1. Visit Bookings List
    await page.goto("/bookings");
    await expect(page.getByRole("heading", { name: "Bookings List" })).toBeVisible();

    // Search filter test
    const searchInput = page.getByPlaceholder(/Search \/ filter/i);
    await searchInput.fill("XC-261124-018");
    await expect(page.getByText("XC-261124-018")).toBeVisible();
    await expect(page.getByText("XC-261124-017")).not.toBeVisible();
    await searchInput.fill("");

    // 2. Click View on XC-261124-018
    await page.getByRole("link", { name: "View ›" }).first().click();
    await page.waitForURL("/bookings/bkg_018");

    // 3. Inspect Primary Information and Separate Operational States
    await expect(page.getByRole("heading", { name: "Booking Detail / Operations" })).toBeVisible();
    await expect(page.getByText("XC-261124-018 · v3")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Primary information" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Separate operational states" })).toBeVisible();
    await expect(page.getByText("Vendor decision")).toBeVisible();
    await expect(page.getByText("ACCEPTED", { exact: true })).toBeVisible();
    await expect(page.getByText("Payment", { exact: true })).toBeVisible();
    await expect(page.getByText("PAYMENT DUE", { exact: true })).toBeVisible();
    await expect(page.getByText("Authority guard")).toBeVisible();

    // Confirm booking action
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText(/confirmed successfully/i)).toBeVisible();
    await expect(page.getByText("· v4")).toBeVisible();
  });

  test("Journey C: Modification Resolution (Detail -> Change Requests -> Resolve Modification -> Approve -> Updated Detail)", async ({
    page,
  }) => {
    // 1. Start from Booking Detail for bkg_018
    await page.goto("/bookings/bkg_018");
    await expect(page.getByRole("heading", { name: "Booking Detail / Operations" })).toBeVisible();

    // 2. Click "Resolve change" to navigate to Change Requests table (CC-BKG-04)
    await page.getByRole("link", { name: "Resolve change" }).click();
    await page.waitForURL("/bookings/bkg_018/change-requests");
    await expect(page.getByRole("heading", { name: "Booking Change Requests" })).toBeVisible();
    await expect(page.getByText("MODIFICATION", { exact: true })).toBeVisible();

    // 3. Click "Resolve ›" on modification request (CC-BKG-05)
    await page.getByRole("link", { name: "Resolve ›" }).first().click();
    await page.waitForURL(/\/bookings\/bkg_018\/change-requests\/cr_018_1\/resolve/);
    await expect(
      page.getByRole("heading", { name: "Resolve Booking Change / Cancellation" }),
    ).toBeVisible();
    await expect(page.getByText("MODIFICATION", { exact: true })).toBeVisible();
    await expect(page.getByText("Current authoritative version (v3)")).toBeVisible();

    // 4. Submit approval
    await page.getByRole("button", { name: "Approve / reject" }).click();

    // 5. Land on updated Booking Detail with incremented version and updated schedule
    await page.waitForURL("/bookings/bkg_018");
    await expect(page.getByText("· v4")).toBeVisible();
    await expect(page.getByText("Nov 24, 2026 · 09:30 EST")).toBeVisible();
  });

  test("Journey D: Cancellation Resolution (Change Requests -> Resolve Cancellation -> Approve -> Status Cancelled without Payment alteration)", async ({
    page,
  }) => {
    // 1. Go directly to change requests
    await page.goto("/bookings/bkg_018/change-requests");
    await expect(page.getByText("CANCELLATION", { exact: true })).toBeVisible();

    // 2. Open cancellation resolution
    await page.goto("/bookings/bkg_018/change-requests/cr_018_2/resolve");
    await expect(page.getByText("CANCELLATION", { exact: true })).toBeVisible();

    // 3. Submit cancellation approval
    await page.getByRole("button", { name: "Approve / reject" }).click();

    // 4. Returned to Booking Detail
    await page.waitForURL("/bookings/bkg_018");
    // Verify booking status is now CANCELLED
    await expect(page.getByText("CANCELLED", { exact: true })).toBeVisible();
    // Verify payment status is strictly untouched (isolated from operational cancellation)
    await expect(page.getByText("PAYMENT DUE", { exact: true })).toBeVisible();
  });

  test("Negative Scenarios: Not Found & Conflict Recovery", async ({ page }) => {
    // 1. Invalid booking ID
    await page.goto("/bookings/non-existent-booking-999");
    await expect(page.getByText("Booking Not Found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Bookings List" })).toBeVisible();

    // 2. Invalid change request ID
    await page.goto("/bookings/bkg_018/change-requests/invalid-request-999/resolve");
    await expect(page.getByText("Record Not Found")).toBeVisible();
  });
});
