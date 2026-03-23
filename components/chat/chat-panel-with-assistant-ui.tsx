'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { EmailSection, EmailElement } from '@/components/preview/email-preview';
import { SelectedSectionCard } from './selected-section-card';
import { mergeSectionHtml } from '@/lib/merge-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ChatPanelProps {
  currentHtml: string;
  selectedSection?: EmailSection | null;
  selectedElement?: EmailElement | null;
  onHtmlUpdate: (html: string, skipHistory?: boolean) => void;
  onSectionDeselect?: () => void;
  onGenerationComplete?: () => void;
  suggestions?: string[];
}

// Helper function to format AI messages and handle error responses
function formatAIMessage(content: string): string {
  // Check if content looks like a JSON error
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.error) {
        // Transform error into conversational message
        return `I'm sorry, but ${parsed.error.charAt(0).toLowerCase()}${parsed.error.slice(1)}

Could you try being more specific or selecting a section first?`;
      }
    } catch (e) {
      // Not valid JSON, return as is
    }
  }
  return content;
}

export function ChatPanel({
  currentHtml,
  selectedSection,
  selectedElement,
  onHtmlUpdate,
  onSectionDeselect,
  onGenerationComplete,
  suggestions = []
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [thinkingTime, setThinkingTime] = useState(0);
  const thinkingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastEditedSection, setLastEditedSection] = useState<string | null>(null);
  const [lastEditSummary, setLastEditSummary] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Use ref to track the section or element being edited (to avoid stale closure in onFinish)
  const editingSectionRef = useRef<EmailSection | null>(null);
  const editingElementRef = useRef<EmailElement | null>(null);

  // Throttle streaming updates
  const lastStreamUpdateRef = useRef<number>(0);

  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'initial-user',
        role: 'user',
        content: `Create a product launch email for this Salomon sneaker: https://www.salomon.com/fr-fr/product/xt-6-gore-tex-lg9333

TONE: Premium outdoor brand with urban edge. Confident and technical but accessible. Focus on "heritage meets innovation" — trail performance adapted for city life. Aspirational but grounded, avoid hype. High-end technical apparel vibe (Arc'teryx level).

Clean layout with dramatic hero, product details + CTA, tech close-up, 4-feature grid with icons, alternating lifestyle sections, and footer.`
      },
      {
        id: 'initial-assistant',
        role: 'assistant',
        content: `I've created a product launch email for the Salomon XT-6 GORE-TEX sneaker that balances technical authority with urban appeal.

**What I included:**
• Hero section with dramatic product imagery and clean headline
• Product details with price, CTA, and technical callouts
• Close-up view highlighting the GORE-TEX waterproofing technology
• 4-feature grid with icons (Trail Heritage, All-Weather Protection, Urban Ready, Premium Build)
• Alternating lifestyle sections showing versatility (trail to city)
• Footer with unsubscribe, copyright, and social links

**Key decision:** I emphasized the heritage-meets-innovation positioning by pairing technical language ("GORE-TEX waterproofing", "Sensifit construction") with lifestyle photography. The layout is clean and premium, avoiding hype-driven copy in favor of confident, specification-driven messaging that mirrors Arc'teryx's approach.`
      }
    ],
    body: {
      html: currentHtml,
    },
    onFinish: (message) => {
      console.log('✅ Generation complete');

      let content = message.content;
      let summary: string | null = null;

      // Extract SUMMARY if present
      if (content.startsWith('SUMMARY:')) {
        const lines = content.split('\n');
        const summaryLine = lines[0];
        summary = summaryLine.replace('SUMMARY:', '').trim();
        content = lines.slice(1).join('\n').trim();
        console.log('📝 Edit summary:', summary);
      }

      // Remove markdown code fences if present (```html ... ``` or ``` ... ```)
      content = content.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

      // Check if response is HTML (more robust)
      const isHtml = content.includes('<table') ||
        content.includes('<tr') ||
        content.includes('<!DOCTYPE') ||
        content.includes('<html>');

      if (isHtml) {
        // Use the ref to get the section or element that was being edited
        const editingSection = editingSectionRef.current;
        const editingElement = editingElementRef.current;

        // Validation: Check if AI response is suspiciously short (might have lost sections)
        if (!editingSection && !editingElement) {
          // Full email editing - check for content loss
          const inputSections = (currentHtml.match(/data-section-id=/g) || []).length;
          const outputSections = (content.match(/data-section-id=/g) || []).length;
          const inputImages = (currentHtml.match(/<img/g) || []).length;
          const outputImages = (content.match(/<img/g) || []).length;

          if (outputSections < inputSections || outputImages < inputImages) {
            console.error('⚠️ AI response lost content!', {
              inputSections,
              outputSections,
              inputImages,
              outputImages
            });

            // Show error to user
            const lostSections = inputSections - outputSections;
            const lostImages = inputImages - outputImages;
            const errorMsg = `⚠️ The AI's response lost some content (${lostSections} section(s), ${lostImages} image(s)). Please try again or rephrase your request.`;
            setValidationError(errorMsg);

            // Don't apply the update
            console.error('Response rejected - content loss detected');
            return;
          }

          // Clear any previous validation error
          setValidationError(null);
        }

        // If element is selected, merge using the parent section
        // If section is selected, merge using section
        // Otherwise full replace
        if (editingElement) {
          // For elements, use the parent section for merging
          const merged = mergeSectionHtml(currentHtml, editingElement.sectionId, content);
          onHtmlUpdate(merged);
          // Save the summary for display
          setLastEditSummary(summary);
        } else if (editingSection) {
          const merged = mergeSectionHtml(currentHtml, editingSection.id, content);
          onHtmlUpdate(merged);
          // Save the summary for display
          setLastEditSummary(summary);
        } else {
          onHtmlUpdate(content);
          setLastEditSummary(summary);
        }

        // Deselect section/element after successful edit
        if ((editingSection || editingElement) && onSectionDeselect) {
          onSectionDeselect();
        }

        // Notify parent that generation completed
        if (onGenerationComplete) {
          onGenerationComplete();
        }

        // Clear the editing refs
        editingSectionRef.current = null;
        editingElementRef.current = null;
      } else if (content.trim().startsWith('{') && content.includes('error')) {
        console.error('AI returned error:', content);
      }
    },
  });

  // Auto-scroll to bottom only if user is already near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if user is near bottom (within 100px)
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Only auto-scroll if user is already near bottom
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);


  // Timer for thinking animation
  useEffect(() => {
    if (isLoading) {
      setThinkingTime(0);
      thinkingIntervalRef.current = setInterval(() => {
        setThinkingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
        thinkingIntervalRef.current = null;
      }
    }

    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
    };
  }, [isLoading]);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Set height based on content, max 3 lines (~72px for 3 lines with text-sm)
    const maxHeight = 72; // Approx 3 lines
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [input]);

  // Streaming preview disabled for cleaner UX - only show final result
  // The blur animation will handle the loading state visually

  // Wrapper for handleSubmit to store which section/element was edited and pass dynamic data
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Clear any previous validation error
    setValidationError(null);

    // Store the section or element being edited in ref (to avoid stale closure in onFinish)
    editingSectionRef.current = selectedSection || null;
    editingElementRef.current = selectedElement || null;

    if (selectedElement) {
      setLastEditedSection(selectedElement.label);
    } else if (selectedSection) {
      setLastEditedSection(selectedSection.label);
    } else {
      setLastEditedSection(null);
    }

    // Pass the current selectedSection/selectedElement values dynamically
    // Element takes priority over section
    originalHandleSubmit(e, {
      body: {
        html: currentHtml,
        selectedSectionId: selectedSection?.id,
        selectedSectionHtml: selectedSection?.html,
        selectedElementId: selectedElement?.id,
        selectedElementType: selectedElement?.type,
        selectedElementTag: selectedElement?.tag,
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-sm">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Welcome to the Email Editor
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Type instructions to modify your email. For example:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleInputChange({ target: { value: 'Make the hero section dark blue' } } as any)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  • "Make the hero section dark blue"
                </button>
                <button
                  onClick={() => handleInputChange({ target: { value: 'Change the heading to Winter Sale' } } as any)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  • "Change the heading to 'Winter Sale'"
                </button>
                <button
                  onClick={() => handleInputChange({ target: { value: 'Add a discount code to the footer' } } as any)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  • "Add a discount code to the footer"
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Don't show the last user message if we're loading
              if (message.role === 'user' && isLoading && index === messages.length - 1) {
                return null;
              }

              // Don't show the last assistant message if we're loading (avoid showing partial streaming)
              if (message.role === 'assistant' && isLoading && index === messages.length - 1) {
                return null;
              }

              // Check if message contains HTML (more robust check)
              const content = message.content.trim();
              const isHtmlMessage = message.role === 'assistant' && (
                content.includes('<!DOCTYPE') ||
                content.includes('<html') ||
                content.includes('<table') ||
                content.includes('<tr') ||
                content.includes('bgcolor=') ||
                content.includes('cellpadding=') ||
                content.startsWith('SUMMARY:')
              );

              // Don't show HTML messages at all - replace with summary
              if (isHtmlMessage) {
                return (
                  <div
                    key={index}
                    className="flex justify-start"
                  >
                    <div className="w-full text-sm text-foreground whitespace-pre-wrap">
                      {lastEditSummary
                        ? lastEditSummary
                        : lastEditedSection
                        ? `✓ Updated "${lastEditedSection}" section`
                        : '✓ Updated email'
                      }
                    </div>
                  </div>
                );
              }

              // Show normal messages
              return (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'user' ? (
                    <div className="max-w-[90%] rounded-lg px-4 py-2 bg-muted text-foreground">
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full text-sm text-foreground prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-strong:font-semibold prose-strong:text-foreground">
                      {formatAIMessage(message.content).split('\n').map((line, i) => {
                        // Handle bold text with **
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <div key={i} className={i > 0 ? 'mt-2' : ''}>
                            {parts.map((part, j) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j}>{part.slice(2, -2)}</strong>;
                              }
                              return <span key={j}>{part}</span>;
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Validation error */}
            {validationError && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {validationError}
                </div>
              </div>
            )}

            {/* Thinking loader */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                  <div className="relative">
                    <svg
                      className="animate-spin h-5 w-5 text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-foreground">
                    Thinking... {thinkingTime}s
                  </span>
                </div>
              </div>
            )}

            {/* Suggestion chips - inside scrollable area */}
            {suggestions.length > 0 && (
              <div className="px-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleInputChange({ target: { value: suggestion } } as any)}
                      className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 bg-background">
        <form onSubmit={handleSubmit} className="relative border border-border rounded-[24px] bg-background focus-within:ring-2 focus-within:ring-ring transition-shadow">
          {/* Selected section or element chip - shown inside the input area */}
          {(selectedSection || selectedElement) && onSectionDeselect && (
            <div className="px-3 pt-2 pb-1">
              <Badge
                variant="secondary"
                className="gap-1 pr-1 text-xs font-normal border border-primary/20"
              >
                {selectedElement ? selectedElement.label : selectedSection?.label}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={onSectionDeselect}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          )}

          <div className="flex items-end gap-2 px-3 py-2">
            {/* Textarea - auto-expanding */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                // Submit on Enter (without Shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    handleSubmit(e as any);
                  }
                }
              }}
              placeholder="Ask for edits, add sections, refine the tone..."
              disabled={isLoading}
              rows={1}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-2 py-2 text-sm resize-none outline-none min-h-[24px] max-h-[72px] overflow-y-auto scrollbar-hide"
              style={{ height: '24px' }}
            />

            {/* Send button - circular with arrow */}
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
              className="flex-shrink-0 h-9 w-9 rounded-full bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50 mb-0.5"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 12V4M8 4L4 8M8 4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
