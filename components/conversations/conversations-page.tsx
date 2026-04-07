'use client';

import { useEffect } from 'react';
import { useConversations, type ConversationWithTags } from '@/hooks/use-conversations';
import { ConversationEmptyState } from '@/components/conversations/conversation-empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { basePath } from '@/lib/base-path';
import { Plus } from 'lucide-react';

export function ConversationsPage() {
  const { conversations, isLoading, refresh, removeConversation, updateConversation } = useConversations();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-xl font-semibold">Conversations</h1>
        <a href={basePath + '/'}>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New conversation
          </Button>
        </a>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && conversations.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-sm text-muted-foreground">
              Loading conversations...
            </div>
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <ConversationEmptyState />
        )}

        {conversations.length > 0 && (
          <div className="divide-y">
            {conversations.map((c: ConversationWithTags) => (
              <div key={c.id} className="group flex items-center gap-3 px-6 py-4 hover:bg-accent/50 transition-colors">
                <a href={`${basePath}/c/${c.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {c.title || 'Untitled conversation'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {c.agent_label && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                        {c.agent_label}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  {c.preview && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{c.preview}</p>
                  )}
                </a>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
