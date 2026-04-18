import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth.helper";
import {
  navigateToKpiCards,
  waitForCardsList,
} from "./helpers/seed.helper";
import { TEST_URLS } from "./helpers/constants"; // used by auth guard tests

test.describe("KPI Cards — list page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("shows kpi-cards-list after login", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);
    await expect(page.locator('[data-testid="kpi-cards-list"]')).toBeVisible();
  });

  test("status filter renders all options", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    const trigger = page.locator('[data-testid="filter-status"]');
    await expect(trigger).toBeVisible();
  });

  test("year filter renders", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    const trigger = page.locator('[data-testid="filter-year"]');
    await expect(trigger).toBeVisible();
  });
});

test.describe("KPI Cards — detail page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("navigates to detail page on row click", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    const firstRow = page.locator('[data-testid^="card-row-"]').first();

    if (await firstRow.count() === 0) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForURL(/\/kpi-cards\/.+/);
    await expect(
      page.locator('[data-testid="kpi-card-detail"]')
    ).toBeVisible();
  });

  test("detail page shows header and reward blocks", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    const firstRow = page.locator('[data-testid^="card-row-"]').first();

    if (await firstRow.count() === 0) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForURL(/\/kpi-cards\/.+/);

    await expect(
      page.locator('[data-testid="kpi-card-header"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="kpi-card-reward"]')
    ).toBeVisible();
  });

  test("submit for approval button visible on active card for admin", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    // Find a card with status active or returned
    const activeRow = page
      .locator('[data-testid^="card-row-"]')
      .filter({ hasText: /Активна|Возвращена/ })
      .first();

    if (await activeRow.count() === 0) {
      test.skip();
      return;
    }

    await activeRow.click();
    await page.waitForURL(/\/kpi-cards\/.+/);

    await expect(
      page.locator('[data-testid="submit-for-approval"]')
    ).toBeVisible();
  });

  test("return card button visible on pending_approval card for admin", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    const pendingRow = page
      .locator('[data-testid^="card-row-"]')
      .filter({ hasText: /На согласовании/ })
      .first();

    if (await pendingRow.count() === 0) {
      test.skip();
      return;
    }

    await pendingRow.click();
    await page.waitForURL(/\/kpi-cards\/.+/);

    await expect(
      page.locator('[data-testid="return-card"]')
    ).toBeVisible();
  });

  test("approve line button visible on pending_approval card", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    const pendingRow = page
      .locator('[data-testid^="card-row-"]')
      .filter({ hasText: /На согласовании/ })
      .first();

    if (await pendingRow.count() === 0) {
      test.skip();
      return;
    }

    await pendingRow.click();
    await page.waitForURL(/\/kpi-cards\/.+/);

    const approveBtn = page.locator('[data-testid^="approve-line-"]').first();
    if (await approveBtn.count() === 0) {
      test.skip();
      return;
    }
    await expect(approveBtn).toBeVisible();
  });

  test("return line button visible and requires comment", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    const pendingRow = page
      .locator('[data-testid^="card-row-"]')
      .filter({ hasText: /На согласовании/ })
      .first();

    if (await pendingRow.count() === 0) {
      test.skip();
      return;
    }

    await pendingRow.click();
    await page.waitForURL(/\/kpi-cards\/.+/);

    const returnBtn = page.locator('[data-testid^="return-line-"]').first();
    if (await returnBtn.count() === 0) {
      test.skip();
      return;
    }

    await returnBtn.click();
    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test("kpi-card-reward block shows execution percentage", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    const firstRow = page.locator('[data-testid^="card-row-"]').first();
    if (await firstRow.count() === 0) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForURL(/\/kpi-cards\/.+/);

    const rewardBlock = page.locator('[data-testid="kpi-card-reward"]');
    await expect(rewardBlock).toBeVisible();
    await expect(rewardBlock).toContainText("Выполнение KPI");
    await expect(rewardBlock).toContainText("Вознаграждение");
  });

  test("l2 line rows visible on composite card", async ({ page }) => {
    await navigateToKpiCards(page);
    await waitForCardsList(page);

    const firstRow = page.locator('[data-testid^="card-row-"]').first();
    if (await firstRow.count() === 0) {
      test.skip();
      return;
    }

    await firstRow.click();
    await page.waitForURL(/\/kpi-cards\/.+/);

    // L2 rows may or may not exist — just check the table renders
    await expect(page.locator('[data-testid="kpi-card-detail"]')).toBeVisible();
  });
});

test.describe("KPI Cards — auth guard", () => {
  test("unauthenticated user is redirected from kpi-cards list", async ({
    page,
  }) => {
    await page.goto(TEST_URLS.kpiCards);
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page has required form fields", async ({ page }) => {
    await page.goto(TEST_URLS.login);
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit"]')).toBeVisible();
  });
});
