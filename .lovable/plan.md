

# Refine App Card Design

## Problem
The current card layout is cramped — the icon, name, ID, description, environment badge, health status, role badge, and actions menu are all jammed together with inconsistent alignment.

## Refined Structure

Reorganize the card into clear visual zones with better spacing:

```text
┌──────────────────────────────────────────────┐
│  [Icon]   App Name              [⚠/✓] [···] │
│           app_id_here                        │
│           Description text...                │
│                                              │
│  [production]  [⊕ Admin]                     │
│                                              │
│  ─────────────────────────────────────────── │
│  3 of 4 products enabled          Healthy    │
└──────────────────────────────────────────────┘
```

### Changes (all in `src/pages/Apps.tsx`, lines 164-227)

1. **Top row**: Icon + app name on left, health icon + kebab menu on right — single horizontal line, cleanly aligned
2. **Body**: App ID, description below the top row with proper vertical spacing
3. **Badges row**: Environment badge and role badge side by side on their own line with `mt-3`
4. **Footer separator**: A subtle `border-t` divider before the bottom stats row
5. **Bottom stats row**: Product count left, health text right — with `pt-3 mt-3 border-t` for separation
6. **Card padding**: Use `CardHeader` area or increase `p-5` for breathing room
7. **Remove** the nested flex-col on the right side that stacks health icon and admin badge vertically — flatten the layout

### Design Tokens
- Card uses existing `shadow-block` from the Card component
- Maintain `hover:border-foreground/20 transition-colors cursor-pointer`
- Keep all semantic badge colors (`envColors`, warning admin badge)
- Monospace ID styling preserved

