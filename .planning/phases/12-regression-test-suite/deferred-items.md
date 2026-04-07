# Deferred Items - Phase 12

## Pre-existing: Cross-spec DB contamination

**Found during:** 12-02 Task 2 (full suite verification)

When running ALL Playwright spec files together (`npx playwright test`), 2 pre-existing tests fail due to DB state contamination between spec files:

1. `e2e-phase8.spec.ts` LIST-05 empty state test - expects no conversations but phase 10 seeds data first
2. `e2e-phase10.spec.ts` TAB-03b empty tag tab test - depends on specific DB state

These failures reproduce even without the regression spec (just `e2e-phase8 + e2e-phase10` together). The root cause is that `globalSetup` resets the DB once, but each spec file seeds additional data that persists for subsequent files.

**Fix options:**
- Add per-spec-file DB reset (e.g., a `beforeAll` that truncates tables)
- Use Playwright projects with separate DB paths per spec file
- Reorder specs to run empty-state tests first

**Not caused by:** the regression spec (12-02)
