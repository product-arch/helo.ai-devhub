import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, Code2, UserPlus, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppRole = "admin" | "developer";
type UserStatus = "active" | "pending";

interface AppUser {
  id: string;
  name: string | null;
  email: string;
  role: AppRole;
  status: UserStatus;
}

const ROLE_CONFIG: Record<AppRole, { label: string; icon: React.ElementType; className: string }> = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  developer: {
    label: "Developer",
    icon: Code2,
    className: "bg-primary/10 text-primary border-primary/20",
  },
};

const DEFAULT_USERS: AppUser[] = [
  { id: "1", name: "Soumik Choudhury", email: "soumik@helo.ai", role: "admin", status: "active" },
];

export default function Users() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("developer");
  const [submitting, setSubmitting] = useState(false);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSubmitting(true);
    const newUser: AppUser = {
      id: crypto.randomUUID(),
      name: null,
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "pending",
    };
    setUsers((prev) => [...prev, newUser]);
    toast({
      title: "Invite sent",
      description: `An invitation has been sent to ${inviteEmail.trim()}.`,
    });
    setInviteEmail("");
    setInviteRole("developer");
    setSubmitting(false);
    setModalOpen(false);
  }

  function handleRemove(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage who has access to this app</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const role = ROLE_CONFIG[user.role];
              const RoleIcon = role.icon;
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-foreground">
                    {user.name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground">{user.email}</span>
                    {user.status === "pending" && (
                      <Badge variant="outline" className="ml-2 text-[10px] bg-warning/10 text-warning border-warning/20">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`inline-flex items-center gap-1.5 text-xs ${role.className}`}>
                      <RoleIcon className="h-3 w-3" />
                      {role.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-warning">
                        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemove(user.id)}
                          disabled={user.role === "admin" && users.filter(u => u.role === "admin").length === 1}
                        >
                          Remove user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Invite User Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-warning" />
                      Admin
                    </span>
                  </SelectItem>
                  <SelectItem value="developer">
                    <span className="flex items-center gap-2">
                      <Code2 className="h-3.5 w-3.5 text-primary" />
                      Developer
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !inviteEmail.trim()}>
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
