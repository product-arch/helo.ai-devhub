

# helo.ai Developer Console -- Apps and Capabilities Architecture

## What's Changing

The current console has a flat hierarchy: **Account > Products > APIs**. This update introduces two new layers to match the real technical model:

```text
Account
  -> Apps (NEW -- containers for products)
    -> Products (SMS, RCS, WhatsApp, Webhooks)
      -> Messaging Capabilities (NEW -- what users actually enable)
        -> APIs (read-only, auto-exposed based on enabled capabilities)
```

This is a significant structural change that touches routing, state management, navigation, and most screens.

---

## New Screens

### 1. Apps List (`/apps`)
The new entry point after login. Replaces the current Overview as the landing page.

- Grid of App cards, each showing:
  - App name (e.g., "Production App", "Staging App")
  - Environment label (Production / Staging / Development)
  - Enabled products count (e.g., "3 of 4 products enabled")
  - Overall health status: **Healthy** or **Action Required**
- "Create App" button in the page header
- Create App dialog: name + environment selector
- Two pre-seeded mock apps for demonstration

### 2. App Overview (`/apps/:appId/overview`)
Replaces the current Overview screen, now scoped to a single App.

- Same content as before (account status, blocking issues, API key, products grid)
- But all data is scoped to the selected App
- Sidebar shows the App name and environment at the top
- Breadcrumbs: Apps > [App Name] > Overview

---

## Modified Screens

### 3. Sidebar Navigation (App-Scoped)
When inside an App, the sidebar shows:

- App name + environment badge at the top (replaces "Account" indicator)
- "Back to Apps" link above the nav items
- Same nav items: Overview, Products, API Credentials, Webhooks, Logs, Settings
- All routes are now prefixed with `/apps/:appId/`

### 4. Product Detail -- NEW Section B: Messaging Capabilities
This is the most important change. The Product Detail page gains a new section between Status and API Surface.

**Section B: Messaging Capabilities**

Each capability is rendered as a row within a card:

| Column | Content |
|--------|---------|
| Name | Capability name (e.g., "Template Messages") |
| Description | One-line value description |
| Status | Enabled / Disabled / Restricted badge |
| Requirements | Tags for: Approval, Billing, Compliance |
| Action | Enable button, "Request Access" link, or "View reason" for blocked |

**Capabilities per product:**

- **SMS**: Basic MT, Unicode and Long SMS, Delivery Receipts, Two-Way SMS
- **RCS**: Text Messages, Rich Cards, Carousels, Suggested Actions, File Transfer
- **WhatsApp**: Template Messages, Session Messages, Media Messages, Interactive Messages, Catalog Messages
- **Webhooks**: Event Subscriptions, Retry Management (simpler set)

**How this changes the API Surface section:**

- APIs are no longer always shown for an enabled product
- Each API endpoint is linked to a specific capability
- Only APIs for **enabled** capabilities appear in Section D
- When all capabilities are disabled, the API section shows: "Enable messaging capabilities above to see available API endpoints"

### 5. Routes Update

All inner routes become App-scoped:

```text
/apps                              -- Apps list (new)
/apps/:appId/overview              -- App overview
/apps/:appId/products              -- Products list
/apps/:appId/products/:productId   -- Product detail
/apps/:appId/credentials           -- API credentials
/apps/:appId/webhooks              -- Webhooks
/apps/:appId/logs                  -- Logs and events
/apps/:appId/settings              -- Settings
```

### 6. Credentials Screen
Minor update: text now says "App-level API key" instead of account-level. Scope warning references enabled products **and messaging capabilities**.

### 7. Login Redirect
After login, redirect to `/apps` instead of `/overview`.

---

## Technical Details

### Data Model Changes (AppContext)

New types to add:

```text
CapabilityStatus = "enabled" | "disabled" | "restricted"

MessagingCapability = {
  id: string
  name: string
  description: string
  status: CapabilityStatus
  requirements: ("approval" | "billing" | "compliance")[]
  linkedEndpoints: string[]   // endpoint IDs that become visible when enabled
}

HeloApp = {
  id: string
  name: string
  environment: "production" | "staging" | "development"
  apiKey: string
  status: "healthy" | "action_required"
  products: Product[]
  webhookUrl: string
  webhookSecret: string
  webhookEvents: WebhookEvent[]
  logEvents: LogEvent[]
}
```

Product type gains a `capabilities` field:

```text
Product = {
  ...existing fields
  capabilities: MessagingCapability[]
}
```

Product config gains capability-linked endpoints:

```text
Endpoint = {
  ...existing fields
  capabilityId: string   // links to capability that must be enabled
}
```

### New State Actions

- `createApp(name, environment)` -- adds a new App to the list
- `selectApp(appId)` -- sets the current active App context
- `toggleCapability(appId, productId, capabilityId)` -- enable/disable a capability
- `requestCapabilityAccess(appId, productId, capabilityId)` -- mock access request

### Existing Actions Updated

All existing actions (`updateProduct`, `rotateApiKey`, `setWebhookUrl`, etc.) become scoped to the current App.

### Mock Data

Two pre-seeded Apps:

1. **"Production App"** (environment: production)
   - SMS: active, most capabilities enabled
   - RCS: configured, some capabilities pending
   - WhatsApp: restricted, capabilities blocked
   - Webhooks: active

2. **"Staging App"** (environment: staging)
   - SMS: active, all capabilities enabled
   - All others: disabled

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Apps.tsx` | Apps list screen |
| `src/components/CapabilityRow.tsx` | Reusable capability row component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/AppContext.tsx` | Add App, Capability types; restructure state; add new actions |
| `src/App.tsx` | Update routes to App-scoped paths; add Apps page |
| `src/components/layout/AppSidebar.tsx` | App name display, "Back to Apps" link, dynamic route prefixes |
| `src/components/layout/DashboardLayout.tsx` | Pass sidebar context for current App |
| `src/pages/Overview.tsx` | Scope to current App; update breadcrumbs |
| `src/pages/Products.tsx` | Scope to current App; update links |
| `src/pages/ProductDetail.tsx` | Add Messaging Capabilities section; make API Surface capability-driven |
| `src/pages/Credentials.tsx` | Update copy to reference App-level key and capabilities |
| `src/pages/Webhooks.tsx` | Scope to current App |
| `src/pages/Logs.tsx` | Scope to current App |
| `src/pages/Settings.tsx` | Scope to current App |
| `src/pages/Login.tsx` | Redirect to `/apps` after login |
| `src/components/layout/PageHeader.tsx` | No structural changes needed |
| `src/components/StatusBadge.tsx` | Add "enabled" status variant for capabilities |

## Implementation Sequence

1. Update `AppContext.tsx` with new data model (Apps, Capabilities, mock data)
2. Create `Apps.tsx` list screen and `CapabilityRow.tsx` component
3. Update `App.tsx` routing to App-scoped paths
4. Update `AppSidebar.tsx` with App context and "Back to Apps" navigation
5. Update `DashboardLayout.tsx` for App-aware layout
6. Update `ProductDetail.tsx` with Messaging Capabilities section and capability-driven APIs
7. Update remaining screens (Overview, Products, Credentials, Webhooks, Logs, Settings) for App scoping
8. Update `Login.tsx` redirect and `StatusBadge.tsx` for new status types

