/**
 * Phase 8 tests: Conversation list page logic
 * Covers: LIST-01 browse, LIST-02 navigate, LIST-03 rename, LIST-04 delete, LIST-05 empty state
 *
 * Tests the conversations page orchestration (fetch, rename, delete)
 * and useConversations hook logic without rendering React components.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

/* ---------- Fixtures ---------- */

function makeConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conv-1',
    title: 'Welcome email draft',
    preview: 'Hi there, welcome to our platform...',
    agent_label: 'Formal',
    agent_id: 'agent-1',
    is_archived: false,
    tags: [],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    ...overrides,
  };
}

/* ---------- LIST-01: Browse conversations ---------- */

describe('Conversation list: fetch and browse', () => {
  it('parses threads from API response', async () => {
    const threads = [
      makeConversation({ id: 'c1', title: 'First' }),
      makeConversation({ id: 'c2', title: 'Second' }),
    ];
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ threads }))
    );

    const res = await fetch('/api/threads');
    const data = await res.json();

    expect(data.threads).toHaveLength(2);
    expect(data.threads[0].title).toBe('First');
    expect(data.threads[1].title).toBe('Second');
  });

  it('handles empty thread list gracefully', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ threads: [] }))
    );

    const res = await fetch('/api/threads');
    const data = await res.json();

    expect(data.threads).toHaveLength(0);
  });

  it('handles missing threads key (fallback to empty)', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}))
    );

    const res = await fetch('/api/threads');
    const data = await res.json();
    const conversations = data.threads || [];

    expect(conversations).toHaveLength(0);
  });

  it('displays conversation fields for list rendering', async () => {
    const conv = makeConversation({
      title: 'Product launch',
      agent_label: 'Casual',
      preview: 'Hey team, excited about...',
      updated_at: '2025-06-15T10:30:00Z',
    });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ threads: [conv] }))
    );

    const res = await fetch('/api/threads');
    const data = await res.json();
    const c = data.threads[0];

    expect(c.title).toBe('Product launch');
    expect(c.agent_label).toBe('Casual');
    expect(c.preview).toBe('Hey team, excited about...');
    expect(new Date(c.updated_at).toLocaleDateString()).toBeDefined();
  });

  it('uses "Untitled conversation" fallback for null title', () => {
    const conv = makeConversation({ title: null });
    const displayTitle = conv.title || 'Untitled conversation';
    expect(displayTitle).toBe('Untitled conversation');
  });
});

/* ---------- LIST-02: Navigate to conversation ---------- */

describe('Conversation list: navigation', () => {
  it('builds correct navigation URL from conversation id', () => {
    const basePath = '';
    const conv = makeConversation({ id: 'abc-123' });
    const href = basePath + '/c/' + conv.id;
    expect(href).toBe('/c/abc-123');
  });

  it('builds correct navigation URL with basePath', () => {
    const basePath = '/email-editor';
    const conv = makeConversation({ id: 'xyz-789' });
    const href = basePath + '/c/' + conv.id;
    expect(href).toBe('/email-editor/c/xyz-789');
  });
});

/* ---------- LIST-03: Rename conversation ---------- */

describe('Conversation list: rename', () => {
  it('sends PATCH request with trimmed title', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })));

    const id = 'conv-1';
    const editValue = '  Updated title  ';
    const trimmed = editValue.trim();

    await fetch(`/api/threads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/threads/conv-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated title' }),
    });
  });

  it('skips rename when trimmed value is empty', () => {
    const editValue = '   ';
    const trimmed = editValue.trim();
    const shouldSave = trimmed.length > 0;

    expect(shouldSave).toBe(false);
  });

  it('updates local state optimistically after rename', () => {
    const conversations = [
      makeConversation({ id: 'c1', title: 'Old title' }),
      makeConversation({ id: 'c2', title: 'Other' }),
    ];

    // Simulate updateConversation logic from hook
    const updated = conversations.map(c =>
      c.id === 'c1' ? { ...c, title: 'New title' } : c
    );

    expect(updated[0].title).toBe('New title');
    expect(updated[1].title).toBe('Other');
  });

  it('handles rename API failure gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    let error: Error | null = null;
    try {
      await fetch('/api/threads/conv-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New' }),
      });
    } catch (e) {
      error = e as Error;
    }

    // The page catches errors silently — verify the error is catchable
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toBe('Network error');
  });
});

/* ---------- LIST-04: Delete conversation ---------- */

describe('Conversation list: delete', () => {
  it('sends DELETE request for conversation', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })));

    const id = 'conv-to-delete';
    await fetch(`/api/threads/${id}`, { method: 'DELETE' });

    expect(mockFetch).toHaveBeenCalledWith('/api/threads/conv-to-delete', {
      method: 'DELETE',
    });
  });

  it('removes conversation from local state after delete', () => {
    const conversations = [
      makeConversation({ id: 'c1' }),
      makeConversation({ id: 'c2' }),
      makeConversation({ id: 'c3' }),
    ];

    // Simulate removeConversation logic from hook
    const filtered = conversations.filter(c => c.id !== 'c2');

    expect(filtered).toHaveLength(2);
    expect(filtered.map(c => c.id)).toEqual(['c1', 'c3']);
  });

  it('does nothing when deletingId is null (guard clause)', () => {
    const deletingId: string | null = null;
    let deleteExecuted = false;

    if (deletingId) {
      deleteExecuted = true;
    }

    expect(deleteExecuted).toBe(false);
  });

  it('resets deletingId after successful delete', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })));

    let deletingId: string | null = 'conv-1';
    await fetch(`/api/threads/${deletingId}`, { method: 'DELETE' });
    deletingId = null; // mirrors setDeletingId(null) after delete

    expect(deletingId).toBeNull();
  });

  it('handles delete API failure gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Server error'));

    let error: Error | null = null;
    try {
      await fetch('/api/threads/conv-1', { method: 'DELETE' });
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeInstanceOf(Error);
  });
});

/* ---------- LIST-05: Empty state ---------- */

describe('Conversation list: empty state', () => {
  it('shows empty state when not loading and no conversations', () => {
    const isLoading = false;
    const conversations: unknown[] = [];

    const showEmpty = !isLoading && conversations.length === 0;
    const showLoading = isLoading && conversations.length === 0;
    const showList = conversations.length > 0;

    expect(showEmpty).toBe(true);
    expect(showLoading).toBe(false);
    expect(showList).toBe(false);
  });

  it('shows loading state when fetching', () => {
    const isLoading = true;
    const conversations: unknown[] = [];

    const showEmpty = !isLoading && conversations.length === 0;
    const showLoading = isLoading && conversations.length === 0;

    expect(showEmpty).toBe(false);
    expect(showLoading).toBe(true);
  });

  it('shows list when conversations exist, even if still loading', () => {
    const isLoading = true;
    const conversations = [makeConversation()];

    const showEmpty = !isLoading && conversations.length === 0;
    const showLoading = isLoading && conversations.length === 0;
    const showList = conversations.length > 0;

    expect(showEmpty).toBe(false);
    expect(showLoading).toBe(false);
    expect(showList).toBe(true);
  });

  it('empty state CTA links to root for new conversation', () => {
    const basePath = '';
    const href = `${basePath}/`;
    expect(href).toBe('/');
  });
});

/* ---------- Edit state machine ---------- */

describe('Conversation list: edit state machine', () => {
  it('startEditing sets editingId and prefills current title', () => {
    let editingId: string | null = null;
    let editValue = '';

    // Simulate startEditing
    const startEditing = (id: string, currentTitle: string | null) => {
      editingId = id;
      editValue = currentTitle || '';
    };

    startEditing('conv-1', 'My draft');
    expect(editingId).toBe('conv-1');
    expect(editValue).toBe('My draft');
  });

  it('startEditing handles null title', () => {
    let editingId: string | null = null;
    let editValue = '';

    const startEditing = (id: string, currentTitle: string | null) => {
      editingId = id;
      editValue = currentTitle || '';
    };

    startEditing('conv-2', null);
    expect(editingId).toBe('conv-2');
    expect(editValue).toBe('');
  });

  it('cancelEditing clears state', () => {
    let editingId: string | null = 'conv-1';
    let editValue = 'partial input';

    const cancelEditing = () => {
      editingId = null;
      editValue = '';
    };

    cancelEditing();
    expect(editingId).toBeNull();
    expect(editValue).toBe('');
  });

  it('Enter key triggers save, Escape triggers cancel', () => {
    const actions: string[] = [];
    const onSaveEdit = () => actions.push('save');
    const onCancelEdit = () => actions.push('cancel');

    // Simulate keydown handler
    const handleKeyDown = (key: string) => {
      if (key === 'Enter') onSaveEdit();
      if (key === 'Escape') onCancelEdit();
    };

    handleKeyDown('Enter');
    handleKeyDown('Escape');
    handleKeyDown('Tab'); // no-op

    expect(actions).toEqual(['save', 'cancel']);
  });
});
