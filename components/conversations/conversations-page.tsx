'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useConversations, type ConversationWithTags, type ConversationTag } from '@/hooks/use-conversations';
import { ConversationEmptyState } from '@/components/conversations/conversation-empty-state';
import { ConversationListItem } from '@/components/conversations/conversation-list-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { basePath } from '@/lib/base-path';
import { Plus, Home } from 'lucide-react';

export function ConversationsPage() {
  const { conversations, isLoading, refresh, removeConversation, updateConversation } = useConversations();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<ConversationTag[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  const filteredConversations = useMemo(() => {
    if (activeTab === 'all') return conversations;
    return conversations.filter((c) =>
      c.tags.some((t) => t.id === activeTab)
    );
  }, [conversations, activeTab]);

  const visibleTabs = useMemo(() => {
    const tagMap = new Map<string, ConversationTag>();
    for (const c of conversations) {
      for (const t of c.tags) {
        if (!tagMap.has(t.id)) {
          tagMap.set(t.id, t);
        }
      }
    }
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [conversations]);

  // Reset to "all" if active tag disappears from visible tabs
  useEffect(() => {
    if (activeTab !== 'all' && !visibleTabs.some((t) => t.id === activeTab)) {
      setActiveTab('all');
    }
  }, [visibleTabs, activeTab]);

  const refreshAllTags = useCallback(async () => {
    try {
      const res = await fetch(`${basePath}/api/tags`);
      const data = await res.json();
      setAllTags(data.tags || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshAllTags();
  }, [refresh, refreshAllTags]);

  const startEditing = (id: string, currentTitle: string | null) => {
    setEditingId(id);
    setEditValue(currentTitle || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }
    try {
      await fetch(`${basePath}/api/threads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      updateConversation(id, { title: trimmed });
    } catch {
      // silently fail, user can retry
    }
    setEditingId(null);
    setEditValue('');
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`${basePath}/api/threads/${deletingId}`, { method: 'DELETE' });
      removeConversation(deletingId);
    } catch {
      // silently fail
    }
    setDeletingId(null);
  };

  const handleAssignTag = async (conversationId: string, tagName: string) => {
    try {
      const res = await fetch(`${basePath}/api/threads/${conversationId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName }),
      });
      const data = await res.json();

      if (data.tag) {
        // Optimistic update: add tag to conversation's local state
        const conversation = conversations.find((c) => c.id === conversationId);
        if (conversation) {
          const alreadyHas = conversation.tags.some((t) => t.id === data.tag.id);
          if (!alreadyHas) {
            updateConversation(conversationId, {
              tags: [...conversation.tags, data.tag],
            });
          }
        }

        // Update allTags if this is a newly created tag
        if (!allTags.some((t) => t.id === data.tag.id)) {
          setAllTags((prev) => [...prev, data.tag].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }
    } catch {
      // silently fail, user can retry
    }
  };

  const handleRemoveTag = async (conversationId: string, tagId: string) => {
    // Optimistic update: remove tag from local state immediately
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      updateConversation(conversationId, {
        tags: conversation.tags.filter((t) => t.id !== tagId),
      });
    }

    try {
      await fetch(`${basePath}/api/threads/${conversationId}/tags/${tagId}`, {
        method: 'DELETE',
      });
    } catch {
      // If API fails, refresh to restore correct state
      refresh();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <a href={basePath + '/'} title="Home">
            <Home className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </a>
          <h1 className="text-xl font-semibold">Conversations</h1>
        </div>
        <a href={basePath + '/'}>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New conversation
          </Button>
        </a>
      </div>

      {visibleTabs.length > 0 && (
        <div className="px-6 py-2 border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {visibleTabs.map((tag) => (
                <TabsTrigger key={tag.id} value={tag.id}>
                  {tag.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <ScrollArea className="flex-1">
        {isLoading && conversations.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-sm text-muted-foreground">
              Loading conversations...
            </div>
          </div>
        )}

        {!isLoading && conversations.length === 0 && activeTab === 'all' && (
          <ConversationEmptyState />
        )}

        {!isLoading && filteredConversations.length === 0 && activeTab !== 'all' && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No conversations with this tag
          </div>
        )}

        {filteredConversations.length > 0 && (
          <div className="divide-y">
            {filteredConversations.map((c: ConversationWithTags) => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                isEditing={editingId === c.id}
                editValue={editValue}
                onStartEdit={() => startEditing(c.id, c.title)}
                onEditChange={setEditValue}
                onSaveEdit={() => saveEdit(c.id)}
                onCancelEdit={cancelEditing}
                onDelete={() => setDeletingId(c.id)}
                allTags={allTags}
                onAssignTag={(tagName) => handleAssignTag(c.id, tagName)}
                onRemoveTag={(tagId) => handleRemoveTag(c.id, tagId)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The conversation and all its messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
