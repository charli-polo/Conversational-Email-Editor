'use client';

import { Pencil } from 'lucide-react';

export function DesignEmptyState() {
  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Design
        </h2>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center text-center max-w-sm">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Pencil className="w-7 h-7 text-muted-foreground" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Ready to Edit
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Click on any element in your email template to start live editing its styles, content, and properties.
          </p>
        </div>
      </div>
    </div>
  );
}
