'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';

interface SettingsSheetProps {
  activeAgentLabel?: string;
}

export function SettingsSheet({ activeAgentLabel }: SettingsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Quick Settings</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Active agent display */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Active Agent</h3>
            <p className="text-sm">
              {activeAgentLabel || 'No agent selected'}
            </p>
          </div>

          {/* Link to full settings page */}
          <div className="pt-4 border-t border-border">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Settings className="h-4 w-4" />
              Open full settings
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
