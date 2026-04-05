'use client';

import { useRouter } from 'next/navigation';
import { useBriefChat } from '@/hooks/use-brief-chat';
import { BriefChatPanel } from '@/components/brief/brief-chat-panel';
import { BriefEmptyState } from '@/components/brief/brief-empty-state';

export default function BriefPage() {
  const router = useRouter();
  const {
    messages,
    suggestedQuestions,
    input,
    setInput,
    sendMessage,
    isLoading,
    isBriefComplete,
    briefContent,
  } = useBriefChat();

  const handleStartEditing = () => {
    router.push('/editor'); // Navigate to editor
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      {/* Minimal header */}
      <header className="h-12 border-b border-border bg-background flex items-center px-6 flex-shrink-0">
        <h1 className="text-lg font-semibold text-foreground">Email Brief</h1>
        <span className="ml-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
      </header>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Chat */}
        <div className="w-[420px] flex-shrink-0">
          <BriefChatPanel
            messages={messages}
            suggestedQuestions={suggestedQuestions}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            isLoading={isLoading}
          />
        </div>

        {/* Right panel - Brief empty state */}
        <div className="flex-1 overflow-y-auto">
          <BriefEmptyState
            isBriefComplete={isBriefComplete}
            briefContent={briefContent}
            onStartEditing={handleStartEditing}
          />
        </div>
      </div>
    </div>
  );
}
