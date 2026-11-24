import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 2 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-02/browser");

  test("Capture all 5 Batch 2 booking screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset customer and booking repositories to initial seeded state
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Customers to Initial Defaults" }).click();

    // 1. CC-BKG-01: Bookings List
    await page.goto("/bookings");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-BKG-01_browser.png"),
      fullPage: true,
    });

    // 2. CC-BKG-02: Booking Detail / Operations (bkg_018)
    await page.goto("/bookings/bkg_018");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-BKG-02_browser.png"),
      fullPage: true,
    });

    // 3. CC-BKG-03: Create Booking on Behalf
    await page.goto("/bookings/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-BKG-03_browser.png"),
      fullPage: true,
    });

    // 4. CC-BKG-04: Booking Change Requests
    await page.goto("/bookings/bkg_018/change-requests");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-BKG-04_browser.png"),
      fullPage: true,
    });

    // 5. CC-BKG-05: Resolve Booking Change / Cancellation
    await page.goto("/bookings/bkg_018/change-requests/cr_018_1/resolve");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-BKG-05_browser.png"),
      fullPage: true,
    });
  });
});
