'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { basePath } from '@/lib/base-path';

interface TestPrompt {
  id: string;
  name: string;
  text: string;
  autoSend: boolean;
  displayOrder: number;
}

interface TestPromptListProps {
  refreshKey: number;
  onEdit: (prompt: TestPrompt) => void;
  onRefresh: () => void;
}

export function TestPromptList({
  refreshKey,
  onEdit,
  onRefresh,
}: TestPromptListProps) {
  const [prompts, setPrompts] = useState<TestPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TestPrompt | null>(null);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch(`${basePath}/api/test-prompts`);
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts, refreshKey]);

  async function handleDelete(prompt: TestPrompt) {
    try {
      const res = await fetch(`${basePath}/api/test-prompts/${prompt.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteTarget(null);
        onRefresh();
      }
    } catch {
      // silently fail
    }
  }

  async function handleReorder(prompt: TestPrompt, direction: 'up' | 'down') {
    const idx = prompts.findIndex((p) => p.id === prompt.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= prompts.length) return;

    const other = prompts[swapIdx];

    try {
      // Swap display orders
      await Promise.all([
        fetch(`${basePath}/api/test-prompts/${prompt.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: other.displayOrder }),
        }),
        fetch(`${basePath}/api/test-prompts/${other.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: prompt.displayOrder }),
        }),
      ]);
      onRefresh();
    } catch {
      // silently fail
    }
  }

  function truncateText(text: string, maxLen: number = 60): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 rounded-md bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold">No test prompts</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Create test prompts that appear as quick-start chips in the chat.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Prompt Text</TableHead>
            <TableHead>Auto-send</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prompts.map((prompt, idx) => (
            <TableRow key={prompt.id}>
              <TableCell className="font-medium">{prompt.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {truncateText(prompt.text)}
              </TableCell>
              <TableCell>
                <Badge variant={prompt.autoSend ? 'default' : 'secondary'}>
                  {prompt.autoSend ? 'Auto' : 'Manual'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(prompt)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {idx > 0 && (
                      <DropdownMenuItem
                        onClick={() => handleReorder(prompt, 'up')}
                      >
                        <ArrowUp className="mr-2 h-4 w-4" />
                        Move up
                      </DropdownMenuItem>
                    )}
                    {idx < prompts.length - 1 && (
                      <DropdownMenuItem
                        onClick={() => handleReorder(prompt, 'down')}
                      >
                        <ArrowDown className="mr-2 h-4 w-4" />
                        Move down
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteTarget(prompt)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete prompt"
        description="This will permanently delete this test prompt. Delete prompt?"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </>
  );
}
