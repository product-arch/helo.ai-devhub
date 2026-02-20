

# Redesign Overview Page -- Operational Status Surface

## Overview

Replace the current Overview page (which displays credentials and product cards with setup buttons) with a pure read-only operational status interface. The page will have 5 distinct sections that communicate App health, blocking issues, channel readiness, system pulse, and recent activity -- without any configuration controls or credential display.

---

## Section 1: App Status Header (Top Summary Strip)

A compact horizontal strip below the page header showing four read-only status indicators side by side.

| Indicator | Source | Display |
|---|---|---|
| Environment | `app.environment` | Badge -- Production (amber), Staging (blue), Development (gray) |
| Execution Status | Derived from app state (default: "Enabled") | Badge -- Enabled (green), Disabled (red), Maintenance (amber) |
| App Health | `app.status` mapped: `healthy` = "Healthy" (green), `action_required` = "Warning" (amber) | StatusBadge with dot indicator |
| Active Products | Count from `app.products` where status is not "disabled" | Text: "3 of 4 active" |

Layout: Single row of 4 items inside a subtle `bg-muted/30` strip with rounded corners and padding. No card border -- just a horizontal bar.

For Production apps, add a left border accent (`border-l-4 border-l-amber-500`).

---

## Section 2: Blocking Issues (Conditional)

Only rendered if there are blocking issues detected from:
- Products with `blockingReason` set
- Products with `status === "restricted"`
- WhatsApp capabilities all restricted/disabled

Each issue row shows:
- An `AlertTriangle` icon (amber)
- Short description (e.g., "WhatsApp Messaging restricted -- Business verification pending")
- A "Resolve" text link that navigates to the relevant product page (`/apps/{appId}/products/{productId}`)

Wrapped in a subtle amber-tinted card (`bg-warning/5 border-warning/20`). Hidden entirely when no issues exist.

---

## Section 3: Channel Status Grid

Four cards in a responsive grid (`md:grid-cols-2 lg:grid-cols-4`), one per channel.

Each card displays:
- Channel icon + name (reusing existing `productIcons` map)
- Status badge (Active / Configured / Restricted / Disabled)
- Capability count: e.g., "3 of 4 enabled" -- computed from `product.capabilities`
- Identity presence: "Configured" or "Missing" -- derived from product status (active/configured = Configured, disabled = Missing)
- Last activity: Mocked timestamp (e.g., "2 hours ago", "No activity")

The entire card is clickable, navigating to `/apps/{appId}/products/{productId}`.

No setup buttons, no descriptions, no configuration controls.

---

## Section 4: Operational Pulse

A single card with a horizontal row of 4 metric items.

| Metric | Value (Mocked) | Links to |
|---|---|---|
| Messages sent (24h) | 12,847 | `/apps/{appId}/logs` |
| Failure rate | 0.3% | `/apps/{appId}/logs` |
| Webhook delivery rate | 98.7% | `/apps/{appId}/webhooks` |
| API requests (24h) | 34,219 | `/apps/{appId}/logs` |

Each metric shows: label (muted text, small), value (large font, semibold), and a subtle "View logs" or "View webhooks" link below.

Layout: 4-column grid inside a single card. No charts, no filters.

---

## Section 5: Recent System Activity

A compact table showing the last 10 system-level events.

**Table columns:** Timestamp | Event | Product | Status

**Mocked entries (10 rows) -- system-level only:**
- "SMS Messaging enabled"
- "API key rotated"
- "WhatsApp capability restricted"
- "Webhook delivery failures detected"
- "RCS Messaging configured"
- "Execution paused"
- "Two-Way SMS capability enabled"
- "Webhook URL updated"
- "API key rotated"
- "Execution resumed"

Each row shows a StatusBadge for the status column. Clicking any row navigates to `/apps/{appId}/logs`.

Card header includes "Recent System Activity" title and a "View all" link to the Logs page.

---

## State Management

No new state needed. Everything is derived from the existing `app` object in AppContext:
- Products and capabilities for channel status and blocking issues
- Environment and health status for the header strip
- Mocked constants for metrics and activity log (hardcoded at top of file)

---

## Technical Details

### File to Modify

| File | Action |
|---|---|
| `src/pages/Overview.tsx` | Full replacement with all 5 sections |

### Removed from Current Page
- Credentials section (App ID, App Secret, copy/reveal buttons)
- Product description text
- Setup / View Details buttons
- `showSecret`, `copiedField` state and clipboard logic

### Components Used
- `DashboardLayout`, `PageHeader` (existing)
- `StatusBadge` (existing)
- `Card`, `CardContent`, `CardHeader`, `CardTitle` (existing)
- `Badge` (existing)
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` (existing)
- `AlertTriangle`, `ArrowRight`, `Activity`, `MessageSquare`, `Smartphone`, `MessageCircle`, `Webhook` from lucide-react

### Layout Notes
- Status header strip uses `flex items-center gap-6` with `p-4 rounded-lg bg-muted/30`
- Channel cards use `cursor-pointer` with `onClick` navigation
- Operational pulse uses `grid grid-cols-2 lg:grid-cols-4 gap-6` inside a single card
- Activity table rows use `cursor-pointer hover:bg-muted/50` for click-to-navigate
- All sections separated with `mb-8` spacing

