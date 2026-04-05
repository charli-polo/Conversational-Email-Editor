'use client';

import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useRemoteThreadListRuntime,
  type RemoteThreadListAdapter,
} from '@assistant-ui/react';
import { useMemo, useCallback, useRef } from 'react';
import { createDifyAdapter } from '@/lib/dify/adapter';
import { basePath } from '@/lib/base-path';

interface BriefRuntimeProviderProps {
  children: React.ReactNode;
  onBriefContent?: (content: string) => void;
}

export function BriefRuntimeProvider({ children, onBriefContent }: BriefRuntimeProviderProps) {
  // Track the current thread's difyConversationId for resumption (PERSIST-03)
  const difyConversationIdRef = useRef<string>('');
  // Track the current thread's remoteId so the Dify adapter can send it for message persistence
  const currentThreadIdRef = useRef<string>('');

  const threadListAdapter: RemoteThreadListAdapter = useMemo(() => ({
    async list() {
      const res = await fetch(`${basePath}/api/threads`);
      const data = await res.json();
      return {
        threads: data.threads.map((t: Record<string, unknown>) => ({
          remoteId: t.id as string,
          status: t.is_archived ? ('archived' as const) : ('regular' as const),
          title: (t.title as string) ?? undefined,
        })),
      };
    },
    async initialize(localId: string) {
      const res = await fetch(`${basePath}/api/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localId }),
      });
      const result = await res.json();
      // New thread has no difyConversationId yet
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
      // CRITICAL for PERSIST-03: Store the difyConversationId when switching to this thread
      // so the Dify adapter uses it for multi-turn context resumption
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
    runtimeHook: useCallback(() => {
      // Create adapter for the current thread
      // Pass difyConversationId from ref so resumed threads maintain Dify multi-turn context
      const adapter = createDifyAdapter({
        conversationId: difyConversationIdRef.current,
        threadId: currentThreadIdRef.current,
        onConversationId: (id: string) => {
          difyConversationIdRef.current = id;
        },
        onBriefContent,
      });
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useLocalRuntime(adapter);
    }, [onBriefContent]),
    adapter: threadListAdapter,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
