'use client';

import { useState } from 'react';
import { useAssistantRuntime } from '@assistant-ui/react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { basePath } from '@/lib/base-path';
import { useConversationId } from './brief-runtime-provider';

export function SaveConversationButton() {
  const runtime = useAssistantRuntime();
  const conversationIdRef = useConversationId();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const state = runtime.thread.getState();
    const messages = state.messages;

    if (messages.length === 0) return;

    setSaving(true);
    try {
      // Create thread in DB
      const createRes = await fetch(`${basePath}/api/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const { id: threadId } = await createRes.json();

      // Generate title from first user message
      const firstUser = messages.find(m => m.role === 'user');
      const title = firstUser
        ? firstUser.content
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map(p => p.text)
            .join('')
            .slice(0, 50)
        : 'Saved conversation';

      // Save all messages
      const serializedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map(p => p.text)
          .join(''),
      }));

      await Promise.all([
        // Update thread title and conversation_id
        fetch(`${basePath}/api/threads/${threadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            dify_conversation_id: conversationIdRef.current || undefined,
          }),
        }),
        // Save messages
        fetch(`${basePath}/api/threads/${threadId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: serializedMessages }),
        }),
      ]);

      // Navigate to saved conversation
      window.location.href = `${basePath}/c/${threadId}`;
    } catch (err) {
      console.error('Failed to save conversation:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSave}
      disabled={saving}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <Save className="h-4 w-4" />
      {saving ? 'Saving...' : 'Save'}
    </Button>
  );
}
