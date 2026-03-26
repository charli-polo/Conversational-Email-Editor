'use client';

import { useEffect, useState, useRef } from 'react';
import { basePath } from '@/lib/base-path';

export interface EmailSection {
  id: string;
  html: string;
  label: string;
  index: number;
}

export type ElementType = 'heading' | 'button' | 'image' | 'text' | 'link';

export interface EmailElement {
  id: string;
  sectionId: string;
  type: ElementType;
  tag: string;
  label: string;
  preview: string;
}

interface EmailPreviewProps {
  html: string;
  selectedSectionId?: string | null;
  selectedElementId?: string | null;
  onSectionSelect?: (section: EmailSection | null) => void;
  onElementSelect?: (element: EmailElement | null) => void;
  onAnnotatedHtmlReady?: (annotatedHtml: string) => void;
  isLoading?: boolean;
}

export function EmailPreview({
  html,
  selectedSectionId,
  selectedElementId,
  onSectionSelect,
  onElementSelect,
  onAnnotatedHtmlReady,
  isLoading
}: EmailPreviewProps) {
  const [sections, setSections] = useState<EmailSection[]>([]);
  const [elements, setElements] = useState<EmailElement[]>([]);
  const [enhancedHtml, setEnhancedHtml] = useState(html);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Parse sections when HTML changes
  useEffect(() => {
    const parseSections = async () => {
      try {
        const response = await fetch(`${basePath}/api/parse-sections`, {
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
          elementsCount: data.elements?.length,
          hasAnnotatedHtml: !!data.annotatedHtml
        });
        setSections(data.sections || []);
        setElements(data.elements || []);

        // Use the annotated HTML from the API (with data-section-id and data-element-id attributes)
        const htmlWithIds = data.annotatedHtml || html;

        // Debug: check if data attributes exist in HTML
        console.log('Has data-section-id in HTML:', htmlWithIds.includes('data-section-id'));
        console.log('Has data-element-id in HTML:', htmlWithIds.includes('data-element-id'));

        // Notify parent about annotated HTML so it can be used for merging
        // Only notify if the HTML actually changed to avoid loops
        if (onAnnotatedHtmlReady && data.annotatedHtml && data.annotatedHtml !== html) {
          onAnnotatedHtmlReady(data.annotatedHtml);
        }

        // Inject the interaction script into the HTML
        const scriptInjectedHtml = injectInteractionScript(htmlWithIds, data.sections || [], data.elements || []);
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
      } else if (event.data?.type === 'element-click') {
        const elementId = event.data.elementId;
        const element = elements.find(e => e.id === elementId);
        if (element && onElementSelect) {
          onElementSelect(element);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sections, elements, onSectionSelect, onElementSelect]);

  // Update highlight when selectedSectionId or selectedElementId changes
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'update-selection',
          selectedSectionId,
          selectedElementId,
        },
        '*'
      );
    }
  }, [selectedSectionId, selectedElementId]);

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

function injectInteractionScript(html: string, sections: EmailSection[], elements: EmailElement[]): string {
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
        let hoveredElementId = null;
        let selectedElementId = null;

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
          const elementIds = ${JSON.stringify(elements.map(e => e.id))};
          console.log('Iframe script initialized. Section IDs:', sectionIds);
          console.log('Iframe script initialized. Element IDs:', elementIds);

          sectionIds.forEach(sectionId => {
            const element = document.querySelector('[data-section-id="' + sectionId + '"]');
            console.log('Found element for', sectionId, ':', !!element);
            if (!element) return;

            // Add hover styles
            element.addEventListener('mouseenter', () => {
              if (selectedSectionId !== sectionId) {
                hoveredSectionId = sectionId;
                element.style.outline = '2px dashed #818cf8';
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
                window.parent.postMessage({ type: 'section-click', sectionId: null }, '*');
              } else {
                // Clear previous selection
                if (selectedSectionId) {
                  const prevElement = document.querySelector('[data-section-id="' + selectedSectionId + '"]');
                  if (prevElement) {
                    prevElement.style.outline = '';
                    prevElement.style.outlineOffset = '';
                  }
                }

                selectedSectionId = sectionId;
                element.style.outline = '3px solid #818cf8';
                element.style.outlineOffset = '-3px';

                window.parent.postMessage({ type: 'section-click', sectionId }, '*');
              }
            });
          });

          // Handle element interactions (higher priority than sections)
          elementIds.forEach(elementId => {
            const element = document.querySelector('[data-element-id="' + elementId + '"]');
            console.log('Found element for', elementId, ':', !!element);
            if (!element) return;

            // Add hover styles for elements
            element.addEventListener('mouseenter', () => {
              if (selectedElementId !== elementId) {
                hoveredElementId = elementId;
                element.style.outline = '2px dashed #818cf8';
                // Use negative offset for images to ensure visibility
                element.style.outlineOffset = element.tagName === 'IMG' ? '-2px' : '2px';
                element.style.cursor = 'pointer';
              }
            });

            element.addEventListener('mouseleave', () => {
              if (selectedElementId !== elementId) {
                hoveredElementId = null;
                element.style.outline = '';
                element.style.outlineOffset = '';
                element.style.cursor = '';
              }
            });

            // Handle element click (prevent section click from triggering)
            element.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation(); // Prevent section click from firing

              // Toggle element selection
              if (selectedElementId === elementId) {
                selectedElementId = null;
                element.style.outline = '';
                element.style.outlineOffset = '';
                window.parent.postMessage({ type: 'element-click', elementId: null }, '*');
              } else {
                // Clear previous element selection
                if (selectedElementId) {
                  const prevElement = document.querySelector('[data-element-id="' + selectedElementId + '"]');
                  if (prevElement) {
                    prevElement.style.outline = '';
                    prevElement.style.outlineOffset = '';
                  }
                }

                // Clear section selection if any
                if (selectedSectionId) {
                  const prevSection = document.querySelector('[data-section-id="' + selectedSectionId + '"]');
                  if (prevSection) {
                    prevSection.style.outline = '';
                    prevSection.style.outlineOffset = '';
                  }
                  selectedSectionId = null;
                }

                selectedElementId = elementId;
                element.style.outline = '3px solid #818cf8';
                // Use negative offset for images to ensure visibility
                element.style.outlineOffset = element.tagName === 'IMG' ? '-3px' : '2px';

                window.parent.postMessage({ type: 'element-click', elementId }, '*');
              }
            });
          });

          // Listen for selection updates from parent
          window.addEventListener('message', (event) => {
            if (event.data?.type === 'update-selection') {
              const newSelectedSectionId = event.data.selectedSectionId;
              const newSelectedElementId = event.data.selectedElementId;

              // Clear old section selection
              if (selectedSectionId && selectedSectionId !== newSelectedSectionId) {
                const oldElement = document.querySelector('[data-section-id="' + selectedSectionId + '"]');
                if (oldElement) {
                  oldElement.style.outline = '';
                  oldElement.style.outlineOffset = '';
                }
              }

              // Clear old element selection
              if (selectedElementId && selectedElementId !== newSelectedElementId) {
                const oldElement = document.querySelector('[data-element-id="' + selectedElementId + '"]');
                if (oldElement) {
                  oldElement.style.outline = '';
                  oldElement.style.outlineOffset = '';
                }
              }

              // Apply new section selection
              selectedSectionId = newSelectedSectionId;
              if (newSelectedSectionId) {
                const newElement = document.querySelector('[data-section-id="' + newSelectedSectionId + '"]');
                if (newElement) {
                  newElement.style.outline = '3px solid #818cf8';
                  newElement.style.outlineOffset = '-3px';
                }
              }

              // Apply new element selection
              selectedElementId = newSelectedElementId;
              if (newSelectedElementId) {
                const newElement = document.querySelector('[data-element-id="' + newSelectedElementId + '"]');
                if (newElement) {
                  newElement.style.outline = '3px solid #818cf8';
                  // Use negative offset for images to ensure visibility
                  newElement.style.outlineOffset = newElement.tagName === 'IMG' ? '-3px' : '2px';
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
