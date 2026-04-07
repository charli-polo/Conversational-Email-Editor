'use client';

import { createContext, useContext, useRef, useState, useEffect } from 'react';
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';
import type { ChatModelAdapter, ChatModelRunOptions } from '@assistant-ui/react';
import { basePath } from '@/lib/base-path';
import { createDifyAttachmentAdapter, createDifyFeedbackAdapter } from '@/lib/dify/adapters';
import { parseSuggestedAnswer } from '@/lib/dify/parse-suggested-answer';

// ---------------------------------------------------------------------------
// Dify params context (opener, suggested questions, file upload config)
// ---------------------------------------------------------------------------

export interface DifyParams {
  opening_statement: string;
  suggested_questions: string[];
  speech_to_text: { enabled: boolean };
  file_upload: {
    enabled: boolean;
    allowed_file_types: string[];
    allowed_file_extensions: string[];
    number_limits: number;
    image: { enabled: boolean; number_limits: number; transfer_methods: string[] };
  };
  system_parameters: Record<string, unknown>;
}

export const DifyParamsContext = createContext<DifyParams | null>(null);
export function useDifyParams() { return useContext(DifyParamsContext); }

// ---------------------------------------------------------------------------
// Conversation ID context (exposed so Save button can read it)
// ---------------------------------------------------------------------------

export const ConversationIdContext = createContext<React.MutableRefObject<string>>({ current: '' });
export function useConversationId() { return useContext(ConversationIdContext); }

// ---------------------------------------------------------------------------
// Saved thread ID context (exposed so feedback adapter can resolve thread)
// ---------------------------------------------------------------------------

export const SavedThreadIdContext = createContext<React.MutableRefObject<string>>({ current: '' });
export function useSavedThreadId() { return useContext(SavedThreadIdContext); }

// ---------------------------------------------------------------------------
// Dify ChatModelAdapter — async generator, framework manages messages
// ---------------------------------------------------------------------------

function createDifyChatAdapter(
  conversationIdRef: React.MutableRefObject<string>,
  onBriefContentRef: React.MutableRefObject<((content: string) => void) | undefined>,
  savedThreadIdRef: React.MutableRefObject<string>,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }: ChatModelRunOptions) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const query = lastUser?.content
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('') ?? '';

      // Extract Dify upload_file_ids from attachment data content parts
      const files: Array<{ type: 'document' | 'image'; transfer_method: 'local_file'; upload_file_id: string }> = [];
      if (lastUser?.attachments) {
        for (const att of lastUser.attachments) {
          const dataPart = att.content?.find(
            (p): p is { type: 'data'; name: string; data: { upload_file_id: string } } =>
              p.type === 'data' && 'name' in p && (p as { name?: string }).name === 'dify-file',
          );
          if (dataPart) {
            const isImage = att.type === 'image';
            files.push({
              type: isImage ? 'image' : 'document',
              transfer_method: 'local_file',
              upload_file_id: dataPart.data.upload_file_id,
            });
          }
        }
      }

      const response = await fetch(`${basePath}/api/brief/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversation_id: conversationIdRef.current,
          ...(savedThreadIdRef.current ? { threadId: savedThreadIdRef.current } : {}),
          ...(files.length > 0 ? { files } : {}),
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        throw new Error(err || `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let rawText = '';
      let reasoningText = '';
      const toolBadges: string[] = [];
      let difyMessageId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.event === 'agent_thought') {
              if (data.thought) reasoningText += data.thought;
              if (data.tool && !toolBadges.includes(data.tool)) toolBadges.push(data.tool);
              if (data.message_id) difyMessageId = data.message_id;

              // Compute display text for intermediate yield
              let displayText = rawText;
              const briefMatch = rawText.match(/<Brief>([\s\S]*?)(<\/Brief>|$)/);
              if (briefMatch) {
                const beforeBrief = rawText.substring(0, rawText.indexOf('<Brief>')).trim();
                const afterBrief = briefMatch[2] === '</Brief>'
                  ? rawText.substring(rawText.indexOf('</Brief>') + '</Brief>'.length).trim()
                  : '';
                displayText = [beforeBrief, afterBrief].filter(Boolean).join('\n');
                displayText = displayText.replace('[BRIEF_COMPLETE]', '').trim();
              }

              // Strip <suggested_answer> block from display during streaming
              const { displayText: saCleanText } = parseSuggestedAnswer(displayText);
              let safeDisplay = saCleanText;
              const partialSaMatch = safeDisplay.match(/<suggested_answer[^>]*$/);
              if (partialSaMatch) {
                safeDisplay = safeDisplay.substring(0, partialSaMatch.index).trim();
              }

              yield {
                content: [
                  ...(reasoningText ? [{ type: 'reasoning' as const, text: reasoningText }] : []),
                  { type: 'text' as const, text: safeDisplay },
                ],
              };
              continue;
            }

            if (data.event === 'agent_message' || data.event === 'message') {
              if (data.message_id) difyMessageId = data.message_id;
              if (data.answer) {
                rawText += data.answer;

                // Extract <Brief> content if present
                let displayText = rawText;
                const briefMatch = rawText.match(/<Brief>([\s\S]*?)(<\/Brief>|$)/);
                if (briefMatch) {
                  const beforeBrief = rawText.substring(0, rawText.indexOf('<Brief>')).trim();
                  const briefInner = briefMatch[1];
                  const afterBrief = briefMatch[2] === '</Brief>'
                    ? rawText.substring(rawText.indexOf('</Brief>') + '</Brief>'.length).trim()
                    : '';
                  displayText = [beforeBrief, afterBrief].filter(Boolean).join('\n');
                  displayText = displayText.replace('[BRIEF_COMPLETE]', '').trim();
                  onBriefContentRef.current?.(briefInner.trim());
                }

                // Strip <suggested_answer> block from display during streaming
                const { displayText: saCleanText } = parseSuggestedAnswer(displayText);
                let safeDisplay = saCleanText;
                const partialSaMatch = safeDisplay.match(/<suggested_answer[^>]*$/);
                if (partialSaMatch) {
                  safeDisplay = safeDisplay.substring(0, partialSaMatch.index).trim();
                }

                yield {
                  content: [
                    ...(reasoningText ? [{ type: 'reasoning' as const, text: reasoningText }] : []),
                    { type: 'text' as const, text: safeDisplay },
                  ],
                };
              }

              if (!conversationIdRef.current && data.conversation_id) {
                conversationIdRef.current = data.conversation_id;
              }
            }

            if (data.event === 'done' && data.conversation_id) {
              conversationIdRef.current = data.conversation_id;
            }

            if (data.event === 'error') {
              throw new Error(data.message || 'Dify streaming error');
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // Final yield with metadata for feedback adapter
      let finalDisplayText = rawText;
      const finalBriefMatch = rawText.match(/<Brief>([\s\S]*?)(<\/Brief>|$)/);
      if (finalBriefMatch) {
        const beforeBrief = rawText.substring(0, rawText.indexOf('<Brief>')).trim();
        const afterBrief = finalBriefMatch[2] === '</Brief>'
          ? rawText.substring(rawText.indexOf('</Brief>') + '</Brief>'.length).trim()
          : '';
        finalDisplayText = [beforeBrief, afterBrief].filter(Boolean).join('\n');
        finalDisplayText = finalDisplayText.replace('[BRIEF_COMPLETE]', '').trim();
      }

      // Parse <suggested_answer> from final text and attach actions as metadata
      const { displayText: finalSaClean, actions: suggestedActions } = parseSuggestedAnswer(finalDisplayText);

      yield {
        content: [
          ...(reasoningText ? [{ type: 'reasoning' as const, text: reasoningText }] : []),
          { type: 'text' as const, text: finalSaClean },
        ],
        metadata: {
          custom: {
            difyMessageId,
            toolBadges,
            suggestedActions,
          },
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface BriefRuntimeProviderProps {
  children: React.ReactNode;
  onBriefContent?: (content: string) => void;
  initialConversationId?: string;
}

export function BriefRuntimeProvider({ children, onBriefContent, initialConversationId }: BriefRuntimeProviderProps) {
  const [params, setParams] = useState<DifyParams | null>(null);
  const conversationIdRef = useRef(initialConversationId ?? '');
  const savedThreadIdRef = useRef('');
  const onBriefContentRef = useRef(onBriefContent);
  onBriefContentRef.current = onBriefContent;

  // Fetch Dify parameters once on mount
  useEffect(() => {
    fetch(`${basePath}/api/brief/parameters`)
      .then(r => r.json())
      .then(data => { if (!data.error) setParams(data); })
      .catch(() => {});
  }, []);

  const adapter = useRef(createDifyChatAdapter(conversationIdRef, onBriefContentRef, savedThreadIdRef));
  const attachmentAdapter = useRef(createDifyAttachmentAdapter());
  const feedbackAdapter = useRef(createDifyFeedbackAdapter(() => savedThreadIdRef.current));

  const runtime = useLocalRuntime(adapter.current, {
    adapters: {
      attachments: attachmentAdapter.current,
      feedback: feedbackAdapter.current,
    },
  });

  return (
    <DifyParamsContext.Provider value={params}>
      <ConversationIdContext.Provider value={conversationIdRef}>
        <SavedThreadIdContext.Provider value={savedThreadIdRef}>
          <AssistantRuntimeProvider runtime={runtime}>
            {children}
          </AssistantRuntimeProvider>
        </SavedThreadIdContext.Provider>
      </ConversationIdContext.Provider>
    </DifyParamsContext.Provider>
  );
}
