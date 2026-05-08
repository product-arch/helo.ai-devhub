# WhatsApp API Playground — Full Rewrite

## Overview

Rebuild `src/components/WhatsAppGettingStarted.tsx` into a production-grade, conversion-focused playground that addresses every functionality, UX, and UI gap in the brief. Theme follows the global light/dark toggle but introduces a scoped electric-teal accent for this page only. All API calls are simulated locally (no network) — realistic latency, status codes, and error payloads.

## Architecture

Split the monolith into focused files under `src/components/whatsapp/`:

```text
src/components/whatsapp/
  PlaygroundPage.tsx            // top-level layout, sticky 60/40 grid
  EnvSwitcher.tsx               // Sandbox | Production pill + banner
  Stepper.tsx                   // 4-step, 3-state, clickable, persisted
  RateLimitMeter.tsx            // 47/100 per minute, color thresholds
  ApiHealthDot.tsx              // operational/degraded/incident
  ApiKeyPanel.tsx               // copy/regenerate/visibility
  SendForm/
    index.tsx                   // orchestrates message-type sub-forms
    PhoneInput.tsx              // E.164 + country picker + saved numbers
    TextForm.tsx
    TemplateForm.tsx            // searchable picker + variable mapping + preview
    MediaForm.tsx               // image/video/audio/document
    InteractiveForm.tsx         // buttons + list builder
    LocationForm.tsx
    ReactionForm.tsx
    WhatsAppPreview.tsx         // mobile chat-bubble preview
  CodeSnippets.tsx              // 11 langs, live-updates, key inject toggle
  ResponsePanel.tsx             // ghost sample → real, metadata bar, copy
  HistoryTab.tsx                // last 10, click-to-replay
  WebhookSimulator.tsx          // collapsible, simulates inbound POST
  WhatsNext.tsx                 // 3 cards w/ recommended-path badge
  lib/
    simulator.ts                // mockSend(payload, env) → response w/ latency
    snippets.ts                 // builders for cURL, JS fetch, JS axios, Python requests, Python httpx, PHP, Ruby, Go, Java, .NET, Node
    storage.ts                  // typed localStorage helpers (history, savedNumbers, env, stepper, savedKey)
    types.ts
    syntax.ts                   // tiny JSON + code token highlighter (no Prism)
    templates.ts                // mock approved templates with {{N}} vars
```

`src/pages/whatsapp/Playground.tsx` (or wherever current route lives) imports `PlaygroundPage`. Old `WhatsAppGettingStarted.tsx` is deleted.

## Theming — scoped teal accent

Add a single CSS scope class `.playground-theme` in `src/index.css` overriding `--primary`, `--ring`, `--accent` to teal `162 100% 42%` for both `:root` and `.dark` so the switch works in both modes. All teal usage is via `bg-primary`, `text-primary`, `ring-primary` — no hardcoded hex. Outside this wrapper the brand red/pink is untouched.

## Layout

- Sticky two-column grid at `lg`+ : left `60%` (form, snippets, webhook sim, what's next), right `40%` sticky (response, rate limit, health, history tab).
- Mobile (`<lg`): single column; response panel sits directly under Send button.
- Page shell uses existing `DashboardLayout` + `PageHeader`.

## Feature spec

### 1. Environment switcher
- Sliding pill in the page header: Sandbox / Production. Persisted in localStorage.
- Sandbox → amber full-width banner + base URL `https://sandbox.api.helo.ai/v1` + sandbox-prefixed key.
- Production → small red `LIVE` badge next to the toggle, no banner.
- State propagates to base URL display, code snippets, and simulator behavior (sandbox always 202, production sometimes 4xx based on input validity).

### 2. Stepper
- Horizontal full-width, 4 steps, 3 states (completed filled-teal-check / active glowing-teal / upcoming muted) with connector lines colored by completion.
- Each step is a button that scrolls to and expands its inline help accordion.
- Completion is auto-derived: key copied → 1 done, header copied → 2 done, base URL copied → 3 done, request sent → 4 done. Persisted.
- Step 4's "complete" state shows a subtle success ribbon: "You're set up — explore webhooks next".

### 3. Send form
- **PhoneInput**: country picker (flag + dial code), E.164 regex validation `/^\+[1-9]\d{6,14}$/`, inline error, bookmark icon to save, dropdown to load saved numbers.
- **Message type select**: Text, Template, Image, Video, Audio, Document, Interactive (Buttons), Interactive (List), Location, Reaction.
- **TemplateForm**: searchable combobox over mock templates (name, language, category badge, status badge). Renders one labeled input per `{{N}}` variable. Live preview in WhatsAppPreview.
- **MediaForm**: tabbed URL / Drag-drop (drag-drop accepts file → object URL, no upload). Caption + filename for documents.
- **InteractiveForm**: button rows (max 3, types Reply/URL/Phone) for Buttons; section + row builder (max 10 rows) for List. Live preview.
- **LocationForm**: lat/lng/name/address.
- **ReactionForm**: target message id + emoji.
- **TextForm**: textarea with char counter and a tooltip showing WhatsApp formatting (`*bold*`, `_italic_`, `~strike~`, ` ```mono``` `).
- "Pre-fill with sample data" button populates fields contextually for the selected type.
- **WhatsAppPreview**: phone-style chat bubble preview (right side of left column on lg, below form on mobile) updates live.

### 4. Code snippets
- Tabs: cURL, JS fetch, JS axios, Node.js, Python requests, Python httpx, PHP, Ruby, Go, Java, .NET (C#), helo SDK.
- Built by `snippets.ts` from current form state + env. Update on every keystroke.
- "Insert my API key" toggle swaps `YOUR_API_KEY` for the masked real key.
- Copy button top-right → ✓ Copied for 2s.
- Lightweight token highlighter (`syntax.ts`) — keywords, strings, numbers, comments — no external dep.

### 5. Response panel
- Default: ghost sample 202 payload at 40% opacity, italic "Sample response" label.
- After send: real payload with metadata bar — colored status pill (2xx green, 4xx/5xx red, 3xx amber), response time ms, payload size in bytes/KB.
- Click status pill → tooltip explanation (canonical map of common codes).
- Copy button on payload; "View in Logs →" link appears post-send (deep-links to `/logs?requestId=…`).
- 4xx/5xx renders highlighted error code + human-readable line above the JSON.
- Smooth fade-in / slide-up on new response. Loading state shows skeleton + spinner in Send button; success pulse; error shake.

### 6. History tab
- Tabbed alongside Response in the right column. Last 10 entries in localStorage, each: timestamp, To, type, status pill, time ms. Click → reload into form + response panel. Empty state copy per spec.

### 7. Rate limit meter
- Small bar in right column header: `Requests: N / 100 per minute`. Increments on send. Window resets after 60s. Amber at ≥80, red at ≥95. When at cap, sending returns simulated 429 with `Retry-After`.

### 8. API health dot
- Top-right of header. Green default. Hover tooltip "WhatsApp API: Operational — Last checked Xm ago". Linked to `/status` (placeholder).

### 9. Webhook simulator
- Collapsible card under send form. Inputs: From, message type, body. Renders the exact JSON payload that would be POSTed, plus a simulated webhook response (200 default; 401/500 if user toggles failure mode). No real network call.

### 10. What's next
- 3 cards (Webhooks / Templates / Media types). Recommended path computed from state:
  - First successful send & no webhook configured → Webhooks card gets teal `Start here →` badge + warning dot.
  - Otherwise Templates is recommended.

### Simulator behavior
`simulator.ts` returns realistic shapes:
- 202 `{ message_id: "wamid.<rand>", status: "accepted", to, timestamp }` after 250–650 ms.
- 400 missing-field, 401 invalid-key (when toggle off in prod-style key check), 422 unknown template, 429 rate-limit, 500 random — each with WhatsApp-shaped error payloads (`{ error: { code, title, message, details } }`).

### localStorage keys
`helo:wa:env`, `helo:wa:stepper`, `helo:wa:savedNumbers`, `helo:wa:history`, `helo:wa:apiKey`, `helo:wa:insertKey`.

### Design tokens
- Card surfaces use existing `bg-card` + `shadow-block`.
- Primary CTA `bg-primary` (teal in scope). Secondary actions `variant="outline"` or `ghost`.
- JSON syntax: keys `text-primary`, strings `text-emerald-400`-like via `text-[hsl(var(--success))]` token (add if missing), numbers/booleans `text-amber-400` token, punctuation `text-muted-foreground`. All tokens go through `index.css` HSL variables.
- Status pills reuse existing semantic badge variants.

### Micro-interactions
Framer-motion not required; use Tailwind transitions + a couple of keyframes (`fade-in-up`, `pulse-glow`, `shake`) added to `tailwind.config.ts`.

### Accessibility
- Stepper buttons have `aria-current="step"`.
- Status pills have `aria-label` "Status 202 Accepted".
- All copy buttons announce via `aria-live="polite"` toast.
- Keyboard: tabs, stepper, and language tabs all focusable with visible ring.

## Files

| File | Change |
|---|---|
| `src/components/whatsapp/*` (new tree above) | New files implementing each piece |
| `src/components/WhatsAppGettingStarted.tsx` | Delete; route imports `PlaygroundPage` |
| `src/pages/ProductDetail.tsx` (or wherever WhatsApp getting-started is rendered) | Swap import to new `PlaygroundPage` |
| `src/index.css` | Add `.playground-theme` scope overriding `--primary`/`--ring`/`--accent` to teal in both `:root` and `.dark`; add `success`/`warning` tokens if missing; add `fade-in-up`, `pulse-glow`, `shake` keyframes |
| `tailwind.config.ts` | Register the new keyframes/animations |

## Out of scope
- No new backend / edge functions (all simulated client-side).
- No real Prism dependency (tiny inline highlighter).
- Light-mode behavior of rest of the app and brand red/pink elsewhere stay untouched.
