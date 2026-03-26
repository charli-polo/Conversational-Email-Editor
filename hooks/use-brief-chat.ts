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
  briefContent: string | null;
}

const FALLBACK_OPENING = "Hi! Tell me about the email you'd like to create.";

export function useBriefChat(): UseBriefChatReturn {
  const [messages, setMessages] = useState<BriefMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBriefComplete, setIsBriefComplete] = useState(false);
  const [briefContent, setBriefContent] = useState<string | null>(null);
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
        // Full raw accumulator (includes tags) — used for detection only
        let raw = '';
        // What shows in the chat bubble (before <Brief> and after </Brief>)
        let chatText = '';
        // What shows in the right panel (between <Brief> and </Brief>)
        let briefText = '';
        // Streaming mode: 'chat' | 'brief'
        let mode: 'chat' | 'brief' = 'chat';
        // Whether </Brief> has been seen
        let briefClosed = false;

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
                  chatText = 'Sorry, something went wrong. Please try again.';
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: chatText } : m,
                    ),
                  );
                  continue;
                }

                if (data.event === 'done') {
                  if (data.conversation_id) {
                    conversationIdRef.current = data.conversation_id;
                  }

                  // Clean up [BRIEF_COMPLETE] marker from chat text
                  if (chatText.includes('[BRIEF_COMPLETE]')) {
                    chatText = chatText.replace('[BRIEF_COMPLETE]', '').trim();
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantId ? { ...m, content: chatText } : m,
                      ),
                    );
                    setIsBriefComplete(true);
                  }
                  continue;
                }

                // Answer chunk — route to chat or brief panel
                if (data.answer) {
                  raw += data.answer;

                  if (mode === 'chat') {
                    // Check if <Brief> tag starts in this chunk
                    const openIdx = raw.indexOf('<Brief>');
                    if (openIdx !== -1) {
                      // Everything before <Brief> stays in chat
                      chatText = raw.substring(0, openIdx).trim();
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantId ? { ...m, content: chatText } : m,
                        ),
                      );
                      // Everything after <Brief> goes to brief panel
                      briefText = raw.substring(openIdx + '<Brief>'.length);
                      // Check if </Brief> is already in what we have
                      const closeIdx = briefText.indexOf('</Brief>');
                      if (closeIdx !== -1) {
                        briefClosed = true;
                        const afterClose = briefText.substring(closeIdx + '</Brief>'.length);
                        briefText = briefText.substring(0, closeIdx);
                        setBriefContent(briefText.trim());
                        // Anything after </Brief> goes back to chat
                        if (afterClose.trim()) {
                          chatText = chatText + (chatText ? '\n' : '') + afterClose.trim();
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === assistantId ? { ...m, content: chatText } : m,
                            ),
                          );
                        }
                        mode = 'chat';
                      } else {
                        setBriefContent(briefText.trim());
                        mode = 'brief';
                      }
                    } else {
                      // No <Brief> tag yet — stream to chat normally
                      chatText = raw;
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantId ? { ...m, content: chatText } : m,
                        ),
                      );
                    }
                  } else {
                    // mode === 'brief' — streaming into brief panel
                    briefText = raw.substring(raw.indexOf('<Brief>') + '<Brief>'.length);
                    const closeIdx = briefText.indexOf('</Brief>');
                    if (closeIdx !== -1) {
                      briefClosed = true;
                      const afterClose = briefText.substring(closeIdx + '</Brief>'.length);
                      briefText = briefText.substring(0, closeIdx);
                      setBriefContent(briefText.trim());
                      // Anything after </Brief> goes back to chat
                      if (afterClose.trim()) {
                        chatText = chatText + (chatText ? '\n' : '') + afterClose.trim();
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === assistantId ? { ...m, content: chatText } : m,
                          ),
                        );
                      }
                      mode = 'chat';
                    } else {
                      setBriefContent(briefText.trim());
                    }
                  }
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
    briefContent,
  };
}
