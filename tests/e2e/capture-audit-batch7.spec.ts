import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 7 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-07/browser");

  test("Capture all 5 Batch 7 screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset repositories to initial seeded state and sign in as SUPER_ADMIN
    await page.goto("/qa");
    await page
      .getByRole("button", { name: "Reset Assets & Availability to Initial Defaults" })
      .click();
    await page.getByRole("button", { name: "SUPER_ADMIN" }).click();

    // 1. CC-AVL-02: Create / Edit Availability Rule (88:2336)
    await page.goto("/availability/rules/avl_001/edit");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AVL-02_browser.png"),
      fullPage: true,
    });

    // 2. CC-AVL-03: Availability Exceptions List (88:2424)
    await page.goto("/availability/exceptions");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AVL-03_browser.png"),
      fullPage: true,
    });

    // 3. CC-AVL-04: Create / Edit Availability Exception (88:2532)
    await page.goto("/availability/exceptions/ex_001/edit");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AVL-04_browser.png"),
      fullPage: true,
    });

    // 4. CC-AVL-05: Availability Slots List (88:2610)
    await page.goto("/availability/slots");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AVL-05_browser.png"),
      fullPage: true,
    });

    // 5. CC-AVL-06: Create / Edit Availability Slot (88:2710)
    await page.goto("/availability/slots/slt_001/edit");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AVL-06_browser.png"),
      fullPage: true,
    });
  });
});
