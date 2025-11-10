import { test } from '@playwright/test';

test.describe('test1', () => {
  test('waits for 1s', async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  test.skip('should be skipped', async ({ page }) => {
    await page.waitForTimeout(1000);
  });

  test('should fail', async ({ page }) => {
    // This will fail because there's no element to click
    await page.click('invalid-selector');
  });
});

