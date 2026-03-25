

# Consent Flow Preview — OAuth 2.0 Authorization Code

## Overview

Add a "Consent Flow Preview" component that lets developers preview and trigger the OAuth authorization consent screen. It appears in three places with varying presentation.

## New Component: `src/components/ConsentFlowPreview.tsx`

A reusable component accepting credential data and a `collapsible` prop.

**Inputs**: `credential: AppCredential`, `collapsible?: boolean` (default false)

**Renders**:
- **When credential has no `authorization_code` grant**: Show muted note: "Consent flow is not applicable for Client Credentials grant. Add Authorization Code grant to enable this."
- **When credential is Suspended/Revoked**: Show greyed-out URL block, disabled button labelled "Credential is not Active", and explanatory note.
- **Active with Authorization Code grant**:
  1. Section title "Consent Flow Preview" + subtitle
  2. If multiple redirect URIs: a Select dropdown to pick one (defaults to first)
  3. Monospace code block showing the constructed URL with copy button — URL updates in real time when redirect URI changes
  4. PKCE `code_challenge` auto-generated via `crypto.subtle` on mount (SHA-256 of random verifier, base64url-encoded). Info tooltip on the parameter explaining auto-generation.
  5. "Open Consent Screen" primary button — opens URL in new tab
  6. Informational note about live flow, redirect URI reachability, and 10-minute code expiry

## Integration Points

### 1. Post-Creation Modal (`CreateCredentialModal.tsx`, step 4)

After the Client ID / Client Secret `SecretRow` blocks, when the created credential is OAuth 2.0 with `authorization_code` grant:
- Add a Collapsible section (collapsed by default) labelled "Test your consent flow"
- When expanded, render `<ConsentFlowPreview credential={createdCredential} collapsible />`
- Simplified note: "Use this URL to preview the consent screen. Make sure your redirect URI is reachable before testing."

### 2. Credential Detail Side Panel (`CredentialDetailPanel.tsx`)

Inside the OAuth 2.0 details block (after redirect URIs list, around line 220):
- Render `<ConsentFlowPreview credential={credential} />` as a persistent, always-visible sub-section (not collapsible)

## PKCE Generation Logic

```text
1. Generate random 32-byte verifier → base64url encode
2. SHA-256 hash the verifier → base64url encode → code_challenge
3. Regenerate on every mount / panel open
```

Uses `crypto.getRandomValues` + `crypto.subtle.digest` (Web Crypto API). Falls back to a static placeholder if unavailable.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ConsentFlowPreview.tsx` | New component |
| `src/components/CreateCredentialModal.tsx` | Add collapsible consent preview in step 4 for OAuth auth_code |
| `src/components/CredentialDetailPanel.tsx` | Add persistent consent preview after OAuth redirect URIs |

