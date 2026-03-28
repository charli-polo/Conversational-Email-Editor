import { DifyChatRequest } from './types';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai';
const DIFY_API_KEY = process.env.DIFY_API_KEY;

export async function sendChatMessage(params: DifyChatRequest): Promise<Response> {
  if (!DIFY_API_KEY) {
    throw new Error('DIFY_API_KEY is not configured');
  }

  const response = await fetch(`${DIFY_API_BASE}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: params.inputs || {},
      query: params.query,
      response_mode: 'streaming',
      conversation_id: params.conversation_id || '',
      user: params.user || 'default-user',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Dify API error ${response.status}: ${errorBody}`);
  }

  return response;
}

export async function getParameters(user: string = 'default-user'): Promise<Response> {
  if (!DIFY_API_KEY) {
    throw new Error('DIFY_API_KEY is not configured');
  }

  return fetch(`${DIFY_API_BASE}/v1/parameters?user=${encodeURIComponent(user)}`, {
    headers: { 'Authorization': `Bearer ${DIFY_API_KEY}` },
  });
}
