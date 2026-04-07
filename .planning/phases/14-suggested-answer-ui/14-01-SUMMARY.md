---
plan: 14-01
phase: 14-suggested-answer-ui
status: complete
started: 2026-04-07
completed: 2026-04-07
---

# Plan 14-01 Summary: Suggested Answer Chips UI

## What was built

SuggestedAnswerChips component that renders clickable pill-shaped buttons below assistant messages when the Dify agent includes `<suggested_answer>` blocks. Clicking a chip sends the associated prompt as a user message and dismisses all chips for that message.

## Key changes

### Created
- `components/assistant-ui/suggested-answer-chips.tsx` — Renders chips from message metadata
- `__tests__/suggested-answer-chips.test.tsx` — 7 unit tests for component behavior

### Modified
- `components/assistant-ui/brief-thread.tsx` — Integrated SuggestedAnswerChips into AssistantMessage
- `lib/dify/parse-suggested-answer.ts` — Added support for `{answer, actions}` wrapper format
- `__tests__/parse-suggested-answer.test.ts` — Added 2 tests for wrapper format
- `components/assistant-ui/brief-runtime-provider.tsx` — Minor fix for rawText parsing order
- `vitest.config.ts` — Added `.tsx` test file support and React plugin
- `package.json` — Added @testing-library/react, @testing-library/jest-dom, jsdom dev deps

## Deviations

1. **Parser format mismatch (blocking):** The Dify agent sends `<suggested_answer>` with a `{answer, actions}` object wrapper, not a raw JSON array as Phase 13 assumed. Fixed the parser to handle both formats.
2. **Test infrastructure gaps:** Installed @testing-library/react, @testing-library/jest-dom, jsdom as dev dependencies; updated vitest.config.ts for React JSX transform.

## Self-Check: PASSED

- [x] Chips render below assistant message text
- [x] Chips are pill-shaped with hover effect
- [x] Clicking a chip sends prompt as user message
- [x] All chips disappear after clicking one
- [x] Regular messages render normally (no extra space)
- [x] `<suggested_answer>` text stripped from display
- [x] 86 tests pass (84 existing + 2 new)

## key-files

### created
- components/assistant-ui/suggested-answer-chips.tsx
- __tests__/suggested-answer-chips.test.tsx

### modified
- components/assistant-ui/brief-thread.tsx
- lib/dify/parse-suggested-answer.ts
- __tests__/parse-suggested-answer.test.ts
- components/assistant-ui/brief-runtime-provider.tsx
- vitest.config.ts
- package.json
