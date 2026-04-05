---
phase: 04-settings-panel-chat-upgrade-conversation-persistence
plan: 01
subsystem: database
tags: [sqlite, better-sqlite3, drizzle-orm, drizzle-kit, wal-mode]

# Dependency graph
requires: []
provides:
  - SQLite database singleton with WAL mode (lib/db/index.ts)
  - Drizzle ORM schema with agents, test_prompts, conversations, messages tables (lib/db/schema.ts)
  - Auto-migration function (lib/db/migrate.ts)
  - Drizzle Kit configuration (drizzle.config.ts)
affects: [04-02, 04-03, 04-04, 04-05, 04-06]

# Tech tracking
tech-stack:
  added: [better-sqlite3, drizzle-orm, drizzle-kit, "@types/better-sqlite3"]
  patterns: [drizzle-sqlite-singleton, wal-mode-pragmas, iso-timestamp-defaults]

key-files:
  created: [lib/db/schema.ts, lib/db/index.ts, lib/db/migrate.ts, drizzle.config.ts, "drizzle/0000_graceful_lightspeed.sql"]
  modified: [package.json, next.config.ts, .gitignore]

key-decisions:
  - "Track drizzle migrations in git (not gitignored) so they deploy to Railway"
  - "Use text columns with ISO timestamps instead of integer epoch for readability"

patterns-established:
  - "Database singleton: import { db } from '@/lib/db' for all API routes"
  - "Schema-first migrations: define tables in schema.ts, generate SQL with drizzle-kit"
  - "WAL mode + foreign keys enabled via pragmas on connection init"

requirements-completed: [PERSIST-01, PERSIST-05]

# Metrics
duration: 2min
completed: 2026-04-05
---

# Phase 04 Plan 01: SQLite Database Foundation Summary

**SQLite database with better-sqlite3 + Drizzle ORM: 4 tables (agents, test_prompts, conversations, messages), WAL mode, auto-migration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T18:53:27Z
- **Completed:** 2026-04-05T18:55:36Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Installed better-sqlite3 and drizzle-orm with TypeScript types and migration tooling
- Configured Next.js serverExternalPackages to exclude native module from webpack bundling
- Defined 4-table schema: agents (9 cols), test_prompts (7 cols), conversations (8 cols), messages (5 cols)
- Database singleton with WAL mode and foreign key enforcement
- Generated and committed initial SQL migration

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and configure Next.js** - `c09ddd9` (chore)
2. **Task 2: Create schema, singleton, and migration** - `7d62071` (feat)

## Files Created/Modified
- `lib/db/schema.ts` - Drizzle table definitions for agents, test_prompts, conversations, messages
- `lib/db/index.ts` - Database singleton with WAL mode, foreign keys, DATABASE_PATH env support
- `lib/db/migrate.ts` - Auto-migration function reading from drizzle/ folder
- `drizzle.config.ts` - Drizzle Kit config for SQLite dialect
- `drizzle/0000_graceful_lightspeed.sql` - Initial migration creating all 4 tables
- `next.config.ts` - Added serverExternalPackages for better-sqlite3
- `package.json` - Added better-sqlite3, drizzle-orm, drizzle-kit, @types/better-sqlite3
- `.gitignore` - Added data/ for SQLite database files

## Decisions Made
- Tracked drizzle/ migrations in git (removed from .gitignore) so they are available on Railway deployment
- Used ISO text timestamps for human readability in SQLite

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed drizzle/ from .gitignore**
- **Found during:** Task 2 (migration generation)
- **Issue:** Plan instructed adding `drizzle/` to .gitignore, but migrate.ts reads migration files from that directory at runtime. On Railway deployment, migrations would be missing.
- **Fix:** Removed `drizzle/` from .gitignore so migration SQL files are tracked in source control
- **Files modified:** .gitignore
- **Verification:** `git status` shows drizzle/ files staged and committed
- **Committed in:** 7d62071 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for Railway deployment correctness. No scope creep.

## Issues Encountered
- First `npm install` of better-sqlite3 silently failed to add to package.json (npm quirk) -- re-ran with explicit `--save` flag which succeeded

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Database layer fully operational, ready for API routes in plans 02-06
- All downstream plans can import `{ db }` from `@/lib/db` and schema types from `@/lib/db/schema`
- Migration infrastructure ready for future schema changes

---
*Phase: 04-settings-panel-chat-upgrade-conversation-persistence*
*Completed: 2026-04-05*
