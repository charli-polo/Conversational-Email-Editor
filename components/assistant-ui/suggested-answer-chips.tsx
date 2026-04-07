'use client';

import { useState } from 'react';
import { useMessage, useAssistantRuntime } from '@assistant-ui/react';
import type { SuggestedAction } from '@/lib/dify/parse-suggested-answer';

export function SuggestedAnswerChips() {
  const [dismissed, setDismissed] = useState(false);
  const runtime = useAssistantRuntime();
  const message = useMessage((m) => m);

  const suggestedActions = (
    (message.metadata?.custom as Record<string, unknown>)?.suggestedActions as
      | SuggestedAction[]
      | undefined
  ) || [];

  if (dismissed || suggestedActions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2 px-2">
      {suggestedActions.map((action, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            setDismissed(true);
            runtime.thread.append({
              role: 'user',
              content: [{ type: 'text', text: action.prompt }],
            });
          }}
          className="px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
