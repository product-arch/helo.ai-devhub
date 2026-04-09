

# Auth Background — Prominent Geometric Bubble Pattern

## Overview

Replace the current subtle, organic dither pattern with a more prominent, geometrically ordered arrangement of pixel-bubbles in `#EF1645`. The pattern will use repeating geometric grids of circles at multiple scales — creating an abstract but structured feel (think halftone dots meets geometric wallpaper).

## Changes: `src/index.css` — Replace `.dither-bg`

Replace the current gradient layers with a structured, multi-scale approach:

1. **Large bubble grid** — repeating `radial-gradient` circles (~12-16px diameter) on a ~80px grid, opacity ~0.12-0.15. Creates the dominant visual rhythm.
2. **Medium bubble grid** — repeating circles (~6-8px) on a ~40px grid, offset by half the large grid spacing to create a staggered/diamond pattern. Opacity ~0.10.
3. **Small pixel grid** — repeating tiny dots (~2px) on a ~12px grid at opacity ~0.06. Provides texture fill between larger bubbles.
4. **Accent liquid blobs** — 3-4 large soft elliptical gradients (kept from current) at slightly higher opacity (~0.15-0.20) to add organic depth behind the geometric grid.

All layers use `background-size` with specific tile dimensions and `background-position` offsets to create the staggered geometric arrangement. No images — pure CSS.

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Replace `.dither-bg` background-image layers with geometric repeating bubble grids |

