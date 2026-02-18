
# Webhooks Page Overhaul — Grouped Events with Enable/Disable and Test Actions

## What the PDF Shows

The document is a screenshot of the Meta for Developers WhatsApp Webhooks configuration panel. It reveals the full list of subscribable webhook event fields (from the "Field" column):

**WhatsApp Events extracted from the PDF:**
- `account_alerts`
- `account_review_update`
- `account_settings_update`
- `account_update`
- `automatic_events`
- `business_capability_update`
- `business_status_update`
- `calls`
- `flows`
- `group_lifecycle_update`
- `group_participants_update`
- `group_settings_update`
- `group_status_update`
- `history`
- `message_echoes`
- `message_template_components_update`
- `message_template_quality_update`
- *(plus additional events below the fold, assumed from Meta's documented full list)*: `messages`, `message_reactions`, `phone_number_name_update`, `phone_number_quality_update`

---

## What Changes

The current Webhooks page has a single flat list of 4 generic events. The new design:

1. **Replaces the flat event list** with a grouped, channel-organized catalog of all real WhatsApp webhook events from the PDF
2. **Each event row** has a clear subscribe/unsubscribe toggle and a separate "Test" button
3. **Events are grouped** into logical categories with a collapsible group header
4. **Delivery History** table stays intact at the bottom

---

## Event Groupings

Events are grouped into 5 logical sections:

### 1. Account & Business
- `account_alerts` — Account-level alerts and notifications
- `account_review_update` — Status changes from Meta account reviews
- `account_settings_update` — Account configuration changes
- `account_update` — General account-level updates
- `business_capability_update` — Changes to business-level capabilities
- `business_status_update` — Business account status changes

### 2. Messaging
- `messages` — Inbound and outbound message events (core event)
- `message_echoes` — Copies of messages sent by the app
- `message_reactions` — Message reaction events from recipients
- `calls` — Voice call events on WhatsApp

### 3. Message Templates
- `message_template_components_update` — Template component changes
- `message_template_quality_update` — Template quality rating changes

### 4. Groups
- `group_lifecycle_update` — Group created/modified/deleted events
- `group_participants_update` — Members added/removed from groups
- `group_settings_update` — Group setting changes
- `group_status_update` — Group status changes

### 5. Platform & Flows
- `automatic_events` — System-generated automatic events
- `flows` — WhatsApp Flows interaction events
- `history` — Message history sync events
- `phone_number_name_update` — Business display name changes
- `phone_number_quality_update` — Phone number quality rating changes

---

## New Event Row Design

Each event is a row within its group section. The row shows:

| Column | Content |
|--------|---------|
| Event name | `monospace` code chip (e.g. `messages`) |
| Description | Short plain-text explanation of what fires this event |
| Status | "Subscribed" green badge or "Unsubscribed" muted badge |
| Subscribe toggle | Switch component — checked = subscribed |
| Test button | Small "Test" button — clicking it fires a mock event and shows a success toast |

**Row states:**
- **Subscribed**: Toggle is ON, green "Subscribed" badge, Test button is enabled
- **Unsubscribed**: Toggle is OFF, muted badge, Test button is still clickable (to test without subscribing, matching Meta's UI pattern)

---

## New Data Structure

A new data constant `webhookEventGroups` is defined in `src/pages/Webhooks.tsx` (no separate file needed):

```text
WebhookEventField = {
  id: string              // snake_case event name e.g. "messages"
  name: string            // display name e.g. "messages"
  description: string     // one-line description
  subscribed: boolean     // runtime state — starts pre-seeded for some
}

WebhookEventGroup = {
  id: string              // e.g. "messaging"
  label: string           // e.g. "Messaging"
  description: string     // e.g. "Inbound and outbound message events"
  events: WebhookEventField[]
}
```

Pre-seeded subscribed state (matching the PDF): `account_alerts`, `account_update`, `flows`, `message_template_components_update`, `message_template_quality_update` start as subscribed. All others start as unsubscribed.

---

## Updated Page Layout

```text
┌─────────────────────────────────────────────────────┐
│ Webhook Configuration (existing — endpoint + secret) │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Webhook Event Subscriptions                          │
│ "Subscribe to events your endpoint will receive"    │
│                                                      │
│ ▼ Account & Business                [3 subscribed]  │
│   ┌────────────────────────────────────────────┐    │
│   │ account_alerts  │ desc  │ ● Subscribed │⚡Test│  │
│   │ [toggle ON]                                │    │
│   └────────────────────────────────────────────┘    │
│   ...                                               │
│                                                      │
│ ▼ Messaging                         [0 subscribed]  │
│   ...                                               │
│                                                      │
│ ▼ Message Templates                 [2 subscribed]  │
│   ...                                               │
│                                                      │
│ ▼ Groups                            [0 subscribed]  │
│   ...                                               │
│                                                      │
│ ▼ Platform & Flows                  [1 subscribed]  │
│   ...                                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Delivery History (existing table)                    │
└─────────────────────────────────────────────────────┘
```

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Webhooks.tsx` | Full overhaul: add `webhookEventGroups` data constant, replace the Accordion-based event list with a grouped toggle+test row layout using `useState` for per-event subscription state |

### State Management

Event subscription state is managed locally in the component with `useState`:
```text
const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>(
  // Initial state built from webhookEventGroups, pre-seeding the "already subscribed" ones
)
```

The "Test" button handler:
1. Shows a loading state on the button for 1.5 seconds
2. Fires a `toast` with: "Test event sent", description: "A test `{event.name}` payload was delivered to your endpoint"
3. No real network call — purely UI feedback

### Component Pattern

Each event row is rendered inline (no separate file needed — the component is simple enough):

```text
<div className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
  <code className="font-mono text-xs bg-muted px-2 py-1 rounded">event.name</code>
  <p className="flex-1 text-sm text-muted-foreground">event.description</p>
  <StatusBadge />
  <Switch checked={subscribed} onCheckedChange={toggle} />
  <Button size="sm" variant="outline" onClick={handleTest}>Test</Button>
</div>
```

Group headers use an `Accordion` pattern — each group is collapsible, open by default. The group header shows the group label and a count badge (e.g., "3 subscribed").

### Implementation Sequence

1. Define the full `webhookEventGroups` data structure inside `Webhooks.tsx` with all 21 events across 5 groups, seeded with initial subscription states from the PDF
2. Replace the existing `eventTypes` constant and the Accordion-based `Event Types` card with the new grouped event subscription UI
3. Add `useState` for subscriptions (Record of eventId → boolean)
4. Add `useState` for test loading state (Record of eventId → boolean)
5. Keep the Webhook Configuration card and Delivery History table unchanged
