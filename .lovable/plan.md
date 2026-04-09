

# Integrate Clerk Authentication

## Overview

Replace the mock `login`/`logout` system with Clerk's React SDK. Clerk handles all auth UI and session management; the existing custom login/signup pages and AuthLayout left panel are preserved as the app's branded wrapper, but form submission delegates to Clerk.

## Approach

Since Clerk's publishable key is a **public** key (safe to store in code), we'll store it directly as `VITE_CLERK_PUBLISHABLE_KEY` in the codebase. The user will need to provide the key value.

## Changes

### 1. Install `@clerk/react@latest`

Add the dependency.

### 2. `src/main.tsx` — Wrap app in `<ClerkProvider>`

```tsx
import { ClerkProvider } from "@clerk/react";

createRoot(document.getElementById("root")!).render(
  <ClerkProvider afterSignOutUrl="/login">
    <App />
  </ClerkProvider>
);
```

The publishable key is automatically read from `VITE_CLERK_PUBLISHABLE_KEY` — no manual prop needed.

### 3. `src/contexts/AppContext.tsx` — Replace mock auth with Clerk

- Remove `login` function (mock delay + setState)
- Replace `isAuthenticated` with Clerk's `useAuth().isSignedIn`
- Replace `logout` with Clerk's `useClerk().signOut()`
- Keep all app state (apps, credentials, webhooks, etc.) unchanged

The `AppState.isAuthenticated` field and `login`/`logout` methods will be replaced by Clerk hooks. Components consuming `useApp().isAuthenticated` will get the value from Clerk instead.

### 4. `src/App.tsx` — Update `ProtectedRoute` and `PublicRoute`

- Use `useAuth()` from `@clerk/react` for `isSignedIn` checks (or continue proxying through AppContext)
- Keep route structure identical

### 5. `src/pages/Login.tsx` — Wire form to Clerk sign-in

- Replace `login()` call with Clerk's `useSignIn()` hook
- Call `signIn.create({ identifier: email, password })` on form submit
- Keep the existing branded UI, AuthLayout wrapper, social buttons, and validation
- Wire "Continue with Google" to Clerk's OAuth flow via `signIn.authenticateWithRedirect({ strategy: "oauth_google" })`

### 6. `src/pages/SignUp.tsx` — Wire form to Clerk sign-up

- Replace mock `login()` call with Clerk's `useSignUp()` hook
- Call `signUp.create({ emailAddress, password, firstName, lastName })` on form submit
- Keep existing branded UI

### 7. `src/pages/ForgotPassword.tsx` — Wire to Clerk password reset

- Use `useSignIn()` to initiate `signIn.create({ strategy: "reset_password_email_code" })`

### 8. `src/components/layout/AppSidebar.tsx` (or wherever logout lives)

- Replace `logout()` with Clerk's `<UserButton />` or `clerk.signOut()`

## Prerequisites

Before implementation, the user must provide their **Clerk Publishable Key** from https://dashboard.clerk.com/~/api-keys. It will be stored as `VITE_CLERK_PUBLISHABLE_KEY`.

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add `@clerk/react@latest` |
| `src/main.tsx` | Wrap in `<ClerkProvider>` |
| `src/contexts/AppContext.tsx` | Remove mock `login`/`logout`, derive `isAuthenticated` from Clerk |
| `src/App.tsx` | Update route guards to use Clerk auth state |
| `src/pages/Login.tsx` | Use `useSignIn()` for form submission and OAuth |
| `src/pages/SignUp.tsx` | Use `useSignUp()` for form submission |
| `src/pages/ForgotPassword.tsx` | Use Clerk password reset flow |
| `src/components/layout/AppSidebar.tsx` | Use Clerk sign-out |

