'use client';

import { AttachmentPrimitive } from '@assistant-ui/react';
import { X, FileText, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ComposerAttachmentPreview -- D-11: File preview chips shown in the composer
 * for queued attachments. Each chip shows a file type icon, truncated filename,
 * and a remove button.
 */
export function ComposerAttachmentPreview() {
  return (
    <AttachmentPrimitive.Root className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted border border-border">
      <AttachmentPrimitive.unstable_Thumb
        fallback={<FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
        className="h-3.5 w-3.5 flex-shrink-0"
      />
      <AttachmentPrimitive.Name className="max-w-[120px] truncate" />
      <AttachmentPrimitive.Remove asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-4 w-4 ml-1 hover:bg-destructive/10 p-0"
          aria-label="Remove attachment"
        >
          <X className="h-3 w-3" />
        </Button>
      </AttachmentPrimitive.Remove>
    </AttachmentPrimitive.Root>
  );
}

/**
 * MessageAttachmentDisplay -- D-12: Displays files in chat message history.
 * Images render as thumbnails; documents render as download links.
 */
export function MessageAttachmentDisplay({
  type,
  name,
  url,
}: {
  type: 'image' | 'document';
  name: string;
  url?: string;
}) {
  if (type === 'image' && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img
          src={url}
          alt={name}
          className="max-w-[200px] rounded-md cursor-pointer"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted border border-border text-xs hover:bg-muted/80"
    >
      <FileText className="h-4 w-4" />
      {name}
    </a>
  );
}
