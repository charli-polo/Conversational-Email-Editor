import { sendChatMessage, getActiveAgentConfig } from '@/lib/dify/client';
import { db } from '@/lib/db';
import { messages, conversations, agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message;
    const threadId: string | undefined = body.threadId;
    let conversation_id = body.conversation_id || '';

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Message is required', code: 'INVALID_REQUEST', status: 400 }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Resolve agent config: if threadId provided, use thread's linked agent
    let agentConfig = await getActiveAgentConfig();
    if (threadId) {
      const thread = await db.query.conversations.findFirst({
        where: eq(conversations.id, threadId),
      });
      if (thread?.agentId) {
        const agent = await db.query.agents.findFirst({
          where: eq(agents.id, thread.agentId),
        });
        if (agent) {
          agentConfig = { apiKey: agent.apiKey, baseUrl: agent.baseUrl, difyUrl: agent.difyUrl };
        }
      }
      // Use stored dify_conversation_id for resumption if not provided in request
      if (!conversation_id && thread?.difyConversationId) {
        conversation_id = thread.difyConversationId;
      }
    }

    // Extract file references from request body
    const files = body.files || undefined;

    // Send to Dify with stale conversation_id fallback
    let difyResponse: Response;
    try {
      difyResponse = await sendChatMessage(
        { query: message.trim(), conversation_id, files },
        agentConfig ?? undefined
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '';

      // Stale conversation_id fallback: retry without conversation_id
      if (conversation_id) {
        try {
          difyResponse = await sendChatMessage(
            { query: message.trim(), conversation_id: '', files },
            agentConfig ?? undefined
          );
          // Clear stale dify_conversation_id on thread
          if (threadId) {
            await db
              .update(conversations)
              .set({ difyConversationId: null, updatedAt: new Date().toISOString() })
              .where(eq(conversations.id, threadId));
          }
        } catch {
          // Retry also failed - fall through to original error handling
          return handleDifyError(errMsg);
        }
      } else {
        return handleDifyError(errMsg);
      }
    }

    const reader = difyResponse!.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Track full assistant content, dify conversation_id, and dify message_id for persistence
    let fullAssistantContent = '';
    let difyConversationId = '';
    let difyMessageId = '';

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                if (!data) continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.event === 'message' || parsed.event === 'agent_message') {
                    fullAssistantContent += parsed.answer || '';
                    if (parsed.conversation_id) {
                      difyConversationId = parsed.conversation_id;
                    }
                    if (parsed.message_id) {
                      difyMessageId = parsed.message_id;
                    }
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({ event: parsed.event, answer: parsed.answer, conversation_id: parsed.conversation_id, message_id: parsed.message_id })}\n\n`
                    ));
                  } else if (parsed.event === 'agent_thought') {
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({
                        event: 'agent_thought',
                        id: parsed.id,
                        thought: parsed.thought || '',
                        tool: parsed.tool || '',
                        tool_input: parsed.tool_input || '',
                        observation: parsed.observation || '',
                        message_id: parsed.message_id,
                      })}\n\n`
                    ));
                    if (parsed.message_id) {
                      difyMessageId = parsed.message_id;
                    }
                  } else if (parsed.event === 'message_end') {
                    if (parsed.conversation_id) {
                      difyConversationId = parsed.conversation_id;
                    }
                    if (parsed.message_id) {
                      difyMessageId = parsed.message_id;
                    }
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({ event: 'done', conversation_id: parsed.conversation_id, message_id: parsed.message_id })}\n\n`
                    ));
                  } else if (parsed.event === 'error') {
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({ event: 'error', message: 'Something went wrong with the chat service. Please try again.' })}\n\n`
                    ));
                  }
                } catch { /* skip malformed JSON */ }
              }
            }
          }
        } finally {
          // Persist messages after streaming completes
          if (threadId && fullAssistantContent) {
            try {
              const now = new Date().toISOString();
              await db.insert(messages).values([
                {
                  id: crypto.randomUUID(),
                  conversationId: threadId,
                  role: 'user' as const,
                  content: message.trim(),
                  createdAt: now,
                },
                {
                  id: crypto.randomUUID(),
                  conversationId: threadId,
                  role: 'assistant' as const,
                  content: fullAssistantContent,
                  difyMessageId: difyMessageId || null,
                  createdAt: now,
                },
              ]);

              // Store dify conversation_id on the thread for resumption
              const updateData: Record<string, unknown> = { updatedAt: now };
              if (difyConversationId) {
                updateData.difyConversationId = difyConversationId;
              }
              await db
                .update(conversations)
                .set(updateData)
                .where(eq(conversations.id, threadId));
            } catch {
              // Persistence failure should not break the stream
              console.error('Failed to persist messages for thread:', threadId);
            }
          }
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Something went wrong with the chat service. Please try again.', code: 'DIFY_ERROR', status: 502 }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function handleDifyError(errMsg: string): Response {
  if (errMsg.includes('not configured')) {
    return new Response(
      JSON.stringify({ error: 'Chat service is not configured. Please contact the administrator.', code: 'DIFY_NOT_CONFIGURED', status: 500 }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (errMsg.includes('429')) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment before sending another message.', code: 'DIFY_RATE_LIMIT', status: 429 }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return new Response(
    JSON.stringify({ error: 'Unable to reach the chat service. Please try again in a moment.', code: 'DIFY_UNREACHABLE', status: 502 }),
    { status: 502, headers: { 'Content-Type': 'application/json' } }
  );
}
