import { test } from '@playwright/test';

test.describe('test3', () => {
  test('waits for 3s', async ({ page }) => {
    await page.waitForTimeout(3000);
  });
});

