import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 9 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-09/browser");

  test("Capture all 5 Batch 9 screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset repositories to initial seeded state and sign in as SUPER_ADMIN
    await page.goto("/qa");
    await page
      .getByRole("button", { name: "Reset Finance, FX & Catalog to Initial Defaults" })
      .click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();

    // 1. CC-FIN-01: Vendor Payables List (90:3405)
    await page.goto("/finance/vendor-payables");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-FIN-01_browser.png"),
      fullPage: true,
    });

    // 2. CC-FIN-02: Vendor Payable Detail / Update (90:3511)
    await page.goto("/finance/vendor-payables/pay_016");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-FIN-02_browser.png"),
      fullPage: true,
    });

    // 3. CC-FIN-03: Financial Summary (90:3591)
    await page.goto("/finance/summary");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-FIN-03_browser.png"),
      fullPage: true,
    });

    // 4. CC-FX-01: FX Rates & Manual Override (90:3661)
    await page.goto("/finance/fx-rates");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-FX-01_browser.png"),
      fullPage: true,
    });

    // 5. CC-CAT-01: Catalog Directory (90:3740)
    await page.goto("/catalog");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CAT-01_browser.png"),
      fullPage: true,
    });
  });
});
