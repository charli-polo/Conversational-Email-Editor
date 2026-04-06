'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, MessageSquare, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { basePath } from '@/lib/base-path';

interface SavedThread {
  id: string;
  title: string | null;
  preview: string | null;
  agent_label: string | null;
  created_at: string;
}

function ThreadListItem({ thread, onDelete }: { thread: SavedThread; onDelete: (id: string) => void }) {
  return (
    <div className="group flex items-center gap-1">
      <a
        href={`${basePath}/c/${thread.id}`}
        className="flex-1 text-left px-3 py-2 text-sm hover:bg-accent transition-colors rounded-md overflow-hidden"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate min-w-0 flex-1 font-medium">
            {thread.title || 'Untitled conversation'}
          </span>
        </div>
        {thread.preview && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {thread.preview}
          </p>
        )}
        {thread.agent_label && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 mt-1">
            {thread.agent_label}
          </Badge>
        )}
      </a>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(thread.id); }}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
        title="Delete conversation"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ThreadListDrawer() {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<SavedThread[]>([]);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch(`${basePath}/api/threads`);
      const data = await res.json();
      setThreads(data.threads || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (open) fetchThreads();
  }, [open, fetchThreads]);

  const handleDelete = async (id: string) => {
    await fetch(`${basePath}/api/threads/${id}`, { method: 'DELETE' });
    setThreads(prev => prev.filter(t => t.id !== id));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Saved conversations">
          <History className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[40vw] min-w-[340px] max-w-[600px] p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle>Saved Conversations</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <div className="px-2 space-y-1">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No saved conversations</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Click &quot;Save&quot; in the header to save a conversation
                </p>
              </div>
            ) : (
              threads.map(thread => (
                <ThreadListItem key={thread.id} thread={thread} onDelete={handleDelete} />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
