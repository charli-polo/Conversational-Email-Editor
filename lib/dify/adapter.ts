import type { ChatModelAdapter } from '@assistant-ui/react';
import { basePath } from '@/lib/base-path';

export interface DifyAdapterOptions {
  conversationId?: string;
  onConversationId?: (id: string) => void;
  onBriefContent?: (content: string) => void;
}

export function createDifyAdapter(options: DifyAdapterOptions = {}): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const lastMessage = messages[messages.length - 1];
      const text = lastMessage.content[0]?.type === 'text' ? lastMessage.content[0].text : '';

      const res = await fetch(`${basePath}/api/brief/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_id: options.conversationId || '',
        }),
        signal: abortSignal,
      });

      if (!res.ok || !res.body) throw new Error('Failed to fetch');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.event === 'done') {
              if (data.conversation_id) {
                options.onConversationId?.(data.conversation_id);
              }
              continue;
            }

            if (data.event === 'error') {
              throw new Error(data.message || 'Dify streaming error');
            }

            if (data.answer) {
              fullContent += data.answer;

              // Extract <Brief> content if present
              let displayText = fullContent;
              const briefMatch = fullContent.match(/<Brief>([\s\S]*?)(<\/Brief>|$)/);
              if (briefMatch) {
                const beforeBrief = fullContent.substring(0, fullContent.indexOf('<Brief>')).trim();
                const briefInner = briefMatch[1];
                const afterBrief = briefMatch[2] === '</Brief>'
                  ? fullContent.substring(fullContent.indexOf('</Brief>') + '</Brief>'.length).trim()
                  : '';
                displayText = [beforeBrief, afterBrief].filter(Boolean).join('\n');

                // Strip [BRIEF_COMPLETE] marker
                displayText = displayText.replace('[BRIEF_COMPLETE]', '').trim();

                options.onBriefContent?.(briefInner.trim());
              }

              yield { content: [{ type: 'text' as const, text: displayText || '...' }] };

              if (data.conversation_id && !options.conversationId) {
                options.conversationId = data.conversation_id;
                options.onConversationId?.(data.conversation_id);
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message === 'Dify streaming error') throw e;
            // Skip malformed JSON
          }
        }
      }
    },
  };
}
