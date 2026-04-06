'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAssistantRuntime } from '@assistant-ui/react';
import { Save, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { basePath } from '@/lib/base-path';
import { useConversationId, useSavedThreadId } from './brief-runtime-provider';

type SaveStatus = 'idle' | 'saving' | 'saved';

export function SaveConversationButton() {
  const runtime = useAssistantRuntime();
  const conversationIdRef = useConversationId();
  const savedThreadIdRef = useSavedThreadId();

  // If savedThreadIdRef is already set (e.g. on /c/{id} pages), initialize as saved
  const [status, setStatus] = useState<SaveStatus>(
    () => savedThreadIdRef.current ? 'saved' : 'idle',
  );
  const [showToast, setShowToast] = useState(false);

  // Sync status when savedThreadIdRef changes externally (e.g. page mount sets it)
  useEffect(() => {
    if (savedThreadIdRef.current && status === 'idle') {
      setStatus('saved');
    }
  }, [savedThreadIdRef, status]);

  const handleSave = useCallback(async () => {
    const state = runtime.thread.getState();
    const messages = state.messages;
    if (messages.length === 0) return;

    setStatus('saving');
    try {
      // 1. Create thread in DB
      const createRes = await fetch(`${basePath}/api/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const { id: threadId } = await createRes.json();

      // 2. Serialize messages
      const serializedMessages = messages.map((m) => ({
        role: m.role,
        content: m.content
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(''),
      }));

      // 3. Save messages to DB
      await fetch(`${basePath}/api/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: serializedMessages }),
      });

      // 4. Auto-generate title from Dify (fallback to first user message)
      let title = serializedMessages.find((m) => m.role === 'user')?.content.slice(0, 50) || 'Saved conversation';
      if (conversationIdRef.current) {
        try {
          const renameRes = await fetch(
            `${basePath}/api/brief/conversations/${conversationIdRef.current}/name`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ auto_generate: true }),
            },
          );
          const renameData = await renameRes.json();
          if (renameData.name) title = renameData.name;
        } catch {
          // Fallback to first user message text -- already set above
        }
      }

      // 5. Update thread with title and dify_conversation_id
      await fetch(`${basePath}/api/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          difyConversationId: conversationIdRef.current || undefined,
        }),
      });

      // 6. Enable auto-persist for future messages
      savedThreadIdRef.current = threadId;

      // 7. Update URL without full page reload
      window.history.replaceState(null, '', basePath + '/c/' + threadId);

      // 8. Show toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // 9. Mark as saved
      setStatus('saved');
    } catch (err) {
      console.error('Failed to save conversation:', err);
      setStatus('idle');
    }
  }, [runtime, conversationIdRef, savedThreadIdRef]);

  const handleNewConversation = useCallback(() => {
    savedThreadIdRef.current = '';
    conversationIdRef.current = '';
    setStatus('idle');
    window.location.href = basePath + '/';
  }, [savedThreadIdRef, conversationIdRef]);

  const isEmpty = runtime.thread.getState().messages.length === 0;

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={status === 'saving' || status === 'saved' || isEmpty}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          {status === 'saved' ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {status === 'idle' && 'Save'}
          {status === 'saving' && 'Saving...'}
          {status === 'saved' && 'Saved'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewConversation}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          title="New conversation"
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Conversation saved</span>
        </div>
      )}
    </>
  );
}
