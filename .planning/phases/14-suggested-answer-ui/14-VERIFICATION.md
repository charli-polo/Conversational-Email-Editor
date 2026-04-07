---
phase: 14-suggested-answer-ui
verified: 2026-04-07T22:11:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Chips appear below assistant message text in the running app"
    expected: "When Dify agent sends a message containing a <suggested_answer> block, pill-shaped chips appear below the message text, above the feedback bar"
    why_human: "Requires a live Dify agent session; automated checks confirm the code path but cannot exercise the actual SSE streaming + metadata write cycle"
  - test: "Hover effect is visible on chips"
    expected: "Hovering a chip shows a subtle background change (hover:bg-muted takes effect)"
    why_human: "Tailwind hover states require browser rendering"
  - test: "Clicking a chip sends the correct prompt and chips disappear"
    expected: "Chip click appends a user message with the action prompt text; all chips for that message vanish instantly"
    why_human: "Requires interactive browser session to observe assistant-ui thread state update"
  - test: "Regular messages render normally with no extra space"
    expected: "Messages without suggested answers show no empty gap or placeholder below message text"
    why_human: "SuggestedAnswerChips returns null when no actions present; visual regression requires browser"
  - test: "Chips do not re-appear on page reload for persisted messages"
    expected: "After reloading, chips are absent on prior messages (dismissed state is local, not persisted)"
    why_human: "Requires browser with conversation persistence flow"
---

# Phase 14: Suggested Answer UI Verification Report

**Phase Goal:** Render clickable suggested-answer chips below assistant messages; wire click-to-send.
**Verified:** 2026-04-07T22:11:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Clickable chip buttons appear below assistant message text when suggestedActions metadata is present | VERIFIED | `brief-runtime-provider.tsx` lines 220-233 parse `<suggested_answer>` and write `suggestedActions` to `metadata.custom`; `brief-thread.tsx` line 128 renders `<SuggestedAnswerChips />` inside `AssistantMessage` between content div and feedback bar |
| 2 | Each chip displays the action's label text as a styled pill | VERIFIED | `suggested-answer-chips.tsx` lines 22-37 render `{action.label}` inside a `<button>` with class `px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors cursor-pointer` |
| 3 | Clicking a chip sends the action's prompt as the user's next message | VERIFIED | `onClick` handler (lines 26-31) calls `runtime.thread.append({ role: 'user', content: [{ type: 'text', text: action.prompt }] })`; confirmed by test 5 in `__tests__/suggested-answer-chips.test.tsx` |
| 4 | After clicking any chip, all chips for that message disappear instantly | VERIFIED | `setDismissed(true)` is called before `append`; component returns `null` when `dismissed === true`; confirmed by test 6 |
| 5 | Messages without suggestedActions render normally with no extra UI | VERIFIED | Component returns `null` when `suggestedActions.length === 0` or missing from metadata; confirmed by tests 1 and 2 |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/assistant-ui/suggested-answer-chips.tsx` | SuggestedAnswerChips component | VERIFIED | 41 lines (min 25); exports `SuggestedAnswerChips`; substantive implementation with state, hooks, rendering logic |
| `__tests__/suggested-answer-chips.test.tsx` | Unit tests for chip rendering, dismissal, and empty state | VERIFIED | 101 lines (min 40); 7 tests covering all 5 plan behaviors; all pass |
| `components/assistant-ui/brief-thread.tsx` | AssistantMessage with SuggestedAnswerChips slot | VERIFIED | Contains `import { SuggestedAnswerChips } from './suggested-answer-chips'` (line 28) and `<SuggestedAnswerChips />` (line 128) in correct position |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `suggested-answer-chips.tsx` | `lib/dify/parse-suggested-answer.ts` | import SuggestedAction type | WIRED | Line 5: `import type { SuggestedAction } from '@/lib/dify/parse-suggested-answer'` |
| `suggested-answer-chips.tsx` | `@assistant-ui/react` | useMessage + useAssistantRuntime | WIRED | Line 4: `import { useMessage, useAssistantRuntime } from '@assistant-ui/react'`; both hooks used in component body |
| `brief-thread.tsx` | `suggested-answer-chips.tsx` | import and render SuggestedAnswerChips inside AssistantMessage | WIRED | Line 28 imports; line 128 renders inside `AssistantMessage` FC between `</div>` (AssistantMessageContent) and feedback bar `<div className="mt-1 ml-2` |

**Additional wiring verified (not in PLAN key_links):** `brief-runtime-provider.tsx` imports `parseSuggestedAnswer` from `lib/dify/parse-suggested-answer` and writes `suggestedActions` to `metadata.custom` in the final streaming yield (lines 220-233). This is the pipeline that populates the metadata the chips component reads.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RENDER-01 | 14-01-PLAN.md | User sees clickable action buttons below the assistant message bubble when suggested answers are present | SATISFIED | `SuggestedAnswerChips` renders buttons from `metadata.custom.suggestedActions`; integrated into `AssistantMessage` below content div |
| RENDER-02 | 14-01-PLAN.md | Each button displays the action's `label` text | SATISFIED | `{action.label}` rendered as button text content |
| RENDER-03 | 14-01-PLAN.md | Buttons render as styled chips/pills consistent with the existing chat UI | SATISFIED (NEEDS HUMAN for visual) | Exact chip classes applied: `px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors cursor-pointer`; matches `DynamicSuggestions` pattern in `brief-thread.tsx` line 277 |
| INTERACT-01 | 14-01-PLAN.md | User can click an action button and it sends the action's `prompt` as their next chat message | SATISFIED | `runtime.thread.append({ role: 'user', content: [{ type: 'text', text: action.prompt }] })` |
| INTERACT-02 | 14-01-PLAN.md | After clicking an action, all suggested answer buttons for that message disappear | SATISFIED | `useState(false)` dismissed flag; returns `null` when dismissed |

All 5 phase requirements are covered. No orphaned requirements found for Phase 14 in REQUIREMENTS.md.

### Anti-Patterns Found

None. No TODOs, FIXMEs, placeholder comments, empty implementations, or stub return values found in any phase 14 artifacts.

### Human Verification Required

#### 1. Live chip rendering with Dify agent

**Test:** Run `npm run dev`, start a conversation with a Dify agent that sends a `<suggested_answer>` block
**Expected:** Pill-shaped chips appear below the assistant message text, above the feedback/copy bar
**Why human:** Requires live SSE stream from Dify; automated checks confirm the code path but not the full runtime behavior

#### 2. Hover state on chips

**Test:** Hover the mouse over a rendered chip
**Expected:** Subtle background change visible (bg-muted applied on hover)
**Why human:** Tailwind hover pseudo-classes require browser rendering

#### 3. Click-to-send behavior

**Test:** Click a chip
**Expected:** The action's prompt text appears as a user message in the thread; all chips for that assistant message vanish instantly; no chips remain after page interactions
**Why human:** Requires interactive browser session observing assistant-ui thread state

#### 4. No extra space on regular messages

**Test:** Observe assistant messages from agent responses without `<suggested_answer>` blocks
**Expected:** No empty gap or extra space between message content and feedback bar
**Why human:** Visual regression; component returns null but layout reflow requires browser

#### 5. Chips absent after page reload

**Test:** Click a chip to send, reload the page, navigate back to the conversation
**Expected:** Chips are not shown on the persisted message (dismissed state is in-memory only)
**Why human:** Requires browser with full conversation persistence round-trip

### Gaps Summary

No gaps. All automated checks pass:
- All 5 observable truths verified against actual code
- All 3 required artifacts exist, are substantive, and are wired
- All 3 key links verified
- All 5 requirements (RENDER-01, RENDER-02, RENDER-03, INTERACT-01, INTERACT-02) satisfied
- 7/7 unit tests pass; 86/86 total tests pass; build succeeds (0 TypeScript errors)

Status is `human_needed` because visual correctness and live Dify integration cannot be confirmed programmatically.

---

_Verified: 2026-04-07T22:11:00Z_
_Verifier: Claude (gsd-verifier)_
