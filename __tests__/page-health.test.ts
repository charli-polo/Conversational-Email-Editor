/**
 * Page Health Checks — Phase 12 regression baseline
 *
 * Verifies that /settings and /editor pages load without errors.
 * These are smoke tests to catch regressions in core routes.
 */
import { test, expect } from '@playwright/test';

test.describe('Page Health', () => {
  test('/settings loads without error', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Settings heading is visible
    await expect(page.locator('h1')).toHaveText('Settings');

    // Agents and Test Prompts tabs are visible
    await expect(
      page.locator('button[role="tab"]:has-text("Agents")')
    ).toBeVisible();
    await expect(
      page.locator('button[role="tab"]:has-text("Test Prompts")')
    ).toBeVisible();

    // Add agent button is visible under Agents tab
    await expect(page.locator('button:has-text("Add agent")')).toBeVisible();
  });

  test('/editor loads without error', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Mode toggle buttons are visible
    await expect(
      page.locator('button:has-text("AI mode")')
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Design mode")')
    ).toBeVisible();
  });
});
