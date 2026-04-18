import { Page, expect } from '@playwright/test';
import { TEST_CREDENTIALS, TEST_URLS } from './constants';

type Role = 'admin' | 'approver' | 'participant';

export async function loginAs(page: Page, role: Role): Promise<void> {
  const { email, password } = TEST_CREDENTIALS[role];

  await page.goto(TEST_URLS.login);
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
  await page.click('[data-testid="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="logout"]');
  await page.waitForURL('**/login');
}
