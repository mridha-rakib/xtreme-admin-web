import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 3 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-03/browser");

  test("Capture all 5 Batch 3 screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset repositories to initial seeded state
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Customers to Initial Defaults" }).click();

    // 1. CC-BKG-06: Create Change / Cancellation Request on Behalf (81:708)
    await page.goto("/bookings/bkg_018/change-requests/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-BKG-06_browser.png"),
      fullPage: true,
    });

    // 2. CC-PAY-01: Payment Detail / Refund Management (81:777)
    await page.goto("/bookings/bkg_018/payments/pmt_018_1");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-PAY-01_browser.png"),
      fullPage: true,
    });

    // 3. CC-TRIP-01: Trips List (83:1108)
    await page.goto("/trips");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-TRIP-01_browser.png"),
      fullPage: true,
    });

    // 4. CC-TRIP-02: Trip Detail (83:1208)
    await page.goto("/trips/TRIP-261124-04");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-TRIP-02_browser.png"),
      fullPage: true,
    });

    // 5. CC-TRIP-03: Create / Edit Trip (83:1275)
    await page.goto("/trips/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-TRIP-03_browser.png"),
      fullPage: true,
    });
  });
});
