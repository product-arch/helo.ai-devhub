

# Enhance WhatsApp Getting Started Page — Phase 2

## Overview

Add dynamic message type forms, phone number validation with country flags, a "What's Next" section, and an improved History tab empty state to the existing Getting Started page.

## Changes

### 1. Dynamic Message Type Form (lines 564-609)

Replace the single textarea with type-specific fields based on `messageType`:

| Type | Fields |
|------|--------|
| Text | "Message body" textarea |
| Image | "Image URL" input + "Caption" input (optional) |
| Template | "Template name" input + "Language code" input + "Parameters" textarea |
| Document | "Document URL" input + "Filename" input |

Add `"Document"` to the Select options. Update `buildPayload()` to accept structured state (an object with all fields) and produce the correct payload shape per type:
- Image: `{ image: { link, caption } }`
- Template: `{ template: { name, language: { code }, components: [...] } }`
- Document: `{ document: { link, filename } }`

Replace `messageBody` state with a `messageFields` state object. Update all 5 code generators to use the new payload structure.

### 2. Phone Number Input with Country Flag (lines 566-575)

- Add a small country-flag-to-dialing-code map (top ~20 countries) as a const
- On input change: strip spaces/dashes/parens, match prefix to flag emoji, display it left of the input
- Validate with regex `/^\+[1-9]\d{6,14}$/` — show green border (`border-green-500`) when valid, red border + helper text when invalid and non-empty
- Store cleaned value in `to` state

### 3. "What's Next?" Section (after the request tester card, line ~654)

Three horizontal cards using a grid layout:

| Card | Icon | Title | Description | CTA |
|------|------|-------|-------------|-----|
| 1 | `Bell` | Webhooks & Receiving Messages | Set up a webhook to receive inbound messages... | Read the docs → |
| 2 | `FileText` | Message Templates | Use pre-approved templates to send notifications... | Browse templates → |
| 3 | `Paperclip` | Supported Media Types | Send images, PDFs, audio, and video... | View media guide → |

Cards: `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`, subtle border, consistent icon sizing.

### 4. History Tab — Enhanced Empty State + Expand/Collapse (lines 774-803)

**Empty state**: Replace plain text with centered icon (`Clock`), heading "No requests yet", and subtext "Send your first message above to see it here."

**Request entries**: Add a chevron toggle per entry. When expanded, show the full response JSON below in a `SyntaxCodeBlock`. Add a green POST badge and red/green status badge styling already partially in place — just refine with consistent colors.

### 5. Update Code Generators

All 5 generators (`generateCurl`, `generateJS`, `generatePython`, `generatePhp`, `generateNodeAxios`) need to accept the new structured `messageFields` object and produce the correct payload for each message type (Text, Image, Template, Document).

## Files Changed

| File | Change |
|------|--------|
| `src/components/WhatsAppGettingStarted.tsx` | Add Document type, dynamic form fields, phone validation with flags, What's Next cards, enhanced history empty state with expand/collapse |

## Technical Notes

- Country flag map: ~20 entries inline (no dependency), lookup by longest prefix match
- Phone validation: real-time on change, green/red border via conditional className
- `messageFields` state replaces `messageBody`: `{ body, imageUrl, caption, templateName, languageCode, parameters, documentUrl, filename }`
- All changes in a single file, no new dependencies

