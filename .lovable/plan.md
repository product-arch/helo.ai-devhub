
# App Settings — Full Redesign (CPaaS Enterprise Console)

## Overview

The current `Settings` page is minimal — just Account Name, Timezone, and a basic Danger Zone. This redesign replaces it entirely with an **8-section enterprise-grade settings module** that matches the CPaaS spec: channel-agnostic, security-forward, and governance-ready.

The page uses a **two-column layout**: a sticky left-side section navigation (within the settings page itself, not the app sidebar) and a main content area on the right. Each section is a distinct card group, clearly separated.

---

## Layout Architecture

```text
┌─ AppSidebar ──┬─────────────────────────────────────────────────────┐
│  Overview     │  ← breadcrumb: Apps / {App Name} / Settings          │
│  Products     │  App Settings                                         │
│  Credentials  │                                                       │
│  Webhooks     │  ┌── Left Nav ──┐  ┌──────── Section Content ──────┐ │
│  Logs         │  │ ● General    │  │  [General Card]               │ │
│  Settings ←   │  │   Environ..  │  │                               │ │
│  Users        │  │   API Cred.  │  │                               │ │
│               │  │   Security   │  │                               │ │
│               │  │   Compliance │  │                               │ │
│               │  │   Usage      │  │                               │ │
│               │  │   Audit      │  │                               │ │
│               │  │   Danger     │  │                               │ │
│               │  └─────────────┘  └───────────────────────────────┘ │
└───────────────┴─────────────────────────────────────────────────────┘
```

The left nav uses `scrollIntoView` anchor-based navigation with `id` attributes on each section. Active section is highlighted using an intersection observer or scroll event.

---

## Section-by-Section Design

### 1. General
Fields rendered in a single card:
- **App Name** — editable `Input`, saves on button click
- **App ID** — read-only `Input` with a copy-to-clipboard icon button
- **Environment** — read-only badge (`production` = amber, `staging` = blue, `development` = slate)
- **Description** — optional `Textarea`, editable
- **Created Date** — read-only text (mocked as app creation timestamp)
- **Owner** — read-only display (uses `accountName` from context)

Save button triggers `updateAccountName` and toast confirmation.

---

### 2. Environment & Mode
Card with toggle rows:

| Control | Type | Default |
|---|---|---|
| Message Execution | Switch | On |
| Maintenance Mode | Switch | Off |

- If `app.environment === "production"`, show a `Production` lock badge; sandbox is only for non-production
- Disabling Message Execution shows a yellow warning banner: "Outbound API calls will be blocked while execution is disabled"
- Each toggle includes a label, a sublabel description, and the switch right-aligned
- State is local (`useState`) — no backend in MVP

---

### 3. API Credentials
Replaces the existing `/credentials` page content shown inline here:

Displays:
- **Primary API Key** — masked by default (`helo_live_••••••••••••••••`), with a show/hide eye button
- **Created date** — mocked static
- **Last used** — mocked static (e.g., "2 hours ago")

Action buttons:
- **Rotate Key** — opens an `AlertDialog` with explicit warning: "This will immediately invalidate your current key. All integrations must be updated." Calls `rotateApiKey(appId)` on confirm.
- After rotation: shows the new key in full, one time, in a highlighted reveal box with a copy button and "Store this key securely. It will not be shown again." warning.

---

### 4. Security Controls
Card with status indicator in header (`Healthy` green chip or `Warning` amber chip based on rate limit usage):

Fields:
- **Rate Limit** — `Input` (number, RPM), editable, default `1000`
- **Message Throughput Cap** — `Input` (messages/sec), editable, default `100`
- **IP Allowlist** — `Textarea` placeholder "Enter IPs or CIDR blocks, one per line" — labeled "(Future-ready, optional)"
- **Enforce HTTPS-only** — read-only `Switch` locked to `on` with a lock icon and tooltip "Always enforced — cannot be disabled"

A mini progress bar shows rate limit usage (mocked at 34%).

---

### 5. Compliance & Data Governance
Card with compliance status chip:

Fields:
- **Data Retention Period** — `Select` with options: 7 days / 30 days / 90 days
- **Log Retention Policy** — `Select`: 7 days / 30 days / 90 days / 1 year
- **PII Masking** — `Switch`, on by default, with subtext "Masks phone numbers and identifiers in logs"
- **Data Deletion Callback URL** — `Input`, optional, placeholder `https://your-service.com/gdpr/delete`

Compliance status chip: green "Compliant" if PII masking on + retention < 90 days, else amber "Review Required".

---

### 6. Usage Controls
Card split into two areas:

**Current Usage** (read-only display row):
- Messaging Tier: `Professional`
- Current Throughput: `34 msg/s`
- Monthly Volume: `142,500 / 500,000`
- Mini progress bar for volume usage

**Controls**:
- **Daily Message Cap** — `Input` (optional), placeholder "Unlimited"
- **Alert Threshold** — `Slider` 50–100%, default 80%, shows current value label

---

### 7. Audit & Activity
Read-only log table with columns:

| Timestamp | Actor | Action | Previous | New Value |
|---|---|---|---|---|
| Feb 19, 14:32 | soumik@helo.ai | API Key Rotated | `helo_live_abc...` | `helo_live_xyz...` |
| Feb 19, 09:10 | soumik@helo.ai | Execution Enabled | Disabled | Enabled |
| Feb 18, 16:05 | admin@acme.com | App Name Updated | "Old Name" | "Production App" |

Mocked with 5–8 hardcoded entries. Table rows are striped, no actions. Badge above table: "Immutable log — entries cannot be modified or deleted." Small `Lock` icon.

---

### 8. Danger Zone
Card with `border-destructive/50` border, three distinct action rows separated by dividers:

| Action | Trigger | Confirmation |
|---|---|---|
| Disable App | Button "Disable App" | AlertDialog with typed confirmation: type "DISABLE" |
| Regenerate API Key | Button "Regenerate" | AlertDialog with standard confirm |
| Delete App | Button "Delete App" | AlertDialog with typed confirmation: type app name |

Delete App button is additionally disabled with tooltip if active products exist.

---

## State Management

All new state is **local to `Settings.tsx`** — no changes to `AppContext` except calling existing methods (`rotateApiKey`, `updateAccountName`).

New local state:

```ts
// Environment & Mode
const [executionEnabled, setExecutionEnabled] = useState(true);
const [maintenanceMode, setMaintenanceMode] = useState(false);

// API Credentials
const [keyVisible, setKeyVisible] = useState(false);
const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);

// Security
const [rateLimit, setRateLimit] = useState("1000");
const [throughputCap, setThroughputCap] = useState("100");
const [ipAllowlist, setIpAllowlist] = useState("");

// Compliance
const [dataRetention, setDataRetention] = useState("30");
const [logRetention, setLogRetention] = useState("90");
const [piiMasking, setPiiMasking] = useState(true);
const [deletionCallbackUrl, setDeletionCallbackUrl] = useState("");

// Usage
const [dailyCap, setDailyCap] = useState("");
const [alertThreshold, setAlertThreshold] = useState([80]);

// Left-nav active section
const [activeSection, setActiveSection] = useState("general");
```

---

## Left-Side Section Navigation

A sticky `nav` panel on the left with anchor links. Each item is a `button` that calls:

```ts
document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
setActiveSection(sectionId);
```

Active item is styled with `bg-muted text-foreground font-medium` and a left accent border.

Sections list:
1. General
2. Environment & Mode
3. API Credentials
4. Security Controls
5. Compliance & Data Governance
6. Usage Controls
7. Audit & Activity
8. Danger Zone (styled in `text-destructive`)

---

## Files to Modify

| File | Action |
|---|---|
| `src/pages/Settings.tsx` | Full replacement — all 8 sections, left-nav, new local state |

No other files need changes. The route, layout, breadcrumbs, and sidebar are already correct.

---

## Implementation Notes

- The existing `timezone` and `updateTimezone` from context are **removed** from Settings (timezone is an account-level concern, not an app-level concern per the spec). The General section instead shows App Name, App ID, Description, Environment, Created Date, Owner.
- The existing "Disable Products" section in Danger Zone is **removed** — per spec, product configuration belongs in Product Settings, not App Settings.
- All status indicator chips follow consistent sizing: `text-xs px-2 py-0.5 rounded-full border`.
- Section cards use consistent spacing: `mb-8` between cards.
- The left nav is `w-48 shrink-0 sticky top-8 self-start` — does not interfere with the app sidebar.
- The overall content wrapper changes from `max-w-2xl` to `flex gap-8 items-start`.
