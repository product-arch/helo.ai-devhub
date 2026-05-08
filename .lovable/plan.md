
# SMS Messaging — Quick Start & Production Config

Replace the current generic SMS product detail (rendered by `src/pages/ProductDetail.tsx` via `productConfigs.sms`) with a dedicated, two-layer page modeled after the WhatsApp Playground but tuned to the **"send a test SMS in under 60 seconds"** north star.

## North star

A developer landing on `/apps/:appId/products/sms` can send a real (simulated) SMS within 60 seconds with zero navigation. Quick Start (Layer 1) is always above the fold; Production Config (Layer 2) is collapsed by default.

## Routing & integration

- `ProductDetail.tsx`: when `productId === "sms"`, render new `<SmsDetailPage />` inside `DashboardLayout` with the existing `PageHeader` (breadcrumb: Apps › [App] › SMS Messaging, status badge "Active", subheading, "View full API reference →" link).
- All other product routes untouched.

## File structure

New folder `src/components/sms/`:

```text
sms/
  SmsDetailPage.tsx          // page composition (header + Layer 1 + Layer 2)
  QuickStart/
    QuickStartPanel.tsx      // 3-step stepper container, persists step state
    StepCredentials.tsx      // Step 1 — masked key/secret, reveal, copy
    StepSandboxSender.tsx    // Step 2 — auto-provision sandbox sender
    StepSendTest.tsx         // Step 3 — send + DLR poller + code tabs
    DlrStatusTimeline.tsx    // Queued → Sent → Delivered visual
    CodeSnippetTabs.tsx      // curl | Node | Python | PHP, prefilled
    Confetti.tsx             // tiny canvas/CSS confetti on Delivered
  Production/
    ProductionConfig.tsx     // 4 collapsible sections (Accordion)
    SenderIdsSection.tsx     // table + Register modal (side Sheet)
    DltSection.tsx           // PE ID, headers, templates
    DlrSection.tsx           // toggle, webhook URL, test, sample payload
    SettingsSection.tsx      // encoding, unicode, long-msg, retries
  lib/
    smsSimulator.ts          // mock POST /v1/messages/sms + DLR transitions
    smsStorage.ts            // localStorage per-appId (wizard, sender ids,
                             // DLT, DLR, settings, sandbox sender)
    smsTypes.ts              // SmsMessage, SenderId, DltTemplate, etc.
    smsSnippets.ts           // generators for curl/node/python/php
    smsValidators.ts         // zod schemas (PE ID 19 digits, header 1-6
                             // alnum, phone E.164, etc.)
```

## Layer 1 — Quick Start Panel

Sticky-ish section at top, full width, single Card with horizontal stepper header `[1] Credentials → [2] Sender → [3] Send`. Steps 1 and 2 auto-complete on successful load (green check). Step 3 completes on first successful send. Wizard completion persisted to `localStorage` key `helo:sms:wizard:<appId>`.

### Step 1 — Credentials (inline)
- Sources from existing `AppContext` credentials for the App; if none, simulate one (`apiKey`, `apiSecret`).
- Two read-only fields (monospace): API Key (last 6 visible, rest `●`), API Secret (fully masked).
- Per-field "Reveal" eye toggle (state never persisted) and "Copy" button (uses `useToast`).
- Failure path: inline alert + "Retry" button; rest of page still renders.

### Step 2 — Sandbox Sender (auto-provisioned)
- On mount, read/create `helo:sms:sandbox:<appId>` → `{ senderId: "+1 415 555 0123", type: "sandbox", status: "ready" }`.
- Display chip `+1 (Sandbox) — For testing only` with green "Ready" badge and tooltip explaining shared sandbox / production registration.
- Failure path: inline error + Retry.

### Step 3 — Send Test Message (live tester)
- Fields: **To** (prefilled from a faux user profile phone if available, else placeholder `+91XXXXXXXXXX`), **Message** (prefilled "Hello from helo.ai! Your SMS integration is working. 🎉").
- Validation via zod (`+` E.164 to, message ≤ 1600 chars). Field-level errors inline.
- Primary CTA `Send Test Message` (loading "Sending…"). Calls `smsSimulator.sendSms()` → returns `{ messageId, status: "queued" }` after 250–650ms latency.
- DLR poller: `setInterval` 2s polling `smsSimulator.getStatus(messageId)` for ≤ 30s. Transitions Queued → Sent → Delivered with deterministic timing per messageId; small chance of `failed` with realistic error code (e.g. `21610 Unsubscribed recipient`). Cancelled on unmount and on terminal state.
- UI: success banner with messageId + copy; `<DlrStatusTimeline>` (3 dots, animated). On Delivered: `<Confetti>` + green "Your SMS integration is working. Ready to go to production →" link to Layer 2.
- Failure: red banner with exact code + message. "What went wrong?" expand reveals tip list keyed by error code.
- Below: collapsed "Show request" section with `<CodeSnippetTabs>` (curl | Node.js | Python | PHP), each prefilled with the user's API key + sandbox `from` + current `to`/`body`. "Copy" per tab.

## Layer 2 — Production Configuration

`<Accordion type="multiple">` (shadcn) with all items closed by default. Stored open-state NOT persisted (per spec).

### Sender IDs
- `<Table>` columns: Sender ID, Type, Country, Status, Actions. Status badge variants for Pending/Approved/Rejected/Active.
- `Register Sender ID` opens shadcn `<Sheet>` (side panel) with: searchable Country (`<Command>`), Type radios (Alphanumeric / Shortcode / Longcode / Toll-free), value input with type-specific zod validation. Submit → adds row with `Pending`.
- Empty state card: "No Sender IDs registered. Add one to go live." + CTA.

### DLT Configuration (India)
- Top alert banner (info/warning style): "Required for sending SMS to Indian mobile numbers…"
- PE ID input (19-digit numeric, validated), Telemarketer ID (optional).
- **Sender Headers** sub-table (Header, DLT status, Actions) + `Add Header` modal (1–6 alnum, uppercase enforced).
- **Message Templates** sub-table (Template ID, content truncated, Type, Status, Actions) + `Add Template` modal: textarea with live char count, Type radios (Transactional / Promotional / Service Implicit / Service Explicit), DLT Template ID input, Associated Header dropdown sourced from registered headers.

### Delivery Receipts
- Switch "Enable delivery receipts" (default ON).
- Webhook URL input + `Test Webhook` button → simulates a POST and shows inline JSON response panel (mock 200 with sample DLR).
- Read-only sample DLR JSON block + `Copy`.

### Settings
- Encoding radio (GSM-7 / UCS-2, default GSM-7).
- "Auto-detect Unicode" `<Switch>`.
- Long message handling radio (Concatenate / Truncate, default Concatenate).
- Max retries `<Select>` (0/1/2/3).
- All persisted to `helo:sms:settings:<appId>`.

## State, persistence, lifecycle

| Concern | Storage |
|---|---|
| Wizard step completion | `localStorage` per appId |
| Sandbox sender | `localStorage` per appId |
| Sender IDs / DLT / DLR / Settings | `localStorage` per appId |
| API key reveal | component state only, never persisted |
| DLR poller | `useEffect` cleanup cancels interval |

## Error handling rules

- Every async surface owns its own retry; failures never block siblings.
- All API errors render with **exact code + message** (from simulator); no generic "Something went wrong".
- DLR poll timeout (30s) → "Status unknown — check Logs & Events for delivery confirmation" with link to `/apps/:appId/logs`.
- Forms: zod + react-hook-form (already in deps), inline field errors, no toast on validation.

## Design system

- Reuse existing semantic tokens (no teal scope this time — SMS uses default brand red/primary).
- Components used: `Card`, `Accordion`, `Tabs`, `Table`, `Sheet`, `Dialog`, `Switch`, `RadioGroup`, `Select`, `Badge`, `Button`, `Input`, `Textarea`, `Tooltip`, `Alert`, `Command`. No new dependencies.
- Stepper uses existing visual conventions from WhatsApp `Stepper.tsx` (reuse component if signature fits; otherwise small SMS-local copy).

## Out of scope

Carrier routing, billing, shared sender pools, RBAC for sender management, analytics dashboard, other channels, edits to Products list page.

## Acceptance check (mapped)

1. Above-the-fold Quick Start with prefilled fields → ≤ 60s send. ✓
2. Credentials inline, copyable, masked. ✓
3. Sandbox sender auto-provisioned on mount. ✓
4. Send posts to (simulated) SMS API and renders the real returned payload. ✓
5. DLR poller drives Queued→Sent→Delivered live. ✓
6. Code tabs prefilled with actual creds + payload. ✓
7. DLT section prominent in Layer 2 (not under Settings). ✓
8. Errors show exact code + message. ✓
9. Wizard completion persisted per appId. ✓
10. All Layer 2 accordions collapsed on first load. ✓
