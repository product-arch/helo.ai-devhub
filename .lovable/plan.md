

# Sidebar Text Format Improvements

## What Changes

Based on the reference image, the sidebar navigation items should be organized into labeled groups with uppercase section headers, matching the grouped structure shown. The current flat list of nav items will be split into groups with section labels.

Mapping existing items to groups based on the reference:

**OVERVIEW** (uppercase label)
- Dashboard (currently "Overview") → keep as "Overview" since that's the existing route
- Products

**DEVELOPER** (uppercase label)
- API Credentials (maps to "Auth & API Keys")
- Webhooks
- Logs & Events (maps to "Logs")

**SETTINGS** (uppercase label)
- Settings (maps to "Configuration")
- Users (maps to "Users & Permissions")

## File Changes

### `src/components/layout/AppSidebar.tsx`

1. Replace the flat `navItems` array with grouped sections:
```typescript
const navGroups = [
  {
    label: "OVERVIEW",
    items: [
      { title: "Overview", url: `${prefix}/overview`, icon: LayoutDashboard },
      { title: "Products", url: `${prefix}/products`, icon: Box },
    ],
  },
  {
    label: "DEVELOPER",
    items: [
      { title: "API Credentials", url: `${prefix}/credentials`, icon: Key },
      { title: "Webhooks", url: `${prefix}/webhooks`, icon: Webhook },
      { title: "Logs & Events", url: `${prefix}/logs`, icon: ScrollText },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { title: "Settings", url: `${prefix}/settings`, icon: Settings },
      { title: "Users", url: `${prefix}/users`, icon: Users },
    ],
  },
];
```

2. Update the `<nav>` section to render groups with uppercase labels and spaced sections. Each group gets:
   - A small uppercase label in muted color (`text-[11px] font-semibold tracking-wider text-muted-foreground uppercase`)
   - Nav items beneath with slightly larger spacing between groups (`space-y-6` between groups, `space-y-1` within)

3. In collapsed mode, hide the group labels (same as hiding text today).

No other files changed. All routing, layout, auth pages, and previous implementations remain exactly as-is.

