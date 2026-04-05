'use client';

import { useAssistantRuntime } from '@assistant-ui/react';

/**
 * OpenerSuggestions -- D-06
 * Clickable suggestion chips rendered below the opener assistant message only.
 * Uses runtime.thread.append() instead of ThreadPrimitive.Suggestion because
 * this component renders inside MessagePrimitive.Root (no Composer context).
 */
export function OpenerSuggestions({ suggestions }: { suggestions: string[] }) {
  const runtime = useAssistantRuntime();

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            runtime.thread.append({
              role: 'user',
              content: [{ type: 'text', text: suggestion }],
            });
          }}
          className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
