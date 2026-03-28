# Conversational Email Editor — Brief Flow

## What This Is

A conversational email editor that adds a brief-taking step before email editing. Users first chat with a Dify-powered AI agent to define their email brief, then transition to the existing email editing interface. Built as a Next.js app for Brevo.

## Core Value

Demonstrate a two-step conversational flow: brief collection via AI agent, then email editing — proving the UX pattern of progressive AI-assisted content creation.

## Requirements

### Validated

- [x] Email editing via conversational AI (GPT via LiteLLM proxy)
- [x] Section-scoped editing with preview
- [x] Streaming AI responses in chat panel
- [x] AI-powered edit suggestions

### Active

- [x] Dify `/chat-messages` multi-turn conversation support — Validated in Phase 1
- [ ] Brief-taking chat page with Dify agent integration
- [ ] Two-step flow: brief page -> email editor page
- [ ] Right panel placeholder during brief phase (empty state)
- [ ] Transition button from brief to email editor

### Out of Scope

- Live brief rendering in right panel — deferred to v2
- Brief data injected into email editor context — future enhancement
- Email generation from brief — not in scope
- Dify agent configuration/customization — agent is pre-built

## Context

- Existing Next.js app with chat panel (left) + email preview (right) layout
- Uses `@ai-sdk/openai` with LiteLLM proxy (`data-litellm-proxy.brevo.tech`) for email editing
- Dify agent exposed at `https://api.dify.ai/v1` with key `app-Ey4TRfvs78MptXZFWyZNCokx`
- Dify agent uses `/chat-messages` endpoint (multi-turn with `conversation_id`)
- Current branch: `feat/litellm-refactor`

## Constraints

- **Tech stack**: Next.js, React, TypeScript, Tailwind — must stay consistent with existing codebase
- **Dify API key**: Must be server-side only (API route), never exposed to client
- **Layout**: Reuse existing two-panel layout pattern (chat left, content right)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dify agent for brief | Pre-built agent, simple HTTP API, multi-turn support | Validated — Phase 1 complete |
| Brief panel empty in v1 | Simplify first iteration, brief rendering deferred | -- Pending |
| Separate page for brief vs editor | Clear step separation, simpler state management | -- Pending |

---
*Last updated: 2026-03-25 after Phase 1 (Dify Agent API Integration) complete*
