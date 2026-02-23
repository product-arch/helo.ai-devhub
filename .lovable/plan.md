

# Apply Custom Box Shadow to Block Elements

## Overview

Add the specified box shadow to all card-like, rectangular block elements across the project for improved depth and visibility, using a custom Tailwind shadow utility defined once and applied consistently.

## Approach

Rather than manually editing every component file, the most maintainable approach is:

1. Define a custom `shadow-block` utility in `tailwind.config.ts`
2. Apply it to the base `Card` component (covers most block elements project-wide)
3. Apply it to remaining standalone block elements in page files (tables, panels, code blocks)

## Shadow Value

```
rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px
```

## Changes

### 1. `tailwind.config.ts` -- Add custom shadow

Add a `boxShadow` entry under `theme.extend`:

```
boxShadow: {
  block: "rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px",
}
```

### 2. `src/components/ui/card.tsx` -- Update Card component

Replace `shadow-sm` with `shadow-block` on the Card div. This automatically applies the shadow to every Card usage across all pages (Overview, Apps, Products, Settings, Credentials, etc.).

### 3. `src/pages/Users.tsx` -- Standalone tables

Add `shadow-block` to the two `rounded-lg border` table wrapper divs (users table and roles modal table).

### 4. `src/pages/Settings.tsx` -- Standalone panels

Add `shadow-block` to the bordered block elements: credentials panel (`bg-muted/40`), usage summary block, audit log table wrapper, and the revealed key warning block.

### 5. `src/pages/Webhooks.tsx` -- Table/status blocks

Add `shadow-block` to the URL test status block and any standalone bordered containers.

### 6. `src/pages/ProductDetail.tsx` -- Standalone blocks

Add `shadow-block` to bordered container elements for prerequisites and endpoint tables.

### 7. `src/pages/Logs.tsx` -- Log table wrapper

Add `shadow-block` to the log table container if it uses a standalone bordered div.

### 8. `src/components/ui/dialog.tsx` -- Dialog content

Replace `shadow-lg` with `shadow-block` on the DialogContent panel for consistency.

### 9. `src/pages/Login.tsx` -- Login card

Add `shadow-block` to the login form container if it's not already using the Card component.

## Files Modified

| File | Change |
|---|---|
| `tailwind.config.ts` | Add `boxShadow.block` custom utility |
| `src/components/ui/card.tsx` | `shadow-sm` to `shadow-block` |
| `src/pages/Users.tsx` | Add `shadow-block` to table wrappers |
| `src/pages/Settings.tsx` | Add `shadow-block` to panel blocks |
| `src/pages/Webhooks.tsx` | Add `shadow-block` to bordered containers |
| `src/pages/ProductDetail.tsx` | Add `shadow-block` to bordered containers |
| `src/pages/Logs.tsx` | Add `shadow-block` to table wrapper |
| `src/components/ui/dialog.tsx` | Update dialog shadow |
| `src/pages/Login.tsx` | Add `shadow-block` to login container |

