'use client';

import { ThreadPrimitive } from '@assistant-ui/react';

/**
 * OpenerSuggestions -- D-06
 * Clickable suggestion chips rendered below the opener assistant message only.
 * Distinct from test prompt chips (D-07) which remain in the composer area.
 */
export function OpenerSuggestions({ suggestions }: { suggestions: string[] }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((suggestion, i) => (
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
