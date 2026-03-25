

# Dummy Consent Screen for OAuth 2.0 Authorization Code Flow

## Overview

Create a standalone page at `/oauth/authorize` that simulates the helo.ai consent screen. When the "Open Consent Screen" button is clicked in `ConsentFlowPreview`, it opens this page (instead of a dead link), rendering a realistic OAuth consent UI using the query parameters from the URL.

## New File: `src/pages/OAuthConsent.tsx`

A standalone page (no dashboard layout) that reads URL query params (`client_id`, `scope`, `redirect_uri`) and renders:

```text
┌─────────────────────────────────────┐
│         helo.ai logo/wordmark       │
│                                     │
│   "App Name" is requesting access   │
│   to your account                   │
│                                     │
│   This application would like to:   │
│   ✓ scope.one                       │
│   ✓ scope.two                       │
│   ✓ scope.three                     │
│                                     │
│   Redirect URI: https://...         │
│                                     │
│   [Deny]              [Allow]       │
│                                     │
│   By approving, you agree to share  │
│   the listed permissions.           │
│   ─────────────────────────────────  │
│   Powered by helo.ai               │
└─────────────────────────────────────┘
```

- Parse `scope` param → split by space → display as checklist items
- Show `client_id` and `redirect_uri` in muted monospace
- **Allow** button: redirects to `redirect_uri?code=MOCK_AUTH_CODE_xxxxx&state=...`
- **Deny** button: redirects to `redirect_uri?error=access_denied`
- Clean, centered card layout on a subtle grey background

## Route Addition: `src/App.tsx`

Add a public route: `<Route path="/oauth/authorize" element={<OAuthConsent />} />`

## Update: `src/components/ConsentFlowPreview.tsx`

Change the auth URL base from `https://auth.helo.ai/oauth/authorize` to a relative `/oauth/authorize` so clicking "Open Consent Screen" opens the dummy page within the app's preview.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/OAuthConsent.tsx` | New dummy consent screen page |
| `src/App.tsx` | Add `/oauth/authorize` route |
| `src/components/ConsentFlowPreview.tsx` | Update URL base to relative path |

