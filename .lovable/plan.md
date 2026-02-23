
# Update Users Page -- Three Roles with Role Info Modal

## Overview

Add a "Tester" role alongside the existing Admin and Developer roles, populate the table with dummy data for all three roles, and add a clickable info icon next to the "Users" heading that opens a modal describing each role's permissions and scope.

---

## Changes

### 1. Add Tester Role

Extend `AppRole` type to `"admin" | "developer" | "tester"` and add a new entry in `ROLE_CONFIG`:

| Role | Icon | Badge Style |
|---|---|---|
| Admin | ShieldCheck | Amber (`bg-warning/10 text-warning`) |
| Developer | Code2 | Blue (`bg-primary/10 text-primary`) |
| Tester | FlaskConical | Green (`bg-success/10 text-success`) |

### 2. Dummy Data (3 Users)

Replace `DEFAULT_USERS` with three entries:

| Name | Email | Role | Status |
|---|---|---|---|
| Soumik Choudhury | soumik@helo.ai | Admin | Active |
| Arjun Mehta | arjun@helo.ai | Developer | Active |
| Priya Sharma | priya@helo.ai | Tester | Active |

### 3. Invite Modal -- Add Tester Option

Add a third `SelectItem` for "Tester" in the role selector within the invite dialog.

### 4. Role Info Tooltip + Modal

- Add a small `HelpCircle` icon button next to the "Users" heading
- Clicking it opens a new `Dialog` ("Roles and Permissions") displaying a table:

| Role | Description | Scope of Access |
|---|---|---|
| Admin | Full control of the app lifecycle. Only role that can invite other users. | All features: credentials, products, webhooks, settings, user management |
| Developer | Can manage products, webhooks, logs, and settings. Cannot modify credentials, app lifecycle, or invite users. | Products, Webhooks, Logs, Settings (read-only credentials, no user invites) |
| Tester | Can view and test existing configurations. Cannot configure new products or change webhook/product API scope. | Logs, read-only Products/Webhooks/Credentials/Settings |

---

## File Modified

| File | Action |
|---|---|
| `src/pages/Users.tsx` | Update types, add role config, dummy data, tester select option, help icon, and roles modal |

## Technical Notes

- Import `FlaskConical` and `HelpCircle` from lucide-react
- Add `rolesModalOpen` state for the permissions dialog
- The roles modal uses the existing `Dialog` component with a simple table layout
- No context or other file changes needed
