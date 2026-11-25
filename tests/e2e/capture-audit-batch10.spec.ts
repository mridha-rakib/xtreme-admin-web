import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 10 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-10/browser");

  test("Capture all 5 Batch 10 screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset repositories to initial seeded state and sign in as SUPER_ADMIN
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset All Repositories to Seed State" }).click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();

    // 1. CC-CAT-02: Services List (90:3840)
    await page.goto("/catalog/services");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CAT-02_browser.png"),
      fullPage: true,
    });

    // 2. CC-CAT-03: Service Detail / Config Summary (90:3942)
    await page.goto("/catalog/services/srv_aviation_01");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CAT-03_browser.png"),
      fullPage: true,
    });

    // 3. CC-CAT-04: Create Service (90:4006)
    await page.goto("/catalog/services/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CAT-04_create_browser.png"),
      fullPage: true,
    });

    // 4. CC-CAT-04: Edit Service (90:4006)
    await page.goto("/catalog/services/srv_aviation_01/edit");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CAT-04_edit_browser.png"),
      fullPage: true,
    });

    // 5. CC-CAT-05: Service Custom Fields (90:4104)
    await page.goto("/catalog/services/srv_aviation_01/custom-fields");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CAT-05_browser.png"),
      fullPage: true,
    });

    // 6. CC-CAT-06: Create Custom Field (90:4222)
    await page.goto("/catalog/services/srv_aviation_01/custom-fields/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CAT-06_create_browser.png"),
      fullPage: true,
    });

    // 7. CC-CAT-06: Edit Custom Field (90:4222)
    await page.goto("/catalog/services/srv_aviation_01/custom-fields/cf_pax_count/edit");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CAT-06_edit_browser.png"),
      fullPage: true,
    });
  });
});
