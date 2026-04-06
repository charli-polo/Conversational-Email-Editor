/**
 * Phase 6 regression tests: SSE event normalization in chat route
 * Covers: event field presence, agent_thought forwarding, error handling (D-09, D-16)
 *
 * These tests verify the SSE proxy transforms Dify events correctly by testing
 * the stream output format against expected event structures.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/dify/client', () => ({
  getActiveAgentConfig: vi.fn().mockResolvedValue({
    apiKey: 'test-key',
    baseUrl: 'https://test-dify.example.com',
  }),
  sendChatMessage: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      conversations: { findFirst: vi.fn().mockResolvedValue(null) },
      agents: { findFirst: vi.fn().mockResolvedValue(null) },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
  },
}));

vi.mock('drizzle-orm', () => ({ eq: vi.fn() }));
vi.mock('@/lib/db/schema', () => ({
  messages: {},
  conversations: {},
  agents: {},
}));

const { sendChatMessage } = await import('@/lib/dify/client');
const { POST } = await import('@/app/api/brief/chat/route');

/** Helper to create a Dify-like SSE stream */
function createDifyStream(events: Array<{ event: string; [key: string]: unknown }>): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const evt of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      }
      controller.close();
    },
  });
}

/** Collect all SSE events from the response stream */
async function collectSSEEvents(response: Response): Promise<Array<Record<string, unknown>>> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const events: Array<Record<string, unknown>> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          events.push(JSON.parse(line.slice(6)));
        } catch { /* skip */ }
      }
    }
  }
  return events;
}

describe('SSE event normalization', () => {
  it('forwards message events with event field', async () => {
    vi.mocked(sendChatMessage).mockResolvedValueOnce(
      new Response(
        createDifyStream([
          { event: 'message', answer: 'Hello!', conversation_id: 'conv-1', message_id: 'msg-1' },
          { event: 'message_end', conversation_id: 'conv-1', message_id: 'msg-1' },
        ]),
      ),
    );

    const req = new Request('http://localhost/api/brief/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hi' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await collectSSEEvents(response);

    // message event should include the event field
    const messageEvent = events.find((e) => e.event === 'message');
    expect(messageEvent).toBeDefined();
    expect(messageEvent!.answer).toBe('Hello!');
    expect(messageEvent!.conversation_id).toBe('conv-1');
    expect(messageEvent!.message_id).toBe('msg-1');

    // done event from message_end
    const doneEvent = events.find((e) => e.event === 'done');
    expect(doneEvent).toBeDefined();
    expect(doneEvent!.conversation_id).toBe('conv-1');
  });

  it('forwards agent_message events with event field', async () => {
    vi.mocked(sendChatMessage).mockResolvedValueOnce(
      new Response(
        createDifyStream([
          { event: 'agent_message', answer: 'Agent response', conversation_id: 'conv-2', message_id: 'msg-2' },
          { event: 'message_end', conversation_id: 'conv-2', message_id: 'msg-2' },
        ]),
      ),
    );

    const req = new Request('http://localhost/api/brief/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Agent test' }),
    });

    const response = await POST(req);
    const events = await collectSSEEvents(response);

    const agentEvent = events.find((e) => e.event === 'agent_message');
    expect(agentEvent).toBeDefined();
    expect(agentEvent!.answer).toBe('Agent response');
  });

  it('forwards agent_thought events with tool info', async () => {
    vi.mocked(sendChatMessage).mockResolvedValueOnce(
      new Response(
        createDifyStream([
          {
            event: 'agent_thought',
            id: 'thought-1',
            thought: 'Let me search for that',
            tool: 'web_search',
            tool_input: '{"query": "test"}',
            observation: 'Found results',
            message_id: 'msg-3',
          },
          { event: 'agent_message', answer: 'Here are the results', conversation_id: 'conv-3', message_id: 'msg-3' },
          { event: 'message_end', conversation_id: 'conv-3', message_id: 'msg-3' },
        ]),
      ),
    );

    const req = new Request('http://localhost/api/brief/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Search something' }),
    });

    const response = await POST(req);
    const events = await collectSSEEvents(response);

    const thoughtEvent = events.find((e) => e.event === 'agent_thought');
    expect(thoughtEvent).toBeDefined();
    expect(thoughtEvent!.thought).toBe('Let me search for that');
    expect(thoughtEvent!.tool).toBe('web_search');
    expect(thoughtEvent!.message_id).toBe('msg-3');
  });

  it('transforms error events into user-friendly messages', async () => {
    vi.mocked(sendChatMessage).mockResolvedValueOnce(
      new Response(
        createDifyStream([
          { event: 'error', message: 'Internal error', code: 500 },
        ]),
      ),
    );

    const req = new Request('http://localhost/api/brief/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Trigger error' }),
    });

    const response = await POST(req);
    const events = await collectSSEEvents(response);

    const errorEvent = events.find((e) => e.event === 'error');
    expect(errorEvent).toBeDefined();
    expect(errorEvent!.message).toContain('Something went wrong');
  });

  it('rejects empty message with 400', async () => {
    const req = new Request('http://localhost/api/brief/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.code).toBe('INVALID_REQUEST');
  });

  it('rejects missing message with 400', async () => {
    const req = new Request('http://localhost/api/brief/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
