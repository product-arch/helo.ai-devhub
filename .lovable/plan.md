

# Improve API Credentials Page

## Overview

Transform the current simple key-display page into a structured, 5-section enterprise credentials interface with identity metadata, deterministic scope visualization, operational metrics, credential audit trail, and multi-channel usage examples.

---

## Section 1: Credential Overview (Top Section)

Replace the current single "App-Level API Key" card with a richer identity card.

**New fields displayed as a metadata grid (2-column layout):**

| Field | Source | Display |
|---|---|---|
| Key ID | Derived from `app.id` (e.g., `key_prod_001`) | Read-only monospace text with copy button |
| Environment | `app.environment` | Badge: Production = amber, Staging = blue |
| Status | New local state, default "Active" | StatusBadge: Active (green) / Suspended (amber) / Revoked (red) |
| Created | Mocked static date (e.g., "Jan 15, 2026") | Read-only text |
| Created by | `app.email` | Read-only text |
| Last used | Mocked (e.g., "2 hours ago") | Read-only text |

**API Key row** (below metadata):
- Masked by default, reveal/copy buttons (same as current)
- When revealed, show a small amber warning: "Key is visible. Hide when done."

**Action buttons:**
- Rotate Key (existing AlertDialog)
- Revoke Key (existing AlertDialog)
- **Suspend Key** (new) -- toggles status to "Suspended" with confirmation dialog. Suspended state shows an amber banner at top of page: "This API key is suspended. API calls will be rejected."

Production environment cards get a subtle left border accent (`border-l-4 border-l-amber-500`).

---

## Section 2: Effective API Scope

Replace the current warning-card scope list with a structured, per-product breakdown.

**Header:** "Effective API Scope" with explanatory subtext: "API access is enforced by enabled products and messaging capabilities within this App."

**Layout:** One collapsible card per product (SMS, RCS, WhatsApp, Webhooks). Each shows:
- Product name + overall product status badge
- Expandable capability list using `Collapsible` component
- Each capability row shows:
  - Icon: CheckCircle2 (green) for enabled, XCircle (muted) for disabled, AlertTriangle (amber) for restricted
  - Capability name
  - Status badge

Products with all capabilities disabled show a single "No capabilities enabled" muted message instead of listing each one.

---

## Section 3: Key Usage and Operational Metrics

New "Usage" card with mocked operational data displayed as clean data rows (no charts).

**Data rows (label : value pairs):**
- Requests (24h): `12,847`
- Error rate: `0.3%`
- Current rate limit: `1,000 RPM`
- Top endpoint: `POST /v1/sms/send`

**Recent API Errors sub-section:**
A small table (5 rows) showing:
| Timestamp | Endpoint | Status | Error |
|---|---|---|---|
| Feb 20, 14:32 | /v1/sms/send | 429 | Rate limit exceeded |
| Feb 20, 14:10 | /v1/wa/template | 403 | Capability not enabled |
| ... | ... | ... | ... |

Mocked with 5 hardcoded entries.

---

## Section 4: Credential Audit Trail

New "Audit Activity" card with an immutable-styled log table.

**Header badge:** "Immutable log -- entries cannot be modified or deleted" with a Lock icon.

**Table columns:** Timestamp | Actor | Action | Previous State | New State

**Mocked entries (6 rows):**
- Key created, key rotated, key suspended, key reactivated, IP change, key rotated again
- All with timestamps, actor emails, and state transitions

Striped rows, no action buttons. Read-only presentation.

---

## Section 5: Usage Example (Multi-Channel)

Replace the current static SMS curl example with a channel-selectable example.

**Channel selector:** Tabs component with SMS | RCS | WhatsApp | Webhooks tabs.

**For each channel:**
- If the product has enabled capabilities: show the relevant `curl` example using the current API key (masked) and environment-appropriate base URL
- If the product is disabled or has no enabled capabilities: show a muted explanation box instead of code:
  - "WhatsApp Template Messaging is not enabled for this App. Enable it in Product Settings to use this API."

**Example templates:**
- SMS: `POST /v1/sms/send` (current example)
- RCS: `POST /v1/rcs/send` with rich card payload
- WhatsApp: `POST /v1/wa/template/send` with template payload
- Webhooks: `POST /v1/webhooks/subscribe` with event subscription payload

---

## State Management

All new state is local to `Credentials.tsx`:

```ts
const [keyStatus, setKeyStatus] = useState<"active" | "suspended" | "revoked">("active");
const [selectedChannel, setSelectedChannel] = useState("sms");
```

Existing `rotateApiKey` from AppContext is reused. No context changes needed.

---

## Files to Modify

| File | Action |
|---|---|
| `src/pages/Credentials.tsx` | Full replacement with all 5 sections |

No other files need changes.

---

## Implementation Notes

- Remove `max-w-2xl` constraint to allow full-width content
- Use existing `StatusBadge`, `Card`, `Button`, `AlertDialog`, `Tabs`, `Collapsible`, `Table` components
- Import `CheckCircle2`, `XCircle`, `AlertTriangle`, `Lock`, `Pause`, `Shield` from lucide-react
- All mocked data is hardcoded constants defined at the top of the file
- Section cards use `mb-8` spacing for clear visual separation
- The page title remains "API Credentials" with the same breadcrumb structure

