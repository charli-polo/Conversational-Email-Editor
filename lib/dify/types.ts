// Request type for sending chat messages
export interface DifyChatRequest {
  query: string;
  conversation_id?: string;
  user?: string;
  inputs?: Record<string, string>;
}

// SSE event: message chunk (streamed multiple times per response)
// Handles both "message" (chatbot apps) and "agent_message" (agent apps)
export interface DifyMessageEvent {
  event: 'message' | 'agent_message';
  task_id: string;
  message_id: string;
  conversation_id: string;
  answer: string;     // Incremental text chunk
  created_at: number;
}

// SSE event: stream end (one per response)
export interface DifyMessageEndEvent {
  event: 'message_end';
  task_id: string;
  message_id: string;
  conversation_id: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

// SSE event: error during streaming
export interface DifyErrorEvent {
  event: 'error';
  status: number;
  code: string;
  message: string;
}

// Union type for all possible SSE events
export type DifySSEEvent = DifyMessageEvent | DifyMessageEndEvent | DifyErrorEvent;
