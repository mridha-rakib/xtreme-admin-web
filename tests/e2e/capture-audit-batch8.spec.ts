import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 8 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-08/browser");

  test("Capture all 5 Batch 8 screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset repositories to initial seeded state and sign in as SUPER_ADMIN
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Pricing & Rates to Initial Defaults" }).click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();

    // 1. CC-PRC-01: Vendor Rates List (88:2783)
    await page.goto("/pricing/vendor-rates");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-PRC-01_browser.png"),
      fullPage: true,
    });

    // 2. CC-PRC-02: Vendor Rate Detail / Approval (88:2891)
    await page.goto("/pricing/vendor-rates/rate_aj_02");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-PRC-02_browser.png"),
      fullPage: true,
    });

    // 3. CC-PRC-03: Submit Vendor Rate (88:2960)
    await page.goto("/pricing/vendor-rates/submit");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-PRC-03_browser.png"),
      fullPage: true,
    });

    // 4. CC-PRC-04: Customer Price Configurations (88:3032)
    await page.goto("/pricing/customer-prices");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-PRC-04_browser.png"),
      fullPage: true,
    });

    // 5. CC-PRC-05: Create Customer Price Configuration (88:3140)
    await page.goto("/pricing/customer-prices/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-PRC-05_browser.png"),
      fullPage: true,
    });
  });
});
