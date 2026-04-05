'use client';

import { ComposerPrimitive } from '@assistant-ui/react';
import type { ReactNode } from 'react';

/**
 * DragDropOverlay -- D-10: Wraps the chat area with a drag-and-drop zone.
 * When files are dragged over, an overlay appears with "Drop files here" text.
 * Uses ComposerPrimitive.AttachmentDropzone which manages drag state internally.
 */
export function DragDropOverlay({ children }: { children: ReactNode }) {
  return (
    <ComposerPrimitive.AttachmentDropzone className="relative flex-1 flex flex-col min-h-0 group/dropzone">
      {children}
      {/* Overlay shown when dragging files -- AttachmentDropzone sets data-dragging */}
      <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center pointer-events-none z-10 opacity-0 transition-opacity group-data-[dragging]/dropzone:opacity-100">
        <span className="text-sm text-muted-foreground">Drop files here</span>
      </div>
    </ComposerPrimitive.AttachmentDropzone>
  );
}
