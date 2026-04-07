/**
 * Phase 9 E2E verification tests
 * Covers: TAG-01 (assign tag), TAG-02 (remove tag), TAG-03 (create new tag),
 *         TAG-04 (autocomplete existing tags)
 *
 * All tests use API-seeded data via seedConversation + tag API helpers.
 */
import { test, expect } from '@playwright/test';
import { seedConversation } from './fixtures/test-helpers';
import type { APIRequestContext } from '@playwright/test';

async function assignTag(request: APIRequestContext, threadId: string, name: string) {
  const res = await request.post(`/api/threads/${threadId}/tags`, {
    data: { name },
  });
  return res.json();
}

test.describe.serial('Phase 9: Tagging System', () => {

  test('TAG-01: Assign a tag via popover and see badge appear', async ({ page, request }) => {
    const id = await seedConversation(request, 'Tag Test Conversation');

    await page.goto('/conversations');
    await expect(page.getByText('Tag Test Conversation')).toBeVisible({ timeout: 10000 });

    // Hover to reveal action buttons
    const row = page.locator('.group').filter({ hasText: 'Tag Test Conversation' });
    await row.hover();

    // Click the + (Add tag) button — use force since it may have stopPropagation
    const addTagBtn = row.getByTitle('Add tag');
    await expect(addTagBtn).toBeVisible({ timeout: 3000 });
    await addTagBtn.click({ force: true });

    // Wait for popover to appear — cmdk input inside the popover
    const cmdkInput = page.locator('[cmdk-input]');
    await expect(cmdkInput).toBeVisible({ timeout: 5000 });

    // Type a new tag name and press Enter
    await cmdkInput.fill('work');
    await cmdkInput.press('Enter');

    // Tag badge should appear on the conversation
    // Allow time for optimistic update
    await expect(row.getByText('work').first()).toBeVisible({ timeout: 5000 });
  });

  test('TAG-02: Remove a tag via x button', async ({ page, request }) => {
    const id = await seedConversation(request, 'Remove Tag Test');
    // Assign tag via API
    await assignTag(request, id, 'removeme');

    await page.goto('/conversations');
    await expect(page.getByText('Remove Tag Test')).toBeVisible({ timeout: 10000 });

    const row = page.locator('.group').filter({ hasText: 'Remove Tag Test' });

    // Tag badge should be visible
    await expect(row.getByText('removeme')).toBeVisible({ timeout: 5000 });

    // Click the x button on the tag badge — the x is inside the badge
    const badge = row.locator('div').filter({ hasText: 'removeme' }).first();
    const removeBtn = badge.locator('button');
    await removeBtn.click({ force: true });

    // Badge should disappear
    await expect(row.getByText('removeme')).not.toBeVisible({ timeout: 5000 });
  });

  test('TAG-03: Create a new tag that does not exist yet', async ({ page, request }) => {
    const id = await seedConversation(request, 'New Tag Creation');

    await page.goto('/conversations');
    await expect(page.getByText('New Tag Creation')).toBeVisible({ timeout: 10000 });

    const row = page.locator('.group').filter({ hasText: 'New Tag Creation' });
    await row.hover();

    await row.getByTitle('Add tag').click({ force: true });

    const cmdkInput = page.locator('[cmdk-input]');
    await expect(cmdkInput).toBeVisible({ timeout: 5000 });

    // Type a unique tag name
    await cmdkInput.fill('brand-new-tag');
    await cmdkInput.press('Enter');

    // New tag badge should appear
    await expect(row.getByText('brand-new-tag')).toBeVisible({ timeout: 5000 });
  });

  test('TAG-04: Autocomplete suggests existing tags', async ({ page, request }) => {
    // Create two conversations, assign a tag to the first via API
    const id1 = await seedConversation(request, 'Autocomplete Source');
    await assignTag(request, id1, 'shared-tag');

    const id2 = await seedConversation(request, 'Autocomplete Target');

    await page.goto('/conversations');
    await expect(page.getByText('Autocomplete Target')).toBeVisible({ timeout: 10000 });

    const targetRow = page.locator('.group').filter({ hasText: 'Autocomplete Target' });
    await targetRow.hover();

    await targetRow.getByTitle('Add tag').click({ force: true });

    const cmdkInput = page.locator('[cmdk-input]');
    await expect(cmdkInput).toBeVisible({ timeout: 5000 });

    // Type partial name — autocomplete should show suggestion
    await cmdkInput.fill('shared');

    // The existing tag should appear in the suggestion list
    const suggestion = page.locator('[cmdk-item]').filter({ hasText: 'shared-tag' });
    await expect(suggestion).toBeVisible({ timeout: 5000 });

    // Select it
    await suggestion.click();

    // Badge should appear on target row
    await expect(targetRow.getByText('shared-tag')).toBeVisible({ timeout: 5000 });
  });

  test('TAG-01b: Tags persist after page refresh', async ({ page, request }) => {
    const id = await seedConversation(request, 'Persist Test');
    await assignTag(request, id, 'persistent');

    await page.goto('/conversations');
    const row = page.locator('.group').filter({ hasText: 'Persist Test' });
    await expect(row.getByText('persistent')).toBeVisible({ timeout: 10000 });

    // Refresh
    await page.reload();

    // Tag should still be there
    await expect(row.getByText('persistent')).toBeVisible({ timeout: 10000 });
  });
});
