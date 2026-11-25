import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 6 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-06/browser");
  const auditCorrectionsDir = path.resolve(
    process.cwd(),
    "docs/audit/batch-06-corrections/browser",
  );

  test("Capture all 5 Batch 6 screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset repositories to initial seeded state and sign in as SUPER_ADMIN
    await page.goto("/qa");
    await page
      .getByRole("button", { name: "Reset Assets & Availability to Initial Defaults" })
      .click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();

    // 1. CC-VEN-06: Associate / Manage Vendor Staff (86:2078)
    // Sign in as Vendor A for Vendor-scoped staff view
    await page.goto("/qa");
    await page.getByRole("button", { name: "Vendor A: Arman K. (AeroJet Aviation)" }).click();
    await page.goto("/vendor/staff/stf_001/edit");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-VEN-06_browser.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(auditCorrectionsDir, "CC-VEN-06_browser.png"),
      fullPage: true,
    });

    // Switch back to SUPER_ADMIN for Admin screens
    await page.goto("/qa");
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();

    // 2. CC-AST-01: Assets List (86:2147)
    await page.goto("/assets");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AST-01_browser.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(auditCorrectionsDir, "CC-AST-01_browser.png"),
      fullPage: true,
    });

    // 3. CC-AST-02: Asset Detail (86:2255)
    await page.goto("/assets/ast_001");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AST-02_browser.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(auditCorrectionsDir, "CC-AST-02_browser.png"),
      fullPage: true,
    });

    // 4. CC-AST-03: Create / Edit Asset (86:2320)
    await page.goto("/assets/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AST-03_browser.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(auditCorrectionsDir, "CC-AST-03_browser.png"),
      fullPage: true,
    });

    // 5. CC-AVL-01: Availability Rules (88:2228)
    await page.goto("/availability");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AVL-01_browser.png"),
      fullPage: true,
    });
    await page.screenshot({
      path: path.join(auditCorrectionsDir, "CC-AVL-01_browser.png"),
      fullPage: true,
    });
  });
});
