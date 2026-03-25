'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface BriefMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface UseBriefChatReturn {
  messages: BriefMessage[];
  suggestedQuestions: string[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: (text?: string) => void;
  isLoading: boolean;
  isBriefComplete: boolean;
}

const FALLBACK_OPENING = "Hi! Tell me about the email you'd like to create.";

export function useBriefChat(): UseBriefChatReturn {
  const [messages, setMessages] = useState<BriefMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBriefComplete, setIsBriefComplete] = useState(false);
  const conversationIdRef = useRef<string | null>(null);

  // Fetch parameters on mount (D-02)
  useEffect(() => {
    let cancelled = false;

    async function fetchParameters() {
      try {
        const res = await fetch('/api/brief/parameters');
        if (!res.ok) throw new Error('Failed to fetch parameters');
        const data = await res.json();

        if (cancelled) return;

        const openingStatement = data.opening_statement || FALLBACK_OPENING;
        setMessages([{ id: 'opening', role: 'assistant', content: openingStatement }]);
        setSuggestedQuestions(data.suggested_questions || []);
      } catch (err) {
        console.error('Failed to load brief parameters:', err);
        if (cancelled) return;
        setMessages([{ id: 'opening', role: 'assistant', content: FALLBACK_OPENING }]);
        setSuggestedQuestions([]);
      }
    }

    fetchParameters();

    return () => {
      cancelled = true;
    };
  }, []);

  const sendMessage = useCallback(
    (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isLoading) return;

      // Add user message
      const userMsg: BriefMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
      };

      // Create assistant placeholder
      const assistantId = crypto.randomUUID();
      const assistantMsg: BriefMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput('');
      setIsLoading(true);

      // Clear suggested questions after first user message (D-04)
      setSuggestedQuestions([]);

      // Stream response
      (async () => {
        let accumulated = '';

        try {
          const res = await fetch('/api/brief/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: messageText,
              conversation_id: conversationIdRef.current || '',
            }),
          });

          if (!res.ok) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
                  : m,
              ),
            );
            return;
          }

          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.slice(6));

                if (data.event === 'error') {
                  accumulated = 'Sorry, something went wrong. Please try again.';
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: accumulated } : m,
                    ),
                  );
                  continue;
                }

                if (data.event === 'done') {
                  // Track conversation_id from done event
                  if (data.conversation_id) {
                    conversationIdRef.current = data.conversation_id;
                  }

                  // Check for [BRIEF_COMPLETE] marker only after stream ends (Pitfall 4, D-10)
                  if (accumulated.includes('[BRIEF_COMPLETE]')) {
                    accumulated = accumulated.replace('[BRIEF_COMPLETE]', '').trim();
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId ? { ...m, content: accumulated } : m,
                      ),
                    );
                    setIsBriefComplete(true);
                  }
                  continue;
                }

                // Answer chunk
                if (data.answer) {
                  accumulated += data.answer;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: accumulated } : m,
                    ),
                  );
                }

                // Track conversation_id from first chunk
                if (data.conversation_id && !conversationIdRef.current) {
                  conversationIdRef.current = data.conversation_id;
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }
        } catch (err) {
          console.error('Brief chat error:', err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
                : m,
            ),
          );
        } finally {
          setIsLoading(false);
        }
      })();
    },
    [input, isLoading],
  );

  return {
    messages,
    suggestedQuestions,
    input,
    setInput,
    sendMessage,
    isLoading,
    isBriefComplete,
  };
}
