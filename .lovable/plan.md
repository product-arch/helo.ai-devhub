

# WhatsApp Product Page with API Catalog

## Overview

After configuring a product (e.g., WhatsApp) via the channel config modal, the user is navigated to a dedicated product page. This page lists all WhatsApp APIs from the provided CSV as individual line items, each with an activation control. Activating an API reveals its request structure with code samples in multiple languages.

---

## Flow Change

**Current behavior:** Clicking a product card on the Overview page opens a config modal. Saving the modal updates the status and closes the modal.

**New behavior:** Saving the config modal still updates the product status, but now also navigates the user to `/apps/:appId/products/:productId` -- the product detail page.

This applies to all products, but the WhatsApp page will be the first to have a full API catalog from the CSV data.

---

## WhatsApp Product Page Layout

The page at `/apps/:appId/products/whatsapp` will show:

### Section 1: Page Header
- Title: "WhatsApp Messaging"
- Breadcrumbs: Apps > [App Name] > Products > WhatsApp Messaging
- Status badge

### Section 2: API Catalog (the main content)

A list of all 52 WhatsApp APIs from the CSV, displayed as line items within a card. Each line item shows:

| Element | Description |
|---------|-------------|
| API Category name | e.g., "Send Message", "Business Profile", "Template Create" |
| Purpose | One-line description from the "Purpose in Console" column |
| Method badge | GET / POST / DELETE shown as a colored pill |
| Endpoint path | Monospace text showing the path |
| Layer badge | "WABA" or "Phone" or "Media" tag |
| Activation control | Either a toggle switch OR a "Request Access" button |

**Activation control logic (randomized per API):**
- APIs classified as **MVP** in the CSV get a direct toggle switch (roughly 60% of APIs)
- APIs classified as **BSP Required**, **Internal Only**, or **Future Scope** get a "Request Access" button instead
- This creates a natural mix where basic APIs are self-service and advanced ones require approval
- The randomization is seeded so it stays consistent across renders

### Section 3: Expanded API Detail (shown when activated)

When a user toggles an API ON, the row expands to reveal:

**Request structure panel:**
- Base URL: `https://graph.facebook.com/v24.0`
- Full endpoint path with the required ID placeholder
- Method and required headers (Authorization: Bearer token)
- Required scope badge

**Code samples with language tabs:**
- **cURL** (default)
- **Python** (using `requests`)
- **Node.js** (using `fetch`)
- **PHP** (using `curl`)

Each code block:
- Has syntax-highlighted formatting (monospace, colored keywords)
- Includes a copy button
- Shows the actual endpoint path and method from the CSV
- Uses placeholder values for IDs and tokens

---

## Data Structure

A new data file or constant will hold the parsed WhatsApp API catalog:

```text
WhatsAppApi = {
  id: string              // e.g., "send_message"
  category: string        // e.g., "Send Message"
  endpoint: string        // e.g., "/{PHONE_NUMBER_ID}/messages"
  method: string          // "GET" | "POST" | "DELETE" | "GET/POST"
  requiredId: string      // "WABA_ID" | "PHONE_NUMBER_ID" | "MEDIA_ID"
  purpose: string         // from "Purpose in Console"
  scope: string           // "whatsapp_business_management" | "whatsapp_business_messaging"
  classification: string  // "MVP" | "BSP Required" | "Internal Only" | "Future Scope"
  layer: string           // "WABA" | "Phone" | "Media"
  accessType: "toggle" | "request"  // derived from classification
  enabled: boolean        // runtime state
}
```

**52 APIs total** from the CSV (excluding empty rows and header info).

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/data/whatsappApis.ts` | Static data file with all 52 WhatsApp APIs parsed from the CSV |
| `src/components/ApiLineItem.tsx` | Reusable component for a single API row with toggle/request-access and expandable code panel |
| `src/components/CodeSample.tsx` | Tabbed code sample component with cURL, Python, Node.js, PHP |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ProductDetail.tsx` | Replace the current generic layout with the API catalog for WhatsApp. Other products keep the existing layout. |
| `src/components/ChannelConfigModal.tsx` | After saving, navigate to the product detail page using `useNavigate` |
| `src/pages/Overview.tsx` | Pass navigate capability so modal save triggers redirect |

## Implementation Sequence

1. Create `src/data/whatsappApis.ts` with all 52 APIs from the CSV, each tagged with `accessType` based on classification
2. Create `src/components/CodeSample.tsx` -- tabbed code viewer with copy support for cURL, Python, Node.js, PHP
3. Create `src/components/ApiLineItem.tsx` -- expandable row with toggle or "Request Access" button, expands to show CodeSample
4. Update `src/pages/ProductDetail.tsx` -- for WhatsApp, render the API catalog using ApiLineItem components instead of the generic capabilities layout
5. Update `src/components/ChannelConfigModal.tsx` and `src/pages/Overview.tsx` -- after saving configuration, navigate to the product page

