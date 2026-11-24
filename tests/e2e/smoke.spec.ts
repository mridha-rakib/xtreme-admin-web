import { expect, test } from "@playwright/test";

test.describe("Admin Web Batch 1 Complete Journey & Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    // Reset customer repository via QA endpoint
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Customers to Initial Defaults" }).click();
  });

  test("Authentication: Sign-in validations and failure modes", async ({ page }) => {
    await page.goto("/auth/sign-in");

    // Check elements on Sign In page
    await expect(page.getByRole("heading", { name: "Command Center Sign In" })).toBeVisible();
    await expect(
      page.getByText("Concierge, Vendor, Admin and Super Admin access only."),
    ).toBeVisible();

    // 1. Empty identifier
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Identifier is required.")).toBeVisible();

    // 2. Empty password
    await page.getByLabel("Identifier").fill("victoria.vance@xtremeconcierge.internal");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Password is required.")).toBeVisible();

    // 3. Suspended account
    await page.getByLabel("Identifier").fill("suspended.user@demo.com");
    await page.locator("#password-input").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByText("Account is suspended. Contact operations director."),
    ).toBeVisible();

    // 4. Invalid credentials
    await page.getByLabel("Identifier").fill("victoria.vance@xtremeconcierge.internal");
    await page.locator("#password-input").fill("wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid credentials provided.")).toBeVisible();

    // 5. Password visibility toggle
    const passwordInput = page.locator("#password-input");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await page.getByLabel("Show password").click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await page.getByLabel("Hide password").click();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // 6. Valid Sign In
    await passwordInput.fill("xtreme2026");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/");
    await expect(page.getByRole("heading", { name: "Role-Based Home" })).toBeVisible();
  });

  test("End-to-End User Journey: Sign In -> Dashboard -> Customers -> Detail -> Edit -> Save -> Updated Detail -> Updated Customers List", async ({
    page,
  }) => {
    // 1. Start from Sign In page
    await page.goto("/auth/sign-in");
    await page.getByLabel("Identifier").fill("victoria.vance@xtremeconcierge.internal");
    await page.locator("#password-input").fill("xtreme2026");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/");

    // 2. Super Admin Dashboard (CC-HOME-01)
    await expect(page.getByRole("heading", { name: "Role-Based Home" })).toBeVisible();
    await expect(page.getByText("Role-scoped bookings")).toBeVisible();
    await expect(page.getByText("24", { exact: true })).toBeVisible();

    // Open and close work queue modal
    await page.getByRole("button", { name: "View ›" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 3. Navigate to Customers List via Authority Rail (CC-CUS-01)
    await page.getByRole("link", { name: "Customers" }).click();
    await page.waitForURL("/customers");
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible();

    // Test Search input filtering
    const searchInput = page.getByPlaceholder("Search customers");
    await searchInput.fill("Olivia");
    await expect(page.getByText("Olivia Carter")).toBeVisible();
    await expect(page.getByText("Ethan Mitchell")).not.toBeVisible();
    await searchInput.fill("");

    // 4. Navigate to Customer Detail (CC-CUS-02)
    await page.getByRole("link", { name: "View ›" }).first().click();
    await page.waitForURL(/\/customers\/cus_001/);
    await expect(page.getByRole("heading", { name: "Customer Detail" })).toBeVisible();
    await expect(page.getByText("Olivia Carter")).toBeVisible();
    await expect(page.getByText("olivia.carter@demo.com")).toBeVisible();
    await expect(page.getByText("+1 212-555-0148")).toBeVisible();
    await expect(page.getByText("Scope guard")).toBeVisible();

    // 5. Navigate to Edit Basic Profile (CC-CUS-03)
    await page.getByRole("link", { name: "Edit basic profile" }).click();
    await page.waitForURL(/\/customers\/cus_001\/edit/);
    await expect(page.getByRole("heading", { name: "Edit Customer Basic Profile" })).toBeVisible();

    // Verify form validation on Edit screen
    const emailField = page.getByLabel("Email");
    await emailField.fill("invalid-email-format");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();

    // Update with new valid data
    const firstNameField = page.getByLabel("First name");
    await firstNameField.fill("Olivia Vance");
    await emailField.fill("olivia.vance@demo.com");
    await page.getByLabel("Preferred language").selectOption("French");

    // Click Save
    await page.getByRole("button", { name: "Save" }).click();

    // 6. Verify Updated Customer Detail Immediately Reflects Changes
    await page.waitForURL(/\/customers\/cus_001/);
    await expect(page.getByText("Olivia Vance Carter")).toBeVisible();
    await expect(page.getByText("olivia.vance@demo.com")).toBeVisible();
    await expect(page.getByText("French")).toBeVisible();

    // 7. Verify Updated Customers Directory Immediately Reflects Changes
    await page.getByRole("link", { name: "← Back to Customer Directory" }).click();
    await page.waitForURL("/customers");
    await expect(page.getByText("Olivia Vance Carter")).toBeVisible();
    await expect(page.getByText("olivia.vance@demo.com")).toBeVisible();
  });

  test("Edit Form Cancel action preserves original customer record", async ({ page }) => {
    await page.goto("/customers/cus_001/edit");
    await expect(page.getByRole("heading", { name: "Edit Customer Basic Profile" })).toBeVisible();

    // Change first name but click Cancel
    await page.getByLabel("First name").fill("Cancelled Modification");
    await page.getByRole("link", { name: "Cancel", exact: true }).click();

    // Should return to detail page with original name intact
    await page.waitForURL(/\/customers\/cus_001/);
    await expect(page.getByText("Olivia Carter")).toBeVisible();
    await expect(page.getByText("Cancelled Modification")).not.toBeVisible();
  });

  test("Customer Detail edge cases: Invalid ID, missing records", async ({ page }) => {
    await page.goto("/customers/non-existent-id-999");
    await expect(page.getByText("Customer Not Found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Directory" })).toBeVisible();
  });

  test("Role permissions and Scope Guard modal interaction", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible();

    // Click "+ Add Customer" button
    await page.getByRole("button", { name: "+ Add Customer" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Create Customer Account")).toBeVisible();
    await expect(page.getByText("Scope Guard")).toBeVisible();

    // Dismiss modal
    await page.getByRole("button", { name: "Understood" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("Unimplemented sidebar destinations handle gracefully without broken 404", async ({
    page,
  }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /Pricing Module/i })).toBeVisible();
    await expect(page.getByText(/5 \/ 64 Admin Web Screens/i)).toBeVisible();
    await page.getByRole("link", { name: "← Return to Dashboard" }).click();
    await page.waitForURL("/");
    await expect(page.getByRole("heading", { name: "Role-Based Home" })).toBeVisible();
  });

  test("Sign-out from top bar menu clears session and redirects to sign-in", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "User Menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("/auth/sign-in");
    await expect(page.getByRole("heading", { name: "Command Center Sign In" })).toBeVisible();
  });
});
