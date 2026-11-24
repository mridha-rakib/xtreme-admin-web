import { expect, test } from "@playwright/test";

test.describe("Admin Web Command Center Smoke Tests", () => {
  test("renders layout, branding, and foundation readiness dashboard", async ({ page }) => {
    await page.goto("/");

    // Verify Title & Brand Presence
    await expect(page).toHaveTitle(/XTREME Concierge/);
    await expect(page.locator("img[alt='XTREME Concierge']")).toBeVisible();

    // Verify 240px Navigation Sidebar & Main Sections
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.getByRole("link", { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Bookings/i })).toBeVisible();

    // Verify Metric Cards
    await expect(page.getByText("Net Active Volume")).toBeVisible();
    await expect(page.getByText("Active Expeditions")).toBeVisible();

    // Verify Zero-Reuse Scope Note
    await expect(page.getByText(/0 of 64 business screens implemented/i)).toBeVisible();
  });

  test("allows persona role switching and dynamic navigation filtering", async ({ page }) => {
    await page.goto("/");

    // Default Super Admin should see Access Governance
    await expect(page.getByRole("link", { name: /Access Governance/i })).toBeVisible();

    // Switch to Vendor
    await page.getByLabel("Switch administrative role persona").selectOption("VENDOR");

    // Vendor should not see Access Governance in navigation
    await expect(page.getByRole("link", { name: /Access Governance/i })).not.toBeVisible();
  });
});
