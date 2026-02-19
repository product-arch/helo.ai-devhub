
# API Catalog Bifurcation: Essential & Advanced Groups

## Overview

The WhatsApp API Catalog in `src/pages/ProductDetail.tsx` will be split into two clearly labeled sections:

1. **Essential APIs** — always-on, no toggle needed, visually distinguished with an "Always Active" indicator
2. **Advanced APIs** — toggleable (or Request Access) as today, but grouped under a separate header

The classification logic already exists in `src/data/whatsappApis.ts`:
- `classification === "MVP"` → **Essential**
- Everything else (`BSP Required`, `Future Scope`, `Internal Only`) → **Advanced**

---

## Visual Design

```text
┌─────────────────────────────────────────────────────────────────┐
│  API Catalog                                           52 APIs   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ── Essential APIs ──────────────────────────  12 APIs  ──────  │
│  Always active · Core capabilities included in all plans         │
│                                                                  │
│  GET  Block Users         Phone  /{PHONE_NUMBER_ID}/...  ●Active │
│  POST Business Profile    Phone  /{PHONE_NUMBER_ID}/...  ●Active │
│  GET  Number Health       Phone  /{PHONE_NUMBER_ID}/...  ●Active │
│  POST Send Message        Phone  /{PHONE_NUMBER_ID}/...  ●Active │
│  ...                                                             │
│                                                                  │
│  ── Advanced APIs ───────────────────────────  40 APIs  ──────  │
│  Opt-in access · Enable per your integration requirements        │
│                                                                  │
│  GET  Activities Log      WABA   /{WABA_ID}/activities  [toggle] │
│  GET  AI Thread Search    Phone  /{PHONE_NUMBER_ID}/... [Request]│
│  ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Essential API Row Changes (`ApiLineItem`)

Essential APIs (those with `classification === "MVP"`) need a different control on the right side — instead of a toggle or Request Access button, they show a static **"Always Active"** green indicator chip:

```
● Always Active
```

This chip is: `bg-green-500/10 text-green-600 border border-green-500/20 rounded-full px-2.5 py-0.5 text-xs`

Essential rows still expand on click to show the `CodeSample` (since the API is always on, clicking the row can directly reveal the code sample without needing to enable it first).

---

## Section Header Component

A lightweight inline section header between the two groups:

```
┌──────────────────────────────────────────────────────────┐
│  Essential APIs                                  12 APIs  │
│  Always active · Core capabilities...                     │
└──────────────────────────────────────────────────────────┘
```

Styled as: a `div` with `px-4 py-2.5 bg-muted/40 border-b border-border` containing:
- Left: bold label + muted subtitle
- Right: count badge

---

## Files to Modify

| File | Changes |
|---|---|
| `src/data/whatsappApis.ts` | Add an `isEssential` boolean field (derived from `classification === "MVP"`) to `WhatsAppApi` |
| `src/components/ApiLineItem.tsx` | Accept an `isEssential` prop; when true: always show expanded code sample, replace control with "Always Active" chip, make the row clickable to toggle the code sample open/closed |
| `src/pages/ProductDetail.tsx` | In the WhatsApp branch, split `whatsappApis` into `essentialApis` and `advancedApis`, render a section header before each group |

---

## Technical Details

### 1. `src/data/whatsappApis.ts`

Add `isEssential: boolean` to the `WhatsAppApi` interface. Derive it during the `.map()`:

```ts
const isEssential = api.classification === "MVP";
return { ...api, id, accessType, isEssential };
```

### 2. `src/components/ApiLineItem.tsx`

Add `isEssential?: boolean` to `ApiLineItemProps`.

**Control logic change:**

```ts
// Current
{api.accessType === "toggle" ? <Switch .../> : <RequestAccessButton />}

// New
{isEssential ? (
  <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-0.5">
    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
    Always Active
  </span>
) : api.accessType === "toggle" ? (
  <Switch checked={enabled} onCheckedChange={handleToggle} />
) : (
  <RequestAccessButton />
)}
```

**Expand logic change for Essential rows:**

Essential rows should be expandable by clicking (since they're always "on"), so:
- Add a local `isOpen` state separate from `enabled`
- For essential: `isOpen` toggled on row click, chevron always visible
- For advanced: keep existing `isExpanded = enabled` logic

### 3. `src/pages/ProductDetail.tsx`

In the WhatsApp branch:

```ts
const essentialApis = whatsappApis.filter(a => a.isEssential);
const advancedApis = whatsappApis.filter(a => !a.isEssential);
```

Replace the flat render loop with:

```tsx
<CardContent className="p-0">
  {/* Essential section header */}
  <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-foreground">Essential APIs</p>
      <p className="text-[11px] text-muted-foreground">Always active · Core capabilities included in all plans</p>
    </div>
    <span className="text-[11px] text-muted-foreground">{essentialApis.length} APIs</span>
  </div>
  {essentialApis.map(api => <ApiLineItem key={api.id} api={api} isEssential />)}

  {/* Advanced section header */}
  <div className="px-4 py-2.5 bg-muted/40 border-b border-t flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-foreground">Advanced APIs</p>
      <p className="text-[11px] text-muted-foreground">Opt-in access · Enable per your integration requirements</p>
    </div>
    <span className="text-[11px] text-muted-foreground">{advancedApis.length} APIs</span>
  </div>
  {advancedApis.map(api => <ApiLineItem key={api.id} api={api} />)}
</CardContent>
```

---

## Implementation Order

1. Update `WhatsAppApi` interface + derivation in `whatsappApis.ts`
2. Update `ApiLineItem.tsx` — add `isEssential` prop, separate expand state, new control chip
3. Update `ProductDetail.tsx` — split lists, add section headers
