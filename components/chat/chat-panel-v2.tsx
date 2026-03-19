'use client';

import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react';
import { EmailSection } from '@/components/preview/email-preview';
import { SelectedSectionCard } from './selected-section-card';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatPanelProps {
  currentHtml: string;
  selectedSection?: EmailSection | null;
  onHtmlUpdate: (html: string) => void;
  onSectionDeselect?: () => void;
}

export function ChatPanel({
  currentHtml,
  selectedSection,
  onHtmlUpdate,
  onSectionDeselect
}: ChatPanelProps) {
  return (
    <ThreadPrimitive.Root className="flex flex-col h-full bg-background border-r border-border">
      {/* Selected section card */}
      {selectedSection && onSectionDeselect && (
        <div className="p-4 pb-0">
          <SelectedSectionCard
            section={selectedSection}
            onDeselect={onSectionDeselect}
          />
        </div>
      )}

      {/* Messages area */}
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto p-4 space-y-4">
        <ThreadPrimitive.Empty>
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-sm">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Welcome to the Email Editor
              </h3>
              <p className="text-sm text-muted-foreground">
                Type instructions to modify your email. For example:
              </p>
              <ul className="mt-3 text-xs text-muted-foreground space-y-1 text-left">
                <li>• "Make the hero section dark blue"</li>
                <li>• "Change the heading to 'Winter Sale'"</li>
                <li>• "Add a discount code to the footer"</li>
              </ul>
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage: ({ message }) => (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-primary text-primary-foreground">
                  <MessagePrimitive.Content />
                </div>
              </div>
            ),
            AssistantMessage: ({ message }) => (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-muted text-muted-foreground">
                  <MessagePrimitive.Content />
                </div>
              </div>
            ),
          }}
        />
      </ThreadPrimitive.Viewport>

      {/* Input area */}
      <div className="border-t border-border p-4 bg-muted/50">
        <ComposerPrimitive.Root className="flex gap-2">
          <ComposerPrimitive.Input
            placeholder="Type an instruction..."
            className="flex-1 px-4 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <ComposerPrimitive.Send asChild>
            <Button size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}
