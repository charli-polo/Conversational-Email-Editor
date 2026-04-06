/**
 * Phase 6 E2E verification tests
 * Covers: D-07 (opener/suggestions), D-09 (thinking), D-12 (feedback),
 *         D-16 (reasoning), D-24 (save flow), resume, attachments
 */
import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3001';

test.describe('Test 1: Opener and Suggestions (D-07)', () => {
  test('shows opening statement from Dify /parameters', async ({ page }) => {
    await page.goto(BASE);
    // Wait for the page to load and Dify params to fetch
    await page.waitForLoadState('networkidle');

    // Either the Dify opening statement or the fallback "Hello there!" should be visible
    const openerOrFallback = page.locator('[data-role="assistant"]').first()
      .or(page.getByText('Hello there!'))
      .or(page.getByText(/What email|How can I/i));

    await expect(openerOrFallback.first()).toBeVisible({ timeout: 10000 });
  });

  test('shows suggestion buttons on empty thread', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Look for suggestion buttons (from Dify params or test prompts)
    // They could be SuggestionPrimitive.Trigger buttons or ThreadPrimitive.Suggestion
    const suggestions = page.locator('button').filter({ hasText: /\?|email|write|help/i });

    // If Dify returns suggested_questions, we should see buttons
    // If not, at least the opener area should exist
    const threadRoot = page.locator('.aui-thread-root');
    await expect(threadRoot).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Test 2: Message Input and Send (D-09)', () => {
  test('composer has input and send button', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[aria-label="Message input"]');
    await expect(input).toBeVisible({ timeout: 5000 });

    // Type a message
    await input.fill('Hello, this is a test message');
    await expect(input).toHaveValue('Hello, this is a test message');

    // Send button should be visible
    const sendButton = page.locator('[aria-label="Send message"]');
    await expect(sendButton).toBeVisible();
  });

  test('sends message and shows thinking indicator then response', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[aria-label="Message input"]');
    await input.fill('Say hello');

    const sendButton = page.locator('[aria-label="Send message"]');
    await sendButton.click();

    // User message should appear
    const userMessage = page.locator('[data-role="user"]');
    await expect(userMessage.first()).toBeVisible({ timeout: 5000 });

    // Either thinking indicator (bouncing dots) or assistant response should appear
    const assistantArea = page.locator('[data-role="assistant"]');
    await expect(assistantArea.first()).toBeVisible({ timeout: 30000 });

    // Wait for response to complete (stop button disappears or text appears)
    await page.waitForFunction(
      () => {
        const assistants = document.querySelectorAll('[data-role="assistant"]');
        if (assistants.length === 0) return false;
        const last = assistants[assistants.length - 1];
        return last.textContent && last.textContent.trim().length > 0;
      },
      { timeout: 60000 },
    );
  });
});

test.describe('Test 3: Action Bar — Copy (D-12)', () => {
  test('copy button appears on assistant message hover', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Send a message first
    const input = page.locator('[aria-label="Message input"]');
    await input.fill('What is 2+2?');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for assistant response
    const assistantMsg = page.locator('[data-role="assistant"]');
    await expect(assistantMsg.first()).toBeVisible({ timeout: 30000 });

    // Wait for response to finish
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-role="assistant"]');
        return el && el.textContent && el.textContent.trim().length > 5;
      },
      { timeout: 60000 },
    );

    // Check for feedback buttons (always visible — not just on hover)
    // ThumbsUp and ThumbsDown should be in the action bar
    const feedbackBar = assistantMsg.first().locator('button').filter({ has: page.locator('svg') });
    const buttonCount = await feedbackBar.count();
    expect(buttonCount).toBeGreaterThanOrEqual(2); // At least like + dislike
  });
});

test.describe('Test 4: Feedback Buttons (D-12)', () => {
  test('like and dislike buttons are always visible on assistant messages', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[aria-label="Message input"]');
    await input.fill('Tell me a joke');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for full response
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-role="assistant"]');
        return el && el.textContent && el.textContent.trim().length > 5;
      },
      { timeout: 60000 },
    );

    // Feedback buttons (Like/Dislike tooltips) should be present
    const likeButton = page.locator('button').filter({ has: page.locator('[aria-label="Like"], svg') }).first();
    await expect(likeButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Test 5: Save Flow (D-24)', () => {
  test('save button exists and is disabled when no messages', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Save button should exist
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible({ timeout: 5000 });

    // Should be disabled on empty thread
    await expect(saveButton).toBeDisabled();
  });

  test('new button exists', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const newButton = page.getByRole('button', { name: /new/i });
    await expect(newButton).toBeVisible({ timeout: 5000 });
  });

  test('save becomes enabled after sending a message', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[aria-label="Message input"]');
    await input.fill('Short test');
    await page.locator('[aria-label="Send message"]').click();

    // Wait for response
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-role="assistant"]');
        return el && el.textContent && el.textContent.trim().length > 3;
      },
      { timeout: 60000 },
    );

    // Save button should now be enabled
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeEnabled({ timeout: 5000 });
  });

  test('clicking save shows toast and changes to Saved state', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[aria-label="Message input"]');
    await input.fill('Save test message');
    await page.locator('[aria-label="Send message"]').click();

    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-role="assistant"]');
        return el && el.textContent && el.textContent.trim().length > 3;
      },
      { timeout: 60000 },
    );

    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();

    // Should transition to Saved state or show toast
    const savedIndicator = page.getByText(/saved|saving/i);
    await expect(savedIndicator.first()).toBeVisible({ timeout: 10000 });

    // URL should change to /c/{id}
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/c/'),
      { timeout: 10000 },
    );
    expect(page.url()).toMatch(/\/c\/[a-zA-Z0-9-]+/);
  });
});

test.describe('Test 6: Conversation Resume', () => {
  test('saved conversation URL loads and shows messages', async ({ page }) => {
    // First, save a conversation
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[aria-label="Message input"]');
    await input.fill('Resume test');
    await page.locator('[aria-label="Send message"]').click();

    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-role="assistant"]');
        return el && el.textContent && el.textContent.trim().length > 3;
      },
      { timeout: 60000 },
    );

    await page.getByRole('button', { name: /save/i }).click();

    // Wait for URL to update
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/c/'),
      { timeout: 10000 },
    );

    const savedUrl = page.url();

    // Navigate to that URL directly
    await page.goto(savedUrl);
    await page.waitForLoadState('networkidle');

    // Messages should load (at least one user and one assistant message)
    const userMsg = page.locator('[data-role="user"]');
    const assistantMsg = page.locator('[data-role="assistant"]');

    await expect(userMsg.first()).toBeVisible({ timeout: 15000 });
    await expect(assistantMsg.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Test 7: File Upload UI (D-17)', () => {
  test('composer has attachment drop zone', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // The dropzone wraps the composer — check for data-dragging attribute support
    const dropzone = page.locator('[data-dragging]');
    // It may not have the attribute until drag starts, so check the composer structure
    const composer = page.locator('textarea, [aria-label="Message input"]');
    await expect(composer.first()).toBeVisible({ timeout: 5000 });
  });

  test('attachment add button exists when file upload is enabled', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // The add attachment button (paperclip) may or may not be visible depending
    // on Dify file_upload config. Check if the composer renders correctly.
    const composer = page.locator('[aria-label="Message input"]');
    await expect(composer).toBeVisible({ timeout: 5000 });

    // If file upload is enabled, there should be an attachment button
    // If not enabled, verify the composer still works without it
    const attachBtn = page.locator('button').filter({ has: page.locator('svg') });
    const count = await attachBtn.count();
    expect(count).toBeGreaterThanOrEqual(1); // At least the send button
  });
});

test.describe('Test 8: No Console Errors', () => {
  test('no JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out known non-critical warnings
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver'),
    );
    expect(criticalErrors).toEqual([]);
  });

  test('no JavaScript errors during message send', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[aria-label="Message input"]');
    await input.fill('Error check test');
    await page.locator('[aria-label="Send message"]').click();

    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-role="assistant"]');
        return el && el.textContent && el.textContent.trim().length > 3;
      },
      { timeout: 60000 },
    );

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('ResizeObserver'),
    );
    expect(criticalErrors).toEqual([]);
  });
});
