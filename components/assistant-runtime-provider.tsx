'use client';

import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from '@assistant-ui/react';
import { useCallback, useMemo } from 'react';
import { mergeSectionHtml } from '@/lib/merge-section';
import { basePath } from '@/lib/base-path';

interface AssistantProviderProps {
  children: React.ReactNode;
  html: string;
  selectedSectionId?: string | null;
  selectedSectionHtml?: string | null;
  onHtmlUpdate: (html: string) => void;
}

export function AuiProvider({
  children,
  html,
  selectedSectionId,
  selectedSectionHtml,
  onHtmlUpdate,
}: AssistantProviderProps) {
  // Create a custom adapter that calls our chat API
  const adapter: ChatModelAdapter = useMemo(
    () => ({
      async *run({ messages, abortSignal }) {
        const response = await fetch(`${basePath}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map((m) => ({
              role: m.role,
              content:
                m.content[0]?.type === 'text' ? m.content[0].text : '',
            })),
            html,
            selectedSectionId,
            selectedSectionHtml,
          }),
          signal: abortSignal,
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to fetch');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          yield {
            content: [{ type: 'text' as const, text: fullContent }],
          };
        }

        // Check if the response is HTML and update
        if (
          fullContent.trim().startsWith('<!DOCTYPE') ||
          fullContent.trim().startsWith('<html') ||
          fullContent.trim().startsWith('<table') ||
          fullContent.trim().startsWith('<tr')
        ) {
          // If section is selected, merge; otherwise full replace
          if (selectedSectionId) {
            const merged = mergeSectionHtml(html, selectedSectionId, fullContent);
            onHtmlUpdate(merged);
          } else {
            onHtmlUpdate(fullContent);
          }
        }
      },
    }),
    [html, selectedSectionId, selectedSectionHtml, onHtmlUpdate]
  );

  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
