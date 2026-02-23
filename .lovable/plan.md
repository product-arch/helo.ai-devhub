

# RCS API Catalog -- Matching WhatsApp Pattern

## Overview

Populate the RCS product with all APIs from the uploaded CSV, using the same API Catalog design and functionality as WhatsApp (collapsible Essential/Advanced sections, toggles, request access, expandable code samples).

## Approach

1. **Generalize the shared type** -- Rename `WhatsAppApi` to a generic `MessagingApi` interface so both WhatsApp and RCS data files use the same shape
2. **Create RCS data file** -- New `src/data/rcsApis.ts` with all 38 APIs from the CSV
3. **Update components** to use the generic type
4. **Wire RCS into ProductDetail** the same way WhatsApp is wired

## API Classification from CSV

The CSV contains two scopes mapping to Essential vs Advanced:

**Essential (runtime -- `rcsbusinessmessaging` scope, 9 APIs):**
- Send Agent Message (POST), Revoke Agent Message (DELETE), Send Agent Event (POST)
- Upload File (POST), Upload File Resumable (POST)
- Get Capabilities (GET)
- Send Dialogflow Message (POST)
- Invite Tester (POST)
- Batch Get Users (POST)

**Advanced (management -- `businesscommunications` scope, 29 APIs):**
- Analytics: Agent Performances
- Brand: Create, Delete, Get, List, Update
- Agent: Create, Delete, Get, Get Launch Info, Get Verification, List, Update, Request Launch, Request Verification, Update Launch, Update Verification
- Integration: Create, Delete, Get, List, Update
- Partner: Get, Update
- Region: List Regions
- Tester: Create, Delete, Get, List

## RCS Layer Mapping

| Layer | Description |
|---|---|
| Messaging | Send/revoke messages, events, Dialogflow |
| File | Media upload (standard + resumable) |
| Phone | Capabilities check, tester invite, batch users |
| Brand | Brand CRUD operations |
| Agent | Agent lifecycle, launch, verification |
| Integration | Integration CRUD |
| Partner | Partner config |
| Analytics | Performance metrics |
| Region | Region listing |
| Tester | Tester device management |

## Files Changed

### 1. `src/data/rcsApis.ts` (NEW)

Create new file mirroring `whatsappApis.ts` structure:
- Export `RcsApi` type alias to the generic interface
- Define all 38 raw APIs with: category, endpoint, method, requiredId, purpose, scope, classification, layer
- Essential = `rcsbusinessmessaging` scope APIs; Advanced = `businesscommunications` scope APIs
- Base URLs: `https://businesscommunications.googleapis.com` (management) and `https://rcsbusinessmessaging.googleapis.com` (runtime)

### 2. `src/data/whatsappApis.ts` (MODIFY)

- Rename `WhatsAppApi` interface to `MessagingApi` and keep `WhatsAppApi` as a type alias for backward compat
- Export `MessagingApi` as the primary shared interface

### 3. `src/components/ApiLineItem.tsx` (MODIFY)

- Import `MessagingApi` instead of `WhatsAppApi`
- Add PATCH method color: `bg-yellow-500/15 text-yellow-600 dark:text-yellow-400`
- Add new RCS layer colors (Brand, Agent, Integration, etc.)
- Update type references

### 4. `src/components/CodeSample.tsx` (MODIFY)

- Import `MessagingApi` instead of `WhatsAppApi`
- Accept an optional `baseUrl` prop (defaults to WhatsApp URL for backward compat)
- For RCS APIs, use the appropriate base URL based on scope
- Replace `"messaging_product": "whatsapp"` with a generic POST body or scope-aware body

### 5. `src/components/WhatsAppApiCatalog.tsx` (MODIFY)

- Rename to a more generic `ApiCatalog` component (keep `WhatsAppApiCatalog` as re-export)
- Accept `title` prop (e.g. "WhatsApp Messaging" vs "RCS Messaging")
- Accept `baseUrl` prop to pass through to CodeSample
- Accept `essentialLabel` and `advancedLabel` with sensible defaults

### 6. `src/pages/ProductDetail.tsx` (MODIFY)

- Import `rcsApis` from `src/data/rcsApis.ts`
- Add an `rcs` branch alongside the existing `whatsapp` branch:
  - Filter essential vs advanced RCS APIs
  - Render the same `ApiCatalog` component with RCS title and data
- Remove the old static `rcs` entry from `productConfigs` (it will use the catalog view now)

## Technical Details

### RCS API Data Structure (sample entries)

```typescript
{ category: "Send Agent Message", endpoint: "/v1/{parent=phones/*}/agentMessages", method: "POST", requiredId: "Phone ID", purpose: "Send RCS message to user", scope: "rcsbusinessmessaging", classification: "Essential", layer: "Messaging" }

{ category: "Create Brand", endpoint: "/v1/brands", method: "POST", requiredId: "---", purpose: "Create a new brand", scope: "businesscommunications", classification: "Advanced", layer: "Brand" }
```

### Method Color Addition

```typescript
PATCH: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
```

### CodeSample Base URL Logic

```typescript
const baseUrl = props.baseUrl || (api.scope === "rcsbusinessmessaging" 
  ? "https://rcsbusinessmessaging.googleapis.com" 
  : "https://businesscommunications.googleapis.com");
```

