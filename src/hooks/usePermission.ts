import { useApp } from "@/contexts/AppContext";

export function usePermission(action: string): boolean {
  const { hasPermission } = useApp();
  return hasPermission(action);
}

export function useRole() {
  const { currentUserRole } = useApp();
  return currentUserRole;
}
