'use client';

import { ActionBarPrimitive } from '@assistant-ui/react';
import { ThumbsUp, ThumbsDown, Copy, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

function ActionButton({
  tooltip,
  children,
}: {
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AssistantActionToolbar() {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {/* Feedback buttons -- always visible on all assistant messages */}
      <ActionBarPrimitive.Root className="flex gap-1">
        <ActionBarPrimitive.FeedbackPositive asChild>
          <ActionButton tooltip="Helpful">
            <ThumbsUp className="h-3.5 w-3.5" />
          </ActionButton>
        </ActionBarPrimitive.FeedbackPositive>
        <ActionBarPrimitive.FeedbackNegative asChild>
          <ActionButton tooltip="Not helpful">
            <ThumbsDown className="h-3.5 w-3.5" />
          </ActionButton>
        </ActionBarPrimitive.FeedbackNegative>
      </ActionBarPrimitive.Root>

      {/* Copy + Export -- hover on any assistant message */}
      <ActionBarPrimitive.Root
        autohide="always"
        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ActionBarPrimitive.Copy asChild>
          <ActionButton tooltip="Copy to clipboard">
            <Copy className="h-3.5 w-3.5" />
          </ActionButton>
        </ActionBarPrimitive.Copy>
        <ActionBarPrimitive.ExportMarkdown asChild>
          <ActionButton tooltip="Export as Markdown">
            <Download className="h-3.5 w-3.5" />
          </ActionButton>
        </ActionBarPrimitive.ExportMarkdown>
      </ActionBarPrimitive.Root>

      {/* Regenerate -- hover only on last assistant message */}
      <ActionBarPrimitive.Root
        autohide="not-last"
        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ActionBarPrimitive.Reload asChild>
          <ActionButton tooltip="Regenerate response">
            <RefreshCw className="h-3.5 w-3.5" />
          </ActionButton>
        </ActionBarPrimitive.Reload>
      </ActionBarPrimitive.Root>
    </div>
  );
}

export function UserActionToolbar() {
  return (
    <ActionBarPrimitive.Root
      autohide="always"
      className="flex gap-1 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <ActionBarPrimitive.Copy asChild>
        <ActionButton tooltip="Copy to clipboard">
          <Copy className="h-3.5 w-3.5" />
        </ActionButton>
      </ActionBarPrimitive.Copy>
    </ActionBarPrimitive.Root>
  );
}
