import type { Page, APIRequestContext } from '@playwright/test';

/** Build SSE body string from event chunks for route.fulfill() */
export function buildSSEBody(chunks: Array<{ event: string; [key: string]: unknown }>): string {
  return chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('');
}

/** Standard mock for a simple chat response */
export function mockChatResponse(answer: string, conversationId = 'test-conv-001'): string {
  const messageId = `msg-${Date.now()}`;
  return buildSSEBody([
    { event: 'message', answer, conversation_id: conversationId, message_id: messageId },
    { event: 'done', conversation_id: conversationId, message_id: messageId },
  ]);
}

/** Standard mock for /api/brief/parameters */
export const MOCK_PARAMETERS = {
  opening_statement: 'Hello! Tell me about the email you want to create.',
  suggested_questions: ['Write a follow-up email', 'Draft a thank you note'],
  speech_to_text: { enabled: false },
  file_upload: {
    enabled: false,
    allowed_file_types: [],
    allowed_file_extensions: [],
    number_limits: 0,
    image: { enabled: false, number_limits: 0, transfer_methods: [] },
  },
  system_parameters: {},
};

/** Set up Dify mocks on a page -- intercept chat SSE and parameters endpoints */
export async function setupDifyMocks(page: Page, chatAnswer = 'Hello! How can I help you today?'): Promise<void> {
  await page.route('**/api/brief/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: { 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      body: mockChatResponse(chatAnswer),
    });
  });
  await page.route('**/api/brief/parameters', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PARAMETERS),
    });
  });
}

/** Seed a conversation via API and optionally set its title */
export async function seedConversation(request: APIRequestContext, title?: string): Promise<string> {
  const res = await request.post('/api/threads');
  const { id } = await res.json();
  if (title) {
    await request.patch(`/api/threads/${id}`, { data: { title } });
  }
  return id;
}

/** Reset test database by deleting all seeded data via API calls */
export async function resetDatabase(request: APIRequestContext): Promise<void> {
  // Delete all conversations (cascades to messages + conversation_tags)
  const threadsRes = await request.get('/api/threads');
  const threadsBody = await threadsRes.json();
  const threads = threadsBody.threads ?? threadsBody ?? [];
  for (const thread of threads) {
    await request.delete(`/api/threads/${thread.id}`);
  }

  // Delete all agents
  const agentsRes = await request.get('/api/agents');
  const agentsList = await agentsRes.json();
  if (Array.isArray(agentsList)) {
    for (const agent of agentsList) {
      await request.delete(`/api/agents/${agent.id}`);
    }
  }

  // Verify cleanup succeeded
  const verifyRes = await request.get('/api/threads');
  const verifyBody = await verifyRes.json();
  const remaining = verifyBody.threads ?? verifyBody ?? [];
  if (remaining.length > 0) {
    throw new Error(`resetDatabase failed: ${remaining.length} threads still exist`);
  }
}
