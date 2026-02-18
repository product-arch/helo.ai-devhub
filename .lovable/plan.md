
# Test Button — Subscribed-Only + JSON Payload Modal

## Summary of Changes

Two targeted changes to `src/pages/Webhooks.tsx`:

1. **Hide/show the Test button** based on subscription state — only render it when the event is subscribed
2. **Replace the current toast-only test handler** with a modal that shows a dummy JSON payload for the selected event, with a "Send Payload" button in the bottom-right corner

No new files are needed — the Dialog component already exists in the project (`src/components/ui/dialog.tsx`).

---

## Change 1: Test Button Visibility

Currently the Test button is always rendered (just disabled while sending). The new behavior:

- If `isSubscribed === false`: the Test button is not rendered at all (no ghost placeholder, no disabled button — it simply disappears)
- If `isSubscribed === true`: the Test button renders normally as it does today
- This makes the UI much cleaner for unsubscribed events — the row just shows the name, description, status badge, and toggle

---

## Change 2: Payload Modal

Instead of clicking "Test" → 1.5s spinner → toast, the new flow is:

1. User clicks **Test** on a subscribed event
2. A **Dialog modal** opens immediately showing:
   - **Header**: "Test Webhook Event" with the event name as a `code` chip subtitle
   - **Body**: A formatted JSON payload block for that specific event type, with a **Copy** button in the top-right of the code block
   - **Footer**: 
     - Left: small muted text "This payload will be sent to your configured endpoint"
     - Right: **"Send Payload"** button (primary) — clicking it closes the modal, runs a 1.5s loading state on the button (in the modal footer area), then fires the success toast

### State additions needed:

```
const [testModalEvent, setTestModalEvent] = useState<string | null>(null);
const [isSendingPayload, setIsSendingPayload] = useState(false);
```

- `testModalEvent`: holds the `eventId` of whichever event's modal is open, or `null` when closed
- `isSendingPayload`: tracks whether the "Send Payload" button is in loading state

The existing `testingEvents` Record state can be removed since it was only used for the spinner on the inline button.

---

## Dummy JSON Payloads

Each event type gets a realistic but dummy JSON payload. A `getPayloadForEvent(eventId)` helper function maps event IDs to their payloads. Examples:

**`messages`**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number": "15550001234", "phone_number_id": "PHONE_NUMBER_ID" },
        "contacts": [{ "profile": { "name": "John Doe" }, "wa_id": "15551234567" }],
        "messages": [{
          "from": "15551234567",
          "id": "wamid.TEST123",
          "timestamp": "1700000000",
          "text": { "body": "Hello, world!" },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**`account_alerts`**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "alert_severity": "WARNING",
        "alert_type": "ACCOUNT_MESSAGING_LIMIT_REACHED",
        "entity_type": "PHONE_NUMBER",
        "entity_id": "PHONE_NUMBER_ID"
      },
      "field": "account_alerts"
    }]
  }]
}
```

All other events follow the same outer `{ object, entry[{ id, changes[{ value, field }] }] }` envelope with event-specific `value` contents.

---

## Modal Layout

```
┌──────────────────────────────────────────────────────────┐
│ Test Webhook Event                              [X close] │
│ Payload preview for `messages`                           │
├──────────────────────────────────────────────────────────┤
│                                         [Copy]           │
│ {                                                        │
│   "object": "whatsapp_business_account",                 │
│   "entry": [{ ... }]                                     │
│ }                                                        │
├──────────────────────────────────────────────────────────┤
│ This payload will be sent to your endpoint   [Send Payload ▶] │
└──────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Webhooks.tsx` | Add Dialog import, add `testModalEvent` + `isSendingPayload` state, add `getPayloadForEvent()` helper, update `handleTest` to open modal instead of spinner, conditionally render Test button only when subscribed, add Dialog JSX below the event cards |

---

## Implementation Steps

1. Add `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` to imports from `@/components/ui/dialog`
2. Remove `testingEvents` state, add `testModalEvent` and `isSendingPayload` state
3. Add `getPayloadForEvent(eventId: string): string` function that returns a JSON string for each of the 21 events
4. Change `handleTest(eventId)` to simply call `setTestModalEvent(eventId)` — no more setTimeout/toast at click
5. Add `handleSendPayload()` that closes modal, waits 1.5s (simulated), shows success toast
6. In the event row JSX: wrap the Test button in `{isSubscribed && ( ... )}` so it only renders when subscribed
7. Add the `<Dialog>` component at the bottom of the JSX (outside the card, inside the outer `div`) with the payload preview and Send Payload button
