'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
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

        <h1 className="text-2xl font-semibold mb-6">Settings</h1>

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
