'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThreadListPrimitive, ThreadListItemPrimitive } from '@assistant-ui/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, History } from 'lucide-react';

function ThreadListItem() {
  return (
    <ThreadListItemPrimitive.Root className="flex items-center">
      <ThreadListItemPrimitive.Trigger className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors rounded-md truncate data-[active]:bg-accent">
        <div className="flex items-center gap-2">
          <span className="truncate flex-1">
            <ThreadListItemPrimitive.Title fallback="New conversation" />
          </span>
        </div>
      </ThreadListItemPrimitive.Trigger>
    </ThreadListItemPrimitive.Root>
  );
}

export function ThreadListDrawer() {
  return (
    <Sheet>
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
            <Button variant="outline" className="w-full justify-start gap-2" size="sm">
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
                  ThreadListItem,
                }}
              />
            </ThreadListPrimitive.Root>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
