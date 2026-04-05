import { DifyChatRequest } from './types';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AgentConfig {
  apiKey: string;
  baseUrl: string;
  difyUrl?: string | null;
}

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai';
const DIFY_API_KEY = process.env.DIFY_API_KEY;

export async function getActiveAgentConfig(): Promise<AgentConfig | null> {
  const activeAgent = await db.query.agents.findFirst({
    where: eq(agents.isActive, true),
  });
  if (!activeAgent) return null;
  return {
    apiKey: activeAgent.apiKey,
    baseUrl: activeAgent.baseUrl,
    difyUrl: activeAgent.difyUrl,
  };
}

export async function sendChatMessage(
  params: DifyChatRequest,
  config?: AgentConfig
): Promise<Response> {
  const apiKey = config?.apiKey || DIFY_API_KEY;
  const apiBase = config?.baseUrl || DIFY_API_BASE;

  if (!apiKey) {
    throw new Error('DIFY_API_KEY is not configured');
  }

  const response = await fetch(`${apiBase}/v1/chat-messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: params.inputs || {},
      query: params.query,
      response_mode: 'streaming',
      conversation_id: params.conversation_id || '',
      user: params.user || 'default-user',
      ...(params.files?.length ? { files: params.files } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Dify API error ${response.status}: ${errorBody}`);
  }

  return response;
}

export async function getParameters(
  user: string = 'default-user',
  config?: AgentConfig
): Promise<Response> {
  const apiKey = config?.apiKey || DIFY_API_KEY;
  const apiBase = config?.baseUrl || DIFY_API_BASE;

  if (!apiKey) {
    throw new Error('DIFY_API_KEY is not configured');
  }

  return fetch(`${apiBase}/v1/parameters?user=${encodeURIComponent(user)}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
}

export async function submitFeedback(
  messageId: string,
  rating: 'like' | 'dislike' | null,
  user: string = 'default-user',
  config?: AgentConfig
): Promise<Response> {
  const apiKey = config?.apiKey || DIFY_API_KEY;
  const apiBase = config?.baseUrl || DIFY_API_BASE;
  if (!apiKey) throw new Error('DIFY_API_KEY is not configured');

  return fetch(`${apiBase}/v1/messages/${messageId}/feedbacks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rating, user }),
  });
}

export async function uploadFile(
  file: Blob,
  fileName: string,
  user: string = 'default-user',
  config?: AgentConfig
): Promise<Response> {
  const apiKey = config?.apiKey || DIFY_API_KEY;
  const apiBase = config?.baseUrl || DIFY_API_BASE;
  if (!apiKey) throw new Error('DIFY_API_KEY is not configured');

  const formData = new FormData();
  formData.append('file', file, fileName);
  formData.append('user', user);

  return fetch(`${apiBase}/v1/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });
}

export async function audioToText(
  audioBlob: Blob,
  user: string = 'default-user',
  config?: AgentConfig
): Promise<Response> {
  const apiKey = config?.apiKey || DIFY_API_KEY;
  const apiBase = config?.baseUrl || DIFY_API_BASE;
  if (!apiKey) throw new Error('DIFY_API_KEY is not configured');

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('user', user);

  return fetch(`${apiBase}/v1/audio-to-text`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });
}
