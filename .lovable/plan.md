

# Redesign WhatsApp Getting Started Page

## Overview

A major overhaul of `src/components/WhatsAppGettingStarted.tsx` adding an onboarding stepper, live API key injection with masking, syntax-highlighted code blocks, expanded language tabs (5 languages), and an annotated response panel.

## Changes

### 1. Onboarding Stepper Component

Add a horizontal 4-step progress bar above all content:
- **Step 1**: Get your API Key — complete when `apiKey` is non-empty
- **Step 2**: Set Authorization Header — auto-complete (shown inline in step 1's card)
- **Step 3**: Confirm Base URL — complete when user scrolls past or views the Base URL card
- **Step 4**: Send your First Message — complete when `currentResponse` is set

Visual: circles connected by lines, filled check when done, brand primary highlight on active step. Rendered as a new `OnboardingStepper` sub-component inside the file.

### 2. Live API Key Injection + Masking

- Already partially implemented — API key flows into code generators. Enhance with:
  - **Show/hide toggle** (Eye/EyeOff icon) on the API key input field
  - **"Key applied" badge** — green checkmark + text appears next to the input when a value is entered
  - Add PHP and Node.js (axios) generators that also receive the `apiKey` param

### 3. Enhanced Code Blocks with Syntax Highlighting

Replace the plain `CodeBlock` component with a `SyntaxHighlightedCodeBlock`:
- Use regex-based token coloring (no external library needed):
  - **Strings** (quoted values): `text-green-400`
  - **Keys** (JSON keys, HTTP headers): `text-blue-400`
  - **Numbers**: `text-amber-400`
  - **HTTP methods** (GET, POST, etc.): `text-purple-400`
  - **Comments**: `text-muted-foreground`
- Larger padding, `leading-relaxed`, slightly bigger font
- Copy button always visible (top-right), "Copied!" state for 2s

### 4. Expand Language Tabs to 5

Add two new code generators:
- `generatePhp(apiKey, to, type, body)` — full PHP cURL snippet
- `generateNodeAxios(apiKey, to, type, body)` — axios-based Node.js snippet

Tab order: cURL | JavaScript | Python | PHP | Node.js (axios)

### 5. Annotated Response Panel

After response appears:
- Add a **Raw / Annotated** toggle (two small buttons or tabs) above the response body
- **Raw view**: current JSON display
- **Annotated view**: render each top-level and nested JSON field with an inline muted label explaining it:
  - `messaging_product` → "Platform used for delivery"
  - `contacts[].input` → "The number you sent to"
  - `contacts[].wa_id` → "Recipient's WhatsApp ID (without +)"
  - `messages[].id` → "Unique message ID — use this to track delivery status"
- **Status badge**: combine status, time, and timestamp into one styled badge: `"200 OK · 670ms · 11:33 AM"`

## Files Changed

| File | Change |
|------|--------|
| `src/components/WhatsAppGettingStarted.tsx` | Full rewrite — add stepper, key masking, 5 language tabs, syntax highlighting, annotated response panel |

## Technical Notes

- No new dependencies — syntax highlighting via regex spans, stepper via Tailwind
- All state managed locally via existing `useState` hooks plus new `completedSteps` derived state
- Stepper auto-advances based on reactive conditions (apiKey filled, base URL viewed, response received)

