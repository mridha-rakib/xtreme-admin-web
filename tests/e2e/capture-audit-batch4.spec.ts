import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 4 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-04/browser");

  test("Capture all 5 Batch 4 screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset repositories to initial seeded state
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Concierge Requests & Conversations" }).click();

    // 1. CC-CON-01: Concierge Requests List (83:1347)
    await page.goto("/concierge/requests");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CON-01_browser.png"),
      fullPage: true,
    });

    // 2. CC-CON-02: Concierge Request Detail / Management (83:1455)
    await page.goto("/concierge/requests/cr_001");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CON-02_browser.png"),
      fullPage: true,
    });

    // 3. CC-CON-03: Concierge Conversation Inbox (83:1533)
    await page.goto("/concierge/conversations");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CON-03_browser.png"),
      fullPage: true,
    });

    // 4. CC-CON-04: Concierge Conversation Detail (83:1633)
    await page.goto("/concierge/conversations/conv_001");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CON-04_browser.png"),
      fullPage: true,
    });

    // 5. CC-CON-05: Create Concierge Request on Behalf (83:1698)
    await page.goto("/concierge/requests/create");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CON-05_browser.png"),
      fullPage: true,
    });
  });
});
