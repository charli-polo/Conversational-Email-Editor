'use client';

import {
  AssistantRuntimeProvider,
  useAssistantRuntime,
  useExternalStoreRuntime,
  useRemoteThreadListRuntime,
  type RemoteThreadListAdapter,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import { useAuiState } from '@assistant-ui/store';
import { createContext, useContext, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { basePath } from '@/lib/base-path';
import { createDifyFeedbackAdapter, createDifyAttachmentAdapter, createDifyDictationAdapter } from '@/lib/dify/adapters';

export interface ThreadMeta {
  preview: string | null;
  agentLabel: string | null;
}

export const ThreadMetadataContext = createContext<Record<string, ThreadMeta>>({});
export function useThreadMetadata() {
  return useContext(ThreadMetadataContext);
}

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

interface BriefRuntimeProviderProps {
  children: React.ReactNode;
  onBriefContent?: (content: string) => void;
  initialThreadId?: string;
}

interface DbMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  dify_message_id?: string | null;
  rating?: 'like' | 'dislike' | null;
}

export function BriefRuntimeProvider({ children, onBriefContent, initialThreadId }: BriefRuntimeProviderProps) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const difyConversationIdRef = useRef<string>('');
  const currentThreadIdRef = useRef<string>('');
  const justInitializedThreadRef = useRef<string | null>(null);
  const [threadMetadata, setThreadMetadata] = useState<Record<string, ThreadMeta>>({});
  const [params, setParams] = useState<DifyParams | null>(null);

  // Fetch Dify parameters once on mount (opener, file_upload, speech_to_text)
  useEffect(() => {
    fetch(`${basePath}/api/brief/parameters`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) setParams(data);
      })
      .catch(() => {});
  }, []);

  const threadListAdapter: RemoteThreadListAdapter = useMemo(() => ({
    async list() {
      const res = await fetch(`${basePath}/api/threads`);
      const data = await res.json();

      // Build metadata map for drawer consumption
      const meta: Record<string, ThreadMeta> = {};
      const threads = data.threads.map((t: Record<string, unknown>) => {
        const remoteId = t.id as string;
        meta[remoteId] = {
          preview: (t.preview as string) ?? null,
          agentLabel: (t.agent_label as string) ?? null,
        };
        return {
          remoteId,
          status: t.is_archived ? ('archived' as const) : ('regular' as const),
          title: (t.title as string) ?? undefined,
        };
      });
      setThreadMetadata(meta);

      return { threads };
    },
    async initialize(localId: string) {
      const res = await fetch(`${basePath}/api/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localId }),
      });
      const result = await res.json();
      difyConversationIdRef.current = '';
      currentThreadIdRef.current = result.id;
      justInitializedThreadRef.current = result.id;
      window.history.replaceState(null, '', `${basePath}/c/${result.id}`);
      return { remoteId: result.id, externalId: undefined };
    },
    async rename(remoteId: string, title: string) {
      await fetch(`${basePath}/api/threads/${remoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    },
    async archive(remoteId: string) {
      await fetch(`${basePath}/api/threads/${remoteId}/archive`, { method: 'POST' });
    },
    async unarchive(remoteId: string) {
      await fetch(`${basePath}/api/threads/${remoteId}/unarchive`, { method: 'POST' });
    },
    async delete(remoteId: string) {
      await fetch(`${basePath}/api/threads/${remoteId}`, { method: 'DELETE' });
    },
    async fetch(remoteId: string) {
      const res = await fetch(`${basePath}/api/threads/${remoteId}`);
      const t = await res.json();
      if (t.dify_conversation_id) {
        difyConversationIdRef.current = t.dify_conversation_id;
      } else {
        difyConversationIdRef.current = '';
      }
      currentThreadIdRef.current = remoteId;
      return {
        remoteId: t.id as string,
        status: t.is_archived ? ('archived' as const) : ('regular' as const),
        title: (t.title as string) ?? undefined,
      };
    },
    async generateTitle(remoteId: string, messages: readonly Record<string, unknown>[]) {
      const firstUserMsg = messages.find((m) => m.role === 'user');
      const content = firstUserMsg?.content;
      let title = 'New conversation';
      if (Array.isArray(content) && content.length > 0) {
        const textPart = content[0] as Record<string, unknown>;
        if (textPart?.text && typeof textPart.text === 'string') {
          title = textPart.text.slice(0, 50);
        }
      }

      await fetch(`${basePath}/api/threads/${remoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const { createAssistantStream } = await import('assistant-stream');
      return createAssistantStream(async (controller) => {
        controller.appendText(title);
      });
    },
  }), []);

  const runtime = useRemoteThreadListRuntime({
    runtimeHook: function RuntimeHook() {
      const [messages, setMessages] = useState<ThreadMessageLike[]>([]);
      const [isRunning, setIsRunning] = useState(false);
      const onBriefContentRef = useRef(onBriefContent);
      onBriefContentRef.current = onBriefContent;

      // Read the current thread's remoteId from assistant-ui store
      // This updates reactively when the user switches threads
      const remoteId = useAuiState((s) => s.threadListItem?.remoteId);

      // Sync URL when thread changes
      useEffect(() => {
        if (remoteId) {
          const expectedPath = `${basePath}/c/${remoteId}`;
          if (window.location.pathname !== expectedPath) {
            window.history.replaceState(null, '', expectedPath);
          }
        }
      }, [remoteId]);

      // Load persisted messages when remoteId changes (thread switch)
      useEffect(() => {
        if (!remoteId) {
          setMessages([]);
          return;
        }
        currentThreadIdRef.current = remoteId;

        // Skip fetch if we just initialized this thread — it has no messages yet
        if (justInitializedThreadRef.current === remoteId) {
          justInitializedThreadRef.current = null;
          setMessages([]);
          return;
        }

        fetch(`${basePath}/api/threads/${remoteId}/messages`)
          .then((r) => r.json())
          .then((data) => {
            if (data.messages?.length > 0) {
              setMessages(
                data.messages.map((m: DbMessage) => ({
                  role: m.role as 'user' | 'assistant',
                  content: [{ type: 'text' as const, text: m.content }],
                  ...(m.dify_message_id || m.rating ? {
                    metadata: {
                      ...(m.rating ? {
                        submittedFeedback: {
                          type: m.rating === 'like' ? 'positive' : 'negative',
                        },
                      } : {}),
                      custom: {
                        ...(m.dify_message_id ? { difyMessageId: m.dify_message_id } : {}),
                      },
                    },
                  } : {}),
                }))
              );
            } else {
              setMessages([]);
            }
          })
          .catch(() => setMessages([]));
      }, [remoteId]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onNew = useCallback(async (message: any) => {
        const content = message.content;
        const firstPart = Array.isArray(content) ? content[0] : undefined;
        const text = firstPart && typeof firstPart === 'object' && 'type' in firstPart && firstPart.type === 'text' && 'text' in firstPart
          ? (firstPart as { text: string }).text
          : '';
        if (!text) return;

        // Extract file references from attachments (from AttachmentAdapter)
        // The adapter stores the Dify upload_file_id as the attachment id
        const attachments = message.attachments as Array<{ id: string; type?: string }> | undefined;
        const files = attachments
          ?.filter((a) => a.id)
          .map((a) => ({
            type: (a.type === 'image' ? 'image' : 'document') as 'image' | 'document',
            transfer_method: 'local_file' as const,
            upload_file_id: a.id,
          })) || [];

        setMessages((prev) => [
          ...prev,
          { role: 'user' as const, content: [{ type: 'text' as const, text }] },
        ]);
        setIsRunning(true);

        try {
          const res = await fetch(`${basePath}/api/brief/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              conversation_id: difyConversationIdRef.current,
              threadId: currentThreadIdRef.current,
              ...(files.length > 0 ? { files } : {}),
            }),
          });

          if (!res.ok || !res.body) {
            const errorBody = !res.body ? 'No response body' : await res.text().catch(() => '');
            console.error('Chat API error:', res.status, errorBody);
            setMessages((prev) => [
              ...prev,
              { role: 'assistant' as const, content: [{ type: 'text' as const, text: 'Something went wrong. Please try again.' }] },
            ]);
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let buffer = '';
          const reasoningParts: Array<{ thought: string; tool: string }> = [];
          let lastDifyMessageId = '';
          let displayText = '';

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

                if (data.event === 'agent_thought') {
                  if (data.thought) {
                    reasoningParts.push({ thought: data.thought, tool: data.tool || '' });
                  }
                  if (data.message_id) lastDifyMessageId = data.message_id;
                  // Update in-progress message with streaming reasoning metadata (D-14/D-16)
                  setMessages((prev) => {
                    const streamingContent = [
                      ...reasoningParts.map(r => ({
                        type: 'reasoning' as const,
                        text: r.thought + (r.tool ? `\n[Tool: ${r.tool}]` : ''),
                      })),
                      { type: 'text' as const, text: displayText || '' },
                    ];
                    const streamingMetadata = {
                      custom: {
                        ...(lastDifyMessageId ? { difyMessageId: lastDifyMessageId } : {}),
                        isStreamingReasoning: true,
                        streamingTools: reasoningParts.filter(r => r.tool).map(r => r.tool),
                      },
                    };
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { role: 'assistant' as const, content: streamingContent, metadata: streamingMetadata },
                      ];
                    }
                    return [
                      ...prev,
                      { role: 'assistant' as const, content: streamingContent, metadata: streamingMetadata },
                    ];
                  });
                  continue;
                }

                if (data.event === 'done') {
                  if (data.conversation_id) {
                    difyConversationIdRef.current = data.conversation_id;
                  }
                  if (data.message_id) lastDifyMessageId = data.message_id;
                  continue;
                }
                if (data.event === 'error') continue;

                if (data.answer) {
                  fullContent += data.answer;

                  displayText = fullContent;
                  const briefMatch = fullContent.match(/<Brief>([\s\S]*?)(<\/Brief>|$)/);
                  if (briefMatch) {
                    const beforeBrief = fullContent.substring(0, fullContent.indexOf('<Brief>')).trim();
                    const briefInner = briefMatch[1];
                    const afterBrief = briefMatch[2] === '</Brief>'
                      ? fullContent.substring(fullContent.indexOf('</Brief>') + '</Brief>'.length).trim()
                      : '';
                    displayText = [beforeBrief, afterBrief].filter(Boolean).join('\n');
                    displayText = displayText.replace('[BRIEF_COMPLETE]', '').trim();
                    onBriefContentRef.current?.(briefInner.trim());
                  }

                  // Build content with reasoning parts if any
                  const contentParts = [
                    ...reasoningParts.map(r => ({
                      type: 'reasoning' as const,
                      text: r.thought + (r.tool ? `\n[Tool: ${r.tool}]` : ''),
                    })),
                    { type: 'text' as const, text: displayText || '...' },
                  ];
                  const streamMeta = reasoningParts.length > 0 ? {
                    metadata: {
                      custom: {
                        ...(lastDifyMessageId ? { difyMessageId: lastDifyMessageId } : {}),
                        isStreamingReasoning: true,
                        streamingTools: reasoningParts.filter(r => r.tool).map(r => r.tool),
                      },
                    },
                  } : {};

                  setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { role: 'assistant' as const, content: contentParts, ...streamMeta },
                      ];
                    }
                    return [
                      ...prev,
                      { role: 'assistant' as const, content: contentParts, ...streamMeta },
                    ];
                  });

                  if (data.conversation_id && !difyConversationIdRef.current) {
                    difyConversationIdRef.current = data.conversation_id;
                  }
                }
              } catch (e) {
                if (e instanceof Error && e.message === 'Dify streaming error') throw e;
              }
            }
          }

          // Build final message content with reasoning parts but WITHOUT isStreamingReasoning
          const finalContentParts = [
            ...reasoningParts.map(r => ({
              type: 'reasoning' as const,
              text: r.thought + (r.tool ? `\n[Tool: ${r.tool}]` : ''),
            })),
            { type: 'text' as const, text: displayText || '...' },
          ];
          const finalMsgMetadata = {
            custom: {
              ...(lastDifyMessageId ? { difyMessageId: lastDifyMessageId } : {}),
              // isStreamingReasoning deliberately ABSENT — streaming is complete.
              // Plan 03 will show static ReasoningSection toggle instead of dots+timer.
            },
          };

          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { role: 'assistant' as const, content: finalContentParts, metadata: finalMsgMetadata },
              ];
            }
            return [
              ...prev,
              { role: 'assistant' as const, content: finalContentParts, metadata: finalMsgMetadata },
            ];
          });
        } finally {
          setIsRunning(false);
        }
      }, []);

      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useExternalStoreRuntime({
        messages,
        setMessages: (msgs: readonly ThreadMessageLike[]) => setMessages([...msgs]),
        isRunning,
        onNew,
        onReload: async () => {
          // Regenerate: remove last assistant message and re-send last user message
          const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
          if (lastUserIdx === -1) return;
          const actualIdx = messages.length - 1 - lastUserIdx;
          const lastUserMsg = messages[actualIdx];
          const content = lastUserMsg.content;
          const firstPart = Array.isArray(content) ? content[0] : undefined;
          const userText = firstPart && typeof firstPart === 'object' && 'type' in firstPart && firstPart.type === 'text' && 'text' in firstPart
            ? (firstPart as { text: string }).text
            : '';
          if (!userText) return;
          setMessages(prev => prev.slice(0, actualIdx + 1));
          await onNew({ content: [{ type: 'text', text: userText }] });
        },
        convertMessage: (m: ThreadMessageLike) => m,
        adapters: {
          feedback: createDifyFeedbackAdapter(() => currentThreadIdRef.current),
          attachments: createDifyAttachmentAdapter(),
          ...(params?.speech_to_text?.enabled ? { dictation: createDifyDictationAdapter() } : {}),
        },
      });
    },
    adapter: threadListAdapter,
  });

  return (
    <DifyParamsContext.Provider value={params}>
      <ThreadMetadataContext.Provider value={threadMetadata}>
        <AssistantRuntimeProvider runtime={runtime}>
          {initialThreadId && <InitialThreadSwitcher threadId={initialThreadId} />}
          {children}
        </AssistantRuntimeProvider>
      </ThreadMetadataContext.Provider>
    </DifyParamsContext.Provider>
  );
}

function InitialThreadSwitcher({ threadId }: { threadId: string }) {
  const runtime = useAssistantRuntime();
  const switched = useRef(false);

  useEffect(() => {
    if (switched.current) return;
    switched.current = true;
    // Switch to the thread by remoteId after a short delay to let the thread list load
    const timer = setTimeout(() => {
      try {
        runtime.threadList.switchToThread(threadId);
      } catch {
        // Thread may not exist yet — ignore
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [runtime, threadId]);

  return null;
}
