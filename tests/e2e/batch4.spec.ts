import { expect, test } from "@playwright/test";

test.describe("Batch 4 E2E Integration: Concierge Requests & Conversations", () => {
  test.beforeEach(async ({ page }) => {
    // Deterministic reset
    await page.goto("/qa");
    await page.getByRole("button", { name: "Reset Concierge Requests & Conversations" }).click();
  });

  test("CC-CON-01: Concierge Requests list rendering, filters, and navigation", async ({
    page,
  }) => {
    await page.goto("/concierge/requests");

    await expect(page.getByRole("heading", { name: "Concierge Requests List" })).toBeVisible();

    // Verify initial table rows
    await expect(page.getByText("CR-261124-01", { exact: true })).toBeVisible();
    await expect(page.getByText("Olivia Carter")).toBeVisible();
    await expect(page.getByText("CR-261124-02", { exact: true })).toBeVisible();
    await expect(page.getByText("Ethan Mitchell")).toBeVisible();

    // Verify type filter
    await page.getByLabel("Type:").selectOption("PLAN_TRIP");
    await expect(page.getByText("CR-261124-01", { exact: true })).toBeVisible();
    await expect(page.getByText("CR-261124-02", { exact: true })).not.toBeVisible();

    // Clear filter
    await page.getByLabel("Type:").selectOption("ALL");
    await expect(page.getByText("CR-261124-02", { exact: true })).toBeVisible();

    // Verify search
    await page.getByLabel("Search Requests").fill("Sophia");
    await expect(page.getByText("CR-261124-03", { exact: true })).toBeVisible();
    await expect(page.getByText("CR-261124-01", { exact: true })).not.toBeVisible();
  });

  test("CC-CON-05 -> CC-CON-02: Create Concierge Request on Behalf and view detail", async ({
    page,
  }) => {
    await page.goto("/concierge/requests/create");

    await expect(
      page.getByRole("heading", { name: "Create Concierge Request on Behalf" }),
    ).toBeVisible();

    // Fill intake form
    await page.getByLabel(/Customer/).selectOption("cus_001");
    await page.getByLabel("Linked Trip Container (Optional)").selectOption("TRIP-261124-04");
    await page.locator("#req-type-special").check();
    await page.getByLabel("Service Context (Optional)").fill("Helicopter Transfer");
    await page
      .getByLabel(/Request Details/)
      .fill("Require private chopper from JFK to Hamptons helipad upon touchdown.");
    await page.getByLabel("Assigned Concierge").fill("Elena Rostova");

    // Submit
    await page.getByRole("button", { name: "Submit Request" }).click();

    // Should redirect to the new request detail page
    await expect(page).toHaveURL(/\/concierge\/requests\/cr_/);
    await expect(
      page.getByRole("heading", { name: "Concierge Request Detail / Management" }),
    ).toBeVisible();
    await expect(page.getByText("Helicopter Transfer").first()).toBeVisible();
  });

  test("CC-CON-02: Concierge Request Detail management, status update, and navigation to chat", async ({
    page,
  }) => {
    await page.goto("/concierge/requests/cr_001");

    await expect(
      page.getByRole("heading", { name: "Concierge Request Detail / Management" }),
    ).toBeVisible();

    // Check request reference and context with exact: true
    await expect(page.getByText("CR-261124-01", { exact: true })).toBeVisible();
    await expect(page.getByText("Olivia Carter")).toBeVisible();
    await expect(page.getByText("TRIP-261124-04")).toBeVisible();

    // Verify operational inventory boundary callout
    await expect(page.getByText("Inventory & Booking Boundary")).toBeVisible();

    // Update status to IN_PROGRESS
    await page.getByLabel("Status").selectOption("IN_PROGRESS");
    await page.getByLabel("Update Request Notes").fill("Coordinated with aviation handler.");
    await page.getByRole("button", { name: "Save Updates" }).click();

    await expect(page.getByText("Concierge request updated successfully.")).toBeVisible();

    // Navigate to conversation
    await page.getByRole("link", { name: /Open Conversation/ }).click();
    await expect(page).toHaveURL(/\/concierge\/conversations\/conv_001/);
  });

  test("CC-CON-03 & CC-CON-04: Conversation inbox, message sending, and inbox sync", async ({
    page,
  }) => {
    await page.goto("/concierge/conversations");

    await expect(page.getByRole("heading", { name: "Concierge Conversation Inbox" })).toBeVisible();

    // Verify unread badge on conv_001
    await expect(page.getByText("Olivia Carter")).toBeVisible();
    await expect(page.getByText("1 unread")).toBeVisible();

    // Open conv_001
    await page.getByRole("link", { name: "View ›" }).first().click();
    await expect(page).toHaveURL(/\/concierge\/conversations\/conv_001/);

    // Verify thread header and bubbles
    await expect(
      page.getByRole("heading", { name: "Concierge Conversation Detail" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Hello, could you coordinate our JFK arrival transfer with our estate concierge?",
      ),
    ).toBeVisible();

    // Compose and send new message
    await page
      .getByLabel("Message Input")
      .fill("VIP tarmac helicopter clearance confirmed. Pilot is Captain Davies.");
    await page.getByRole("button", { name: "Send Message" }).click();

    // Verify message appears in conversation thread
    await expect(
      page.getByText("VIP tarmac helicopter clearance confirmed. Pilot is Captain Davies."),
    ).toBeVisible();

    // Return to inbox and verify last message and zero unread
    await page.getByRole("link", { name: "← Back to Conversation Inbox" }).click();
    await expect(page).toHaveURL("/concierge/conversations");
    await expect(
      page.getByText("VIP tarmac helicopter clearance confirmed. Pilot is Captain Davies."),
    ).toBeVisible();
    await expect(page.getByText("1 unread")).not.toBeVisible();
  });

  test("Negative Guard: Invalid Request and Conversation IDs show clean error boundaries", async ({
    page,
  }) => {
    // Invalid request
    await page.goto("/concierge/requests/cr_invalid_999");
    await expect(page.getByText("Concierge Request Not Found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Requests List" })).toBeVisible();

    // Invalid conversation
    await page.goto("/concierge/conversations/conv_invalid_999");
    await expect(page.getByText("Conversation Not Found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Conversation Inbox" })).toBeVisible();
  });
});
