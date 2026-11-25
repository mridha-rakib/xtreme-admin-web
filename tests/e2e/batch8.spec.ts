import { expect, test } from "@playwright/test";

test.describe("Batch 8: Pricing Management (CC-PRC-01 through CC-PRC-05)", () => {
  test.beforeEach(async ({ page }) => {
    // Reset all mock repositories and authenticate as SUPER_ADMIN
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Pricing & Rates to Initial Defaults" }).click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();
  });

  test("Journey A: Vendor Rates List & Footnote (CC-PRC-01)", async ({ page }) => {
    // 1. Visit /pricing/vendor-rates
    await page.goto("/pricing/vendor-rates");
    await expect(page.getByRole("heading", { name: "Vendor Rates List" })).toBeVisible();

    // Verify authoritative footnote
    await expect(
      page.getByText(
        "PENDING is not active operational pricing. Customer-facing price/margin is not shown here.",
      ),
    ).toBeVisible();

    // Verify sub-navigation tabs
    await expect(page.getByRole("link", { name: "Vendor Rates" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Customer Prices" })).toBeVisible();

    // Verify + Submit vendor rate button exists
    await expect(page.getByRole("button", { name: "+ Submit vendor rate" })).toBeVisible();

    // Verify seeded rates are displayed
    await expect(page.getByText("Charter Flight Operations").first()).toBeVisible();
    await expect(page.getByText("AeroJet Aviation Partners").first()).toBeVisible();
  });

  test("Journey B: Submit Vendor Rate (CC-PRC-03)", async ({ page }) => {
    await page.goto("/pricing/vendor-rates");
    await page.getByRole("button", { name: "+ Submit vendor rate" }).click();
    await expect(page).toHaveURL("/pricing/vendor-rates/submit");
    await expect(page.getByRole("heading", { name: "Submit Vendor Rate" })).toBeVisible();

    // Verify authoritative footnote
    await expect(
      page.getByText(
        "Submission creates a PENDING version and is not active until authorized approval.",
      ),
    ).toBeVisible();

    // Fill out form
    await page
      .locator('input[placeholder="e.g. Charter Flight Operations"]')
      .fill("Helicopter Transfer VIP");
    await page.locator('input[placeholder="e.g. 4800"]').fill("1200000");
    await page.locator("#currency-select").selectOption("XOF");

    // Submit
    await page.getByRole("button", { name: "Submit Rate Schedule" }).click();

    // Verify redirect to list
    await expect(page).toHaveURL("/pricing/vendor-rates");
    await expect(page.getByText("Helicopter Transfer VIP")).toBeVisible();
    await expect(page.getByText("XOF 1,200,000")).toBeVisible();
    await expect(page.locator("td").filter({ hasText: "PENDING" }).first()).toBeVisible();
  });

  test("Journey C: Vendor Rate Detail & Admin Approval (CC-PRC-02)", async ({ page }) => {
    // Open seeded pending rate rate_aj_02
    await page.goto("/pricing/vendor-rates/rate_aj_02");
    await expect(
      page.getByRole("heading", { name: "Vendor Rate Detail / Approval" }),
    ).toBeVisible();

    // Verify authoritative footnote
    await expect(
      page.getByText("Vendor may view own rate but cannot approve/reject it.").first(),
    ).toBeVisible();

    // Verify rate version details card
    await expect(page.getByText("Rate version")).toBeVisible();
    await expect(page.getByText("Charter Flight Operations")).toBeVisible();

    // Verify initial PENDING badge
    await expect(page.getByText("PENDING").first()).toBeVisible();

    // Approve the rate
    await page
      .locator('textarea[placeholder*="Enter approval conditions"]')
      .fill("Approved for high season deployment");
    await page.getByRole("button", { name: "Approve" }).click();

    // Verify success notice and APPROVED status badge
    await expect(page.getByText("successfully approved")).toBeVisible();
    await expect(page.getByText("APPROVED").first()).toBeVisible();
  });

  test("Journey D: Vendor Rate Detail & Admin Rejection (CC-PRC-02)", async ({ page }) => {
    // Open another pending rate rate_mcp_02
    await page.goto("/pricing/vendor-rates/rate_mcp_02");
    await expect(
      page.getByRole("heading", { name: "Vendor Rate Detail / Approval" }),
    ).toBeVisible();

    // Rejection without reason displays error
    await page.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByText("Please provide a reason")).toBeVisible();

    // Fill rejection reason and reject
    await page
      .locator('textarea[placeholder*="Enter approval conditions"]')
      .fill("Fuel surcharge rate is above benchmark");
    await page.getByRole("button", { name: "Reject" }).click();

    // Verify status updated to REJECTED
    await expect(page.getByText("marked REJECTED")).toBeVisible();
    await expect(page.getByText("REJECTED").first()).toBeVisible();
  });

  test("Journey E: Customer Price Configurations & Creation (CC-PRC-04 & CC-PRC-05)", async ({
    page,
  }) => {
    // 1. Visit /pricing/customer-prices
    await page.goto("/pricing/customer-prices");
    await expect(
      page.getByRole("heading", { name: "Customer Price Configurations" }),
    ).toBeVisible();

    // Verify CC-PRC-04 footnote
    await expect(
      page.getByText(
        "XTREME controls Customer-facing selling price. Vendor/Customer cannot override XTREME margin or selling amount.",
      ),
    ).toBeVisible();

    // Verify seeded customer prices
    await expect(page.getByText("Private Jet Charter · Europe")).toBeVisible();
    await expect(page.getByText("XOF 3,250,000")).toBeVisible();

    // 2. Click + Create customer price
    await page.getByRole("button", { name: "+ Create customer price" }).click();
    await expect(page).toHaveURL("/pricing/customer-prices/create");
    await expect(
      page.getByRole("heading", { name: "Create Customer Price Configuration" }),
    ).toBeVisible();

    // Verify CC-PRC-05 footnote
    await expect(
      page.getByText("No custom-field-driven pricing formula builder is introduced."),
    ).toBeVisible();

    // 3. Fill form
    await page
      .locator('input[placeholder*="e.g. Private Jet Charter"]')
      .fill("Luxury Chauffeur Service · Dakar");
    await page.locator('input[placeholder="e.g. 3500000"]').fill("450000");

    // 4. Save
    await page.getByRole("button", { name: "Create Configuration" }).click();
    await expect(page).toHaveURL("/pricing/customer-prices");

    // 5. Verify created price in table
    await expect(page.getByText("Luxury Chauffeur Service · Dakar")).toBeVisible();
    await expect(page.getByText("XOF 450,000")).toBeVisible();
  });

  test("Journey F: Vendor Persona Isolation & Confidential Margin Safeguards", async ({ page }) => {
    // Sign in as Vendor A
    await page.goto("/qa");
    await page.getByRole("button", { name: "Vendor A: Arman K. (AeroJet Aviation)" }).click();

    // Check Vendor Rates list: only AeroJet rates visible, Riviera Yacht rates not visible
    await page.goto("/pricing/vendor-rates");
    await expect(page.getByText("Charter Flight Operations").first()).toBeVisible();
    await expect(page.getByText("Riviera Luxury Yachting")).not.toBeVisible();

    // Customer prices tab is hidden for vendor in sub-navigation
    await expect(page.getByRole("link", { name: "Customer Prices" })).not.toBeVisible();

    // Direct navigation to /pricing/customer-prices triggers Access Restricted notice
    await page.goto("/pricing/customer-prices");
    await expect(page.getByText("Access Restricted")).toBeVisible();
    await expect(
      page.getByText(
        "Vendors cannot view or manage customer-facing price configurations or margins.",
      ),
    ).toBeVisible();

    // Direct navigation to /pricing/customer-prices/create triggers Access Restricted notice
    await page.goto("/pricing/customer-prices/create");
    await expect(page.getByText("Access Restricted")).toBeVisible();

    // Rate Detail: Vendor viewing own rate has read-only decision card and cannot approve/reject
    await page.goto("/pricing/vendor-rates/rate_aj_01");
    await expect(
      page.getByText("Vendor may view own rate but cannot approve/reject it.").first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).not.toBeVisible();
  });
});
