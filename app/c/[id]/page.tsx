'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BriefRuntimeProvider, useSavedThreadId, useConversationId } from '@/components/assistant-ui/brief-runtime-provider';
import { BriefThread } from '@/components/assistant-ui/brief-thread';
import { BriefEmptyState } from '@/components/brief/brief-empty-state';
import { SettingsSheet } from '@/components/settings/settings-sheet';
import { SaveConversationButton } from '@/components/assistant-ui/save-conversation-button';
import { ThreadListDrawer } from '@/components/assistant-ui/thread-list-drawer';
import { SavedThreadLoader } from '@/components/assistant-ui/saved-thread-loader';
import { basePath } from '@/lib/base-path';

interface ThreadData {
  id: string;
  title: string | null;
  dify_conversation_id: string | null;
}

/**
 * Inner component that uses the context hooks -- must be rendered inside BriefRuntimeProvider.
 */
function ConversationPageInner({ id, thread }: { id: string; thread: ThreadData | null }) {
  const router = useRouter();
  const savedThreadIdRef = useSavedThreadId();
  const conversationIdRef = useConversationId();
  const [loading, setLoading] = useState(true);
  const [briefContent, setBriefContent] = useState<string | null>(null);
  const [isBriefComplete, setIsBriefComplete] = useState(false);

  // Set savedThreadIdRef on mount so auto-persist works and save button shows "Saved"
  useEffect(() => {
    savedThreadIdRef.current = id;
  }, [id, savedThreadIdRef]);

  // Set conversationIdRef from thread data if available
  useEffect(() => {
    if (thread?.dify_conversation_id) {
      conversationIdRef.current = thread.dify_conversation_id;
    }
  }, [thread, conversationIdRef]);

  const handleBriefContent = (content: string) => {
    setBriefContent(content);
    setIsBriefComplete(true);
  };

  const handleLoadingChange = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <header className="h-12 border-b border-border bg-background flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ThreadListDrawer />
          <h1 className="text-lg font-semibold text-foreground">Email Brief</h1>
          {thread?.title && (
            <span className="ml-2 text-sm text-muted-foreground truncate max-w-[200px]">
              — {thread.title}
            </span>
          )}
          <span className="ml-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </div>
        <div className="flex items-center gap-2">
          <SaveConversationButton />
          <SettingsSheet />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/5 flex-shrink-0 border-r border-border">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          ) : (
            <BriefThread />
          )}
          {/* Load saved messages into the runtime */}
          <SavedThreadLoader threadId={id} onLoadingChange={handleLoadingChange} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <BriefEmptyState
            isBriefComplete={isBriefComplete}
            briefContent={briefContent}
            onStartEditing={() => router.push('/editor')}
          />
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [thread, setThread] = useState<ThreadData | null>(null);

  useEffect(() => {
    fetch(`${basePath}/api/threads/${id}`)
      .then((r) => r.json())
      .then((data) => setThread(data))
      .catch(() => {});
  }, [id]);

  return (
    <BriefRuntimeProvider
      onBriefContent={() => {}}
      initialConversationId={thread?.dify_conversation_id ?? undefined}
    >
      <ConversationPageInner id={id} thread={thread} />
    </BriefRuntimeProvider>
  );
}
