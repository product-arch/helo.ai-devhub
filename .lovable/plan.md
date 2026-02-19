
# Logs & Events Page Overhaul

## Overview

Three improvements to `src/pages/Logs.tsx` and `src/contexts/AppContext.tsx`:

1. **Proper Event Type naming** — replace raw codes like `message.sent` with structured Group + Event Name display
2. **Split Event Type column** into two sub-columns: **Event Group** and **Event Name**
3. **More status chips** — add `retried`, `queued`, and `rate_limited` statuses to `StatusBadge` and mock data
4. **Product Health & Latency summary cards** — a block of metric cards at the top of the Logs page showing per-product health and p95 latency

---

## Change 1: Event Type — Proper Names & Bifurcated Columns

### Current state
- Raw `eventType` values from mock data: `message.sent`, `message.delivered`, `message.failed`, `webhook.triggered`, `config.updated`
- Displayed as a single `<code>` chip in one column

### New design (based on user's reference image)

The "Event Type" column becomes two separate columns:

| Event Group | Event Name |
|---|---|
| Message | Sent |
| Message | Delivered |
| Message | Failed |
| Webhook | Triggered |
| Configuration | Updated |

**Parsing logic**: A helper `parseEventType(eventType: string)` splits on `.` and maps each part to a proper display name:

```text
"message.sent"       → group: "Message",       name: "Sent"
"message.delivered"  → group: "Message",       name: "Delivered"  
"message.failed"     → group: "Message",       name: "Failed"
"webhook.triggered"  → group: "Webhook",       name: "Triggered"
"config.updated"     → group: "Configuration", name: "Updated"
```

The group uses a `capitalize`/label map, and the name is capitalized. Both render as styled chips — the group as a muted secondary chip and the name as a distinct primary code chip.

### Column layout change

The table goes from 5 columns to 6:

| Timestamp | Product | Event Group | Event Name | Status | Message |

---

## Change 2: Additional Status Chips

### New statuses to add

| Status key | Label | Color style |
|---|---|---|
| `retried` | Retried | Blue/info — `bg-blue-500/10 text-blue-600 border-blue-500/20` |
| `queued` | Queued | Purple — `bg-purple-500/10 text-purple-600 border-purple-500/20` |
| `rate_limited` | Rate Limited | Orange/amber — `bg-orange-500/10 text-orange-600 border-orange-500/20` |

### Files to update
- `src/components/StatusBadge.tsx` — extend `statusConfig` and `dotColor` with the 3 new statuses, and widen the type union
- `src/contexts/AppContext.tsx` — update `LogEvent.status` type to include the new statuses, and seed a few of them into `generateMockLogEvents()`

---

## Change 3: Product Health & Latency Cards

### New card block above the filter bar

A row of metric summary cards — one per configured product — showing:

```text
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│ 🟢 SMS Messaging   │  │ 🟡 RCS Messaging   │  │ 🔴 WhatsApp        │  │ 🟢 Webhooks        │
│ Active             │  │ Configured         │  │ Restricted         │  │ Active             │
│ p95 Latency        │  │ p95 Latency        │  │ p95 Latency        │  │ p95 Latency        │
│ 142ms              │  │ 287ms              │  │ N/A                │  │ 58ms               │
│ Success rate       │  │ Success rate       │  │ —                  │  │ Success rate       │
│ 98.4%              │  │ 95.1%              │  │                    │  │ 99.8%              │
└────────────────────┘  └────────────────────┘  └────────────────────┘  └────────────────────┘
```

Each card shows:
- **Product name** with product icon
- **Status badge** (existing `StatusBadge` component)
- **p95 Latency** — computed from the app's `logEvents` filtered to that product (mock: just a seeded constant per product since we don't have real timing data)
- **Success rate** — computed from `logEvents` for that product: `(success count / total count) * 100`

The latency values are seeded as a static map per product since mock log events don't carry timing data:
```text
SMS: 142ms, RCS: 287ms, WhatsApp: N/A (restricted), Webhooks: 58ms
```

Success rate is **computed live** from `app.logEvents` grouped by product.

### Visual design
- 4 cards in a horizontal grid (`grid-cols-2 md:grid-cols-4`)
- Each card: `rounded-lg border bg-card p-4`
- A colored left border accent matching the product status (green=active, yellow=configured/restricted, gray=disabled)
- Latency in large bold number, "ms" in smaller muted text
- Success rate with a subtle progress-bar indicator

---

## Filter Bar Enhancement

The "All Event Types" dropdown (currently showing raw codes) becomes "All Event Groups" with clean labels:
- All Event Groups
- Message
- Webhook  
- Configuration

A second filter for "All Event Names" can be added or the existing dropdown can be repurposed to filter by group cleanly.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AppContext.tsx` | Extend `LogEvent.status` type with `"retried" \| "queued" \| "rate_limited"`, seed a few of each in `generateMockLogEvents()` |
| `src/components/StatusBadge.tsx` | Add 3 new status configs + dot colors, widen the `StatusBadgeProps` type |
| `src/pages/Logs.tsx` | Add `parseEventType()` helper, split table into 6 columns (Event Group + Event Name), add health cards above the filter bar, update filter dropdown to use clean group labels |

---

## Technical Details

### parseEventType helper

```text
const GROUP_LABELS: Record<string, string> = {
  message: "Message",
  webhook: "Webhook",
  config: "Configuration",
};

const NAME_LABELS: Record<string, string> = {
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
  triggered: "Triggered",
  updated: "Updated",
};

function parseEventType(eventType: string): { group: string; name: string } {
  const [groupKey, nameKey] = eventType.split(".");
  return {
    group: GROUP_LABELS[groupKey] || capitalize(groupKey),
    name: NAME_LABELS[nameKey] || capitalize(nameKey ?? ""),
  };
}
```

### Product latency seed map

```text
const PRODUCT_LATENCY: Record<string, string> = {
  SMS: "142ms",
  RCS: "287ms",
  WhatsApp: "N/A",
  Webhooks: "58ms",
};
```

### Success rate computation

```text
const productSuccessRate = (productName: string) => {
  const events = app.logEvents.filter(e => e.product === productName);
  if (!events.length) return null;
  const successes = events.filter(e => e.status === "success").length;
  return ((successes / events.length) * 100).toFixed(1);
};
```

### Implementation order

1. Extend types and seed data in `AppContext.tsx`
2. Add new statuses to `StatusBadge.tsx`
3. Update `Logs.tsx`: add health cards → update filter logic → split Event Type column → update sheet detail view to also show the separated event group/name
