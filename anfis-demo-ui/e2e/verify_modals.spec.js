const { test, expect } = require('@playwright/test');

test('Educational Modals should open on click', async ({ page }) => {
  // 1. Load the dashboard
  console.log('Navigating to localhost:3000...');
  await page.goto('http://localhost:3000');
  
  // Wait for the hydration to complete
  try {
    await page.waitForSelector('text=Combat', { timeout: 10000 });
  } catch (e) {
    console.log('Timeout waiting for Combat text. Taking screenshot of failure state.');
    await page.screenshot({ path: 'load_failure.png' });
    throw e;
  }

  // TEST 1: Metric Card (Confidence)
  console.log('Testing Confidence Modal...');
  await page.click('text=Confidence');
  await expect(page.locator('text=Inference Confidence')).toBeVisible();
  await page.keyboard.press('Escape');
  console.log('Confidence: PASS');

  // TEST 2: Comparative Panel (Target Std Dev)
  console.log('Testing Comparative Panel Modal...');
  await page.click('text=Target Std Dev');
  await expect(page.locator('text=Target Standard Deviation')).toBeVisible();
  await page.keyboard.press('Escape');
  console.log('Comparative: PASS');

  // TEST 3: Center Panel (Pipeline Step)
  console.log('Testing Pipeline Step Modal...');
  await page.click('text=Membership Calculation');
  await expect(page.locator('text=Step 3: Membership Calculation')).toBeVisible();
  await page.keyboard.press('Escape');
  console.log('Pipeline: PASS');

  console.log('ALL MODAL TESTS PASSED');
});
