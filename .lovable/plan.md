
# Sidebar Theme Toggle Relocation + Users Page

## Summary of Changes

Three areas of work:

1. **Sidebar cleanup** — Remove the "Dark mode / Light mode" text label from the footer; keep only the icon button. Relocate the theme toggle icon to the top of each page (inside `DashboardLayout`'s top-bar area).
2. **Add Users nav item** — Add a `Users` entry in the sidebar nav list with a `Users` icon, linking to `/apps/:appId/users`.
3. **New Users page** — A full page at that route showing a table of app users with roles, plus an "Invite User" modal.

---

## Change 1: Sidebar Footer — Remove Theme Label

**File:** `src/components/layout/AppSidebar.tsx`

The footer currently has:
```
[ Moon/Sun icon ]  Light mode / Dark mode    ← remove the text label
[ LogOut icon  ]   Sign out
```

After the change, the theme button becomes icon-only in the footer (same as the collapsed state already is). The text `{!collapsed && <span>...</span>}` is removed from the theme button only; the Sign Out text label is kept as-is.

**Also add `Users` to navItems:**
```ts
{ title: "Users", url: `${prefix}/users`, icon: Users },
```
Import `Users` from `lucide-react`. Place it after Settings.

---

## Change 2: Theme Toggle Icon at the Top of the Screen

**File:** `src/components/layout/DashboardLayout.tsx`

Add a thin top-right floating icon button that is always visible over the main content area. The button sits `absolute top-4 right-6` inside the `<main>` wrapper:

```tsx
<main className="ml-60 min-h-screen p-8 transition-all duration-200 relative">
  {/* Theme toggle — top right */}
  <div className="absolute top-4 right-6">
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  </div>
  {children}
</main>
```

`DashboardLayout` will import `useTheme`, `Button`, `Sun`, `Moon`.

---

## Change 3: Register `/apps/:appId/users` Route

**File:** `src/App.tsx`

Add:
```tsx
import Users from "./pages/Users";
...
<Route path="/apps/:appId/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
```

---

## Change 4: New `Users` Page

**File:** `src/pages/Users.tsx` (new)

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  Users                                   [ + Invite User ] │
│  Manage who has access to this app                         │
├────────────────────────────────────────────────────────────┤
│  Name              Email                  Role    Joined    │
│  ─────────────────────────────────────────────────────      │
│  👑 Soumik Choudhury  soumik@helo.ai      Admin   —         │
│  (future invited users show here)                           │
└────────────────────────────────────────────────────────────┘
```

### Role Display

| Role | Icon | Color |
|---|---|---|
| Admin | `ShieldCheck` | Amber/orange badge |
| Developer | `Code2` | Blue badge |

### Default User

One hardcoded mock row pre-seeded in local state:
```ts
{ id: "1", name: "Soumik Choudhury", email: "soumik@helo.ai", role: "admin", joinedAt: null }
```

### "Invite User" Modal

Clicking **+ Invite User** opens a `Dialog` with:
- Email input (`type="email"`, required)
- Role `Select` dropdown: Admin / Developer
- **Send Invite** button — adds the user to the local list with a `pending` status indicator

After submitting, a `toast` fires: *"Invite sent — An invitation has been sent to [email]."*

The new row appears in the table immediately with a "Pending" badge next to their email (since they haven't accepted yet). Once accepted (simulated — no actual email), the status would change.

### Table columns

| Column | Content |
|---|---|
| Name | Full name (or `—` if pending) |
| Email | Email address + optional "Pending" badge |
| Role | Icon + role label badge |
| Status | "Active" green chip / "Pending" amber chip |
| Actions | Kebab menu or remove button (future-proofed) |

### State model (local, no backend)

```ts
type AppRole = "admin" | "developer";
type UserStatus = "active" | "pending";

interface AppUser {
  id: string;
  name: string | null;
  email: string;
  role: AppRole;
  status: UserStatus;
}
```

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Add Users nav item, remove theme text label |
| `src/components/layout/DashboardLayout.tsx` | Add top-right theme toggle icon |
| `src/App.tsx` | Register `/apps/:appId/users` route |
| `src/pages/Users.tsx` | Create new Users page |

---

## Implementation Order

1. Update `AppSidebar.tsx` — add `Users` nav item + remove theme label text
2. Update `DashboardLayout.tsx` — add top-right theme icon button
3. Update `App.tsx` — register new route
4. Create `src/pages/Users.tsx` — full Users page with table + invite modal
