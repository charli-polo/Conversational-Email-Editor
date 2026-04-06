'use client';

import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from '@assistant-ui/react';
import { useAuiState, useAui } from '@assistant-ui/store';
import { ArrowUp, Paperclip, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useState, useEffect, useRef, useCallback } from 'react';
import { basePath } from '@/lib/base-path';
import Markdown from 'react-markdown';
// Action toolbar temporarily removed — will be re-implemented
import { StreamingReasoningIndicator, ReasoningSection } from './reasoning-section';
import { ComposerAttachmentPreview, MessageAttachmentDisplay } from './attachment-preview';
import { DragDropOverlay } from './drag-drop-overlay';
import { useDifyParams } from './brief-runtime-provider';

/**
 * ThreadOpener -- D-05/D-06: Static opener rendered via ThreadPrimitive.Empty.
 * Not injected as a fake message (runtime reconciliation would wipe it).
 */
function ThreadOpener() {
  const difyParams = useDifyParams();
  if (!difyParams?.opening_statement) return null;

  return (
    <div className="flex flex-col items-start">
      <div className="w-full text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
        <Markdown>{difyParams.opening_statement}</Markdown>
      </div>
    </div>
  );
}

/**
 * AssistantMessageContent -- Reads message state via useAuiState to conditionally
 * render streaming reasoning (D-14/D-16), post-response reasoning (D-17),
 * attachment display (D-12), and action toolbar.
 */
function AssistantMessageContent() {
  const message = useAuiState((s) => s.message);

  const custom = (message?.metadata?.custom ?? {}) as Record<string, unknown>;
  const isStreamingReasoning = custom.isStreamingReasoning === true;
  const streamingTools = (custom.streamingTools as string[]) || [];

  // Extract reasoning parts from content
  const content = message?.content;
  const reasoningParts = Array.isArray(content)
    ? content
        .filter((p) => p.type === 'reasoning')
        .map((p) => ({ text: (p as { text: string }).text }))
    : [];

  const reasoningText = reasoningParts.map((r) => r.text).join('\n\n');

  // Check if message is still streaming
  const isRunning = message?.status?.type === 'running';

  // Extract image/document attachment parts from content for D-12
  const attachmentParts = Array.isArray(content)
    ? content.filter((p) => p.type === 'image' || p.type === 'file')
    : [];

  return (
    <>
      <div className="w-full text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
        <MessagePrimitive.Content
          components={{
            Text: ({ text }) => <Markdown>{text}</Markdown>,
          }}
        />
      </div>

      {/* D-12: Render image/document attachments inline in assistant messages */}
      {attachmentParts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachmentParts.map((part, i: number) => (
            <MessageAttachmentDisplay
              key={i}
              type={part.type === 'image' ? 'image' : 'document'}
              name={(part as Record<string, unknown>).filename as string || 'attachment'}
              url={
                part.type === 'image'
                  ? (part as Record<string, unknown>).image as string | undefined
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* D-14/D-16: Streaming reasoning indicator -- dots + timer while agent is thinking */}
      {isStreamingReasoning && isRunning && (
        <StreamingReasoningIndicator
          tools={streamingTools}
          reasoningText={reasoningText}
        />
      )}

      {/* D-17: Post-response collapsible reasoning -- only when streaming is done and reasoning exists */}
      {!isStreamingReasoning && !isRunning && reasoningParts.length > 0 && (
        <ReasoningSection reasoningParts={reasoningParts} />
      )}

      {/* Action toolbar removed — will be re-implemented */}
    </>
  );
}

function UserMessageContent() {
  const message = useAuiState((s) => s.message);
  const custom = (message?.metadata?.custom ?? {}) as Record<string, unknown>;
  const attachmentNames = (custom.attachmentNames as string[]) || [];

  return (
    <>
      <div className="text-sm whitespace-pre-wrap break-words">
        <MessagePrimitive.Content />
      </div>
      {attachmentNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {attachmentNames.map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-background/50 border border-border/50"
            >
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="max-w-[150px] truncate">{name}</span>
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function BriefMessage() {
  return (
    <MessagePrimitive.Root>
      <MessagePrimitive.If user>
        <div className="flex flex-col items-end group">
          <div className="max-w-[90%] rounded-lg px-4 py-2 bg-muted text-foreground">
            <UserMessageContent />
          </div>
          {/* User action toolbar removed — will be re-implemented */}
        </div>
      </MessagePrimitive.If>
      <MessagePrimitive.If assistant>
        <div className="flex flex-col items-start group">
          <AssistantMessageContent />
        </div>
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  );
}

function OpenerSuggestionsBlock() {
  const difyParams = useDifyParams();
  if (!difyParams?.suggested_questions?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-4 py-1">
      {difyParams.suggested_questions.map((suggestion, i) => (
        <ThreadPrimitive.Suggestion
          key={i}
          prompt={suggestion}
          autoSend
          className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
        >
          {suggestion}
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
}

function DynamicSuggestions() {
  const [prompts, setPrompts] = useState<Array<{ id: string; name: string; text: string; autoSend: boolean }>>([]);

  useEffect(() => {
    fetch(`${basePath}/api/test-prompts`)
      .then(res => res.json())
      .then(data => setPrompts((Array.isArray(data) ? data : []).slice(0, 6)))
      .catch(() => {});
  }, []);

  if (prompts.length === 0) {
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

/**
 * FileUploadButton -- Native label+input pattern for reliable file dialog.
 * ComposerPrimitive.AddAttachment uses programmatic input.click() which
 * some browsers block. This uses a <label> wrapping a hidden <input> instead.
 */
function FileUploadButton({ accept }: { accept: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const aui = useAui();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of files) {
      aui.composer().addAttachment(file);
    }
    // Reset so the same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  }, [aui]);

  return (
    <>
      <input
        ref={inputRef}
        id="file-upload-input"
        type="file"
        multiple
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        tabIndex={-1}
      />
      <label
        htmlFor="file-upload-input"
        role="button"
        tabIndex={0}
        className="inline-flex items-center justify-center flex-shrink-0 h-9 w-9 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
      >
        <Paperclip className="h-4 w-4" />
      </label>
    </>
  );
}

export function BriefThread() {
  const difyParams = useDifyParams();
  const fileUploadEnabled = difyParams?.file_upload?.enabled ?? difyParams?.file_upload?.image?.enabled ?? false;

  return (
    <TooltipProvider delayDuration={300}>
    <div className="flex flex-col h-full min-h-0 bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Chat</h2>
      </div>

      <DragDropOverlay>
        <ThreadPrimitive.Root className="flex-1 flex flex-col min-h-0">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
            {/* D-05/D-06: Opener always at top of conversation */}
            <ThreadOpener />
            {/* D-06: Dify suggested questions, right below opener, hidden once messages exist */}
            <ThreadPrimitive.Empty>
              <OpenerSuggestionsBlock />
            </ThreadPrimitive.Empty>
            <ThreadPrimitive.Messages
              components={{
                Message: BriefMessage,
              }}
            />
          </ThreadPrimitive.Viewport>

          {/* Test prompt chips shown only on empty thread */}
          <ThreadPrimitive.Empty>
            <DynamicSuggestions />
          </ThreadPrimitive.Empty>

          <div className="p-4 border-t border-border">
            <ComposerPrimitive.Root className="relative border border-border rounded-[24px] bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
              {/* Attachment previews above the input row (D-11) */}
              <div className="flex flex-wrap gap-1 px-3 pt-2 empty:hidden">
                <ComposerPrimitive.Attachments
                  components={{
                    Attachment: ComposerAttachmentPreview,
                  }}
                />
              </div>

              <div className="flex items-end gap-2 px-3 py-2">
                {/* Paperclip button -- left of input (D-09) */}
                {fileUploadEnabled && (
                  <FileUploadButton accept="image/*,.pdf" />
                )}

                <ComposerPrimitive.Input
                  placeholder="Tell me about the email you'd like to create..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none px-2 py-2 text-sm resize-none outline-none min-h-[24px] max-h-[72px] overflow-y-auto"
                />

                {/* Mic button -- hidden for now (D-18, D-19) */}

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
      </DragDropOverlay>
    </div>
    </TooltipProvider>
  );
}
