import { expect, test } from '@playwright/test';

test('Input Telemetry and Run Pipeline', async ({ page }) => {
  // 1. Load the dashboard
  await page.goto('http://localhost:3000');
  
  // Wait for the dashboard to load
  await expect(page.locator('text=Adaptive Telemetry Dashboard')).toBeVisible();

  // 2. Locate Telemetry Input
  const telemetryInput = page.getByPlaceholder('Paste telemetry JSON here...');
  await expect(telemetryInput).toBeVisible();

  // 3. Enter valid JSON
  const validTelemetry = {
    enemiesHit: 10,
    damageDone: 250,
    timeInCombat: 45,
    kills: 5,
    itemsCollected: 3,
    pickupAttempts: 3,
    timeNearInteractables: 15,
    distanceTraveled: 800,
    timeSprinting: 120,
    timeOutOfCombat: 60
  };
  
  await telemetryInput.fill(JSON.stringify(validTelemetry, null, 2));

  // 4. Verify "Valid JSON" indicator appears
  await expect(page.locator('text=Valid JSON')).toBeVisible();

  // 5. Click "Run" button
  // The button has text "Run" and is inside TopBar
  const runButton = page.getByRole('button', { name: 'Run', exact: true });
  await runButton.click();

  // 6. Verify Execution
  // CenterPanel should show steps. "Pipeline Execution" is the header.
  await expect(page.locator('text=Pipeline Execution')).toBeVisible();
  
  // Verify at least one step appears, e.g., "Input Validation"
  // Verify at least one step appears
  await expect(page.locator('text=Step 1')).toBeVisible();
  await expect(page.locator('text=Input Validation')).toBeVisible();

  // 7. Click a step to expand (e.g., Step 1)
  await page.click('text=Input Validation');
  await expect(page.locator('text=Processing pipeline step...').or(page.locator('text=Checking if your game data'))).toBeVisible();

  console.log('Input and Execution Test Passed');
});
