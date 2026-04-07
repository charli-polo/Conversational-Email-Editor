'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { basePath } from '@/lib/base-path';

export function ConversationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
      <h2 className="text-lg font-medium mt-4">No conversations yet</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
        Start a new conversation from the brief page to see it here
      </p>
      <a href={`${basePath}/`}>
        <Button variant="outline" className="mt-4">
          New conversation
        </Button>
      </a>
    </div>
  );
}
