import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type UserRole = "admin" | "developer";

export interface InvitedUser {
  email: string;
  role: UserRole;
}

interface EmailTagInputProps {
  users: InvitedUser[];
  onChange: (users: InvitedUser[]) => void;
  placeholder?: string;
}

export function EmailTagInput({ users, onChange, placeholder = "user@example.com" }: EmailTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("developer");

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addUser = () => {
    const trimmed = inputValue.trim();
    if (trimmed && isValidEmail(trimmed) && !users.some((u) => u.email === trimmed)) {
      onChange([...users, { email: trimmed, role: selectedRole }]);
      setInputValue("");
    }
  };

  const removeUser = (email: string) => {
    onChange(users.filter((u) => u.email !== email));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addUser();
    }
  };

  const roleLabel: Record<UserRole, string> = {
    admin: "Admin",
    developer: "Developer",
  };

  const roleBadgeClass: Record<UserRole, string> = {
    admin: "bg-role-admin/10 text-role-admin-foreground border-role-admin/20",
    developer: "bg-role-developer/10 text-role-developer-foreground border-role-developer/20",
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          type="email"
          className="flex-1"
        />
        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
          <SelectTrigger className="w-[130px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="developer">Developer</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" onClick={addUser} disabled={!inputValue.trim() || !isValidEmail(inputValue.trim())} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {users.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {users.map((user) => (
            <span key={user.email} className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {user.email}
              <span className={`ml-0.5 rounded px-1.5 py-0.5 text-[10px] border ${roleBadgeClass[user.role]}`}>
                {roleLabel[user.role]}
              </span>
              <button type="button" onClick={() => removeUser(user.email)} className="hover:text-foreground transition-colors ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
