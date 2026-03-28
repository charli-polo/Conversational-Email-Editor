'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BriefEmptyStateProps {
  isBriefComplete: boolean;
  briefContent: string | null;
  onStartEditing: () => void;
}

export function BriefEmptyState({
  isBriefComplete,
  briefContent,
  onStartEditing,
}: BriefEmptyStateProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Brief</h2>
        {isBriefComplete && (
          <Button onClick={onStartEditing} size="sm">
            Start editing
          </Button>
        )}
      </div>

      {briefContent ? (
        /* Brief content rendered as markdown */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:my-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{briefContent}</ReactMarkdown>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center text-center max-w-sm">
            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                isBriefComplete
                  ? 'bg-green-50 dark:bg-green-950'
                  : 'bg-muted'
              }`}
            >
              {isBriefComplete ? (
                <CheckCircle className="w-7 h-7 text-green-500" />
              ) : (
                <FileText className="w-7 h-7 text-muted-foreground" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {isBriefComplete ? 'Brief Complete' : 'Define Your Brief'}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isBriefComplete
                ? 'Brief complete — ready to edit'
                : 'Chat with the AI to define your email brief. Once done, you\'ll move to the editor.'}
            </p>

            {/* Start editing button - only when complete */}
            {isBriefComplete && (
              <Button onClick={onStartEditing} size="lg" className="mt-6">
                Start editing
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
