

# Implement MDX Design System as Light Mode Theme

## Overview

Apply the MDX-specified blue-primary color palette to the light `:root` theme in `index.css`, create the referenced `src/styles/theme.css` file, and update the docs files. The dark OLED theme remains untouched.

## Changes

### 1. Update Light Mode Colors in `src/index.css`

Replace the `:root` CSS variables (lines 8-76) with HSL equivalents of the MDX-specified rgba values:

| Token | Current HSL | New HSL (from MDX rgba) |
|-------|------------|------------------------|
| `--primary` | `240 5.9% 10%` | `207 65% 53%` (rgba 49,134,223) |
| `--primary-foreground` | `0 0% 98%` | `0 0% 100%` |
| `--secondary` | `240 4.8% 95.9%` | `0 0% 100%` |
| `--secondary-foreground` | `240 5.9% 10%` | `200 15% 9%` (rgba 20,24,27) |
| `--background` | `0 0% 100%` | `0 0% 100%` (same) |
| `--foreground` | `240 10% 3.9%` | `200 15% 9%` (rgba 20,24,27) |
| `--muted` | `240 4.8% 95.9%` | `180 3% 95%` (rgba 242,243,243) |
| `--muted-foreground` | `240 3.8% 46.1%` | `200 5% 43%` (rgba 103,110,115) |
| `--accent` | `240 4.8% 95.9%` | `207 87% 97%` (rgba 240,248,254) |
| `--accent-foreground` | `240 5.9% 10%` | `207 65% 53%` (rgba 49,134,223) |
| `--destructive` | `0 84.2% 60.2%` | `350 80% 52%` (rgba 237,28,52) |
| `--border` | `240 5.9% 90%` | `200 3% 82%` (rgba 206,209,211) |
| `--input` | `240 5.9% 90%` | `0 0% 100%` (rgba 255,255,255) |
| `--ring` | `240 5.9% 10%` | `207 65% 53%` (rgba 49,134,223) |
| Sidebar tokens | current values | MDX-specified equivalents |

Also add `--input-background` variable and chart color variables (`--chart-1` through `--chart-5`) to `:root`.

### 2. Create `src/styles/theme.css`

Create this file as a reference/customization entry point containing all CSS variables with comments, as described in the MDX. This file will be imported by `index.css` or `main.tsx`. It serves as the user-editable theme file the MDX docs reference.

### 3. Update `src/docs/` Files

Replace `src/docs/design-system-instructions.mdx` and `src/docs/design-system-quick-reference.mdx` with the uploaded versions (content is identical, this is a no-op but ensures they stay in sync).

### 4. Add `input-background` to Tailwind Config

Add `input-background` color token to `tailwind.config.ts` so `bg-input-background` works as documented in the MDX.

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Update `:root` light-mode variables to match MDX color spec |
| `src/styles/theme.css` | New file -- design token reference with all CSS variables |
| `tailwind.config.ts` | Add `input-background` color token |
| `src/docs/design-system-instructions.mdx` | Sync with uploaded version |
| `src/docs/design-system-quick-reference.mdx` | Sync with uploaded version |

## What stays the same

- `.dark` theme block (OLED aesthetic preserved)
- All existing UI components
- Typography scale and font weight variables
- Status badge utilities
- Role color tokens

