

# Revamped App Creation and App-Specific Page Flow

## What Changes

The current Create App modal only collects name and environment. The app detail page (Overview) shows products as navigable links. This update replaces that with a streamlined two-step flow:

1. **Enhanced Create App modal** with more fields
2. **New App-specific landing page** showing App ID, App Secret, and channel product cards that open configuration modals inline (no page navigation for initial setup)

---

## 1. Create App Modal (Enhanced)

The dialog in `Apps.tsx` gets these new fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| App Name | Text input | Yes | Already exists |
| Email Account | Text input (email) | Yes | The account this app binds to |
| Environment | Select | Yes | Already exists (Production/Staging/Development) |
| Description | Textarea | No | What the app does |
| Invite Developers | Multi-input (email tags) | No | Add email addresses for developer role access |

**Invite Developers behavior:**
- A text input where the user types an email and presses Enter or clicks "Add"
- Each added email appears as a removable tag/chip below the input
- Purely optional -- can be left empty

**Data model changes in `AppContext.tsx`:**
- `HeloApp` gains: `email: string`, `description: string`, `invitedDevelopers: string[]`
- `createApp` signature becomes: `createApp(name, email, environment, description, invitedDevelopers)`

---

## 2. App Card on Apps List

No major change to the card layout. The new fields (email, description) are stored but the card continues to show: name, environment badge, product count, and health status. The description could optionally appear as a one-line truncated subtitle under the app name.

---

## 3. App-Specific Page (replaces current Overview)

When clicking an app card, the user lands on a redesigned page at `/apps/:appId/overview`. The layout changes to:

### Top Section: App Credentials
A card displaying:
- **App ID** -- shown in monospace, with a copy button (e.g., `app_prod_001`)
- **App Secret** -- shown as dots (`••••••••••••••••••••`), with a reveal toggle and copy button

This replaces the current "App API Key" card. The App Secret is the existing `apiKey` field, just renamed for clarity.

### Bottom Section: Channel Products Grid
A grid of product cards (SMS, RCS, WhatsApp, Webhooks). Each card shows:
- Channel icon and name
- Current status badge
- Short description

**Clicking a product card opens a modal (not a page redirect).** The modal contains channel-specific configuration fields:

| Channel | Modal Fields |
|---------|-------------|
| **SMS** | Sender ID (required), Callback URL (optional) |
| **RCS** | RCS Agent ID (required), Verification Token (required) |
| **WhatsApp** | WABA ID (required), WABA Phone Number (required), Business Account ID (required) |
| **Webhooks** | Endpoint URL (required), Authorization Header (optional) |

The modal has:
- Channel name as title
- Status badge
- Input fields with labels and placeholders
- "Save" and "Cancel" buttons
- Saving triggers a toast confirmation and updates the product status from "disabled" to "configured"

The full Product Detail page (`/apps/:appId/products/:productId`) still exists for deeper configuration (capabilities, API endpoints, prerequisites, events) -- this modal is just the quick-setup entry point.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AppContext.tsx` | Add `email`, `description`, `invitedDevelopers` to `HeloApp`. Update `createApp` signature and mock data. Rename `apiKey` display label concept (field stays the same). |
| `src/pages/Apps.tsx` | Expand Create App dialog with email, description, textarea, and developer invite tag input. Optionally show description on card. |
| `src/pages/Overview.tsx` | Redesign: top section becomes App ID + App Secret. Bottom section becomes product cards grid with click-to-open configuration modals. |

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/EmailTagInput.tsx` | Reusable component for adding/removing email tags (used in invite developers field) |
| `src/components/ChannelConfigModal.tsx` | Modal component for channel-specific asset configuration (WABA ID, Sender ID, etc.) |

## Implementation Sequence

1. Update `AppContext.tsx` data model with new `HeloApp` fields and updated `createApp`
2. Create `EmailTagInput.tsx` component
3. Update `Apps.tsx` with the expanded Create App modal
4. Create `ChannelConfigModal.tsx` for channel-specific configuration
5. Redesign `Overview.tsx` with App ID/Secret section and product cards with modal triggers

