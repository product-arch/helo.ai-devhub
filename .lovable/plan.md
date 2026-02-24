

# Canvas-Based Dither Effect for Auth Left Panel

## Overview

Replace the current CSS gradient-based `.dither-bg` with a real canvas-rendered dither effect that matches the reference image -- individual pixel dots with varying density forming organic blob shapes. The canvas renders behind the text content, randomizes dot positions on each load, and adapts colors when the theme changes.

## How It Works

A full-size HTML `<canvas>` element is placed behind the left panel content using absolute positioning. A generation algorithm creates organic blob shapes using layered Perlin-like noise (simplex approximation via sine combinations), then renders individual square dots at grid positions where the noise value exceeds a threshold. Dot density varies across the panel to create the characteristic dither gradient from dense (grey regions) to sparse (dark regions).

### Dot rendering logic

```text
For each grid cell (every 4px):
  1. Sample noise at (x, y) using layered sine functions
  2. Add edge bias (denser near edges/corners)
  3. If noise > threshold: draw a 2-3px dot
  4. Dot color: grey tone varying with noise intensity
```

This produces the exact look from the reference -- clusters of grey/white dots forming organic shapes on a black background, with clear black areas in between.

### Theme adaptation

- **Dark mode**: Black background (#0a0a0a), grey/white dots (matching reference)
- **Light mode**: White/light grey background, dark grey/charcoal dots (inverted scheme)

The component reads the current theme from `useTheme()` and re-renders the canvas when the theme changes.

## File Changes

### 1. `src/components/DitherCanvas.tsx` -- NEW

A React component that:
- Uses a `<canvas>` element sized to fill its parent container
- On mount and theme change, generates randomized dither dots using noise functions
- Uses `ResizeObserver` to adapt to container size changes
- Accepts `theme` prop to switch color palette
- Renders with `position: absolute; inset: 0` so it sits behind content

Key implementation details:
- Grid spacing: ~4px between potential dot positions
- Dot size: 2-3px squares
- Noise: combination of sine waves at different frequencies to create organic blobs
- Random seed changes on each mount for unique patterns
- Performance: renders once on mount/resize/theme-change, not continuously

### 2. `src/components/AuthLayout.tsx` -- Update left panel

- Import and render `DitherCanvas` inside both the desktop left panel and mobile header
- Remove the `dither-bg` CSS class from these elements
- Use `relative` positioning on the panel container so the canvas fills it via absolute positioning
- Text content gets `relative z-10` to stay above the canvas

### 3. `src/index.css` -- Remove `.dither-bg` class

Remove the `.dither-bg` CSS class since it's fully replaced by the canvas approach.

## Text Visibility

The canvas renders only in the background layer. All text elements (branding, tagline, security indicators) are positioned with `relative z-10` so they sit above the canvas. The dither dots use muted grey tones (never pure white at full opacity) so even where dots overlap with text areas, readability is maintained. The darkest regions of the dither (where text content lives -- center area) will have intentionally lower dot density.

## Visual Result

The left panel will display an authentic dithered halftone pattern with:
- Randomized dot positions that change on each page load
- Dense grey dot clusters near edges forming organic blob shapes
- Sparse/empty black areas in the center (where text lives)
- Smooth theme transitions between dark and light color schemes
- Pixel-perfect match to the reference image aesthetic

