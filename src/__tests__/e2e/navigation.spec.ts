import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth.helper";

test.describe("Navigation baseline", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  const routes = [
    { path: "/", name: "Dashboard" },
    { path: "/kpi-cards", name: "KPI Cards" },
    { path: "/participants", name: "Participants" },
  ];

  for (const { path, name } of routes) {
    test(`${name} — страница загружается без ошибок`, async ({ page }) => {
      const errors: string[] = [];
      page.on("response", (res) => {
        if (res.status() >= 500) errors.push(`${res.status()} ${res.url()}`);
      });

      await page.goto(path);
      await expect(page).not.toHaveTitle(/error/i);
      expect(errors).toHaveLength(0);
    });
  }
});
