'use client';

import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';
import { useMemo, useRef, useCallback } from 'react';
import { createDifyAdapter } from '@/lib/dify/adapter';

interface BriefRuntimeProviderProps {
  children: React.ReactNode;
  onBriefContent?: (content: string) => void;
}

export function BriefRuntimeProvider({ children, onBriefContent }: BriefRuntimeProviderProps) {
  const conversationIdRef = useRef<string>('');

  const handleConversationId = useCallback((id: string) => {
    conversationIdRef.current = id;
  }, []);

  const adapter = useMemo(
    () => createDifyAdapter({
      conversationId: conversationIdRef.current,
      onConversationId: handleConversationId,
      onBriefContent,
    }),
    [handleConversationId, onBriefContent]
  );

  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
