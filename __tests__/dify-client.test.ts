/**
 * Phase 6 regression tests: Dify client functions
 * Covers: renameConversation, submitFeedback, sendChatMessage, uploadFile
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module before importing client
vi.mock('@/lib/db', () => ({
  db: { query: { agents: { findFirst: vi.fn().mockResolvedValue(null) } } },
}));
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Set env vars before importing
process.env.DIFY_API_BASE_URL = 'https://test-dify.example.com';
process.env.DIFY_API_KEY = 'test-api-key';

const {
  renameConversation,
  submitFeedback,
  sendChatMessage,
  getParameters,
} = await import('@/lib/dify/client');

beforeEach(() => {
  mockFetch.mockReset();
});

describe('renameConversation', () => {
  it('calls Dify rename endpoint with auto_generate', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ name: 'Auto Title' })));

    const res = await renameConversation('conv-123', { auto_generate: true });
    const data = await res.json();

    expect(data.name).toBe('Auto Title');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-dify.example.com/v1/conversations/conv-123/name',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        }),
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.auto_generate).toBe(true);
    expect(body.user).toBe('default-user');
  });

  it('calls Dify rename endpoint with explicit name', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ name: 'My Title' })));

    await renameConversation('conv-456', { name: 'My Title' });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.name).toBe('My Title');
  });

  it('uses custom agent config when provided', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ name: 'ok' })));

    await renameConversation(
      'conv-789',
      { auto_generate: true },
      'default-user',
      { apiKey: 'custom-key', baseUrl: 'https://custom.dify.com' },
    );

    expect(mockFetch).toHaveBeenCalledWith(
      'https://custom.dify.com/v1/conversations/conv-789/name',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer custom-key',
        }),
      }),
    );
  });

  it('throws when no API key configured', async () => {
    const origKey = process.env.DIFY_API_KEY;
    delete process.env.DIFY_API_KEY;

    // Re-import to pick up missing key
    vi.resetModules();
    vi.doMock('@/lib/db', () => ({
      db: { query: { agents: { findFirst: vi.fn().mockResolvedValue(null) } } },
    }));
    vi.doMock('drizzle-orm', () => ({ eq: vi.fn() }));
    const freshClient = await import('@/lib/dify/client');

    await expect(
      freshClient.renameConversation('conv', { auto_generate: true }, 'default-user', undefined),
    ).rejects.toThrow('DIFY_API_KEY is not configured');

    process.env.DIFY_API_KEY = origKey;
  });
});

describe('submitFeedback', () => {
  it('sends like feedback to Dify', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ result: 'success' })));

    await submitFeedback('msg-123', 'like');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-dify.example.com/v1/messages/msg-123/feedbacks',
      expect.objectContaining({ method: 'POST' }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.rating).toBe('like');
  });

  it('sends dislike feedback to Dify', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ result: 'success' })));

    await submitFeedback('msg-456', 'dislike');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.rating).toBe('dislike');
  });

  it('sends null rating to clear feedback', async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ result: 'success' })));

    await submitFeedback('msg-789', null);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.rating).toBeNull();
  });
});

describe('sendChatMessage', () => {
  it('sends chat message with conversation_id', async () => {
    mockFetch.mockResolvedValueOnce(new Response('streaming data'));

    await sendChatMessage({
      query: 'Hello',
      conversation_id: 'conv-abc',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.query).toBe('Hello');
    expect(body.conversation_id).toBe('conv-abc');
    expect(body.response_mode).toBe('streaming');
  });

  it('sends files when provided', async () => {
    mockFetch.mockResolvedValueOnce(new Response('streaming data'));

    await sendChatMessage({
      query: 'See this image',
      conversation_id: '',
      files: [{ type: 'image', transfer_method: 'local_file', upload_file_id: 'file-123' }],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.files).toHaveLength(1);
    expect(body.files[0].upload_file_id).toBe('file-123');
  });

  it('throws on HTTP error from Dify', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('rate limited', { status: 429 }),
    );

    await expect(
      sendChatMessage({ query: 'test', conversation_id: '' }),
    ).rejects.toThrow('Dify API error 429');
  });
});

describe('getParameters', () => {
  it('calls parameters endpoint', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({
        opening_statement: 'Welcome!',
        suggested_questions: ['Q1', 'Q2'],
      })),
    );

    const res = await getParameters();
    const data = await res.json();

    expect(data.opening_statement).toBe('Welcome!');
    expect(data.suggested_questions).toEqual(['Q1', 'Q2']);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/parameters?user='),
      expect.any(Object),
    );
  });
});
