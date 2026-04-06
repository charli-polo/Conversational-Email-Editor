'use client';

import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  useMessage,
} from '@assistant-ui/react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  RefreshCwIcon,
  SquareIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TooltipIconButton } from './tooltip-icon-button';
import { MarkdownText } from './markdown-text';
import { ComposerAddAttachment, ComposerAttachments, UserMessageAttachments } from './attachment';
import { useDifyParams } from './brief-runtime-provider';
import { useState, useEffect } from 'react';
import { basePath } from '@/lib/base-path';
import { cn } from '@/lib/utils';
import type { FC } from 'react';

// ---------------------------------------------------------------------------
// Thinking indicator (3 bouncing dots) — shown while assistant is working
// ---------------------------------------------------------------------------

const ThinkingIndicator: FC = () => (
  <div className="flex items-center gap-1 py-1 text-muted-foreground">
    <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
    <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
    <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
  </div>
);

const ThinkingText: FC = () => {
  const isEmpty = useMessage((m) =>
    m.content
      .filter((p) => p.type === 'text')
      .every((p) => (p as { type: 'text'; text: string }).text === '')
  );
  const isRunning = useMessage((m) => m.status?.type === 'running');

  if (isEmpty && isRunning) return <ThinkingIndicator />;
  return <MarkdownText />;
};

// ---------------------------------------------------------------------------
// Collapsible reasoning section (D-14, D-15, UX-07)
// ---------------------------------------------------------------------------

const ReasoningSection: FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const message = useMessage((m) => m);
  const toolBadges = ((message.metadata?.custom as Record<string, unknown>)?.toolBadges as string[]) || [];

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRightIcon className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
        Show reasoning
        {toolBadges.length > 0 && (
          <span className="flex gap-1">
            {toolBadges.map((tool, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {tool}
              </Badge>
            ))}
          </span>
        )}
      </button>
      {expanded && (
        <div className="mt-2 pl-5 border-l-2 border-muted text-sm text-muted-foreground whitespace-pre-wrap">
          {text}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root
    className="fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-[var(--thread-max-width)] animate-in py-3 duration-150"
    data-role="assistant"
  >
    <div className="wrap-break-word px-2 text-foreground leading-relaxed">
      <MessagePrimitive.Parts>
        {({ part }) => {
          if (part.type === 'reasoning') return <ReasoningSection text={(part as { type: 'reasoning'; text: string }).text} />;
          if (part.type === 'text') return <ThinkingText />;
          return null;
        }}
      </MessagePrimitive.Parts>
    </div>

    <div className="mt-1 ml-2 flex min-h-6 items-center gap-2">
      <AssistantFeedbackBar />
      <AssistantActionBar />
    </div>
  </MessagePrimitive.Root>
);

/** Feedback buttons (like/dislike) — always visible (D-12, UX-01) */
const AssistantFeedbackBar: FC = () => (
  <ActionBarPrimitive.Root className="-ml-1 flex gap-1 text-muted-foreground">
    <ActionBarPrimitive.FeedbackPositive asChild>
      <TooltipIconButton tooltip="Like">
        <AuiIf condition={(s) => (s.message as Record<string, unknown> & { feedback?: { type: string } }).feedback?.type === 'positive'}>
          <ThumbsUpIcon className="fill-current" />
        </AuiIf>
        <AuiIf condition={(s) => (s.message as Record<string, unknown> & { feedback?: { type: string } }).feedback?.type !== 'positive'}>
          <ThumbsUpIcon />
        </AuiIf>
      </TooltipIconButton>
    </ActionBarPrimitive.FeedbackPositive>
    <ActionBarPrimitive.FeedbackNegative asChild>
      <TooltipIconButton tooltip="Dislike">
        <AuiIf condition={(s) => (s.message as Record<string, unknown> & { feedback?: { type: string } }).feedback?.type === 'negative'}>
          <ThumbsDownIcon className="fill-current" />
        </AuiIf>
        <AuiIf condition={(s) => (s.message as Record<string, unknown> & { feedback?: { type: string } }).feedback?.type !== 'negative'}>
          <ThumbsDownIcon />
        </AuiIf>
      </TooltipIconButton>
    </ActionBarPrimitive.FeedbackNegative>
  </ActionBarPrimitive.Root>
);

/** Copy + Regenerate — hidden while running, autohide not-last */
const AssistantActionBar: FC = () => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    autohide="not-last"
    className="-ml-1 flex gap-1 text-muted-foreground"
  >
    <ActionBarPrimitive.Copy asChild>
      <TooltipIconButton tooltip="Copy">
        <AuiIf condition={(s) => s.message.isCopied}>
          <CheckIcon />
        </AuiIf>
        <AuiIf condition={(s) => !s.message.isCopied}>
          <CopyIcon />
        </AuiIf>
      </TooltipIconButton>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload asChild>
      <TooltipIconButton tooltip="Regenerate">
        <RefreshCwIcon />
      </TooltipIconButton>
    </ActionBarPrimitive.Reload>
  </ActionBarPrimitive.Root>
);

const UserMessage: FC = () => (
  <MessagePrimitive.Root
    className="fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-[var(--thread-max-width)] animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&>*]:col-start-2"
    data-role="user"
  >
    <UserMessageAttachments />
    <div className="relative col-start-2 min-w-0">
      <div className="peer rounded-2xl bg-muted px-4 py-2.5 text-foreground empty:hidden wrap-break-word">
        <MessagePrimitive.Parts />
      </div>
    </div>
  </MessagePrimitive.Root>
);

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  if (role === 'user') return <UserMessage />;
  return <AssistantMessage />;
};

// ---------------------------------------------------------------------------
// Welcome / Opener
// ---------------------------------------------------------------------------

function ThreadWelcome() {
  const difyParams = useDifyParams();
  return (
    <div className="mx-auto my-auto flex w-full max-w-[var(--thread-max-width)] grow flex-col">
      <div className="flex w-full grow flex-col items-center justify-center">
        <div className="flex size-full flex-col justify-center px-4">
          {difyParams?.opening_statement ? (
            <p className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground text-sm leading-relaxed duration-200">
              {difyParams.opening_statement}
            </p>
          ) : (
            <>
              <h1 className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-semibold text-2xl duration-200">
                Hello there!
              </h1>
              <p className="fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground text-xl delay-75 duration-200">
                What email would you like to create?
              </p>
            </>
          )}
        </div>
      </div>
      <OpenerSuggestions />
    </div>
  );
}

function OpenerSuggestions() {
  const difyParams = useDifyParams();
  if (!difyParams?.suggested_questions?.length) return null;
  return (
    <div className="grid w-full @md:grid-cols-2 gap-2 pb-4">
      {difyParams.suggested_questions.map((q, i) => (
        <ThreadPrimitive.Suggestion key={i} prompt={q} autoSend asChild>
          <Button
            variant="ghost"
            className="h-auto w-full flex-wrap items-start justify-start gap-1 rounded-3xl border bg-background px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
          >
            {q}
          </Button>
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic test prompt suggestions (shown on empty thread below opener)
// ---------------------------------------------------------------------------

function DynamicSuggestions() {
  const [prompts, setPrompts] = useState<Array<{ id: string; name: string; text: string; autoSend: boolean }>>([]);

  useEffect(() => {
    fetch(`${basePath}/api/test-prompts`)
      .then(res => res.json())
      .then(data => setPrompts((Array.isArray(data) ? data : []).slice(0, 6)))
      .catch(() => {});
  }, []);

  if (prompts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {prompts.map(p => (
        <ThreadPrimitive.Suggestion
          key={p.id}
          prompt={p.text}
          method="replace"
          {...(p.autoSend ? { autoSend: true } : {})}
          className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground cursor-pointer"
        >
          {p.name}
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function Composer() {
  const difyParams = useDifyParams();
  const fileUploadEnabled = difyParams?.file_upload?.enabled ?? difyParams?.file_upload?.image?.enabled ?? false;

  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div className="flex w-full flex-col gap-2 rounded-[var(--composer-radius)] border bg-background p-[var(--composer-padding)] transition-shadow focus-within:border-ring/75 focus-within:ring-2 focus-within:ring-ring/20 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50">
          <ComposerAttachments />
          <ComposerPrimitive.Input
            placeholder="Send a message..."
            className="max-h-32 min-h-10 w-full resize-none bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted-foreground/80"
            rows={1}
            autoFocus
            aria-label="Message input"
          />
          <div className="relative flex items-center justify-between">
            {fileUploadEnabled ? (
              <ComposerAddAttachment />
            ) : (
              <div />
            )}
            <AuiIf condition={(s) => !s.thread.isRunning}>
              <ComposerPrimitive.Send asChild>
                <TooltipIconButton
                  tooltip="Send message"
                  side="bottom"
                  variant="default"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Send message"
                >
                  <ArrowUpIcon className="size-4" />
                </TooltipIconButton>
              </ComposerPrimitive.Send>
            </AuiIf>
            <AuiIf condition={(s) => s.thread.isRunning}>
              <ComposerPrimitive.Cancel asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Stop generating"
                >
                  <SquareIcon className="size-3 fill-current" />
                </Button>
              </ComposerPrimitive.Cancel>
            </AuiIf>
          </div>
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Scroll to bottom
// ---------------------------------------------------------------------------

const ThreadScrollToBottom: FC = () => (
  <ThreadPrimitive.ScrollToBottom asChild>
    <TooltipIconButton
      tooltip="Scroll to bottom"
      variant="outline"
      className="absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:border-border dark:bg-background dark:hover:bg-accent"
    >
      <ArrowDownIcon />
    </TooltipIconButton>
  </ThreadPrimitive.ScrollToBottom>
);

// ---------------------------------------------------------------------------
// Main thread export
// ---------------------------------------------------------------------------

export function BriefThread() {
  return (
    <TooltipProvider delayDuration={300}>
      <ThreadPrimitive.Root
        className="aui-root aui-thread-root flex h-full flex-col bg-background"
        style={{
          '--thread-max-width': '44rem',
          '--composer-radius': '24px',
          '--composer-padding': '10px',
        } as React.CSSProperties}
      >
        <ThreadPrimitive.Viewport
          className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-scroll scroll-smooth px-4 pt-4"
        >
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <ThreadWelcome />
          </AuiIf>

          <ThreadPrimitive.Messages>
            {() => <ThreadMessage />}
          </ThreadPrimitive.Messages>

          <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mx-auto mt-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-[var(--composer-radius)] bg-background pb-4">
            <ThreadScrollToBottom />
            <Composer />
          </ThreadPrimitive.ViewportFooter>
        </ThreadPrimitive.Viewport>
      </ThreadPrimitive.Root>
    </TooltipProvider>
  );
}
