/**
 * Phase 10 E2E verification tests
 * Covers: TAB-01 (All tab shows every conversation),
 *         TAB-02 (Tag tab filters to matching conversations),
 *         TAB-03 (Switching back to All shows all),
 *         TAB-03b (Empty tag tab shows contextual message),
 *         TAB-01b (Tab bar hidden when no tags exist)
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

test.describe.serial('Phase 10: Tab Navigation', () => {

  test('TAB-01b: Tab bar hidden when no tags exist', async ({ page, request }) => {
    // Seed a conversation with no tags
    await seedConversation(request, 'No Tags Conv');

    await page.goto('/conversations');
    await expect(page.getByText('No Tags Conv')).toBeVisible({ timeout: 10000 });

    // Tab bar should NOT be visible when no tags exist
    await expect(page.getByRole('tablist')).not.toBeVisible({ timeout: 3000 });
  });

  test('TAB-01: All tab shows every conversation', async ({ page, request }) => {
    // Seed 2 conversations
    const id1 = await seedConversation(request, 'Tab Alpha Conv');
    const id2 = await seedConversation(request, 'Tab Beta Conv');

    // Assign a tag to conversation 1 so tab bar renders
    await assignTag(request, id1, 'alpha');

    await page.goto('/conversations');

    // Wait for tab bar to appear
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 10000 });

    // "All" tab should be visible
    await expect(page.getByRole('tab', { name: 'All' })).toBeVisible({ timeout: 5000 });

    // Both conversations should be visible in the list
    await expect(page.getByText('Tab Alpha Conv')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Tab Beta Conv')).toBeVisible({ timeout: 5000 });
  });

  test('TAB-02: Tag tab filters to matching conversations only', async ({ page, request }) => {
    // Seed 2 conversations, assign tag "beta" to only the first
    const id1 = await seedConversation(request, 'Filter Match Conv');
    const id2 = await seedConversation(request, 'Filter No Match Conv');

    await assignTag(request, id1, 'beta');

    await page.goto('/conversations');
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 10000 });

    // Click the "beta" tab
    await page.getByRole('tab', { name: 'beta' }).click();

    // First conversation (with "beta" tag) should be visible
    await expect(page.getByText('Filter Match Conv')).toBeVisible({ timeout: 5000 });

    // Second conversation (without "beta" tag) should NOT be visible
    await expect(page.getByText('Filter No Match Conv')).not.toBeVisible({ timeout: 5000 });
  });

  test('TAB-03: Switching back to All tab shows all conversations', async ({ page, request }) => {
    // Seed 2 conversations, assign tag to only one
    const id1 = await seedConversation(request, 'Switch Test A');
    const id2 = await seedConversation(request, 'Switch Test B');

    await assignTag(request, id1, 'gamma');

    await page.goto('/conversations');
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 10000 });

    // Click "gamma" tab to filter
    await page.getByRole('tab', { name: 'gamma' }).click();

    // Only matching conversation visible
    await expect(page.getByText('Switch Test A')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Switch Test B')).not.toBeVisible({ timeout: 5000 });

    // Click "All" tab to show all again
    await page.getByRole('tab', { name: 'All' }).click();

    // Both conversations should be visible again
    await expect(page.getByText('Switch Test A')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Switch Test B')).toBeVisible({ timeout: 5000 });
  });

  test('TAB-03b: Empty tag tab shows contextual message', async ({ page, request }) => {
    // Seed 1 conversation, assign tag "delta" via API
    const id = await seedConversation(request, 'Empty Tag Conv');
    const tagData = await assignTag(request, id, 'delta');
    const tagId = tagData.tag?.id;

    // Remove the tag from conversation so no conversations match "delta"
    if (tagId) {
      await request.delete(`/api/threads/${id}/tags/${tagId}`);
    }

    await page.goto('/conversations');
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 10000 });

    // Click "delta" tab -- the tag still exists even though no conversations have it
    await page.getByRole('tab', { name: 'delta' }).click();

    // Should show contextual empty message
    await expect(page.getByText('No conversations with this tag')).toBeVisible({ timeout: 5000 });
  });
});
