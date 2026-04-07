'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Download, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AgentList } from '@/components/settings/agent-list';
import { AgentForm } from '@/components/settings/agent-form';
import { TestPromptList } from '@/components/settings/test-prompt-list';
import { TestPromptForm } from '@/components/settings/test-prompt-form';

interface Agent {
  id: string;
  label: string;
  apiKey: string;
  baseUrl: string;
  difyUrl: string | null;
  conversationMode: string;
  isActive: boolean;
}

interface TestPrompt {
  id: string;
  name: string;
  text: string;
  autoSend: boolean;
  displayOrder: number;
}

export default function SettingsPage() {
  const [agentRefreshKey, setAgentRefreshKey] = useState(0);
  const [promptRefreshKey, setPromptRefreshKey] = useState(0);
  const [agentFormOpen, setAgentFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>(undefined);
  const [promptFormOpen, setPromptFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<TestPrompt | undefined>(
    undefined
  );

  function handleAgentRefresh() {
    setAgentRefreshKey((k) => k + 1);
  }

  function handlePromptRefresh() {
    setPromptRefreshKey((k) => k + 1);
  }

  function handleEditAgent(agent: Agent) {
    setEditingAgent(agent);
    setAgentFormOpen(true);
  }

  function handleEditPrompt(prompt: TestPrompt) {
    setEditingPrompt(prompt);
    setPromptFormOpen(true);
  }

  function handleAddAgent() {
    setEditingAgent(undefined);
    setAgentFormOpen(true);
  }

  function handleAddPrompt() {
    setEditingPrompt(undefined);
    setPromptFormOpen(true);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  async function handleExport() {
    const res = await fetch('/api/settings/export');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-editor-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch('/api/settings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        setImportStatus(`Error: ${err.error}`);
        return;
      }
      const result = await res.json();
      setImportStatus(`Imported ${result.agentsAdded} agent(s), ${result.promptsAdded} prompt(s)`);
      handleAgentRefresh();
      handlePromptRefresh();
    } catch {
      setImportStatus('Error: invalid JSON file');
    }
    // Reset file input so the same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to brief
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>
        </div>
        {importStatus && (
          <div className="mb-4 rounded-md border px-4 py-3 text-sm">
            {importStatus}
            <button onClick={() => setImportStatus(null)} className="ml-2 text-muted-foreground hover:text-foreground">
              dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="agents">
          <TabsList>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="test-prompts">Test Prompts</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-6">
            <AgentList
              refreshKey={agentRefreshKey}
              onEdit={handleEditAgent}
              onRefresh={handleAgentRefresh}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddAgent} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add agent
              </Button>
            </div>
            <AgentForm
              open={agentFormOpen}
              onOpenChange={setAgentFormOpen}
              agent={editingAgent}
              onSaved={handleAgentRefresh}
            />
          </TabsContent>

          <TabsContent value="test-prompts" className="mt-6">
            <TestPromptList
              refreshKey={promptRefreshKey}
              onEdit={handleEditPrompt}
              onRefresh={handlePromptRefresh}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddPrompt} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add test prompt
              </Button>
            </div>
            <TestPromptForm
              open={promptFormOpen}
              onOpenChange={setPromptFormOpen}
              prompt={editingPrompt}
              onSaved={handlePromptRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
