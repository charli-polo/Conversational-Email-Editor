'use client';

import { useEffect, useState, useRef } from 'react';

export interface EmailSection {
  id: string;
  html: string;
  label: string;
  index: number;
}

interface EmailPreviewProps {
  html: string;
  selectedSectionId?: string | null;
  onSectionSelect?: (section: EmailSection | null) => void;
  onAnnotatedHtmlReady?: (annotatedHtml: string) => void;
  isLoading?: boolean;
}

export function EmailPreview({ html, selectedSectionId, onSectionSelect, onAnnotatedHtmlReady, isLoading }: EmailPreviewProps) {
  const [sections, setSections] = useState<EmailSection[]>([]);
  const [enhancedHtml, setEnhancedHtml] = useState(html);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Parse sections when HTML changes
  useEffect(() => {
    const parseSections = async () => {
      try {
        const response = await fetch('/api/parse-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html }),
        });

        if (!response.ok) {
          console.error('Failed to parse sections');
          setSections([]);
          setEnhancedHtml(html);
          return;
        }

        const data = await response.json();
        console.log('Parse sections response:', {
          sectionsCount: data.sections?.length,
          hasAnnotatedHtml: !!data.annotatedHtml
        });
        setSections(data.sections || []);

        // Use the annotated HTML from the API (with data-section-id attributes)
        const htmlWithSectionIds = data.annotatedHtml || html;

        // Debug: check if data-section-id exists in HTML
        console.log('Has data-section-id in HTML:', htmlWithSectionIds.includes('data-section-id'));

        // Notify parent about annotated HTML so it can be used for merging
        // Only notify if the HTML actually changed to avoid loops
        if (onAnnotatedHtmlReady && data.annotatedHtml && data.annotatedHtml !== html) {
          onAnnotatedHtmlReady(data.annotatedHtml);
        }

        // Inject the interaction script into the HTML
        const scriptInjectedHtml = injectInteractionScript(htmlWithSectionIds, data.sections || []);
        setEnhancedHtml(scriptInjectedHtml);
      } catch (error) {
        console.error('Error parsing sections:', error);
        setSections([]);
        setEnhancedHtml(html);
      }
    };

    parseSections();
  }, [html]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: verify origin if needed
      if (event.data?.type === 'section-click') {
        const sectionId = event.data.sectionId;
        const section = sections.find(s => s.id === sectionId);
        if (section && onSectionSelect) {
          onSectionSelect(section);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sections, onSectionSelect]);

  // Update highlight when selectedSectionId changes
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'update-selection',
          selectedSectionId,
        },
        '*'
      );
    }
  }, [selectedSectionId]);

  return (
    <div className="min-h-full w-full bg-zinc-100 flex items-start justify-center py-16">
      <div
        className={`w-[800px] bg-white shadow-xl transition-all duration-500 ${
          isLoading ? 'blur-sm opacity-60 animate-pulse-slow' : 'blur-0 opacity-100'
        }`}
      >
        <iframe
          ref={iframeRef}
          srcDoc={enhancedHtml}
          sandbox="allow-same-origin allow-scripts"
          title="Email Preview"
          className="w-full border-0 block"
          style={{
            colorScheme: 'normal',
            height: 'auto',
          }}
          onLoad={(e) => {
            // Adjust iframe height to match content
            const iframe = e.currentTarget;
            if (iframe.contentWindow) {
              const height = iframe.contentWindow.document.body.scrollHeight;
              iframe.style.height = height + 'px';
            }
          }}
        />
      </div>
    </div>
  );
}

function injectInteractionScript(html: string, sections: EmailSection[]): string {
  const script = `
    <style>
      /* Remove all scrollbars from iframe - parent page handles scrolling */
      html, body {
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        justify-content: center !important;
        background: transparent !important;
      }
      /* Force email to stay at 600px max and center it */
      body > table {
        max-width: 600px !important;
        width: 600px !important;
        margin: 0 auto !important;
      }
    </style>
    <script>
      (function() {
        let hoveredSectionId = null;
        let selectedSectionId = null;

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          init();
        }

        function init() {
          // Force remove all scrolling - parent page handles it
          document.documentElement.style.overflow = 'hidden';
          document.body.style.overflow = 'hidden';

          const sectionIds = ${JSON.stringify(sections.map(s => s.id))};
          console.log('Iframe script initialized. Section IDs:', sectionIds);

          sectionIds.forEach(sectionId => {
            const element = document.querySelector('[data-section-id="' + sectionId + '"]');
            console.log('Found element for', sectionId, ':', !!element);
            if (!element) return;

            // Add hover styles
            element.addEventListener('mouseenter', () => {
              if (selectedSectionId !== sectionId) {
                hoveredSectionId = sectionId;
                element.style.outline = '2px solid #818cf8';
                element.style.outlineOffset = '-2px';
                element.style.cursor = 'pointer';
              }
            });

            element.addEventListener('mouseleave', () => {
              if (selectedSectionId !== sectionId) {
                hoveredSectionId = null;
                element.style.outline = '';
                element.style.outlineOffset = '';
                element.style.cursor = '';
              }
            });

            // Handle click
            element.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();

              // Toggle selection
              if (selectedSectionId === sectionId) {
                selectedSectionId = null;
                element.style.outline = '';
                element.style.outlineOffset = '';
                element.style.backgroundColor = '';
                window.parent.postMessage({ type: 'section-click', sectionId: null }, '*');
              } else {
                // Clear previous selection
                if (selectedSectionId) {
                  const prevElement = document.querySelector('[data-section-id="' + selectedSectionId + '"]');
                  if (prevElement) {
                    prevElement.style.outline = '';
                    prevElement.style.outlineOffset = '';
                    prevElement.style.backgroundColor = '';
                  }
                }

                selectedSectionId = sectionId;
                element.style.outline = '3px solid #4f46e5';
                element.style.outlineOffset = '-3px';
                element.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';

                window.parent.postMessage({ type: 'section-click', sectionId }, '*');
              }
            });
          });

          // Listen for selection updates from parent
          window.addEventListener('message', (event) => {
            if (event.data?.type === 'update-selection') {
              const newSelectedId = event.data.selectedSectionId;

              // Clear old selection
              if (selectedSectionId && selectedSectionId !== newSelectedId) {
                const oldElement = document.querySelector('[data-section-id="' + selectedSectionId + '"]');
                if (oldElement) {
                  oldElement.style.outline = '';
                  oldElement.style.outlineOffset = '';
                  oldElement.style.backgroundColor = '';
                }
              }

              // Apply new selection
              selectedSectionId = newSelectedId;
              if (newSelectedId) {
                const newElement = document.querySelector('[data-section-id="' + newSelectedId + '"]');
                if (newElement) {
                  newElement.style.outline = '3px solid #4f46e5';
                  newElement.style.outlineOffset = '-3px';
                  newElement.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
                }
              }
            }
          });
        }
      })();
    </script>
  `;

  // Inject script before closing </body> tag
  if (html.includes('</body>')) {
    return html.replace('</body>', script + '</body>');
  }

  // Fallback: append to end
  return html + script;
}
