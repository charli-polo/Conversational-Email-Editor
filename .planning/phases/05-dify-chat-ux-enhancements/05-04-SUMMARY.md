---
phase: 05-dify-chat-ux-enhancements
plan: 04
subsystem: ui
tags: [assistant-ui, file-upload, speech-to-text, composer, drag-drop, attachments]

requires:
  - phase: 05-02
    provides: DifyParamsContext with useDifyParams() hook, attachment/dictation adapters wired in runtime
provides:
  - Conditional paperclip button for file upload in composer
  - Conditional mic/stop-dictation buttons for STT in composer
  - Attachment preview chips for queued files in composer
  - Drag-and-drop overlay for file upload on chat area
  - MessageAttachmentDisplay for image thumbnails and document links in history
affects: [05-05, ui-polish]

tech-stack:
  added: []
  patterns:
    - "Conditional composer buttons gated by DifyParamsContext feature flags"
    - "ComposerPrimitive.Attachments with custom Attachment component"
    - "ComposerPrimitive.AttachmentDropzone as wrapper with CSS group data-attribute overlay"

key-files:
  created:
    - components/assistant-ui/attachment-preview.tsx
    - components/assistant-ui/drag-drop-overlay.tsx
  modified:
    - components/assistant-ui/brief-thread.tsx

key-decisions:
  - "Used FileText icon as universal file type indicator instead of conditional image/document icons in composer chips"
  - "Wrapped AttachmentPrimitive.Name in span for truncation since Name primitive accepts no props"
  - "DragDropOverlay uses CSS group/data-attribute approach for overlay visibility"

patterns-established:
  - "Conditional composer buttons: derive boolean from useDifyParams(), guard render with &&"
  - "AttachmentDropzone wraps thread area with group class, overlay uses group-data-[dragging] for visibility"

requirements-completed: [UX-05, UX-06, UX-08]

duration: 2min
completed: 2026-04-05
---

# Phase 5 Plan 4: Composer File Upload and Speech-to-Text UI Summary

**Conditional paperclip, mic/stop buttons, attachment preview chips, and drag-drop overlay in composer, gated by Dify /parameters config via shared DifyParamsContext**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-05T22:02:20Z
- **Completed:** 2026-04-05T22:04:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Composer now shows paperclip button (left of input) when file_upload.image.enabled is true
- Mic/StopDictation buttons (right of input, before send) appear when speech_to_text.enabled is true
- Queued attachments render as preview chips with filename and remove button above the input row
- Drag-and-drop overlay with "Drop files here" feedback wraps the entire thread area
- All features consume DifyParamsContext (no duplicate /parameters fetch -- WARNING 3 fix)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create attachment preview and drag-drop overlay components** - `30de978` (feat)
2. **Task 2: Add paperclip, mic, attachment previews, and dropzone to composer** - `f158bc2` (feat)

## Files Created/Modified
- `components/assistant-ui/attachment-preview.tsx` - ComposerAttachmentPreview (file chips with icon, name, remove) and MessageAttachmentDisplay (image thumbnails, document links)
- `components/assistant-ui/drag-drop-overlay.tsx` - DragDropOverlay wrapping chat area with ComposerPrimitive.AttachmentDropzone
- `components/assistant-ui/brief-thread.tsx` - Updated composer with conditional paperclip, mic/stop, attachment previews, dropzone wrapper

## Decisions Made
- Used FileText as universal file icon in composer chips (AttachmentPrimitive.unstable_Thumb does not support fallback prop)
- Wrapped AttachmentPrimitive.Name in a span for max-w-[120px] truncate styling since Name primitive accepts no className
- DragDropOverlay uses CSS group/data-attribute pattern (group-data-[dragging]) for overlay visibility transition

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed AttachmentPrimitive.unstable_Thumb usage**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** Plan specified `fallback` prop on unstable_Thumb but it only accepts standard div props
- **Fix:** Replaced with a static FileText icon; wrapped AttachmentPrimitive.Name in span for className
- **Files modified:** components/assistant-ui/attachment-preview.tsx
- **Verification:** `npx tsc --noEmit` passes clean
- **Committed in:** f158bc2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor API mismatch fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are fully wired to assistant-ui primitives and DifyParamsContext.

## Next Phase Readiness
- Composer is complete with file upload and STT UI
- Plan 05 (suggested questions, UI polish) can proceed
- All composer primitives (AddAttachment, Dictate, StopDictation, Attachments, AttachmentDropzone) are integrated

---
*Phase: 05-dify-chat-ux-enhancements*
*Completed: 2026-04-05*
