

# Incorporate Design Language from MDX Files

## What Changes

Add the typography CSS variables and font-weight tokens defined in the MDX design system to the project's `src/index.css`. This gives the codebase access to the standardized `--text-*` and `--font-weight-*` CSS variables for future use, while keeping the existing color palette, layout, spacing, and minimalistic aesthetic completely intact.

The MDX files will also be saved into the project as reference documentation.

## Why Not Change Colors

The MDX defines a blue primary color palette (`rgba(49, 134, 223, 1)`), which is fundamentally different from the current neutral/grey Vercel-inspired theme. Adopting it would break the "clean minimalistic approach" the user wants preserved. The existing semantic color system (`bg-primary`, `text-muted-foreground`, etc.) already follows the MDX's recommended pattern of using CSS variables -- just with different values. No color changes needed.

## File Changes

### 1. `src/index.css` -- Add typography CSS variables

Add to `:root` block:

```css
/* Typography scale */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 2.5rem;
--text-xl: 3rem;
--text-2xl: 3.5rem;
--text-caption: 0.75rem;
--text-badge: 0.875rem;

/* Font weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semi-bold: 600;
--font-weight-bold: 700;
```

These variables provide a standardized way to reference typography tokens in components, consistent with the MDX design language.

### 2. `src/docs/design-system-instructions.mdx` -- Save reference doc

Copy the uploaded MDX file into the project as developer documentation.

### 3. `src/docs/design-system-quick-reference.mdx` -- Save reference doc

Copy the uploaded quick-reference MDX file into the project as developer documentation.

## What Stays the Same

- All existing color tokens (dark/light mode palettes)
- All page layouts, component placements, and spacings
- Sidebar structure and navigation groups
- Auth pages (login, signup, MFA, forgot password, SSO)
- Dither background effect
- All existing components and routing

