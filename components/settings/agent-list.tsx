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
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { AgentSwitchDialog } from './agent-switch-dialog';
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

interface AgentListProps {
  refreshKey: number;
  onEdit: (agent: Agent) => void;
  onRefresh: () => void;
}

export function AgentList({ refreshKey, onEdit, onRefresh }: AgentListProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [switchTarget, setSwitchTarget] = useState<Agent | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${basePath}/api/agents`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch {
      // silently fail, user sees empty/stale list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents, refreshKey]);

  async function handleDelete(agent: Agent) {
    try {
      const res = await fetch(`${basePath}/api/agents/${agent.id}`, {
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

  async function handleDeactivate(agent: Agent) {
    try {
      await fetch(`${basePath}/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      onRefresh();
    } catch {
      // silently fail
    }
  }

  function handleActiveToggle(agent: Agent) {
    if (agent.isActive) {
      // Deactivating: no confirmation needed
      handleDeactivate(agent);
    } else {
      // Activating a different agent: show confirmation per D-09
      const hasActive = agents.some((a) => a.isActive);
      if (hasActive) {
        setSwitchTarget(agent);
      } else {
        // No active agent exists, just activate directly
        confirmSwitch(agent);
      }
    }
  }

  async function confirmSwitch(agent: Agent) {
    try {
      // Step 1: Find the most recent non-archived thread and archive it
      const threadsRes = await fetch(`${basePath}/api/threads`);
      if (threadsRes.ok) {
        const { threads } = await threadsRes.json();
        const activeThread = threads.find(
          (t: { is_archived: boolean }) => !t.is_archived
        );
        if (activeThread) {
          await fetch(`${basePath}/api/threads/${activeThread.id}/archive`, {
            method: 'POST',
          });
        }
      }

      // Step 2: Activate the new agent
      await fetch(`${basePath}/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      setSwitchTarget(null);
      onRefresh();
    } catch {
      // silently fail
    }
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

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold">No agents configured</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Add an agent to connect your Dify chatbot. You need at least one agent
          to start chatting.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Base URL</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell className="font-medium">
                {agent.label}
                {agent.isActive && (
                  <Badge className="ml-2" variant="default">
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">
                {agent.apiKey}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {agent.baseUrl}
              </TableCell>
              <TableCell className="text-sm capitalize">
                {agent.conversationMode}
              </TableCell>
              <TableCell>
                <Switch
                  checked={agent.isActive}
                  onCheckedChange={() => handleActiveToggle(agent)}
                  aria-label={`Set ${agent.label} as active`}
                />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(agent)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteTarget(agent)}
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
        title="Delete agent"
        description="This will permanently delete this agent configuration. Any conversations using this agent will keep their saved config snapshot. Delete agent?"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />

      <AgentSwitchDialog
        open={!!switchTarget}
        onOpenChange={(open) => !open && setSwitchTarget(null)}
        newAgentLabel={switchTarget?.label ?? ''}
        onConfirm={() => switchTarget && confirmSwitch(switchTarget)}
      />
    </>
  );
}
