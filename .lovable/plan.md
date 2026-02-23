

# World-Class Login and Sign Up Experience for helo.ai Developer Console

## Overview

Replace the current minimal login card with a full enterprise-grade authentication experience featuring a two-panel desktop layout, multiple auth methods (email, Google, GitHub, SSO), sign-up flow, MFA verification, and forgot-password flow. All screens share a consistent security-first, infrastructure-focused aesthetic.

## New Pages and Routes

| Route | Page | Purpose |
|---|---|---|
| `/login` | Login | Primary sign-in (replaces current) |
| `/signup` | SignUp | Account creation |
| `/mfa` | MfaVerify | TOTP code entry post-login |
| `/forgot-password` | ForgotPassword | Password reset request |
| `/sso` | SsoLogin | Enterprise SSO domain entry |

## Layout Structure

### Desktop (two-panel)

```text
+-----------------------------+-----------------------------+
|                             |                             |
|   helo.ai                   |   [Form Area]               |
|   Developer Console         |                             |
|                             |   Email + Password           |
|   Secure access to          |   OR divider                |
|   messaging infrastructure  |   Google / GitHub buttons   |
|                             |   SSO button                |
|   Shield icon               |   Secondary links           |
|   "256-bit encrypted"       |                             |
|   "SOC 2 compliant"         |                             |
|   "99.99% uptime"           |                             |
|                             |                             |
+-----------------------------+-----------------------------+
```

Left panel: dark background (uses `--sidebar-background` tones), branding, tagline, security indicators.
Right panel: clean form area on `--background`.

### Mobile

Single-column stacked layout -- branding collapses to a compact header above the form card.

## Login Page Details

### Form elements (right panel)

1. **Header**: "Sign in to your account"
2. **Email field** with inline validation
3. **Password field** with show/hide toggle
4. **Remember me** checkbox + **Forgot password?** link (same row)
5. **Sign In** primary button
6. **OR** divider
7. **Continue with Google** button (outline, Google icon)
8. **Continue with GitHub** button (outline, GitHub icon)
9. **Sign in with SSO** button (outline, building icon)
10. **Footer**: "Don't have an account? Sign up" | "Having trouble signing in?"

### Password validation

- Minimum 8 characters
- Inline error messages on blur
- Failed login shows toast (existing pattern)

## Sign Up Page Details

Same two-panel layout. Right panel form:

1. **Header**: "Create your account"
2. **Full Name** field
3. **Work Email** field
4. **Password** field with strength indicator (weak/fair/strong bar)
5. **Confirm Password** field with match validation
6. **Company Name** field (optional, labeled as such)
7. **Terms checkbox**: "I agree to the Terms of Service and Privacy Policy"
8. **Create Account** primary button
9. **OR** divider
10. **Continue with Google** / **Continue with GitHub**
11. **Footer**: "Already have an account? Sign in"

### Password strength indicator

A small bar below the password field:
- Red = weak (< 8 chars or no variety)
- Yellow = fair (8+ chars, some variety)
- Green = strong (8+ chars, upper + lower + number + special)

## MFA Verification Page

Centered single-card layout (no two-panel):

1. **Header**: "Two-factor authentication"
2. **Subtitle**: "Enter the 6-digit code from your authenticator app"
3. **OTP input** (6 slots, using existing `InputOTP` component)
4. **Verify** primary button
5. **Link**: "Use a backup code instead" (toggles to a single text input)
6. **Link**: "Back to sign in"

## SSO Domain Flow

Centered single-card layout:

1. **Header**: "Enterprise SSO"
2. **Subtitle**: "Enter your company email or domain"
3. **Domain/email input** field
4. **Continue with SSO** primary button
5. **Back to sign in** link

## Forgot Password Page

Centered single-card layout:

1. **Header**: "Reset your password"
2. **Subtitle**: "Enter your email and we'll send a reset link"
3. **Email input**
4. **Send Reset Link** button
5. **Success state**: Shows confirmation message, "Back to sign in" link
6. **Back to sign in** link

## Left Panel Content (Login + Sign Up)

- **Logo**: "helo.ai" in semibold
- **Subtitle**: "Developer Console"
- **Tagline**: "Secure access to messaging infrastructure"
- **Security indicators** (small icon + text rows):
  - Shield icon -- "256-bit TLS encryption"
  - Check icon -- "SOC 2 Type II compliant"
  - Clock icon -- "99.99% uptime SLA"
- **Theme toggle** in bottom-left corner

## Files Changed

| File | Change |
|---|---|
| `src/pages/Login.tsx` | Complete redesign with two-panel layout, social login buttons, SSO button, remember me, forgot password link |
| `src/pages/SignUp.tsx` | **NEW** -- Sign-up form with password strength, terms checkbox, social auth |
| `src/pages/MfaVerify.tsx` | **NEW** -- OTP entry using InputOTP component, backup code toggle |
| `src/pages/ForgotPassword.tsx` | **NEW** -- Email input, success state |
| `src/pages/SsoLogin.tsx` | **NEW** -- Domain input, continue button |
| `src/components/AuthLayout.tsx` | **NEW** -- Shared two-panel layout wrapper for Login and SignUp |
| `src/App.tsx` | Add routes for `/signup`, `/mfa`, `/forgot-password`, `/sso` (all wrapped in `PublicRoute`) |
| `src/contexts/AppContext.tsx` | Extend `login()` to return `{ success, requiresMfa }` so the login page can redirect to `/mfa` when needed; add `signup()` method |

## Technical Details

### AuthLayout component

```typescript
interface AuthLayoutProps {
  children: React.ReactNode;  // right panel content
  title?: string;             // overrides left panel title
}
```

Renders the two-panel layout on `md:` breakpoint and above. On mobile, left panel collapses to a compact branded header.

### Updated login flow

```typescript
// AppContext login returns extended result
login: (email, password) => Promise<{ success: boolean; requiresMfa: boolean }>

// Login page handles:
const result = await login(email, password);
if (result.requiresMfa) navigate("/mfa");
else if (result.success) navigate("/apps");

// MFA mock: any 6-digit code succeeds
```

### Social login buttons (mock)

Google and GitHub buttons will call `login()` directly with mock credentials (same as current mock auth). They are UI-ready for future real OAuth integration.

### SSO flow (mock)

Accepts any domain, shows a brief loading state, then calls `login()` with mock credentials. UI-ready for real SAML/OIDC integration.

### Password strength logic

```typescript
function getPasswordStrength(password: string): "weak" | "fair" | "strong" {
  if (password.length < 8) return "weak";
  const checks = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];
  const passed = checks.filter(r => r.test(password)).length;
  if (passed >= 3) return "strong";
  if (passed >= 2) return "fair";
  return "weak";
}
```

### Route additions in App.tsx

```typescript
<Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
<Route path="/mfa" element={<PublicRoute><MfaVerify /></PublicRoute>} />
<Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
<Route path="/sso" element={<PublicRoute><SsoLogin /></PublicRoute>} />
```

## Design Tokens

All screens use existing CSS variables. The left panel uses a darker surface:
- Light mode: `bg-gray-950 text-white`
- Dark mode: `bg-gray-950 text-gray-300`

This creates visual contrast with the form panel and communicates security.

