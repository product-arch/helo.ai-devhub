

# Dithered Background for Auth Left Panel

## Overview

Replace the flat `bg-gray-950` background on the left panel of the Login and Sign Up pages with a CSS-based dithered pattern using black and grey gradients. The effect will mimic the retro halftone/dither aesthetic from the reference image while keeping all text content readable.

## Approach

Create the dither effect using pure CSS -- layered radial gradients with small dot patterns at varying sizes and opacities, combined with a dark base. No images or canvas needed.

## File Changes

### 1. `src/index.css` -- Add dither utility class

Add a `.dither-bg` utility class that layers multiple tiny radial-gradient dot patterns at different scales and opacities to simulate a dithered texture:

```css
.dither-bg {
  background-color: #0a0a0a;
  background-image:
    radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px),
    radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
    radial-gradient(circle, rgba(255,255,255,0.09) 1px, transparent 1px),
    radial-gradient(ellipse at 30% 40%, rgba(120,120,120,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(80,80,80,0.12) 0%, transparent 50%);
  background-size:
    4px 4px,
    6px 6px,
    3px 3px,
    100% 100%,
    100% 100%;
  background-position:
    0 0,
    2px 2px,
    1px 1px,
    0 0,
    0 0;
}
```

The small dot layers (3-6px) create the halftone dither texture. The large elliptical gradients add subtle grey "cloud" shapes similar to the organic blobs in the reference. The base color stays very dark (`#0a0a0a`) so white text remains highly readable.

### 2. `src/components/AuthLayout.tsx` -- Apply dither class to left panel

Replace `bg-gray-950` on the desktop left panel div with `dither-bg`. The mobile header gets the same treatment.

- Desktop panel: change `bg-gray-950` to `dither-bg`
- Mobile header: change `bg-gray-950` to `dither-bg`

All text remains white/grey as-is -- the dither is subtle enough to preserve full readability of the branding, tagline, and security indicators.

## Visual Result

The left panel will show a dark background with a fine-grained dot texture and subtle grey gradient blobs, creating depth and visual interest while maintaining the security-first, infrastructure aesthetic. Text contrast stays high since the pattern uses very low-opacity white/grey dots on a near-black base.

