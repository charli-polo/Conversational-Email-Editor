'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { basePath } from '@/lib/base-path';

interface Agent {
  id: string;
  label: string;
  apiKey: string;
  baseUrl: string;
  difyUrl: string | null;
  conversationMode: string;
  isActive: boolean;
}

interface AgentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent;
  onSaved: () => void;
}

export function AgentForm({ open, onOpenChange, agent, onSaved }: AgentFormProps) {
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.dify.ai');
  const [difyUrl, setDifyUrl] = useState('');
  const [conversationMode, setConversationMode] = useState('chatbot');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isEdit = !!agent;

  useEffect(() => {
    if (open) {
      if (agent) {
        setLabel(agent.label);
        setApiKey('');
        setBaseUrl(agent.baseUrl);
        setDifyUrl(agent.difyUrl || '');
        setConversationMode(agent.conversationMode);
      } else {
        setLabel('');
        setApiKey('');
        setBaseUrl('https://api.dify.ai');
        setDifyUrl('');
        setConversationMode('chatbot');
      }
      setErrors({});
    }
  }, [open, agent]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!label.trim() || label.trim().length > 100) {
      newErrors.label = 'Agent name is required';
    }
    if (!isEdit && !apiKey.trim()) {
      newErrors.apiKey = 'API key is required';
    }
    if (!baseUrl.trim()) {
      newErrors.baseUrl = 'A valid base URL is required';
    } else {
      try {
        new URL(baseUrl.trim());
      } catch {
        newErrors.baseUrl = 'A valid base URL is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const body: Record<string, string> = {
        label: label.trim(),
        baseUrl: baseUrl.trim(),
        conversationMode,
      };
      if (difyUrl.trim()) {
        body.difyUrl = difyUrl.trim();
      }
      if (apiKey.trim()) {
        body.apiKey = apiKey.trim();
      }

      const url = isEdit
        ? `${basePath}/api/agents/${agent.id}`
        : `${basePath}/api/agents`;

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Save failed');
      }

      onSaved();
      onOpenChange(false);
    } catch {
      setErrors({ form: 'Could not save agent. Check your connection and try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit agent' : 'Add agent'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the agent configuration.'
              : 'Register a new Dify agent for the brief chat.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errors.form && (
            <p className="text-sm text-destructive">{errors.form}</p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-label">Label</Label>
            <Input
              id="agent-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My Dify Agent"
              className={errors.label ? 'border-destructive' : ''}
            />
            {errors.label && (
              <p className="text-sm text-destructive">{errors.label}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-api-key">API Key</Label>
            <Input
              id="agent-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEdit ? 'Leave blank to keep current' : 'app-...'}
              className={errors.apiKey ? 'border-destructive' : ''}
            />
            {errors.apiKey && (
              <p className="text-sm text-destructive">{errors.apiKey}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-base-url">Base URL</Label>
            <Input
              id="agent-base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.dify.ai"
              className={errors.baseUrl ? 'border-destructive' : ''}
            />
            {errors.baseUrl && (
              <p className="text-sm text-destructive">{errors.baseUrl}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-dify-url">Dify URL (optional)</Label>
            <Input
              id="agent-dify-url"
              value={difyUrl}
              onChange={(e) => setDifyUrl(e.target.value)}
              placeholder="https://dify.example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-mode">Conversation Mode</Label>
            <Select value={conversationMode} onValueChange={setConversationMode}>
              <SelectTrigger id="agent-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatbot">Chatbot</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
