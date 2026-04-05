'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Settings, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ActiveAgent {
  label: string;
  difyUrl: string | null;
  baseUrl: string;
}

export function SettingsSheet() {
  const [activeAgent, setActiveAgent] = useState<ActiveAgent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch('/api/agents')
      .then((r) => r.json())
      .then((agents: { label: string; isActive: boolean; difyUrl: string | null; baseUrl: string }[]) => {
        const active = agents.find((a) => a.isActive);
        setActiveAgent(active ? { label: active.label, difyUrl: active.difyUrl, baseUrl: active.baseUrl } : null);
      })
      .catch(() => setActiveAgent(null));
  }, [open]);

  const agentUrl = activeAgent?.difyUrl || activeAgent?.baseUrl;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
            <div className="flex items-center gap-1.5">
              <p className="text-sm">
                {activeAgent?.label || 'No agent selected'}
              </p>
              {activeAgent && agentUrl && (
                <a
                  href={agentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Open in Dify"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
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
