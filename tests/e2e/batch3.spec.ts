import { expect, test } from "@playwright/test";

test.describe("Batch 3 E2E Integration: Booking Requests, Payments, Refunds & Trips", () => {
  test.beforeEach(async ({ page }) => {
    // Deterministic reset
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Customers to Initial Defaults" }).click();
  });

  test("CC-BKG-06: Pending Request Guard displays open request and prevents duplicate submission", async ({
    page,
  }) => {
    await page.goto("/bookings/bkg_018/change-requests/create");

    // Verify title and node context
    await expect(
      page.getByRole("heading", { name: "Create Change / Cancellation Request on Behalf" }),
    ).toBeVisible();

    // Verify Pending Request Guard is triggered on bkg_018
    await expect(page.getByText("Pending-request guard active")).toBeVisible();
    await expect(
      page.getByText("Duplicate pending change requests cannot be created"),
    ).toBeVisible();
    await expect(page.getByText("Review & Resolve Pending Request →")).toBeVisible();
  });

  test("CC-BKG-06: Create Change Request on Behalf for booking without open requests", async ({
    page,
  }) => {
    await page.goto("/bookings/bkg_017/change-requests/create");

    await expect(
      page.getByRole("heading", { name: "Create Change / Cancellation Request on Behalf" }),
    ).toBeVisible();

    // Fill change request form
    await page
      .getByLabel("Requested Changes & Specifications")
      .fill("Delay dinner seating by 1 hour");
    await page
      .getByLabel("Operational Reason for Change")
      .fill("Customer flight delayed into Southampton");

    await page.getByRole("button", { name: "Submit Request" }).click();

    // Verify redirect to change requests list
    await expect(page).toHaveURL(/\/bookings\/bkg_017\/change-requests/);
    await expect(page.getByText("Delay dinner seating by 1 hour")).toBeVisible();
  });

  test("CC-PAY-01: Payment Details view and Refund Management execution", async ({ page }) => {
    await page.goto("/bookings/bkg_018/payments/pmt_018_1");

    await expect(
      page.getByRole("heading", { name: "Payment Detail / Refund Management" }),
    ).toBeVisible();

    // Check authoritative payment state
    await expect(page.getByRole("link", { name: "XC-261124-018", exact: true })).toBeVisible();
    await expect(page.getByText("USD 185.00").first()).toBeVisible();

    // Initiate partial refund
    const amountInput = page.getByLabel("Refund Amount (USD)");
    await amountInput.fill("85");
    await page
      .getByLabel("Refund Reason / Operational Note")
      .fill("VIP goodwill adjustment for minor airport delay");

    await page.getByRole("button", { name: /Process Refund/ }).click();

    // Verify refund confirmation and balance update
    await expect(page.getByText(/Refund of USD 85.*initiated successfully/)).toBeVisible();
    await expect(page.getByText("- USD 85.00")).toBeVisible();
    await expect(page.getByText("USD 100.00")).toBeVisible(); // Refundable remainder
  });

  test("CC-TRIP-01: Trips List display and searching", async ({ page }) => {
    await page.goto("/trips");

    await expect(page.getByRole("heading", { name: "Trips List" })).toBeVisible();
    await expect(page.getByText("Thanksgiving in New York")).toBeVisible();
    await expect(page.getByText("Hamptons Culinary Retreat")).toBeVisible();

    // Filter test
    const searchInput = page.getByPlaceholder("Search reference, customer, destination...");
    await searchInput.fill("Paris");
    await expect(page.getByText("Autumn Paris Excursion")).toBeVisible();
    await expect(page.getByText("Thanksgiving in New York")).not.toBeVisible();
  });

  test("CC-TRIP-02 & CC-TRIP-03: Trip Container Creation, Detail & Editing", async ({ page }) => {
    // 1. Create Trip
    await page.goto("/trips/create");
    await expect(page.getByRole("heading", { name: "Create Trip Container" })).toBeVisible();

    await page.getByPlaceholder("e.g. Thanksgiving in New York").fill("Miami Art Basel VIP");
    await page.getByPlaceholder("e.g. New York / Manhattan").fill("Miami Beach, FL");

    // Date range inputs
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill("2026-12-01");
    await dateInputs.nth(1).fill("2026-12-06");

    await page.getByRole("button", { name: "Create Trip" }).click();

    // 2. Redirected to Trip Detail (CC-TRIP-02)
    await expect(page).toHaveURL(/\/trips\/TRIP-261124-/);
    await expect(page.getByRole("heading", { name: "Trip Detail" })).toBeVisible();
    await expect(page.getByText("Miami Art Basel VIP")).toBeVisible();
    await expect(page.getByText("Miami Beach, FL")).toBeVisible();

    // 3. Edit Trip (CC-TRIP-03)
    await page.getByRole("link", { name: "Edit Trip" }).click();
    await expect(page.getByRole("heading", { name: /Edit Trip:/ })).toBeVisible();

    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.fill("Miami Art Basel Deluxe");
    await page.getByRole("button", { name: "Save Trip" }).click();

    await expect(page).toHaveURL(/\/trips\/TRIP-261124-/);
    await expect(page.getByText("Miami Art Basel Deluxe")).toBeVisible();
  });
});
