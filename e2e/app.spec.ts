import { expect, test } from '@playwright/test';

test.describe('Smoke', () => {
  test('renders the application shell without fatal errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/');

    await expect(page).toHaveTitle(/КОСМОПОРТ/);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page.locator('#root > *').first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('serves the SPA fallback for deep links', async ({ page }) => {
    const response = await page.goto('/some/deep/link/route');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/КОСМОПОРТ/);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('exposes interactive controls in the DOM', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('button').first()).toBeAttached();
  });
});
