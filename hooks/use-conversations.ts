'use client';

import { useState, useCallback } from 'react';
import { basePath } from '@/lib/base-path';

export interface ConversationTag {
  id: string;
  name: string;
}

export interface ConversationWithTags {
  id: string;
  title: string | null;
  preview: string | null;
  agent_label: string | null;
  agent_id: string | null;
  is_archived: boolean;
  tags: ConversationTag[];
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${basePath}/api/threads`);
      const data = await res.json();
      setConversations(data.threads || []);
    } catch {
      // ignore -- caller can check isLoading
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<ConversationWithTags>) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }, []);

  return { conversations, isLoading, refresh, removeConversation, updateConversation };
}
