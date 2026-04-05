'use client';

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  useRemoteThreadListRuntime,
  type RemoteThreadListAdapter,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import { useAuiState } from '@assistant-ui/store';
import { createContext, useContext, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { basePath } from '@/lib/base-path';

export interface ThreadMeta {
  preview: string | null;
  agentLabel: string | null;
}

export const ThreadMetadataContext = createContext<Record<string, ThreadMeta>>({});
export function useThreadMetadata() {
  return useContext(ThreadMetadataContext);
}

interface BriefRuntimeProviderProps {
  children: React.ReactNode;
  onBriefContent?: (content: string) => void;
}

interface DbMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function BriefRuntimeProvider({ children, onBriefContent }: BriefRuntimeProviderProps) {
  const difyConversationIdRef = useRef<string>('');
  const currentThreadIdRef = useRef<string>('');
  const [threadMetadata, setThreadMetadata] = useState<Record<string, ThreadMeta>>({});

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

      // Load persisted messages when remoteId changes (thread switch)
      useEffect(() => {
        if (!remoteId) {
          setMessages([]);
          return;
        }
        currentThreadIdRef.current = remoteId;
        fetch(`${basePath}/api/threads/${remoteId}/messages`)
          .then((r) => r.json())
          .then((data) => {
            if (data.messages?.length > 0) {
              setMessages(
                data.messages.map((m: DbMessage) => ({
                  role: m.role as 'user' | 'assistant',
                  content: [{ type: 'text' as const, text: m.content }],
                }))
              );
            } else {
              setMessages([]);
            }
          })
          .catch(() => setMessages([]));
      }, [remoteId]);

      const onNew = useCallback(async (message: { content: { type: string; text?: string }[] }) => {
        const text = message.content[0]?.type === 'text' ? (message.content[0] as { text: string }).text : '';
        if (!text) return;

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
            }),
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
                    difyConversationIdRef.current = data.conversation_id;
                  }
                  continue;
                }
                if (data.event === 'error') continue;

                if (data.answer) {
                  fullContent += data.answer;

                  let displayText = fullContent;
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

                  setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { role: 'assistant' as const, content: [{ type: 'text' as const, text: displayText || '...' }] },
                      ];
                    }
                    return [
                      ...prev,
                      { role: 'assistant' as const, content: [{ type: 'text' as const, text: displayText || '...' }] },
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
        } finally {
          setIsRunning(false);
        }
      }, []);

      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useExternalStoreRuntime({
        messages,
        setMessages,
        isRunning,
        onNew,
        convertMessage: (m: ThreadMessageLike) => m,
      });
    },
    adapter: threadListAdapter,
  });

  return (
    <ThreadMetadataContext.Provider value={threadMetadata}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ThreadMetadataContext.Provider>
  );
}
