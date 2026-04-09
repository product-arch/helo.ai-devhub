

# Add Clerk Publishable Key to `.env`

## Overview

Store the Clerk publishable key in a `.env` file at the project root. This is a **public** key (safe to commit), and Vite will expose it to client code via the `VITE_` prefix.

## Changes

### Create `.env` in the project root

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2VydGFpbi1mZWxpbmUtMy5jbGVyay5hY2NvdW50cy5kZXYk
```

No other files need changes — `src/main.tsx` already reads this variable via `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`.

## Files Changed

| File | Change |
|------|--------|
| `.env` | Create with `VITE_CLERK_PUBLISHABLE_KEY` |

