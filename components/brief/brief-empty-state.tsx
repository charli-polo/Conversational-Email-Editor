'use client';

import { FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BriefEmptyStateProps {
  isBriefComplete: boolean;
  onStartEditing: () => void;
}

export function BriefEmptyState({
  isBriefComplete,
  onStartEditing,
}: BriefEmptyStateProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Brief</h2>
      </div>

      {/* Empty state */}
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
    </div>
  );
}
