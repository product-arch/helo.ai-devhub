

# Refactor CreateCredentialModal — Enterprise-Grade 3-Step Flow

## Overview

Complete rewrite of `CreateCredentialModal.tsx` to consolidate the current confusing 4-step flow into a clean 3-step wizard with labeled stepper, environment toggle, expiry dropdown, scope presets, review summary, and `.env` download.

## Step Structure

```text
  [1. Identity] ── [2. Permissions] ── [3. Review & Create]
       ●                 ○                     ○
```

## Changes

### 1. Labeled Step Indicator
Replace the 3 plain colored bars with a proper horizontal stepper: numbered circles connected by lines, step label below each. Active step = primary color, completed = checkmark icon, future = muted. Rendered for steps 1–3; hidden after creation (reveal state).

### 2. Step 1 — Identity
Combine type selection + name + environment + expiry into one step:
- **Credential Name** (required, first field)
- **Type selector** (existing card UI, moved here from old step 1)
- **Environment toggle**: two buttons `[🟢 Live]` / `[🧪 Sandbox]`, with contextual badge (amber for live, blue for sandbox). Key prefix preview at bottom: `helo_live_••••••••••` or `helo_test_••••••••••`
- **Expiry dropdown** (`<Select>`): 30d / 60d / 90d (default) / 1 year / No expiry. Remove `isPermanent` boolean + Switch entirely. Compute `expiresAt` from selection.

### 3. Step 2 — Permissions
Move all scope config here. Remove `max-h-48` constraint — let modal scroll internally (up to 80vh).
- **Quick-select preset pills** at top: `[Full Access]` / `[Send Only]` / `[Read Only]` — auto-check correct scopes
- **Per-product scope grid** with count badge: `"WhatsApp · 2 of 4 selected"`
- **Select All** checkbox more prominent per product
- **Access Summary** text at bottom: `"This key can: Send messages · Read templates"`
- **Scope tooltips**: hover on `wa.template` → "Create & send message templates", etc.
- **OAuth 2.0 section** (grant types, redirect URIs, token lifetimes) shown below scopes under "OAuth 2.0 Configuration" heading when type is `oauth2`
- **Service Account section** (PEM upload) shown below scopes under "Service Account Configuration" heading when type is `service_account`

### 4. Step 3 — Review & Create
Read-only summary card:
- Name, Type (with icon), Environment badge, Expiry, Scopes as badge pills
- For OAuth: grant types + redirect URI count
- Warning text: "Your secret will only be shown once after creation."
- CTA: "Generate Credential" with loading spinner

**Post-creation reveal** (transforms step 3 in-place, no step 4):
- Green checkmark header
- Amber one-time warning banner
- SecretRow component(s) (unchanged)
- **"Download as .env"** button — generates and downloads:
  ```
  # helo.ai API Credentials
  # Generated: [ISO timestamp]
  # Credential: [name]
  # Environment: [live/sandbox]
  HELO_API_KEY=helo_live_xxxxx
  HELO_BASE_URL=https://api.helo.ai/v1
  HELO_ENVIRONMENT=live
  ```
  For OAuth: `HELO_CLIENT_ID` + `HELO_CLIENT_SECRET`
- ConsentFlowPreview collapsible (kept for OAuth auth_code)
- Credential ID card
- Confirmation checkbox + Done button

### 5. Environment in Key Generation
New `environment` state: `"live" | "sandbox"` (default `"live"`).
- API key prefix: `helo_live_` or `helo_test_`
- Stored on credential object
- Used in `.env` download

### 6. Visual Polish
- Modal `sm:max-w-xl` (from `sm:max-w-lg`)
- Step transitions: CSS fade between steps
- Scope permission tooltips with human-readable descriptions
- `onOpenChange` uses step 3 reveal check instead of step 4

### Preserved (unchanged)
- `SecretRow` component
- `ConsentFlowPreview` collapsible
- `validatePEM` function
- `isValidRedirectUri` function
- `handleToggleScope`, `handleSelectAllProduct`, `isScopeSelected` logic
- `AppContext` types and `createCredential` signature

## Files Changed

| File | Change |
|------|--------|
| `src/components/CreateCredentialModal.tsx` | Full rewrite — 3-step flow, environment toggle, expiry dropdown, scope presets, labeled stepper, `.env` download, review summary |

