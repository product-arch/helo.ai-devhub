
# Webhook URL Test Button + Gated Event Subscriptions

## Overview

Two connected changes to `src/pages/Webhooks.tsx`:

1. **"Test Endpoint" button** next to the URL input — simulates a ping to the configured URL and shows a pass/fail result inline
2. **Gate the Event Subscriptions card** — the card is hidden (or shown with a locked overlay) until the endpoint has been successfully tested at least once in the current session

---

## Change 1: Test Endpoint Button

### Placement
The Endpoint URL row currently has:
```
[ Input field ]  [ Save button ]
```
It becomes:
```
[ Input field ]  [ Test Endpoint button ]  [ Save button ]
```

The "Test Endpoint" button sits between the input and Save.

### States & behavior

| State | Button appearance | Result area |
|---|---|---|
| Idle (no URL) | Disabled, outline | — |
| Idle (URL present) | Active, outline, "Test Endpoint" with a `FlaskConical` icon | — |
| Testing | Disabled, spinner, "Testing…" | — |
| Success | Green outline, checkmark, "Endpoint Verified" | Inline green success strip below input row |
| Failed | Red outline, X icon, "Test Failed" | Inline red error strip below input row |

### Result strip (below the input row)
A small inline banner that appears after the test completes:

**Success:**
```
✅  Endpoint responded with HTTP 200 in 142ms     [×]
```

**Failure:**
```
❌  No response received — check your URL and try again    [×]
```

The strip has a dismiss button and auto-clears when the URL field is edited.

### Simulation logic
Since this is a frontend-only mock:
- When "Test Endpoint" is clicked → `isTestingUrl = true` for 1.8s
- After delay: 80% chance of success (HTTP 200, random latency 80–300ms), 20% failure
- Result stored in `urlTestStatus: "idle" | "success" | "failed"`

New state additions:
```
const [isTestingUrl, setIsTestingUrl] = useState(false);
const [urlTestStatus, setUrlTestStatus] = useState<"idle" | "success" | "failed">("idle");
const [urlTestLatency, setUrlTestLatency] = useState<number | null>(null);
```

When the URL input changes → reset `urlTestStatus` to `"idle"` and clear the result strip.

---

## Change 2: Gate Event Subscriptions on Successful Test

### Logic
A derived boolean:
```
const endpointVerified = urlTestStatus === "success";
```

### When NOT verified
The **Webhook Event Subscriptions** card renders with:
- A subtle lock overlay on the accordion content area
- A centered message inside the card body:

```
┌─────────────────────────────────────────────────────┐
│ Webhook Event Subscriptions           [0 subscribed] │
│ Subscribe to events your endpoint will receive...    │
├─────────────────────────────────────────────────────┤
│                                                      │
│          🔒  Test your endpoint first                │
│     Verify your endpoint URL above before            │
│     configuring event subscriptions.                 │
│                                                      │
│            [ Test Endpoint → ]                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

The CTA button inside the card scrolls the page up to the URL input and focuses it.

### When verified
The accordion renders normally, exactly as it does today.

### Persistence
This is session-only — if the app already has a `webhookUrl` saved (like the Production App), the gate still requires an active test in the current session. The pre-existing URL alone is not enough to unlock the list.

---

## Visual Layout (Endpoint URL section after changes)

```
Endpoint URL
[ https://api.example.com/webhooks/helo  ]  [ Test Endpoint ]  [ Save ]

  ✅  Endpoint responded with HTTP 200 in 142ms                    [×]
```

---

## Files to Modify

| File | Changes |
|---|---|
| `src/pages/Webhooks.tsx` | Add 3 new state variables, `handleTestUrl()` function, result strip JSX below input row, update Event Subscriptions card to conditionally show lock screen or accordion |

No new components or files needed — everything fits cleanly into the existing page.

---

## Implementation Steps

1. Add imports: `FlaskConical`, `XCircle`, `Lock` from `lucide-react`
2. Add state: `isTestingUrl`, `urlTestStatus`, `urlTestLatency`
3. Add `handleTestUrl()` — 1.8s mock delay, sets status and latency
4. In the URL `onChange` handler → reset `urlTestStatus` to `"idle"`
5. Add the Test Endpoint button between input and Save
6. Add the result strip below the input row, conditional on `urlTestStatus !== "idle"`
7. Wrap the `<Accordion>` in a conditional:
   - If `endpointVerified`: render accordion as-is
   - If not: render the lock placeholder with CTA
