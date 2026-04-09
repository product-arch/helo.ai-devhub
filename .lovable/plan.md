

# OLED True Black Dark Mode Theme

## Overview

Shift the dark theme from warm charcoal (7% lightness backgrounds) to pure/near-pure black with high-contrast text. Inspired by Linear and Vercel's dark modes — crisp, minimal, OLED-friendly.

## Changes

### 1. `src/index.css` — Update `.dark` CSS variables

Replace all dark theme HSL values:

| Token | Current | New | Rationale |
|-------|---------|-----|-----------|
| `--background` | `0 0% 7%` | `0 0% 0%` | Pure black base |
| `--foreground` | `0 0% 72%` | `0 0% 82%` | Brighter body text for contrast |
| `--card` | `0 0% 10%` | `0 0% 4%` | Near-black card surfaces |
| `--card-foreground` | `0 0% 72%` | `0 0% 82%` | Match foreground |
| `--popover` | `0 0% 10%` | `0 0% 4%` | Match card |
| `--popover-foreground` | `0 0% 72%` | `0 0% 82%` | Match foreground |
| `--primary` | `0 0% 88%` | `0 0% 95%` | Near-white primary text/buttons |
| `--primary-foreground` | `0 0% 4%` | `0 0% 0%` | Pure black on primary |
| `--secondary` | `0 0% 13%` | `0 0% 8%` | Darker secondary surface |
| `--secondary-foreground` | `0 0% 72%` | `0 0% 78%` | Slightly brighter |
| `--muted` | `0 0% 13%` | `0 0% 8%` | Darker muted surface |
| `--muted-foreground` | `0 0% 48%` | `0 0% 45%` | Subtle dimmed text |
| `--accent` | `0 0% 14%` | `0 0% 8%` | Darker accent surface |
| `--accent-foreground` | `0 0% 72%` | `0 0% 82%` | Brighter |
| `--border` | `0 0% 16%` | `0 0% 12%` | Subtler borders on black |
| `--input` | `0 0% 16%` | `0 0% 12%` | Match border |
| `--ring` | `0 0% 30%` | `0 0% 25%` | Subtler focus ring |
| `--sidebar-background` | `0 0% 9%` | `0 0% 0%` | Pure black sidebar |
| `--sidebar-foreground` | `0 0% 62%` | `0 0% 70%` | Brighter sidebar text |
| `--sidebar-accent` | `0 0% 12%` | `0 0% 8%` | Darker hover states |
| `--sidebar-accent-foreground` | `0 0% 72%` | `0 0% 85%` | High-contrast active items |
| `--sidebar-border` | `0 0% 16%` | `0 0% 10%` | Subtle sidebar borders |
| `--sidebar-ring` | `0 0% 30%` | `0 0% 20%` | Subtler ring |

Status/role/destructive colors stay unchanged — they already work well on dark backgrounds.

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Update all `.dark` CSS custom property values for OLED true black theme |

