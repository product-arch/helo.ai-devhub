

# Make OAuth 2.0 Credential Modal Scrollable

## Overview

The DialogContent component currently uses a fixed centered position without scroll capability. When content (like the consent flow preview) exceeds the viewport height, it gets clipped.

## Changes

### `src/components/ui/dialog.tsx` — Add scroll support to DialogContent

Update the DialogContent className to add `max-h-[90vh] overflow-y-auto` so the modal becomes scrollable when content exceeds 90% of viewport height. Change from `grid` to `flex flex-col` to ensure proper scroll behavior.

Current: `fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-block ...`

New: `fixed left-[50%] top-[50%] z-50 flex flex-col w-full max-w-lg max-h-[85vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-block ...`

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/dialog.tsx` | Add `max-h-[85vh] overflow-y-auto` and switch from `grid` to `flex flex-col` |

