import path from "node:path";
import { test } from "@playwright/test";

test.describe("Batch 1 Visual Audit Capture at 1440x900", () => {
  const auditDir = path.resolve(process.cwd(), "docs/audit/batch-01/browser");

  test("Capture all 5 screens in Chromium at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Reset customer repository via QA endpoint
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Customers to Initial Defaults" }).click();

    // 1. CC-AUTH-01: Command Center Sign In
    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-AUTH-01_browser.png"),
      fullPage: true,
    });

    // Sign in to establish active session
    await page.getByLabel("Identifier").fill("victoria.vance@xtremeconcierge.internal");
    await page.locator("#password-input").fill("xtreme2026");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/");

    // 2. CC-HOME-01: Super Admin Dashboard
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-HOME-01_browser.png"),
      fullPage: true,
    });

    // 3. CC-CUS-01: Customers List
    await page.goto("/customers");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CUS-01_browser.png"),
      fullPage: true,
    });

    // 4. CC-CUS-02: Customer Detail
    await page.goto("/customers/cus_001");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CUS-02_browser.png"),
      fullPage: true,
    });

    // 5. CC-CUS-03: Edit Customer Basic Profile
    await page.goto("/customers/cus_001/edit");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(auditDir, "CC-CUS-03_browser.png"),
      fullPage: true,
    });
  });
});
