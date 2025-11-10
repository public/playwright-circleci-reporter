import { test } from '@playwright/test';

test.describe('test4', () => {
  test('waits for 4s', async ({ page }) => {
    await page.waitForTimeout(4000);
  });
});

