import { sendChatMessage, getActiveAgentConfig } from '@/lib/dify/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message;
    const conversation_id = body.conversation_id || '';

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Message is required', code: 'INVALID_REQUEST', status: 400 }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use active agent from DB if available, otherwise fall back to env vars
    const agentConfig = await getActiveAgentConfig();

    let difyResponse: Response;
    try {
      difyResponse = await sendChatMessage({ query: message.trim(), conversation_id }, agentConfig ?? undefined);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '';
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

    const reader = difyResponse.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

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
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({ answer: parsed.answer, conversation_id: parsed.conversation_id, message_id: parsed.message_id })}\n\n`
                    ));
                  } else if (parsed.event === 'message_end') {
                    controller.enqueue(encoder.encode(
                      `data: ${JSON.stringify({ event: 'done', conversation_id: parsed.conversation_id })}\n\n`
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
