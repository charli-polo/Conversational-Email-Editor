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

### Active

(None — define in next milestone via `/gsd:new-milestone`)

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

---
*Last updated: 2026-04-06 after v1.0 milestone*
