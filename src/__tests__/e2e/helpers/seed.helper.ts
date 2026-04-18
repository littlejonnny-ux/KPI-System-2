import { Page } from '@playwright/test';

export interface SeedCardResult {
  cardId: string;
}

/**
 * Seed helpers for E2E tests.
 * Test data should be created via Supabase service-role API calls or
 * by interacting with the UI in beforeAll/beforeEach hooks.
 * These helpers provide shortcuts for common setup patterns.
 */

export async function navigateToKpiCards(page: Page): Promise<void> {
  await page.goto('/kpi-cards');
  await page.waitForLoadState('networkidle');
}

export async function waitForCardsList(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="kpi-cards-list"]', { timeout: 10000 });
}
