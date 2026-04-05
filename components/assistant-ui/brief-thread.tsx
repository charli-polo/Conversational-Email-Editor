'use client';

import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from '@assistant-ui/react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

function BriefMessage() {
  return (
    <MessagePrimitive.Root>
      <MessagePrimitive.If user>
        <div className="flex justify-end">
          <div className="max-w-[90%] rounded-lg px-4 py-2 bg-muted text-foreground">
            <div className="text-sm whitespace-pre-wrap break-words">
              <MessagePrimitive.Content />
            </div>
          </div>
        </div>
      </MessagePrimitive.If>
      <MessagePrimitive.If assistant>
        <div className="flex justify-start">
          <div className="w-full text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
            <MessagePrimitive.Content />
          </div>
        </div>
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  );
}

function BriefSuggestions() {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      <ThreadPrimitive.Suggestion
        prompt="Create a product launch email"
        autoSend
        className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground cursor-pointer"
      >
        Create a product launch email
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        prompt="Write a newsletter update"
        autoSend
        className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground cursor-pointer"
      >
        Write a newsletter update
      </ThreadPrimitive.Suggestion>
    </div>
  );
}

export function BriefThread() {
  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Chat</h2>
      </div>

      <ThreadPrimitive.Root className="flex-1 flex flex-col">
        <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 space-y-4">
          <ThreadPrimitive.Messages
            components={{
              Message: BriefMessage,
            }}
          />
        </ThreadPrimitive.Viewport>

        {/* Suggestion chips shown only on empty thread */}
        <ThreadPrimitive.Empty>
          <BriefSuggestions />
        </ThreadPrimitive.Empty>

        <div className="p-4 border-t border-border">
          <ComposerPrimitive.Root className="relative border border-border rounded-[24px] bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
            <div className="flex items-end gap-2 px-3 py-2">
              <ComposerPrimitive.Input
                placeholder="Tell me about the email you'd like to create..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none px-2 py-2 text-sm resize-none outline-none min-h-[24px] max-h-[72px] overflow-y-auto"
              />
              <ComposerPrimitive.Send asChild>
                <Button
                  size="icon"
                  className="flex-shrink-0 h-9 w-9 rounded-full bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </ComposerPrimitive.Send>
            </div>
          </ComposerPrimitive.Root>
        </div>
      </ThreadPrimitive.Root>
    </div>
  );
}
