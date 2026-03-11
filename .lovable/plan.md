

# PRD Implementation Plan — Developer Console Expansion

## Summary

The PRD defines several core modules. After comparing with the current codebase, here is what's already implemented vs. what needs to be built.

### Already Implemented (keep as-is)
- Authentication flows (Login, SignUp, MFA, Forgot Password, SSO)
- App creation, deletion, duplication, search
- App Overview dashboard with channel status, operational pulse, system activity
- Products page with setup flow and detail pages (SMS, RCS, WhatsApp API catalogs)
- Webhooks with endpoint testing, event subscriptions, retry config, test payloads
- Single API key management (rotate, suspend, revoke)
- Logs & Events with filtering, product health cards, event detail sheet
- Settings (8-section control plane with general, environment, credentials, security, compliance, usage, audit, danger zone)
- Users page (Admin, Developer, Viewer roles with invite and permissions modal)
- Design system, sidebar navigation, theming

### New Capabilities to Build

The implementation is split into 5 phases, each self-contained and buildable incrementally.

---

## Phase 1: Multi-Credential Support

The biggest gap. Currently there's one API key per app. The PRD requires multiple credentials of three types.

### Data Model Changes (`AppContext.tsx`)

Add new types:
```typescript
type CredentialType = "api_key" | "oauth2" | "service_account";
type CredentialStatus = "active" | "suspended" | "revoked" | "expired";

interface CredentialScope {
  product: string;       // e.g. "sms", "whatsapp"
  permissions: string[]; // e.g. ["sms.send", "sms.status"]
}

interface AppCredential {
  id: string;
  name: string;
  type: CredentialType;
  status: CredentialStatus;
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
  expiresAt: string | null;  // null = permanent
  scopes: CredentialScope[];

  // API Key specific
  apiKey?: string;

  // OAuth 2.0 specific
  clientId?: string;
  clientSecret?: string;
  grantTypes?: ("authorization_code" | "client_credentials")[];
  redirectUris?: string[];
  thirdPartyAppName?: string;

  // Service Account specific
  publicKey?: string;
  keyFormat?: string;
}
```

Add `credentials: AppCredential[]` to `HeloApp` interface. Generate a default API key credential on app creation. Add context methods: `createCredential`, `updateCredential`, `suspendCredential`, `revokeCredential`, `rotateCredential`, `deleteCredential`.

### New Page: Credentials List (`Credentials.tsx` refactor)

Transform the current single-key view into a multi-credential management page:

1. **Header** with "Create Credential" button
2. **Credential Cards List** — each card shows: name, type badge, status badge, created date, last used, expiry, scopes summary
3. **Card actions**: View details, rotate, suspend/reactivate, revoke
4. Clicking a card opens a **detail view** (reuses most of the current Credentials page sections)

### New Component: Create Credential Modal

A multi-step dialog:
- **Step 1**: Select type (API Key / OAuth 2.0 / Service Account)
- **Step 2**: Name, expiry (date picker or "permanent"), select scopes from enabled products
- **Step 3** (type-specific):
  - API Key: System generates key, displayed once with copy button and warning
  - OAuth 2.0: Select grant types, enter redirect URIs (if auth code), optional third-party app name. System generates Client ID + Client Secret
  - Service Account: Upload public key (file upload or paste), validate RSA/PEM format
- **Step 4**: Confirmation with summary

### Files Changed/Created
- `src/contexts/AppContext.tsx` — new types, credential CRUD methods, mock data
- `src/pages/Credentials.tsx` — refactored to list + detail view
- `src/components/CreateCredentialModal.tsx` — new multi-step creation dialog
- `src/components/CredentialCard.tsx` — new card component for list

---

## Phase 2: App Lifecycle & Settings Enhancements

### App Suspension (`AppContext.tsx` + `Apps.tsx` + `Settings.tsx`)

- Add `appStatus: "active" | "suspended" | "deleted"` to `HeloApp` (separate from `health`)
- Add `suspendApp(appId)` and `reactivateApp(appId)` to context
- In `Apps.tsx`: Show suspended badge on cards, add suspend/reactivate to dropdown menu
- In `Settings.tsx` Danger Zone: Add "Suspend App" action with confirmation
- Suspended apps show a persistent banner on all inner pages: "This app is suspended. All API calls are rejected."

### IP Whitelisting Enhancement (`Settings.tsx`)

Currently a text input. Enhance to:
- Tag-based input for individual IPs and CIDR ranges
- Validation of IP format
- "Any IP" default indication when empty
- Warning when removing all IPs from a populated list

### Test ↔ Live Mode Toggle (`Settings.tsx` + `AppContext.tsx`)

- Add `operationalMode: "test" | "live"` to `HeloApp`
- In Settings Environment section: Add a toggle with consent checks for test → live transition
- Show confirmation dialog listing requirements (KYC, email verification, etc.)
- Visual indicator on Overview and sidebar

### Files Changed
- `src/contexts/AppContext.tsx` — new fields and methods
- `src/pages/Apps.tsx` — suspend/reactivate in dropdown
- `src/pages/Settings.tsx` — enhanced IP input, test/live toggle, suspend in danger zone
- `src/pages/Overview.tsx` — show suspended banner, test/live badge
- `src/components/layout/AppSidebar.tsx` — suspended indicator

---

## Phase 3: Webhook Enhancements

### Multiple Named Webhooks

Currently one webhook endpoint per app. Expand to support multiple:

- Add `webhooks: WebhookEndpoint[]` to `HeloApp`:
```typescript
interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  product: string;        // scoped to one product
  status: "active" | "suspended";
  retryCount: number;
  retryInterval: number;
  subscribedEvents: string[];
  createdBy: string;
  createdAt: string;
  verified: boolean;
}
```

- Refactor `Webhooks.tsx` into a list + detail pattern:
  1. **List view**: Table of webhook endpoints with name, product badge, status, event count, URL
  2. **Create webhook**: Modal with name, product selection (dropdown of subscribed products), URL, test endpoint before save
  3. **Detail view**: Current webhook config UI (endpoint, secret, event subscriptions, retry config) scoped to that webhook

### Files Changed
- `src/contexts/AppContext.tsx` — new webhook types and CRUD
- `src/pages/Webhooks.tsx` — list + detail refactor
- `src/components/CreateWebhookModal.tsx` — new

---

## Phase 4: Enhanced Logs & Monitoring

### Log Categories

Split logs into four tabs/categories:

1. **API Activity Logs** — All API requests with credential ID, credential type, endpoint, HTTP method, response status, IP address, rate limit status
2. **Auth & Token Logs** — OAuth token issuance/exchange, JWT verification, failed auth attempts, token expiration/revocation
3. **Webhook Delivery Logs** — Per-webhook delivery attempts with webhook ID, event type, target URL, HTTP response, retry count, final status
4. **Governance & Audit Logs** — Configuration changes (app creation, product subscription, credential lifecycle, role changes, settings changes). Admin-only visibility.

### Monitoring Dashboard (new section at top of Logs page)

- API request volume over time (line chart using recharts — already installed)
- Error rate over time
- Authentication failure trends
- Rate limit violations
- Anomaly indicators (spikes, high failure rates)

### Files Changed
- `src/contexts/AppContext.tsx` — enhanced log event types with credential ID, IP, etc.
- `src/pages/Logs.tsx` — tabs for 4 log categories, monitoring charts
- Mock data generators for each log category

---

## Phase 5: RBAC Enforcement in UI

### Role-Based UI Gating

Currently roles exist but don't gate UI actions. Add enforcement:

- Add `currentUserRole: AppRole` to app context (mock as "admin" for current user)
- Create a `usePermission(action: string)` hook that checks role against a permission matrix
- Gate UI elements:
  - **Admin**: Full access (current behavior)
  - **Developer**: Hide credential delete, app suspend/delete, settings modification (IP, rate limits, timezone), role management, product subscription changes, user invites. Show read-only views.
  - **Viewer**: Everything read-only. Hide all create/edit/delete actions. Show credentials list without secrets.

### Permission Matrix Component

Enhance the existing roles modal in Users page with a detailed permission matrix table showing exactly what each role can/cannot do per module.

### Files Changed
- `src/contexts/AppContext.tsx` — add `currentUserRole`, permission matrix
- `src/hooks/usePermission.ts` — new hook
- All pages — wrap actions with permission checks (conditional rendering)

---

## Implementation Order

Each phase is independent and can be built sequentially:

1. **Phase 1** (Multi-Credentials) — largest change, core PRD requirement
2. **Phase 2** (App Lifecycle) — enhances existing Settings
3. **Phase 3** (Webhooks) — enhances existing Webhooks
4. **Phase 4** (Logs & Monitoring) — enhances existing Logs
5. **Phase 5** (RBAC) — cross-cutting, best done last

All existing UI, design language, spacing, and minimalistic approach will be preserved. New components follow the same patterns (Card-based layouts, StatusBadge, semantic color tokens, Inter font, shadcn/ui components).

