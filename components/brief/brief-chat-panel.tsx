'use client';

import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BriefMessage } from '@/hooks/use-brief-chat';

interface BriefChatPanelProps {
  messages: BriefMessage[];
  suggestedQuestions: string[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: (text?: string) => void;
  isLoading: boolean;
}

export function BriefChatPanel({
  messages,
  suggestedQuestions,
  input,
  setInput,
  sendMessage,
  isLoading,
}: BriefChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 72)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        sendMessage();
      }
    }
  };

  // Show suggestion chips only when only the opening statement exists
  const showSuggestions = messages.length <= 1 && suggestedQuestions.length > 0;

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Chat</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[90%] rounded-lg px-4 py-2 bg-muted text-foreground">
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="w-full text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Suggestion chips after opening statement */}
            {index === 0 && msg.role === 'assistant' && showSuggestions && (
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'assistant' &&
          messages[messages.length - 1].content === '' && (
            <div className="flex justify-start">
              <div className="flex gap-1 py-2">
                <span
                  className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border">
        <form
          onSubmit={handleSubmit}
          className="relative border border-border rounded-[24px] bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow"
        >
          <div className="flex items-end gap-2 px-3 py-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me about the email you'd like to create..."
              disabled={isLoading}
              rows={1}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none px-2 py-2 text-sm resize-none outline-none min-h-[24px] max-h-[72px] overflow-y-auto"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="flex-shrink-0 h-9 w-9 rounded-full bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
