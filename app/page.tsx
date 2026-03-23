'use client';

import { useState } from 'react';
import { NavigationSidebar } from '@/components/navigation/navigation-sidebar';
import { ChatPanel } from '@/components/chat/chat-panel-with-assistant-ui';
import { PropertyPanel } from '@/components/properties/property-panel';
import { DesignEmptyState } from '@/components/design/design-empty-state';
import { EmailPreview, EmailSection, EmailElement } from '@/components/preview/email-preview';
import { SAMPLE_EMAIL } from '@/lib/sample-email';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2 } from 'lucide-react';

export default function Home() {
  const [currentHtml, setCurrentHtml] = useState(SAMPLE_EMAIL);
  const [selectedSection, setSelectedSection] = useState<EmailSection | null>(null);
  const [selectedElement, setSelectedElement] = useState<EmailElement | null>(null);
  const [mode, setMode] = useState<'chat' | 'design'>('chat');
  const [showBlur, setShowBlur] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Undo/Redo state (max 5 snapshots)
  const [history, setHistory] = useState<string[]>([SAMPLE_EMAIL]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleHtmlUpdate = (newHtml: string, skipHistory = false) => {
    setCurrentHtml(newHtml);

    // Skip history push during streaming
    if (skipHistory) return;

    // Push to history (FIFO - keep max 5)
    setHistory((prevHistory) => {
      // If we're not at the latest state, discard future states
      const newHistory = prevHistory.slice(0, historyIndex + 1);

      // Add new snapshot
      newHistory.push(newHtml);

      // Keep only last 5
      if (newHistory.length > 5) {
        const sliced = newHistory.slice(-5);
        // Adjust index since we removed the oldest item
        setHistoryIndex(4); // Last index in a 5-item array
        return sliced;
      }

      // Update index to point to the new item
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentHtml(history[newIndex]);
      console.log('Undo to index:', newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentHtml(history[newIndex]);
      console.log('Redo to index:', newIndex);
    }
  };

  const handleSectionSelect = (section: EmailSection | null) => {
    setSelectedSection(section);
    setSelectedElement(null); // Clear element selection when section is selected
    // Don't automatically switch modes - let the user control that via navigation
  };

  const handleElementSelect = (element: EmailElement | null) => {
    setSelectedElement(element);
    setSelectedSection(null); // Clear section selection when element is selected
    // Don't automatically switch modes - let the user control that via navigation
  };

  const handleSectionDeselect = () => {
    setSelectedSection(null);
    setSelectedElement(null);
    // Stay in design mode but show empty state
  };

  const handleAnnotatedHtmlReady = (annotatedHtml: string) => {
    // Only update if the current HTML doesn't already have annotations
    // This prevents infinite loop when property changes trigger re-parsing
    if (!currentHtml.includes('data-section-id')) {
      setCurrentHtml(annotatedHtml);
    }
  };

  const handleExport = () => {
    // Copy HTML to clipboard
    navigator.clipboard.writeText(currentHtml).then(() => {
      alert('HTML copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      // Fallback: download as file
      const blob = new Blob([currentHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'email.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: currentHtml }),
      });

      if (!response.ok) {
        console.error('Failed to fetch suggestions');
        return;
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
        {/* Top bar */}
        <header className="h-12 border-b border-border bg-background flex items-center justify-between px-6 flex-shrink-0">
          {/* Left side: Title + Undo/Redo */}
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">
              Salomon XT-6 GORE-TEX Launch
            </h1>

            {/* Undo/Redo buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="h-8 w-8"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                className="h-8 w-8"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right side: Export button */}
          <Button onClick={handleExport} size="sm">
            Export
          </Button>
        </header>

        {/* Main content layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Navigation sidebar */}
          <NavigationSidebar mode={mode} onModeChange={setMode} />

          {/* Left panel - Chat or Design */}
          <div className="w-[420px] flex-shrink-0">
            {/* Chat panel - always mounted to preserve messages */}
            <div className={mode === 'chat' ? 'block h-full' : 'hidden'}>
              <ChatPanel
                currentHtml={currentHtml}
                selectedSection={selectedSection}
                selectedElement={selectedElement}
                onHtmlUpdate={handleHtmlUpdate}
                onSectionDeselect={handleSectionDeselect}
                suggestions={suggestions}
                onGenerationComplete={() => {
                  // Show blur for 3 seconds after AI generation completes
                  setShowBlur(true);
                  setTimeout(() => setShowBlur(false), 3000);

                  // Fetch suggestions after generation
                  fetchSuggestions();
                }}
              />
            </div>

            {/* Design mode panels */}
            {mode === 'design' && (
              selectedSection || selectedElement ? (
                <PropertyPanel
                  selectedSection={selectedSection}
                  selectedElement={selectedElement}
                  currentHtml={currentHtml}
                  onHtmlUpdate={handleHtmlUpdate}
                  onClose={handleSectionDeselect}
                />
              ) : (
                <DesignEmptyState />
              )
            )}
          </div>

          {/* Preview panel - takes remaining space with scroll */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <EmailPreview
              html={currentHtml}
              selectedSectionId={selectedSection?.id}
              selectedElementId={selectedElement?.id}
              onSectionSelect={handleSectionSelect}
              onElementSelect={handleElementSelect}
              onAnnotatedHtmlReady={handleAnnotatedHtmlReady}
              isLoading={showBlur}
            />
          </div>
        </div>
      </div>
  );
}
