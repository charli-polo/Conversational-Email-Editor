/**
 * Phase 8 E2E verification tests
 * Covers: LIST-01 (view conversations), LIST-02 (navigate), LIST-03 (rename),
 *         LIST-04 (delete), LIST-05 (empty state)
 *
 * All tests use API-seeded data via seedConversation helper.
 * LIST-05 (empty state) runs first before any seeding occurs.
 * Tests within this spec share DB state (clean DB per spec file via globalSetup).
 */
import { test, expect } from '@playwright/test';
import { seedConversation, resetDatabase } from './fixtures/test-helpers';

test.describe.serial('Phase 8: Conversation List', () => {

  test.describe('LIST-05: Empty state', () => {
    test('shows empty state when no conversations exist', async ({ page, request }) => {
      await resetDatabase(request);
      await page.goto('/conversations');
      await expect(page.getByText('No conversations yet')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Start a new conversation from the brief page')).toBeVisible();

      // Both the header and empty state have "New conversation" buttons
      const newConvButtons = page.getByRole('button', { name: /new conversation/i });
      await expect(newConvButtons).toHaveCount(2);
    });
  });

  test.describe('LIST-01: View conversations', () => {
    test('shows seeded conversations with title and date', async ({ page, request }) => {
      await seedConversation(request, 'First Conversation');
      await seedConversation(request, 'Second Conversation');

      await page.goto('/conversations');
      await expect(page.getByText('First Conversation')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Second Conversation')).toBeVisible();

      // Verify date is displayed (locale date format like M/D/YYYY or DD/MM/YYYY)
      await expect(
        page.locator('.text-muted-foreground').filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}/ }).first()
      ).toBeVisible();
    });
  });

  test.describe('LIST-02: Navigate to conversation', () => {
    test('clicking a conversation navigates to /c/{id}', async ({ page, request }) => {
      const id = await seedConversation(request, 'Navigate Test');

      await page.goto('/conversations');
      await expect(page.getByText('Navigate Test')).toBeVisible({ timeout: 10000 });
      await page.getByText('Navigate Test').click();

      await expect(page).toHaveURL(new RegExp('/c/' + id));
    });
  });

  test.describe('LIST-03: Rename conversation', () => {
    test('inline rename via pencil icon on hover', async ({ page, request }) => {
      await seedConversation(request, 'Old Name');

      await page.goto('/conversations');
      await expect(page.getByText('Old Name')).toBeVisible({ timeout: 10000 });

      // Scope to the row containing 'Old Name' (the .group div)
      const row = page.locator('.group', { hasText: 'Old Name' });

      // Hover over the row to reveal action buttons (opacity-0 -> opacity-100 on hover)
      await row.hover();

      // Click rename button scoped to this row
      await row.getByTitle('Rename conversation').click();

      // The input should appear (only one text input in the list area when editing)
      const input = page.locator('.divide-y input');
      await expect(input).toBeVisible({ timeout: 5000 });

      await input.clear();
      await input.fill('New Name');
      await input.press('Enter');

      await expect(page.getByText('New Name')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Old Name')).not.toBeVisible();
    });
  });

  test.describe('LIST-04: Delete conversation', () => {
    test('delete with confirmation dialog', async ({ page, request }) => {
      await seedConversation(request, 'To Delete');
      await seedConversation(request, 'Keep This');

      await page.goto('/conversations');
      await expect(page.getByText('To Delete')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Keep This')).toBeVisible();

      // Scope to the row containing 'To Delete'
      const row = page.locator('.group', { hasText: 'To Delete' });

      // Hover over 'To Delete' row to reveal action buttons
      await row.hover();

      // Click delete button scoped to this row
      await row.getByTitle('Delete conversation').click();

      // AlertDialog should appear
      await expect(page.getByText('Delete conversation?')).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: 'Delete' }).click();

      // 'To Delete' should disappear, 'Keep This' should remain
      await expect(page.getByText('To Delete')).not.toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Keep This')).toBeVisible();
    });
  });

});
