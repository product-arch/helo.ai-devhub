

# Brighten Dark Theme

## Overview

Lift the dark theme's base surfaces and text from near-black into warmer dark greys, improving readability and visual appeal while keeping the minimalistic, low-contrast aesthetic.

## Current vs. New Values

All changes are in `src/index.css` inside the `.dark` block.

| Variable | Current | New | Reasoning |
|---|---|---|---|
| `--background` | `0 0% 4%` | `0 0% 7%` | Base lifted from near-black to dark charcoal |
| `--foreground` | `0 0% 63%` | `0 0% 72%` | Body text brighter for readability |
| `--card` | `0 0% 6.5%` | `0 0% 10%` | Cards slightly lifted for better separation |
| `--card-foreground` | `0 0% 63%` | `0 0% 72%` | Match foreground lift |
| `--popover` | `0 0% 6.5%` | `0 0% 10%` | Match card surface |
| `--popover-foreground` | `0 0% 63%` | `0 0% 72%` | Match foreground lift |
| `--primary` | `0 0% 82%` | `0 0% 88%` | Headings and primary text slightly brighter |
| `--secondary` | `0 0% 9%` | `0 0% 13%` | Secondary surfaces more visible |
| `--secondary-foreground` | `0 0% 63%` | `0 0% 72%` | Match foreground lift |
| `--muted` | `0 0% 9%` | `0 0% 13%` | Muted backgrounds lifted |
| `--muted-foreground` | `0 0% 40%` | `0 0% 48%` | Subtle text more legible |
| `--accent` | `0 0% 10%` | `0 0% 14%` | Accent backgrounds lifted |
| `--accent-foreground` | `0 0% 63%` | `0 0% 72%` | Match foreground lift |
| `--border` | `0 0% 11%` | `0 0% 16%` | Borders more visible for structure |
| `--input` | `0 0% 11%` | `0 0% 16%` | Input borders match |
| `--ring` | `0 0% 25%` | `0 0% 30%` | Focus rings slightly brighter |
| `--sidebar-background` | `0 0% 5.5%` | `0 0% 9%` | Sidebar lifted alongside background |
| `--sidebar-foreground` | `0 0% 55%` | `0 0% 62%` | Sidebar text brighter |
| `--sidebar-accent` | `0 0% 8%` | `0 0% 12%` | Active nav items more visible |
| `--sidebar-accent-foreground` | `0 0% 63%` | `0 0% 72%` | Match foreground lift |
| `--sidebar-border` | `0 0% 11%` | `0 0% 16%` | Match border lift |

## Design Rationale

- Background moves from 4% to 7% lightness -- still firmly dark but no longer pitch-black
- All foreground text jumps ~9 points (63% to 72%), improving contrast without feeling bright
- Card and sidebar surfaces maintain a 3% offset from background for subtle layering
- Borders lift from 11% to 16% so dividers and input outlines are actually discernible
- Status colors (success, warning, destructive) remain unchanged to preserve semantic meaning

## File Modified

| File | Action |
|---|---|
| `src/index.css` | Update CSS custom property values inside `.dark` block (lines 56-97) |

