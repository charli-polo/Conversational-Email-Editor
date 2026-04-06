/**
 * Phase 6 regression tests: Dify adapters
 * Covers: FeedbackAdapter, AttachmentAdapter (D-12, D-17)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock basePath
vi.mock('@/lib/base-path', () => ({ basePath: '' }));

const { createDifyFeedbackAdapter, createDifyAttachmentAdapter } = await import(
  '@/lib/dify/adapters'
);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('createDifyFeedbackAdapter', () => {
  it('submits positive feedback with difyMessageId', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    const adapter = createDifyFeedbackAdapter(() => 'thread-abc');

    await adapter.submit({
      type: 'positive',
      message: {
        id: 'local-msg-1',
        role: 'assistant',
        content: [],
        metadata: {
          custom: { difyMessageId: 'dify-msg-123' },
        },
      },
    } as any);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/brief/feedback',
      expect.objectContaining({ method: 'POST' }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.rating).toBe('like');
    expect(body.difyMessageId).toBe('dify-msg-123');
    expect(body.threadId).toBe('thread-abc');
    expect(body.messageId).toBe('local-msg-1');
  });

  it('submits negative feedback', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    const adapter = createDifyFeedbackAdapter(() => 'thread-xyz');

    await adapter.submit({
      type: 'negative',
      message: {
        id: 'local-msg-2',
        role: 'assistant',
        content: [],
        metadata: { custom: { difyMessageId: 'dify-msg-456' } },
      },
    } as any);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.rating).toBe('dislike');
  });

  it('handles missing difyMessageId gracefully', async () => {
    mockFetch.mockResolvedValueOnce(new Response('ok'));
    const adapter = createDifyFeedbackAdapter(() => 'thread-no-dify');

    await adapter.submit({
      type: 'positive',
      message: {
        id: 'local-msg-3',
        role: 'assistant',
        content: [],
        metadata: {},
      },
    } as any);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.difyMessageId).toBeUndefined();
  });
});

describe('createDifyAttachmentAdapter', () => {
  it('accepts image/* and .pdf', () => {
    const adapter = createDifyAttachmentAdapter();
    expect(adapter.accept).toBe('image/*,.pdf');
  });

  it('creates pending attachment from file', async () => {
    const adapter = createDifyAttachmentAdapter();
    const file = new File(['test'], 'photo.png', { type: 'image/png' });

    const pending = await adapter.add({ file });

    expect(pending.id).toBeTruthy();
    expect(pending.type).toBe('image');
    expect(pending.name).toBe('photo.png');
    expect(pending.status.type).toBe('requires-action');
    expect(pending.file).toBe(file);
  });

  it('creates document type for non-image files', async () => {
    const adapter = createDifyAttachmentAdapter();
    const file = new File(['pdf content'], 'doc.pdf', { type: 'application/pdf' });

    const pending = await adapter.add({ file });

    expect(pending.type).toBe('document');
  });

  it('uploads file and returns data content part with upload_file_id', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'dify-upload-001' })),
    );

    const adapter = createDifyAttachmentAdapter();
    const file = new File(['img'], 'test.jpg', { type: 'image/jpeg' });
    const pending = await adapter.add({ file });
    const complete = await adapter.send(pending);

    expect(complete.status.type).toBe('complete');
    expect(complete.content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'data',
          name: 'dify-file',
          data: { upload_file_id: 'dify-upload-001' },
        }),
      ]),
    );
  });

  it('throws on upload failure', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('error', { status: 500 }),
    );

    const adapter = createDifyAttachmentAdapter();
    const file = new File(['img'], 'fail.jpg', { type: 'image/jpeg' });
    const pending = await adapter.add({ file });

    await expect(adapter.send(pending)).rejects.toThrow('File upload failed: 500');
  });

  it('remove is a no-op', async () => {
    const adapter = createDifyAttachmentAdapter();
    // Should not throw
    await adapter.remove({ id: 'any' } as any);
  });
});
