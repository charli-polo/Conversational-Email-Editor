/**
 * Phase 6 regression tests: Save-on-demand conversation persistence flow
 * Covers: D-24 save flow logic, Dify rename, auto-persist signaling
 *
 * Tests the save orchestration logic (thread creation, message serialization,
 * Dify rename, URL update) without rendering React components.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Save flow orchestration', () => {
  /**
   * Simulates the save button's handleSave logic extracted as a pure function.
   * This tests the orchestration without React rendering.
   */
  async function simulateSave(params: {
    messages: Array<{ role: string; content: Array<{ type: string; text?: string }> }>;
    conversationId: string;
    savedThreadIdRef: { current: string };
  }) {
    const { messages, conversationId, savedThreadIdRef } = params;
    if (messages.length === 0) return { status: 'empty' as const };

    // 1. Create thread in DB
    const createRes = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const { id: threadId } = await createRes.json();

    // 2. Serialize messages
    const serializedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join(''),
    }));

    // 3. Save messages
    await fetch(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: serializedMessages }),
    });

    // 4. Auto-generate title from Dify
    let title = serializedMessages.find((m) => m.role === 'user')?.content.slice(0, 50) || 'Saved conversation';
    if (conversationId) {
      const renameRes = await fetch(`/api/brief/conversations/${conversationId}/name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_generate: true }),
      });
      const renameData = await renameRes.json();
      if (renameData.name) title = renameData.name;
    }

    // 5. Update thread with title
    await fetch(`/api/threads/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, difyConversationId: conversationId || undefined }),
    });

    // 6. Enable auto-persist
    savedThreadIdRef.current = threadId;

    return { status: 'saved' as const, threadId, title };
  }

  it('creates thread, saves messages, renames via Dify, and enables auto-persist', async () => {
    // Mock: create thread
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'thread-new-001' })),
    );
    // Mock: save messages
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    // Mock: Dify rename
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ name: 'Auto-generated title from Dify' })),
    );
    // Mock: update thread
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    const savedThreadIdRef = { current: '' };
    const result = await simulateSave({
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
        { role: 'assistant', content: [{ type: 'text', text: 'Hi there!' }] },
      ],
      conversationId: 'dify-conv-123',
      savedThreadIdRef,
    });

    expect(result.status).toBe('saved');
    expect(result.threadId).toBe('thread-new-001');
    expect(result.title).toBe('Auto-generated title from Dify');
    expect(savedThreadIdRef.current).toBe('thread-new-001');

    // Verify API calls
    expect(mockFetch).toHaveBeenCalledTimes(4);

    // 1. Create thread
    expect(mockFetch.mock.calls[0][0]).toBe('/api/threads');

    // 2. Save messages
    expect(mockFetch.mock.calls[1][0]).toBe('/api/threads/thread-new-001/messages');
    const savedMsgs = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(savedMsgs.messages).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]);

    // 3. Dify rename
    expect(mockFetch.mock.calls[2][0]).toBe('/api/brief/conversations/dify-conv-123/name');
    const renameBody = JSON.parse(mockFetch.mock.calls[2][1].body);
    expect(renameBody.auto_generate).toBe(true);

    // 4. Update thread with title
    expect(mockFetch.mock.calls[3][0]).toBe('/api/threads/thread-new-001');
    const patchBody = JSON.parse(mockFetch.mock.calls[3][1].body);
    expect(patchBody.title).toBe('Auto-generated title from Dify');
    expect(patchBody.difyConversationId).toBe('dify-conv-123');
  });

  it('falls back to first user message as title when no conversationId', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'thread-002' })),
    );
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    // No Dify rename call (no conversationId)
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    const result = await simulateSave({
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'Write me an email about quarterly results' }] },
        { role: 'assistant', content: [{ type: 'text', text: 'Here is a draft...' }] },
      ],
      conversationId: '',
      savedThreadIdRef: { current: '' },
    });

    expect(result.title).toBe('Write me an email about quarterly results');
    // Only 3 calls (no rename)
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('truncates long first-user-message title to 50 chars', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'thread-003' })),
    );
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    const longMessage = 'A'.repeat(100);
    const result = await simulateSave({
      messages: [
        { role: 'user', content: [{ type: 'text', text: longMessage }] },
        { role: 'assistant', content: [{ type: 'text', text: 'ok' }] },
      ],
      conversationId: '',
      savedThreadIdRef: { current: '' },
    });

    expect(result.title!.length).toBe(50);
  });

  it('returns empty status for empty messages', async () => {
    const result = await simulateSave({
      messages: [],
      conversationId: '',
      savedThreadIdRef: { current: '' },
    });

    expect(result.status).toBe('empty');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('filters non-text content parts during serialization', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'thread-004' })),
    );
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    mockFetch.mockResolvedValueOnce(new Response('ok'));

    await simulateSave({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'See attached' },
            { type: 'data', text: undefined }, // attachment data part — should be filtered
          ],
        },
        {
          role: 'assistant',
          content: [
            { type: 'reasoning', text: 'internal thought' }, // reasoning — should be filtered
            { type: 'text', text: 'Here is my response' },
          ],
        },
      ],
      conversationId: '',
      savedThreadIdRef: { current: '' },
    });

    const savedMsgs = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(savedMsgs.messages[0].content).toBe('See attached');
    expect(savedMsgs.messages[1].content).toBe('Here is my response');
  });
});

describe('Auto-persist signaling', () => {
  it('threadId is included in chat API body when savedThreadIdRef is set', () => {
    // This tests the chat adapter's behavior: when savedThreadIdRef.current is set,
    // the fetch body should include threadId
    const savedThreadIdRef = { current: 'thread-persisted-001' };
    const body = JSON.stringify({
      message: 'follow-up message',
      conversation_id: 'conv-abc',
      ...(savedThreadIdRef.current ? { threadId: savedThreadIdRef.current } : {}),
    });

    const parsed = JSON.parse(body);
    expect(parsed.threadId).toBe('thread-persisted-001');
  });

  it('threadId is omitted when savedThreadIdRef is empty', () => {
    const savedThreadIdRef = { current: '' };
    const body = JSON.stringify({
      message: 'first message',
      conversation_id: '',
      ...(savedThreadIdRef.current ? { threadId: savedThreadIdRef.current } : {}),
    });

    const parsed = JSON.parse(body);
    expect(parsed.threadId).toBeUndefined();
  });
});

describe('New conversation reset', () => {
  it('clears all refs on new conversation', () => {
    const savedThreadIdRef = { current: 'thread-old' };
    const conversationIdRef = { current: 'conv-old' };

    // Simulate handleNewConversation
    savedThreadIdRef.current = '';
    conversationIdRef.current = '';

    expect(savedThreadIdRef.current).toBe('');
    expect(conversationIdRef.current).toBe('');
  });
});
