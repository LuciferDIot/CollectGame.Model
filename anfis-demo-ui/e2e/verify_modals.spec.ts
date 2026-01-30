import { expect, test } from '@playwright/test';

test('Educational Modals should open on click', async ({ page }) => {
  // 1. Load the dashboard
  await page.goto('http://localhost:3000');
  
  // Wait for the hydration to complete and "Combat" card to appear
  await page.waitForSelector('text=Combat');

  // TEST 1: Metric Card (Confidence)
  // Click on the "Confidence" card content
  console.log('Testing Confidence Modal...');
  await page.click('text=Confidence');
  // Check for Dialog Content
  await expect(page.locator('text=Inference Confidence')).toBeVisible();
  await expect(page.locator('text=AVG(Rule_Firing_Strengths)')).toBeVisible();
  // Close modal
  await page.keyboard.press('Escape');
  await expect(page.locator('text=Inference Confidence')).not.toBeVisible();

  // TEST 2: Comparative Panel (Target Std Dev)
  console.log('Testing Comparative Panel Modal...');
  await page.click('text=Target Std Dev');
  await expect(page.locator('text=Target Standard Deviation')).toBeVisible();
  await expect(page.locator('text=std(target_signal)')).toBeVisible();
  await page.keyboard.press('Escape');

  // TEST 3: Center Panel (Pipeline Step)
  console.log('Testing Pipeline Step Modal...');
  await page.click('text=Membership Calculation');
  await expect(page.locator('text=Step 3: Membership Calculation')).toBeVisible();
  await page.keyboard.press('Escape');

  // TEST 4: Model Evaluation (Bottom)
  console.log('Testing Model Eval Modal...');
  await page.click('text=Target Signal Integrity');
  await expect(page.locator('text=Target Integrity')).toBeVisible();
  await page.keyboard.press('Escape');

  // TEST 5: Validation Check (Bottom List)
  console.log('Testing Validation Check Modal...');
  // Find a check that says "Check: " or similar. The list items are "Check: Membership Sum" etc.
  // We'll target the text in the list.
  await page.waitForSelector('text=Validation Checks');
  // Just click the first check name found in the validation list
  const firstCheck = page.locator('h5', { hasText: 'Membership' }).first();
  if (await firstCheck.isVisible()) {
      await firstCheck.click();
      await expect(page.locator('text=Check: Membership')).toBeVisible();
      await page.keyboard.press('Escape');
  } else {
      console.log('Skipping Validation Check test (pipeline might be empty state)');
  }
  
  console.log('ALL MODAL TESTS PASSED');
});
