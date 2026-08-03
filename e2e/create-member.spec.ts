import { test, expect } from "@playwright/test";

const TEST_EMAIL = "jane.doe.test@example.com";

async function deleteTestMemberIfExists(page: ReturnType<typeof test>["page"]) {
  await page.goto("/members");
  const testRow = page.locator("tr", { hasText: TEST_EMAIL }).first();
  if (await testRow.isVisible().catch(() => false)) {
    const deleteButton = testRow.locator("button[aria-label^='Delete']");
    await deleteButton.click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(testRow).toHaveCount(0);
  }
}

test.describe("Create Member", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/members");
    await deleteTestMemberIfExists(page);
  });

  test.afterEach(async ({ page }) => {
    await deleteTestMemberIfExists(page);
  });

  test("TC-MEM-001: create a new member with all fields", async ({ page }) => {
    await page.goto("/members");

    // Click the top Add Member button
    await page.getByRole("button", { name: "Add Member" }).first().click();

    // Fill the form
    await page.getByLabel("Name").fill("Jane Doe");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Role").fill("QA Engineer");
    await page.getByLabel("Hourly Cost (€)").fill("32,00");
    await page.getByLabel("Billing Rate (€)").fill("50,00");

    // Verify margin is calculated immediately
    await expect(page.getByLabel("Margin")).toHaveValue("36,00%");

    // Submit the form
    await page.locator("form").getByRole("button", { name: "Add Member" }).click();

    // Verify the member appears in the table
    const row = page.locator("tr", { hasText: TEST_EMAIL }).first();
    await expect(row).toBeVisible();

    await expect(row).toContainText("Jane Doe");
    await expect(row).toContainText("QA Engineer");
    await expect(row).toContainText("€ 32,00");
    await expect(row).toContainText("€ 50,00");
    await expect(row).toContainText("36,00%");
  });
});
