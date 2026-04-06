'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BriefRuntimeProvider } from '@/components/assistant-ui/brief-runtime-provider';
import { BriefThread } from '@/components/assistant-ui/brief-thread';
import { BriefEmptyState } from '@/components/brief/brief-empty-state';
import { SettingsSheet } from '@/components/settings/settings-sheet';
import { ThreadListDrawer } from '@/components/assistant-ui/thread-list-drawer';
import { SavedThreadLoader } from '@/components/assistant-ui/saved-thread-loader';
import { basePath } from '@/lib/base-path';

interface ThreadData {
  id: string;
  title: string | null;
  dify_conversation_id: string | null;
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [briefContent, setBriefContent] = useState<string | null>(null);
  const [isBriefComplete, setIsBriefComplete] = useState(false);

  useEffect(() => {
    fetch(`${basePath}/api/threads/${id}`)
      .then(r => r.json())
      .then(data => setThread(data))
      .catch(() => {});
  }, [id]);

  const handleBriefContent = (content: string) => {
    setBriefContent(content);
    setIsBriefComplete(true);
  };

  return (
    <BriefRuntimeProvider
      onBriefContent={handleBriefContent}
      initialConversationId={thread?.dify_conversation_id ?? undefined}
    >
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
          <SettingsSheet />
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-2/5 flex-shrink-0 border-r border-border">
            <BriefThread />
            {/* Load saved messages into the runtime */}
            <SavedThreadLoader threadId={id} />
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
    </BriefRuntimeProvider>
  );
}
