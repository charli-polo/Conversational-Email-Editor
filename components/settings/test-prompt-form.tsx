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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { basePath } from '@/lib/base-path';

interface TestPrompt {
  id: string;
  name: string;
  text: string;
  autoSend: boolean;
  displayOrder: number;
}

interface TestPromptFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: TestPrompt;
  onSaved: () => void;
}

export function TestPromptForm({
  open,
  onOpenChange,
  prompt,
  onSaved,
}: TestPromptFormProps) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [autoSend, setAutoSend] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const isEdit = !!prompt;

  useEffect(() => {
    if (open) {
      if (prompt) {
        setName(prompt.name);
        setText(prompt.text);
        setAutoSend(prompt.autoSend);
      } else {
        setName('');
        setText('');
        setAutoSend(true);
      }
      setErrors({});
    }
  }, [open, prompt]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length > 100) {
      newErrors.name = 'Prompt name is required';
    }
    if (!text.trim() || text.trim().length > 2000) {
      newErrors.text = 'Prompt text is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const body: Record<string, string | boolean> = {
        name: name.trim(),
        text: text.trim(),
        autoSend,
      };

      const url = isEdit
        ? `${basePath}/api/test-prompts/${prompt.id}`
        : `${basePath}/api/test-prompts`;

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
      setErrors({
        form: 'Could not save prompt. Check your connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit test prompt' : 'Add test prompt'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this test prompt.'
              : 'Create a new test prompt that appears as a quick-start chip in the chat.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errors.form && (
            <p className="text-sm text-destructive">{errors.form}</p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="prompt-name">Name</Label>
            <Input
              id="prompt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome email"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prompt-text">Prompt Text</Label>
            <Textarea
              id="prompt-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write the prompt text that will be sent to the agent..."
              className={`min-h-[120px] ${errors.text ? 'border-destructive' : ''}`}
            />
            {errors.text && (
              <p className="text-sm text-destructive">{errors.text}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="prompt-auto-send"
              checked={autoSend}
              onCheckedChange={setAutoSend}
            />
            <Label htmlFor="prompt-auto-send" className="cursor-pointer">
              Auto-send when clicked
            </Label>
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
              {saving ? 'Saving...' : 'Save prompt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
