import { test } from '@playwright/test';

test.describe('test5', () => {
  test('waits for 5s', async ({ page }) => {
    await page.waitForTimeout(5000);
  });
});

