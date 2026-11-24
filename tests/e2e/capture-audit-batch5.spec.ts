import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 5 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-05/browser");

  test("Capture all 5 Batch 5 screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset repositories to initial seeded state and sign in as SUPER_ADMIN
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Vendors & Staff to Initial Defaults" }).click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();

    // 1. CC-VEN-01: Vendors List (86:1679)
    await page.goto("/vendors");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-VEN-01_browser.png"),
      fullPage: true,
    });

    // 2. CC-VEN-02: Vendor Detail (86:1779)
    await page.goto("/vendors/vnd_aerojet_99");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-VEN-02_browser.png"),
      fullPage: true,
    });

    // 3. CC-VEN-03: Create / Edit Vendor (86:1846)
    await page.goto("/vendors/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-VEN-03_browser.png"),
      fullPage: true,
    });

    // Switch to Vendor persona for CC-VEN-04 and CC-VEN-05
    await page.goto("/qa");
    await page.getByRole("button", { name: "Vendor A: Arman K. (AeroJet Aviation)" }).click();

    // 4. CC-VEN-04: My Vendor Organization (86:1917)
    await page.goto("/vendor/organization");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-VEN-04_browser.png"),
      fullPage: true,
    });

    // 5. CC-VEN-05: Vendor Staff (86:1986)
    await page.goto("/vendor/staff");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-VEN-05_browser.png"),
      fullPage: true,
    });
  });
});
