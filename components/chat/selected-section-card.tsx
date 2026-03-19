'use client';

import { EmailSection } from '@/components/preview/email-preview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SelectedSectionCardProps {
  section: EmailSection;
  onDeselect: () => void;
}

export function SelectedSectionCard({ section, onDeselect }: SelectedSectionCardProps) {
  return (
    <Card className="mb-4 bg-primary/5 border-primary/20">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                Selected Section
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate">
              {section.label}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Section {section.index + 1}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onDeselect}
            aria-label="Deselect section"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
