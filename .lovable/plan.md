

# Enterprise API Credentials Overhaul

This is a large feature set. I recommend implementing it in 4 phases to keep changes manageable and testable. Here is the full plan.

---

## Phase 1 — Credential List Page Enhancements

### Files: `src/pages/Credentials.tsx`, `src/components/CredentialCard.tsx`

**List page additions:**
- Search bar filtering by credential name
- Filter dropdowns: Type (All / API Key / OAuth 2.0 / Service Account) and Status (All / Active / Suspended / Expired / Revoked)
- Summary line below title: "5 credentials · 3 Active · 1 Suspended · 1 Expired"
- Credential usage counter with progress bar: "14 of 20 credentials used"
- Expiry notification banners (amber for expiring within 30 days, red for already expired)
- Credential limit warning at 80%+ usage, disabling Create button at limit
- All copy scoped to "credentials in this App"

**Card redesign (`CredentialCard.tsx`):**
- Add expiry display: "Permanent" / "Expires in X days" (amber <30d) / "Expired" (red)
- Show scopes as monospace pill tags
- Conditionally show "Created by" for Admin role only (passed as prop)
- Updated 3-dot menu logic:
  - Rotate: hidden for Revoked/Expired
  - Suspend/Reactivate: contextual
  - View Audit Log: always shown
  - Revoke: shown for Active/Suspended/Expired, styled red
  - Delete: only shown when Revoked, styled grey

**Role-based visibility:**
- Admin sees all credentials with "Created by" field
- Developer sees only self-created credentials (filter in list page by `createdBy === currentUserEmail`)

---

## Phase 2 — Create Credential Modal Improvements

### File: `src/components/CreateCredentialModal.tsx`

**Step 1 — Type Selection:**
- Add "Most Common" tag to API Key card
- Improve card descriptions per spec

**Step 2 — Configure Details:**
- Name validation: 3-64 chars, duplicate name check (case-insensitive within app)
- Expiry: toggle Permanent vs Fixed Date with date picker pre-filled +90 days, must be future
- Scopes: grouped by product with "Select all" per group, inline error if none selected on Next
- Note about scopes tied to subscribed products

**Step 3 — Type-specific:**
- API Key: review/confirm summary screen
- OAuth 2.0: grant types, redirect URI validation (pills, max 10, HTTP only for localhost, no wildcards), access/refresh token lifetime inputs, third-party app name
- Service Account: drag-drop .pem upload or paste area, live validation checklist (valid PEM, RSA, min 2048-bit) — all must pass before Next

**Step 4 — Post-Creation Secret Reveal:**
- Non-dismissible modal (no outside click, no Escape)
- Green checkmark icon
- Type-specific secret display with individual copy buttons
- Notes: Client ID is permanent, Client Secret cannot be retrieved, Service Account uses JWT signing
- Amber full-width warning banner
- Checkbox "I have copied my credentials and stored them safely"
- Done button disabled until checkbox checked

---

## Phase 3 — Credential Detail Side Panel + Step-Up Auth

### New files: `src/components/CredentialDetailPanel.tsx`, `src/components/StepUpAuthModal.tsx`

**Side Panel (`CredentialDetailPanel.tsx`):**
- Slides in from right as a Sheet overlay on card click (replaces current full-page detail view)
- Editable credential name (inline)
- Credential ID (monospace, copy), Type, Status badge, Created by, dates, expiry
- Full scope list grouped by product as pill tags
- OAuth details: Client ID (copyable), grant types, redirect URIs, token lifetimes, app name
- Service Account: public key fingerprint, upload date, "Replace Public Key" button with invalidation warning
- Status History Timeline: vertical timeline of state transitions with timestamps and actors
- Danger Zone section (red-tinted background): Suspend/Reactivate, Revoke, Delete buttons

**Step-Up Auth Modal (`StepUpAuthModal.tsx`):**
- Intercepts Rotate, Suspend, Revoke, Delete, Replace Public Key
- Password input with inline error on failure
- Only on success does the actual action proceed

**Action Modals (enhance existing AlertDialogs):**
- Rotate: grace period selector (Immediate / 15-min / Custom up to 24h), shows new secret after
- Suspend: confirmation with 403 warning
- Reactivate: confirmation
- Revoke: red heading, type-credential-name-to-confirm, disabled red button until match
- Delete: only for revoked credentials, simple confirm

---

## Phase 4 — Audit Log, Default Key, Loading States

### New file: `src/components/AuditLogDrawer.tsx`

**Default Key on App Creation:**
- When app has zero credentials on first load, auto-trigger non-dismissible modal showing generated default API key
- Checkbox + Done pattern matching post-creation flow
- After dismiss, "Default Key" appears as Active in list
- Update `AppContext` to generate a default credential on `createApp`

**Audit Log (`AuditLogDrawer.tsx`):**
- Accessible from card menu "View Audit Log" (filtered) or top-level tab (all credentials)
- Event entries: type badge (color-coded), credential name/ID, actor, timestamp (relative + absolute hover), IP, failure reason
- Filters: event type, date range, credential
- Export CSV/JSON buttons
- Retention notice, pagination (20/page)
- Uses mock data from existing `MOCK_AUDIT` pattern

**Loading & Transition States:**
- Spinner inside buttons during async actions
- Disable buttons during loading
- Panel slide-in 250ms ease-out
- Modal fade-in 150ms
- Status badge color transitions

---

## Context Changes (`src/contexts/AppContext.tsx`)

- Add `currentUserEmail` to state (derived from login)
- Generate default credential in `createApp`
- Add credential limit constant (20)

## Design Tokens

All existing design tokens preserved. Danger Zone uses `bg-destructive/5 border-destructive/20`. Monospace for all IDs/keys/scopes. Semantic badges follow existing `StatusBadge` patterns.

