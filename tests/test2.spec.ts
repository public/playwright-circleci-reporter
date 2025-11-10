import { test } from '@playwright/test';

test.describe('test2', () => {
  test('waits for 2s', async ({ page }) => {
    await page.waitForTimeout(2000);
  });
});

