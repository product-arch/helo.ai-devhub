

# Auth Left Panel — Pink Background with Liquid-Pixel-Bubble Pattern

## Overview

Replace the dark dither background on the auth left panel with a pink `#FFDFDF` base and a decorative CSS pattern in `#EF1645` that evokes liquid, pixel, and bubble motifs. Text colors must be updated for readability on a light pink background.

## Changes

### 1. `src/index.css` — Replace `.dither-bg` styles

Replace the current dark dither pattern with:
- Background color: `#FFDFDF`
- Layered CSS radial gradients in `#EF1645` at varying opacities to create:
  - **Bubble** effect: scattered circular radial gradients at different sizes (small, medium, large) with low opacity
  - **Pixel** effect: tiny repeating dot grid pattern (3-4px spacing) with very low opacity
  - **Liquid** effect: large, soft elliptical gradients with organic positioning to simulate fluid blobs

All purely CSS — no images or SVGs.

### 2. `src/components/AuthLayout.tsx` — Update text colors for light background

Since the background shifts from near-black to light pink, all text on the left panel and mobile header must change:
- `text-white` → `text-gray-900` (headings)
- `text-gray-400` / `text-gray-300` → `text-gray-600` / `text-gray-700` (body/labels)
- `text-gray-500` (icons) → `text-[#EF1645]/60` (tinted icons)
- Theme toggle button hover: `hover:bg-pink-200/50` instead of `hover:bg-gray-800`

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Replace `.dither-bg` with pink + red liquid/pixel/bubble pattern |
| `src/components/AuthLayout.tsx` | Update text/icon colors for light background readability |

