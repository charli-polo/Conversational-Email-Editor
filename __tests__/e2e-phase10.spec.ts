/**
 * Phase 10 E2E verification tests
 * Covers: TAB-01 (All tab shows every conversation),
 *         TAB-02 (Tag tab filters to matching conversations),
 *         TAB-03 (Switching back to All shows all),
 *         TAB-03b (Reactive tabs — orphan tag tab disappears),
 *         TAB-01b (Tab bar hidden when no tags exist)
 *
 * All tests use API-seeded data via seedConversation + tag API helpers.
 */
import { test, expect } from '@playwright/test';
import { seedConversation, resetDatabase } from './fixtures/test-helpers';
import type { APIRequestContext } from '@playwright/test';

async function assignTag(request: APIRequestContext, threadId: string, name: string) {
  const res = await request.post(`/api/threads/${threadId}/tags`, {
    data: { name },
  });
  return res.json();
}

test.describe.serial('Phase 10: Tab Navigation', () => {

  test('TAB-01b: Tab bar hidden when no tags exist', async ({ page, request }) => {
    await resetDatabase(request);
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

  test('TAB-03b: Reactive tabs — orphan tag tab disappears when last conversation untagged', async ({ page, request }) => {
    // Seed 2 conversations, assign tag "delta" to the first only
    const id1 = await seedConversation(request, 'Delta Tagged Conv');
    await seedConversation(request, 'Delta Untagged Conv');
    const tagData = await assignTag(request, id1, 'delta');
    const tagId = tagData.tag?.id;

    await page.goto('/conversations');
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 10000 });

    // "delta" tab should be visible while a conversation has the tag
    await expect(page.getByRole('tab', { name: 'delta' })).toBeVisible({ timeout: 5000 });

    // Remove the tag from the conversation via API
    if (tagId) {
      await request.delete(`/api/threads/${id1}/tags/${tagId}`);
    }

    // Reload and verify the "delta" tab disappears (Phase 11 reactive tabs)
    await page.goto('/conversations');
    // Tab bar may still be visible from other tags (alpha, beta, gamma from prior tests)
    // but the "delta" tab specifically should be gone
    await expect(page.getByRole('tab', { name: 'delta' })).not.toBeVisible({ timeout: 5000 });
  });
});
