# Conversational Email Editor — Technical Spec

> This is the dev spec for the Conversational Email Editor prototype. It's meant to be read by Claude Code as persistent context (`SPEC.md` at project root).
> For the full product rationale, user stories, and success metrics, see the companion feature spec (docx).

## What We're Building

A two-panel web app where users edit AI-generated emails via natural language conversation. Left panel = chat. Right panel = live HTML email preview. The user types instructions like "Make the hero section dark blue with white text" and the preview updates in real-time.

Inspired by [Migma](https://migma.ai). Not a drag-and-drop editor — a conversational one with a lightweight visual property editor as complement.

## Implementation Notes (Deviations from Original Spec)

**Chat UI:**
- Originally specced to use `@assistant-ui/react`, but reverted to Vercel AI SDK's `useChat` hook for simplicity
- Custom chat UI with shadcn/ui components (Button, Input, Badge)
- Modern pill-shaped input design with circular send button
- Loading state with timer ("Thinking... Xs")
- HTML responses hidden and replaced with descriptive messages ("✓ Updated 'Hero' section")

**Section Selection (Slice 2):**
- Selected section displayed as chip badge **inside** the textarea (not as card at top as originally specced)
- Chip automatically removed after AI generation completes
- Section click behavior unchanged from spec

**Visual Editor (Slice 3):**
- Added mode toggle: "Visual Editor" button below textarea
- In chat mode (default): section click → chip in textarea
- In visual editor mode: section click → property panel replaces chat (Option B from spec)
- Close button at bottom right of property panel to return to chat
- Properties implemented: background color (with color picker), padding, text alignment

**LLM:**
- Using OpenAI GPT-4o instead of Claude (env config, both supported)

## Product Context (for copy, error messages, onboarding)

Brevo is a SaaS marketing automation platform. Our users are mostly SMB marketers who need to create and send email campaigns fast. The Aura AI initiative generates emails from a prompt, but users currently have to jump into a complex drag-and-drop editor to fix anything. This conversational editor is the fast lane: talk to the AI, see the email update, export when done.

## Current Slice

**Slice 6 — Improvements & Enhancements (NEXT)**

**Status:**
- ✅ Slice 1 complete
- ✅ Slice 2 complete
- ✅ Slice 3 complete
- ✅ Slice 4 complete
- ✅ Slice 5 complete (Points 1 and 5 deferred)
- ⏸️ Slice 6 pending

**Slice 5 progress:**
- ⏸️ Point 1: GenerationContext - deferred
- ✅ Point 2: Streaming preview - complete (blur + slow pulse animation, disabled streaming updates)
- ❌ Point 3: Change highlighting - rejected (removed per user feedback)
- ✅ Point 4: Suggested actions - complete (English chips above textarea, implementable format)
- ⏸️ Point 5: Onboarding empty state - deferred

**Status:** Slice 5 effectively complete (Points 1 and 5 deferred)

## Layout

The app is a single full-viewport page with a two-panel split layout.

```
┌─────────────────────────────────────────────────────────┐
│  Conversational Email Editor                    [Export] │  ← top bar, 48px, sticky
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│    CHAT PANEL        │       EMAIL PREVIEW              │
│    (assistant-ui)    │       (iframe, sandboxed)        │
│                      │                                  │
│    width: 420px      │       flex: 1 (takes rest)       │
│    fixed, not        │                                  │
│    collapsible       │       email centered at 600px    │
│                      │       in a gray background       │
│                      │       (like an email client)     │
│                      │                                  │
│    ┌──────────────┐  │       ┌────────────────────┐     │
│    │ message      │  │       │  ┌──────────────┐  │     │
│    │ message      │  │       │  │              │  │     │
│    │ message      │  │       │  │  600px email │  │     │
│    │              │  │       │  │  content     │  │     │
│    │              │  │       │  │              │  │     │
│    │              │  │       │  └──────────────┘  │     │
│    └──────────────┘  │       └────────────────────┘     │
│    ┌──────────────┐  │                                  │
│    │ input area   │  │                                  │
│    └──────────────┘  │                                  │
├──────────────────────┴──────────────────────────────────┤
```

### Layout Rules

- **Viewport:** `h-screen w-screen overflow-hidden`. No page-level scrolling.
- **Top bar:** 48px height. Contains app title on the left, export actions on the right. `border-b` separator. Minimal — not a full toolbar.
- **Panel split:** Horizontal flex. Chat panel is fixed 420px wide. Preview panel takes remaining space (`flex-1`).
- **Chat panel:** Full height below top bar. Scrolls internally. assistant-ui handles the message list + composer layout. The composer (input area) is pinned to the bottom.
- **Preview panel:** Full height below top bar. Gray background (`bg-muted` or `#f4f4f5`). The email HTML renders in an iframe centered horizontally, max-width 600px, with `mx-auto` and light shadow to simulate an email client view. The iframe itself scrolls vertically if the email is longer than the viewport.
- **Divider:** A 1px vertical border between panels (`border-r` on chat panel). No drag-to-resize for Slice 1.
- **No responsive/mobile layout.** This is a desktop-only tool. Min-width: 1024px.

### Later Slices Layout Changes

- **Slice 2:** Clicking a section in the preview highlights it. A small "section card" appears at the top of the chat panel showing a thumbnail/label of the selected section. The chat panel layout doesn't change structurally.
- **Slice 3:** When a section is selected and the user clicks "Edit properties", a property panel (280px wide) slides in from the right edge of the chat panel, pushing the chat narrower temporarily. Or: the property panel replaces the chat panel entirely (tab-based toggle: Chat | Properties). Decision deferred — prototype both and pick during testing.

## Tech Stack

| Layer | Choice | Package | Notes |
|-------|--------|---------|-------|
| Framework | Next.js 15 (App Router) | `next` | ✅ Using Turbopack |
| Chat UI | ~~assistant-ui~~ | ~~`@assistant-ui/react`~~ | ❌ Reverted to useChat from Vercel AI SDK |
| Components | shadcn/ui + Tailwind | `tailwindcss`, components via `npx shadcn@latest` | ✅ Using Badge, Button, Input, Label |
| AI integration | Vercel AI SDK | `ai`, `@ai-sdk/openai` | ✅ Implemented |
| LLM | ~~Claude~~ → GPT-4o | via Vercel AI SDK provider | ⚠️ Using OpenAI instead of Claude |
| HTML parsing | cheerio (server) | `cheerio` | ✅ Implemented in /api/parse-sections |
| State | React state | Built-in hooks | ✅ No zustand needed yet |

## Project Structure

```
/
├── SPEC.md                          # this file
├── app/
│   ├── layout.tsx                   # root layout
│   ├── page.tsx                     # main editor page (two-panel layout)
│   └── api/
│       └── chat/
│           └── route.ts             # AI chat endpoint (Vercel AI SDK)
├── components/
│   ├── chat/
│   │   └── chat-panel.tsx           # assistant-ui chat thread
│   ├── preview/
│   │   └── email-preview.tsx        # iframe-based HTML preview
│   └── ui/                          # shadcn/ui components
├── lib/
│   ├── email-session.ts             # EmailSession type + state management
│   ├── prompts/
│   │   └── email-editor.ts          # system prompt for the AI agent
│   └── sample-email.ts              # hardcoded sample email HTML for prototype
├── public/
└── package.json
```

## Data Model

```typescript
// lib/email-session.ts

export interface BrandKit {
  colors: string[];
  tone: string;                      // e.g. "professional", "playful"
  logo?: string;                     // logo URL
  fonts?: string[];
}

export interface GenerationContext {
  originalPrompt: string;            // e.g. "Promo email for winter sale"
  sourceUrls?: string[];             // URLs crawled during generation
  brandKit?: BrandKit;
  productData?: Record<string, unknown>;
  campaignRef?: string;              // reference to past campaign used
  industry?: string;                 // e.g. "e-commerce", "SaaS"
}

export interface EditSnapshot {
  html: string;
  timestamp: number;
  description: string;               // human-readable label for the edit
}

export interface EmailSession {
  html: string;                      // current email HTML
  generationContext?: GenerationContext;
  editHistory: EditSnapshot[];       // undo/redo stack
}
```

For Slice 1, `generationContext` is `undefined`. The session is initialized with a hardcoded sample email in `lib/sample-email.ts`.

## AI Agent — System Prompt

The system prompt for the chat endpoint (`app/api/chat/route.ts`) must include:

```
You are an email HTML editor. You receive the current HTML of an email and a user instruction. You return the modified HTML.

Rules:
- Email HTML is TABLE-BASED. Never use divs for layout. Use <table>, <tr>, <td>.
- ALL styles must be INLINE. No <style> blocks, no CSS classes.
- Image src must be absolute URLs.
- Preserve the overall structure. Only modify what the user asked for.
- Return ONLY the complete modified HTML. No explanations, no markdown fences.
- If you cannot fulfill the instruction, respond with: {"error": "description of the issue"}
```

The full HTML is passed as context with each message. For Slice 1, this is the entire email. Later slices will scope to selected sections.

## API Route — Slice 1

```typescript
// app/api/chat/route.ts

import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { messages, html } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: SYSTEM_PROMPT,          // from lib/prompts/email-editor.ts
    messages: [
      {
        role: "user",
        content: `Current email HTML:\n\`\`\`html\n${html}\n\`\`\``,
      },
      ...messages,
    ],
  });

  return result.toDataStreamResponse();
}
```

## Email Preview — Iframe Sandbox

The preview panel renders the email HTML in a sandboxed iframe:

```typescript
// components/preview/email-preview.tsx
// Use srcdoc attribute to inject HTML directly
// Sandbox: sandbox="allow-same-origin" (no scripts in email HTML)
// Re-render on every html state change
```

Key constraints:
- The iframe must NOT execute scripts (email HTML should be inert).
- Use `srcdoc` — not blob URLs — for simplicity.
- On HTML update, set `srcdoc` to new value. The iframe re-renders automatically.

## State Flow — Slice 1

```
User types message
  → assistant-ui sends to /api/chat with current html in payload
  → API streams response (modified HTML)
  → On stream complete, extract HTML from response
  → Update EmailSession.html in state
  → Preview iframe re-renders with new srcdoc
```

The tricky part: the AI response IS the new HTML. We need to detect whether the response is valid HTML or an error message, then update state accordingly.

Approach:
1. Stream the full response into a buffer.
2. On completion, check if it starts with `<!DOCTYPE` or `<html` or `<table` → treat as HTML.
3. If it starts with `{"error"` → parse as error, display in chat.
4. Otherwise → display as conversational response (the AI might ask a clarifying question).

## Sample Email

The hardcoded sample email in `lib/sample-email.ts` should be a realistic, table-based marketing email with:
- A header with logo placeholder
- A hero section with headline, subheadline, and CTA button
- A product/content section with 2-3 items
- A footer with unsubscribe link

Use inline styles only. Keep it ~200 lines of clean email HTML. Use placeholder images from `https://placehold.co/`.

## Vertical Slices Roadmap

### Slice 1 — Chat + Live Preview ✅ COMPLETE
- ✅ Two-panel layout (chat + preview)
- ✅ Hardcoded sample email
- ✅ AI edits full HTML on every instruction
- ✅ Modern UI with pill-shaped input, loading states with timer
- ✅ HTML hidden in chat, replaced with descriptive messages
- **Tech:** Using Vercel AI SDK with OpenAI (not Claude as originally specced)
- **Known issues:** Occasional parse-sections empty JSON error (minor)

### Slice 2 — Section Selection + Scoped Editing ✅ COMPLETE
- ✅ HTML section parser (cheerio, server-side via /api/parse-sections)
- ✅ Click to select sections in preview (iframe ↔ parent via postMessage)
- ✅ Selected section as chip badge inside textarea (not card at top)
- ✅ AI instructions scoped to selected section only
- ✅ Section merging back into full HTML with data-section-id attributes
- ✅ Automatic chip removal after generation
- **Known issues:** parse-sections called frequently (could optimize with debounce)

### Slice 3 — Visual Property Editor + URL-as-Context ✅ COMPLETE
- ✅ Visual editor mode toggle (button below textarea)
- ✅ Mode-based behavior: chat mode (chip) vs visual editor mode (property panel)
- ✅ Property panel UI (replaces chat when section selected in visual mode)
- ✅ Property extraction from HTML (background color, padding, text alignment)
- ✅ Property updates to HTML (surgical regex targeting `<td>` elements)
- ✅ Styles preservation (font-family, color, etc. maintained during updates)
- ⏸️ Bidirectional sync (AI edits → property panel updates) - deferred to Slice 5
- ⏸️ fetchURL tool (deferred to later slice)
- **Tech fix:** Regex now correctly targets `<td>` inside `<tr data-section-id>` where actual styles live

### Slice 4 — Undo/Redo ✅ COMPLETE
- ✅ EditSnapshot stack (push on every change, max 5 snapshots, FIFO)
- ✅ Undo and Redo buttons in UI with disabled states
- ✅ No history UI - just functional undo/redo
- ✅ Automatic snapshot on HTML changes (chat edits + property panel)
- ⏸️ Export functionality deferred to later slice

### Slice 5 — Polish + Context-Aware Editing ✅ COMPLETE
- ⏸️ Wire up generationContext (simulated) to AI system prompt - deferred
- ✅ Streaming preview with blur + slow pulse animation (Option 1: disabled streaming updates, show only final result with 4s pulse cycle for elegant loading state)
- ❌ Change highlighting (flash modified sections) - rejected by user, removed
- ✅ Suggested actions after each edit - complete (3 contextual suggestions as chips above textarea, click to fill input)
- ⏸️ Onboarding empty state - deferred
- ✅ AI section duplication fix - strengthened system prompt to prevent generating multiple `<tr>` elements
- **Implementation details:**
  - `/api/suggestions` endpoint using GPT-4o-mini
  - Suggestions in English with "Add a section with..." format
  - Chips positioned above textarea, appear after AI generation
  - Click populates input without auto-sending

### Slice 6 — Improvements & Enhancements
- Add animations with motion.dev (Framer Motion)
  - Smooth transitions when switching between chat and property panel
  - Section selection animations
  - Property panel slide-in/out animations
  - Loading states with skeleton animations
- Improve overall UI design
  - Refine visual hierarchy and spacing
  - Enhance color scheme and typography
  - Polish interactive states (hover, focus, active)
  - Improve responsiveness and polish micro-interactions
- Enhance sample email
  - Create a more realistic, visually appealing email template
  - Better showcase of different section types
  - More professional design that reflects modern email best practices

## Email HTML Constraints (for AI prompts)

These constraints must be baked into the AI agent's system prompt:

1. **Table-based layout.** Email clients don't support flexbox/grid. Use `<table>`, `<tr>`, `<td>`.
2. **Inline styles only.** Many clients strip `<style>` blocks. Every element must have its styles inline.
3. **No JavaScript.** Email clients strip all scripts.
4. **Absolute image URLs.** Relative paths won't work in email clients.
5. **Width via attributes.** Use `width="600"` on tables, not just CSS `width`.
6. **Background colors via both.** `bgcolor="#ffffff"` attribute AND `background-color: #ffffff` inline style for max compatibility.
7. **Font stacks.** Use web-safe fonts: Arial, Helvetica, Georgia, Times New Roman. Always include fallbacks.
8. **No CSS shorthand that breaks.** `padding: 20px` is fine. `margin: 0 auto` may not work everywhere. Be explicit: `margin-left: auto; margin-right: auto`.
9. **Max width 600px.** Standard email body width. Wrap everything in a 600px-wide outer table.

## Known Issues & Technical Debt

### High Priority (Fix before prod)
- **Testing missing**: No Playwright tests yet (established workflow rule not followed)

### Medium Priority (Optimize when time permits)
- **Parse-sections performance**: Called on every HTML change, could debounce or optimize
- **Parse-sections error handling**: Occasional "Unexpected end of JSON input" error (empty request body)
- **AI error messages**: Not displayed prominently to user when AI returns `{"error": "..."}`

### Low Priority (Nice to have)
- **Streaming preview**: Currently updates on completion, not as tokens arrive (Slice 5)
- **Change highlighting**: No visual indication of what changed (Slice 5)
- **Undo/redo**: Not implemented yet (Slice 4)

## Open Decisions (resolve as we go)

- [x] Full HTML return vs diff/patch → **RESOLVED:** full HTML return
- [x] Section granularity → **RESOLVED:** top-level table rows via cheerio
- [ ] HTML validation layer → add if AI breaks things in testing
- [x] Google ADK vs Vercel AI SDK for MCP → **RESOLVED:** Vercel AI SDK
- [ ] URL crawling service → decide at Slice 3
- [x] Sample email HTML → **RESOLVED:** created in lib/sample-email.ts
