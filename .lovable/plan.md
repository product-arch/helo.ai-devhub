

# helo.ai Developer Console — Implementation Plan

## Overview
A sleek, Vercel/Linear-inspired developer console for managing CPaaS messaging products. This will be a fully interactive UI prototype with mock data, dark/light mode support, and realistic state management.

---

## Phase 1: Foundation & Layout

### Global Structure
- **Fixed left sidebar navigation** with collapsible support
  - Overview, Products, API Credentials, Webhooks, Logs & Events, Settings
  - Active route highlighting
  - Dark/light theme toggle in sidebar footer

- **Main content area** with consistent header pattern
  - Page title + breadcrumbs
  - Contextual actions (right-aligned)

### Design System
- Dark mode as default (Vercel/Linear aesthetic)
- Monospace accents for code, keys, and technical data
- High contrast status badges
- Subtle borders, minimal shadows
- Information-dense but breathable layouts

---

## Phase 2: Core Screens

### 1. Login Screen
- Clean email/password form
- helo.ai branding (minimal, text-only logo)
- No illustrations, pure utility
- Mock authentication → redirects to Overview

### 2. Overview Dashboard
- **Enabled Products Grid** — Status cards for SMS, RCS, WhatsApp, Webhooks
- **Account Status Panel** — Active/Restricted/Pending approval
- **Blocking Issues Alert** — Red banner if issues exist
- **API Key Status** — Quick view with copy action
- No charts, no metrics — just operational status

### 3. Products List
- Product cards for: SMS, RCS, WhatsApp, Webhooks
- Each card shows:
  - Product icon + name
  - Status badge (Disabled / Configured / Restricted / Active)
  - Primary CTA (Enable / Configure / View Details)
- Clicking opens Product Detail Page

### 4. Product Detail Page (template for all products)
Consistent 5-section layout:

**A. Status Section**
- Operational state with colored indicator
- Reason if blocked + external dependency label

**B. Prerequisites Checklist**
- Required/Optional tags
- Completed/Pending/Failed status
- Source of truth indicator

**C. Configuration Form**
- Raw input fields per product
- Save creates versioned snapshot (mock)

**D. API Surface**
- Endpoint list (visible only if enabled)
- Sample curl with syntax highlighting
- Required headers table
- Error codes reference

**E. Execution Feedback**
- Last 10 events table
- Error details with timestamp, reason, provider ref

### 5. API Credentials Page
- Primary API key display (masked by default, reveal on click)
- Copy to clipboard with toast confirmation
- Rotate key (confirmation modal + mock regeneration)
- Revoke key (danger action with confirmation)
- Scope warning copy

### 6. Webhooks Page
- Endpoint URL configuration
- Shared secret (auto-generated, copyable)
- Retry policy display (read-only)
- Event types list with sample payloads
- Delivery attempts table (success/failure, HTTP status, timestamp)

### 7. Logs & Events
- Filterable stream by: Product, Event type, Date range
- Event list table with:
  - Timestamp, Product, Event type, Status
- Click → Slide-out drawer with:
  - Raw JSON payload (formatted, copyable)
  - Correlation ID
  - External reference ID

### 8. Settings
- Account name (editable)
- Timezone selector
- **Danger Zone** panel:
  - Disable product toggle
  - Revoke API key button

---

## Phase 3: Interactivity & Mock Data

### State Management
- Product enable/disable toggles persist in session
- API key rotation generates new mock key
- Configuration saves show success toast

### Mock Data Sets
- Realistic API keys (format: `helo_live_xxxxxxxxxxxx`)
- Sample webhook events (message.sent, message.delivered, message.failed)
- Log entries with real-looking timestamps and payloads
- Provider references (Twilio, Meta, Google RCS)

### UI Behaviors
- Copy-to-clipboard with visual feedback
- Confirmation modals for destructive actions
- Loading states for async operations (simulated)
- Toast notifications for all actions

---

## Deliverables
- 8+ fully navigable screens
- Dark/light mode toggle
- Interactive state changes throughout
- Realistic mock data populating all views
- Responsive sidebar (collapsible on smaller screens)
- Production-quality Vercel/Linear aesthetic

