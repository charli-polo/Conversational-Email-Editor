# Conversational Email Editor — Brief Flow

## What This Is

A conversational email editor with a two-step AI-assisted flow: users first chat with a Dify-powered agent to define their email brief (objectives, audience, tone), then transition to the email editing interface. Features full conversation persistence, configurable agents, feedback, file uploads, and rich chat UI. Built as a Next.js app for Brevo.

## Core Value

Two-step conversational flow: brief collection via AI agent, then email editing — proving the UX pattern of progressive AI-assisted content creation.

## Requirements

### Validated

- ✓ Dify agent API integration with streaming SSE proxy — v1.0
- ✓ Brief-taking chat page with two-panel layout — v1.0
- ✓ Two-step flow: brief page → email editor — v1.0
- ✓ assistant-ui v0.12 with useLocalRuntime + Dify ChatModelAdapter — v1.0
- ✓ Settings panel (agent CRUD, test prompt management, active agent selection) — v1.0
- ✓ SQLite conversation persistence with save-on-demand flow — v1.0
- ✓ Conversation resume from /c/{id} with auto-persist — v1.0
- ✓ Like/dislike feedback persisted to Dify API — v1.0
- ✓ Conversation opener with markdown rendering — v1.0
- ✓ Suggestion chips from Dify /parameters — v1.0
- ✓ File upload with drag-and-drop and preview — v1.0
- ✓ Speech-to-text via Dify audio endpoint — v1.0
- ✓ Collapsible reasoning display (tool-gated) — v1.0
- ✓ 34 unit tests + E2E Playwright spec — v1.0
- ✓ Playwright E2E infrastructure with webServer, DB isolation, SSE mocks — v1.1 Phase 8.1
- ✓ E2E tests for conversation list (LIST-01 through LIST-05) — v1.1 Phase 8.1

### Active

(No active requirements — v1.1 milestone complete pending audit)

### Recently Validated

- Tag schema (tags + conversationTags tables) with cascade deletes — v1.1 Phase 7
- Threads API rewritten with 2-query join (no N+1) returning tags inline — v1.1 Phase 7
- Shared useConversations hook for cross-component data consumption — v1.1 Phase 7
- Tag-based tab bar filtering with instant client-side switching — v1.1 Phase 10
- In-app navigation to /conversations from brief page header — v1.1 Phase 11
- Reactive tab bar (stale tag tabs removed when last conversation with tag is deleted) — v1.1 Phase 11
- Phase 8 verification trail (VERIFICATION.md + 08-02 SUMMARY.md) — v1.1 Phase 11
- E2E regression suite covering all 5 app routes + 8 critical flows — v1.1 Phase 12
- Cross-spec DB contamination fixed (resetDatabase helper, workers:1) — v1.1 Phase 12

## Current Milestone: v1.1 Conversation Management

**Goal:** Give users a dedicated page to browse, organize, and manage all their saved conversations.

**Target features:**
- Conversation list page with details (agent, timestamp)
- Navigate to, rename, and delete conversations
- Free-text tagging system
- Tab view per tag (+ All tab)

### Out of Scope

- Live brief rendering in right panel — deferred to v2
- Brief data injected into email editor context — future enhancement
- Email generation from brief — not in scope
- Dify agent configuration/customization — agent is pre-built
- Mobile app — web-first approach
- Feedback analytics dashboard — future enhancement
- Offline mode — real-time is core value

## Context

Shipped v1.0 with 12,824 LOC TypeScript across 149 files.
Tech stack: Next.js 15, React 19, assistant-ui v0.12, better-sqlite3 + Drizzle ORM, Dify API, Tailwind CSS.
Deployed to Railway with SQLite persistent storage.
Version: 0.2.0-rc.1

## Constraints

- **Tech stack**: Next.js, React, TypeScript, Tailwind — must stay consistent
- **Dify API key**: Server-side only (API route), never exposed to client
- **Layout**: Two-panel layout (chat left, content right)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dify agent for brief | Pre-built agent, simple HTTP API, multi-turn support | ✓ Good — works well |
| useLocalRuntime over remote | Simpler, save-on-demand vs auto-persist, no broken ThreadList | ✓ Good — Phase 6 rewrite |
| SQLite + Drizzle | Zero-config, Railway-compatible, type-safe | ✓ Good |
| assistant-ui v0.12 primitives | Replaced 676 LOC custom chat, rich component library | ✓ Good |
| Save-on-demand persistence | User controls when to save vs auto-saving everything | ✓ Good — cleaner UX |
| Dify auto-generated titles | Let Dify name conversations based on content | ✓ Good |
| Tool-gated reasoning display | agent_thought without tools just recaps answer | ✓ Good — avoids confusion |
| Inline toast (no library) | Keep bundle light, matches no-new-deps approach | ✓ Good |
| 2-query join over N+1 | Single pass for threads + batch for tags, grouped in-memory | ✓ Good — Phase 7 |
| useConversations shared hook | Single data source for drawer + future conversations page | ✓ Good — Phase 7 |

## Evolution

This document evolves at phase transitions and milestone boundaries.
Last updated: 2026-04-07

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-07 after Phase 12 regression-test-suite complete (gap closure verified)*
