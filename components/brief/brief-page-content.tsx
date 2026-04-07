'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BriefRuntimeProvider } from '@/components/assistant-ui/brief-runtime-provider';
import { BriefThread } from '@/components/assistant-ui/brief-thread';
import { BriefEmptyState } from '@/components/brief/brief-empty-state';
import { SettingsSheet } from '@/components/settings/settings-sheet';
import { SaveConversationButton } from '@/components/assistant-ui/save-conversation-button';
import { ThreadListDrawer } from '@/components/assistant-ui/thread-list-drawer';
import { List } from 'lucide-react';
import { basePath } from '@/lib/base-path';

interface BriefPageContentProps {
  initialThreadId?: string;
}

export function BriefPageContent({ initialThreadId }: BriefPageContentProps) {
  const router = useRouter();
  const [briefContent, setBriefContent] = useState<string | null>(null);
  const [isBriefComplete, setIsBriefComplete] = useState(false);

  const handleBriefContent = (content: string) => {
    setBriefContent(content);
    setIsBriefComplete(true);
  };

  const handleStartEditing = () => {
    router.push('/editor');
  };

  return (
    <BriefRuntimeProvider onBriefContent={handleBriefContent}>
      <div className="h-screen w-screen overflow-hidden flex flex-col">
        {/* Minimal header */}
        <header className="h-12 border-b border-border bg-background flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ThreadListDrawer />
            <a
              href={basePath + '/conversations'}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
              title="All conversations"
            >
              <List className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <h1 className="text-lg font-semibold text-foreground">Email Brief</h1>
            <span className="ml-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
          </div>
          <div className="flex items-center gap-2">
            <SaveConversationButton />
            <SettingsSheet />
          </div>
        </header>

        {/* Two-panel layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel - Chat (40%) */}
          <div className="w-2/5 flex-shrink-0 border-r border-border">
            <BriefThread />
          </div>

          {/* Right panel - Brief (60%) */}
          <div className="flex-1 overflow-y-auto">
            <BriefEmptyState
              isBriefComplete={isBriefComplete}
              briefContent={briefContent}
              onStartEditing={handleStartEditing}
            />
          </div>
        </div>
      </div>
    </BriefRuntimeProvider>
  );
}
