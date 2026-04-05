'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThreadListPrimitive, ThreadListItemPrimitive } from '@assistant-ui/react';
import { useAuiState } from '@assistant-ui/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useThreadMetadata } from '@/components/assistant-ui/brief-runtime-provider';
import { Plus, History, Check, MessageSquare } from 'lucide-react';
import { useState } from 'react';

function ThreadListItem({ onSelect }: { onSelect: () => void }) {
  const metadata = useThreadMetadata();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remoteId = useAuiState((s: any) => s.threadListItem?.remoteId) as string | undefined;
  const meta = remoteId ? metadata[remoteId] : undefined;

  return (
    <ThreadListItemPrimitive.Root className="group flex items-center">
      <ThreadListItemPrimitive.Trigger
        onClick={onSelect}
        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors rounded-md data-[active]:bg-accent data-[active]:font-medium"
      >
        <div className="flex items-center gap-2">
          <span className="truncate flex-1">
            <ThreadListItemPrimitive.Title fallback="New conversation" />
          </span>
          {meta?.agentLabel && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
              {meta.agentLabel}
            </Badge>
          )}
          <Check className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 hidden group-data-[active]:block" />
        </div>
        {meta?.preview && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {meta.preview.length > 80 ? meta.preview.slice(0, 80) + '...' : meta.preview}
          </p>
        )}
      </ThreadListItemPrimitive.Trigger>
    </ThreadListItemPrimitive.Root>
  );
}

function ThreadListEmpty() {
  const metadata = useThreadMetadata();
  if (Object.keys(metadata).length > 0) return null;
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground">No conversations yet</p>
      <p className="text-xs text-muted-foreground/70 mt-1">Start a new conversation to begin</p>
    </div>
  );
}

export function ThreadListDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Conversation history">
          <History className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle>Conversations</SheetTitle>
        </SheetHeader>
        <div className="px-2 pb-2">
          <ThreadListPrimitive.New asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
              onClick={() => setOpen(false)}
            >
              <Plus className="h-4 w-4" />
              New conversation
            </Button>
          </ThreadListPrimitive.New>
        </div>
        <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
          <div className="px-2 space-y-1">
            <ThreadListPrimitive.Root>
              <ThreadListPrimitive.Items
                components={{
                  ThreadListItem: () => (
                    <ThreadListItem onSelect={() => setOpen(false)} />
                  ),
                }}
              />
            </ThreadListPrimitive.Root>
            <ThreadListEmpty />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
