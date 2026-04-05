'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * StreamingReasoningIndicator -- D-14 + D-16
 * Shows animated 3-dot pulse + elapsed timer + tool badges while the agent is thinking.
 * Visible by default during streaming; click "Show details" to expand the full reasoning chain.
 */
export function StreamingReasoningIndicator({
  tools,
  reasoningText,
}: {
  tools?: string[];
  reasoningText?: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 flex-wrap">
        {/* 3-dot pulse animation per D-14 */}
        <div className="flex gap-1">
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

        {/* Timer per D-16 */}
        <span className="text-xs text-muted-foreground">Thinking... {elapsed}s</span>

        {/* Tool badges per D-15 */}
        {tools && tools.length > 0 && (
          <div className="flex gap-1">
            {[...new Set(tools)].map((tool, i) => (
              <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                {tool}
              </Badge>
            ))}
          </div>
        )}

        {/* Expand/collapse for full chain per D-14 */}
        {reasoningText && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer ml-1"
          >
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>

      {/* Expanded reasoning text */}
      {expanded && reasoningText && (
        <div className="pl-3 border-l-2 border-border text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
          {reasoningText}
        </div>
      )}
    </div>
  );
}

/**
 * ReasoningSection -- D-17
 * Post-response collapsible reasoning toggle below assistant messages.
 * Default collapsed. Shows tool badges in collapsed state as summary.
 */
export function ReasoningSection({
  reasoningParts,
}: {
  reasoningParts: Array<{ text: string }>;
}) {
  const [expanded, setExpanded] = useState(false);

  // Filter out empty parts
  const validParts = reasoningParts.filter((p) => p.text?.trim());
  if (validParts.length === 0) return null;

  // Extract unique tool names from reasoning text lines containing [Tool: ...]
  const toolNames: string[] = [];
  for (const part of validParts) {
    const matches = part.text.matchAll(/\[Tool:\s*([^\]]+)\]/g);
    for (const match of matches) {
      toolNames.push(match[1]);
    }
  }
  const uniqueTools = [...new Set(toolNames)];

  const reasoningText = validParts.map((p) => p.text).join('\n\n');

  return (
    <div className="mt-1">
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ChevronDown
            className="h-3 w-3 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
          {expanded ? 'Hide reasoning' : 'Show reasoning'}
        </button>

        {/* Tool badges in collapsed view */}
        {!expanded && uniqueTools.length > 0 && (
          <div className="flex gap-1">
            {uniqueTools.map((tool, i) => (
              <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                {tool}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Expanded reasoning content */}
      {expanded && (
        <div className="pl-3 border-l-2 border-border text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
          {reasoningText}
        </div>
      )}
    </div>
  );
}
