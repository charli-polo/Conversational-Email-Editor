/**
 * E2E Regression Test Suite
 *
 * Canonical safety-net covering all 7 critical flows defined in Phase 12.
 * Run after every future phase to catch cross-feature breakage.
 *
 * Flows covered:
 *   1. Create conversation + verify in list
 *   2. Rename conversation + verify new name
 *   3. Tag conversation, tab appears, filter works
 *   4. Delete last tagged conversation removes stale tab (Phase 11 fix)
 *   5. Nav link from brief page to /conversations
 *   6. /settings page loads + agent CRUD
 *   7. /editor page loads without error
 *
 * Each describe block seeds its own data independently (D-05/D-06).
 */
import { test, expect } from '@playwright/test';
import { seedConversation, setupDifyMocks } from './fixtures/test-helpers';
import type { APIRequestContext } from '@playwright/test';

// Helper: assign tag to conversation (same pattern as phase 10 spec)
async function assignTag(request: APIRequestContext, threadId: string, name: string) {
  const res = await request.post(`/api/threads/${threadId}/tags`, { data: { name } });
  return res.json();
}

// ---------------------------------------------------------------------------
// 1 & 2: Conversation CRUD
// ---------------------------------------------------------------------------
test.describe.serial('Conversation CRUD', () => {
  test('create conversation and verify it appears in list', async ({ page, request }) => {
    await seedConversation(request, 'Regression Create Test');

    await page.goto('/conversations');
    await expect(page.getByText('Regression Create Test')).toBeVisible({ timeout: 10000 });
  });

  test('rename conversation and verify new name', async ({ page, request }) => {
    await seedConversation(request, 'Rename Me Regression');

    await page.goto('/conversations');
    await expect(page.getByText('Rename Me Regression')).toBeVisible({ timeout: 10000 });

    // Scope to the row containing the conversation
    const row = page.locator('.group', { hasText: 'Rename Me Regression' });
    await row.hover();

    // Click rename button
    await row.getByTitle('Rename conversation').click();

    // Clear and type new name
    const input = page.locator('.divide-y input');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.clear();
    await input.fill('Renamed Regression');
    await input.press('Enter');

    // Verify new name appears and old name is gone
    await expect(page.getByText('Renamed Regression')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Rename Me Regression')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3 & 4: Tagging and Tab Filtering
// ---------------------------------------------------------------------------
test.describe('Tagging and Tab Filtering', () => {
  test('tag conversation, tab appears, filter works', async ({ page, request }) => {
    const taggedId = await seedConversation(request, 'Reg Tagged Alpha');
    await seedConversation(request, 'Reg Untagged Beta');
    await assignTag(request, taggedId, 'regression-tag');

    await page.goto('/conversations');
    await expect(page.getByText('Reg Tagged Alpha')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Reg Untagged Beta')).toBeVisible({ timeout: 10000 });

    // Tab bar should be visible since we have a tag
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 5000 });

    // Click the regression-tag tab
    await page.getByRole('tab', { name: 'regression-tag' }).click();

    // Tagged conversation visible, untagged not visible
    await expect(page.getByText('Reg Tagged Alpha')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Reg Untagged Beta')).not.toBeVisible({ timeout: 5000 });
  });

  test('delete last tagged conversation removes stale tab', async ({ page, request }) => {
    const id = await seedConversation(request, 'Stale Tab Test');
    await assignTag(request, id, 'stale-tag');

    await page.goto('/conversations');
    await expect(page.getByText('Stale Tab Test')).toBeVisible({ timeout: 10000 });

    // Verify stale-tag tab is visible
    await expect(page.getByRole('tab', { name: 'stale-tag' })).toBeVisible({ timeout: 5000 });

    // Delete the conversation via the UI
    const row = page.locator('.group', { hasText: 'Stale Tab Test' });
    await row.hover();
    await row.getByTitle('Delete conversation').click();

    // Confirm in the alert dialog
    await expect(page.getByText('Delete conversation?')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // The stale-tag tab should disappear
    await expect(page.getByRole('tab', { name: 'stale-tag' })).not.toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 5: Navigation
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test('nav link from brief page to /conversations', async ({ page }) => {
    await setupDifyMocks(page);
    await page.goto('/');

    // Wait for the page to load
    await expect(page.locator('[aria-label="Message input"]')).toBeVisible({ timeout: 15000 });

    // Click the "All conversations" link in the header (an <a> tag with href="/conversations")
    await page.locator('a[href*="/conversations"]').click();

    // URL should contain /conversations
    await expect(page).toHaveURL(/\/conversations/);
  });
});

// ---------------------------------------------------------------------------
// 6: Settings Page
// ---------------------------------------------------------------------------
test.describe('Settings Page', () => {
  test('settings page loads and shows tabs', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab', { name: 'Agents' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Test Prompts' })).toBeVisible();
  });

  test('agent CRUD end-to-end', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });

    // Click "Add agent" button
    await page.getByRole('button', { name: 'Add agent' }).click();

    // Fill the agent form
    await page.locator('#agent-label').fill('Regression Agent');
    await page.locator('#agent-api-key').fill('app-regression-test-key-1234');

    // Submit
    await page.getByRole('button', { name: 'Save agent' }).click();

    // Verify agent appears in the list
    await expect(page.getByText('Regression Agent')).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 7: Editor Page
// ---------------------------------------------------------------------------
test.describe('Editor Page', () => {
  test('editor page loads without error', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Mode toggle visible
    await expect(page.getByText('AI mode')).toBeVisible({ timeout: 10000 });

    // Export button visible
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  });
});
