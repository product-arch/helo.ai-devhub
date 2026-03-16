

# Replace WhatsApp API Catalog with Getting Started Page

## Overview

Replace the WhatsApp product detail route (`/apps/:appId/products/whatsapp`) with an interactive "Getting Started" page for helo.ai's WhatsApp Business API. The page uses a two-column layout (55/45) with a scrollable guide on the left and a sticky response viewer on the right.

## New Component

**`src/components/WhatsAppGettingStarted.tsx`** — replaces the `ApiCatalog` render for WhatsApp in `ProductDetail.tsx`.

### Left Column (55%) — Guide

Four sections rendered in a scrollable container:

1. **What is this API?** — Static 3-line paragraph.
2. **Authentication** — Text input for API key that populates all code examples via state. Code block showing `Authorization: Bearer {key}`.
3. **Base URL** — Static code block: `https://api.helo.ai/v1`
4. **Try your first request** — Interactive form:
   - `POST /messages` endpoint display
   - **To** — phone number input
   - **Message type** — Select dropdown (Text / Image / Template)
   - **Message body** — Textarea
   - Tabbed code snippet (cURL / JavaScript / Python) that auto-updates from form state and the API key input
   - "Send request →" button

### Right Column (45%) — Sticky Response Viewer

- **Default state**: Dashed border placeholder "Your response will appear here"
- **After request**: Status pill (green 200 / red 4xx), response time, timestamp, JSON response with copy button, collapsible request details
- **Tabs**: Response | History (last 5 requests stored in session state)
- Uses `sticky top-6` positioning

### Request Logic

The "Send request" button sends a real POST to `https://api.helo.ai/v1/messages` using the user's API key. If the request fails (network/CORS), show the error in the response panel with a plain-English explanation.

## Changes to Existing Files

**`src/pages/ProductDetail.tsx`** (lines 64-78) — Replace the `ApiCatalog` render with the new `WhatsAppGettingStarted` component, still wrapped in `DashboardLayout` + `PageHeader`.

## Design

- All existing shadcn/ui components: Card, Input, Label, Textarea, Select, Tabs, Button, Badge
- Monospace code blocks with `bg-muted` backgrounds
- Status pills use `StatusBadge` patterns (semantic green/red)
- Follows current spacing, typography, and color tokens

