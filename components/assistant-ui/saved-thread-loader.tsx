'use client';

import { useEffect, useRef } from 'react';
import { useAssistantRuntime, ExportedMessageRepository } from '@assistant-ui/react';
import { basePath } from '@/lib/base-path';

interface SavedThreadLoaderProps {
  threadId: string;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string) => void;
}

/**
 * Invisible component that loads saved messages from the DB and imports them
 * into the current thread runtime so saved conversations can be displayed
 * and continued.
 */
export function SavedThreadLoader({ threadId, onLoadingChange, onError }: SavedThreadLoaderProps) {
  const runtime = useAssistantRuntime();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    onLoadingChange?.(true);

    fetch(`${basePath}/api/threads/${threadId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.messages?.length) {
          onLoadingChange?.(false);
          return;
        }

        const messageLikes = data.messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as 'user' | 'assistant',
          content: [{ type: 'text' as const, text: msg.content }],
        }));

        const exported = ExportedMessageRepository.fromArray(messageLikes);
        runtime.thread.import(exported);
        onLoadingChange?.(false);
      })
      .catch((err) => {
        onError?.(err instanceof Error ? err.message : 'Failed to load messages');
        onLoadingChange?.(false);
      });
  }, [threadId, runtime, onLoadingChange, onError]);

  return null;
}
