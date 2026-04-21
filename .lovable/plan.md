

# Bauhaus Geometric Pattern for Auth Left Panel

## Overview

Replace the current `dither-bg` halftone dot pattern on the Login/Sign Up left panel with a layered, Bauhaus-style geometric composition (circles, semicircles, triangles, striped rectangles, dot grids) rendered in the existing red-to-pink palette. The pattern clusters on the right edge of the left panel, leaving the upper-left area clean for the Helo.ai branding and feature list.

## Reference Interpretation

Source image traits to translate:
- Solid filled shapes: full circles, half-circles, quarter-circles, triangles, rectangles
- Striped/lined fills inside shapes (horizontal, vertical, diagonal/chevron)
- Two scattered dot grids (one upper-left, one lower-center) acting as texture
- Single thin horizontal accent line
- Clean cream background on the left, dense composition on the right

Color remap (greens/yellows/orange → existing brand palette):
- `#EF1645` (brand red) — primary solid fills
- `#a80000` / `#420000` (deep maroon) — dark accent shapes
- `#FFDFDF` (existing pink) — light fills / current background
- `#FFB8C5` (mid pink) — secondary fills
- `#F8C8C8` (warm beige equivalent of cream) — neutral block fills

## Changes

### 1. New `.geometric-bg` utility in `src/index.css`

Add a new background utility (keep `.dither-bg` available as fallback). Build the composition with **layered SVG `data:` URIs** in `background-image` so it stays a pure CSS class — no new component, no asset files.

Layers, top-to-bottom:
1. **Right-cluster SVG**: a single SVG containing the dense Bauhaus shape arrangement (circles, semicircles, striped rectangles, triangles, quarter-arcs) sized to roughly the right 55% of the panel. `background-position: right top`, `background-size: auto 100%`, `no-repeat`.
2. **Upper-left dot grid**: small radial-gradient dots in deep red at low opacity, ~12px tile, masked to the top-left ~30% via `background-size` + `background-position`.
3. **Lower-center dot grid**: same dots, denser, positioned bottom-center.
4. **Thin horizontal accent line**: linear-gradient strip in `#EF1645` at ~45% from top.
5. **Base color**: `#FFF5F5` (cream-pink) base, slightly warmer than current `#FFDFDF` so shapes pop.

The SVG itself (inline, URL-encoded) contains roughly 18–24 shapes:
- 3 large solid circles in `#EF1645`, `#a80000`, `#FFB8C5`
- 2 half-circles
- 2 quarter-arcs hugging panel edges
- 3 striped rectangles (horizontal stripes, vertical stripes, chevron) using `<pattern>` elements
- 2 solid triangles
- 1 small white dot accent (matches the white dot in the reference)
- Several small filled circles as "punctuation"

### 2. Update `src/components/AuthLayout.tsx`

- Swap `dither-bg` → `geometric-bg` on both the desktop left panel (line 15) and the mobile header (line 52).
- Mobile header gets a compressed variant via an extra modifier class `geometric-bg--compact` that scales the SVG down so a strip of pattern still reads on a short header.
- Keep all branding text, icons, and theme toggle untouched. Ensure text contrast remains readable on the cream base by leaving the upper-left clear of dense shapes (the SVG cluster is anchored to `right top`).

### 3. No changes to

- Color tokens in `index.css` `:root`
- Dark theme
- Login / Sign Up form panels (right side)
- Any other component

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add `.geometric-bg` utility (and `.geometric-bg--compact` modifier) with layered SVG + radial-gradient + linear-gradient backgrounds in the red/pink palette |
| `src/components/AuthLayout.tsx` | Replace `dither-bg` class with `geometric-bg` on desktop panel; use `geometric-bg geometric-bg--compact` on the mobile header |

## Visual Result

```text
┌──────────────────────────────┬───────────────┐
│ Helo.ai                      │               │
│ Developer Console            │               │
│                              │   ◐ ▦ ▲ ●     │
│ ····                         │  ● ▥ ◑ ▦      │
│                              │   ▲ ● ◐ ▥     │
│ Secure access...             │  ◑ ▦ ● ▲      │
│ • 256-bit TLS                │               │
│ • SOC 2 Type II              │               │
│ • 99.99% uptime         ────────              │
│                         · · · · · ·          │
│ [☾]                          │               │
└──────────────────────────────┴───────────────┘
   ↑ branding stays readable     ↑ dense Bauhaus cluster
```

