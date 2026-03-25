import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { AppEnvironment } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Box, AlertTriangle, CheckCircle2, ShieldCheck, MoreVertical, Trash2, Copy, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, LogOut } from "lucide-react";
import { EmailTagInput, InvitedUser } from "@/components/EmailTagInput";

export default function Apps() {
  const { apps, createApp, deleteApp, duplicateApp, selectApp, logout, accountName } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newEnv, setNewEnv] = useState<AppEnvironment>("production");
  const [newDescription, setNewDescription] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteAppId, setDeleteAppId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    createApp(newName.trim(), newEmail.trim(), newEnv, newDescription.trim(), invitedUsers.map(u => u.email));
    toast({ title: "App created", description: `${newName} has been created.` });
    setNewName("");
    setNewEmail("");
    setNewEnv("production");
    setNewDescription("");
    setInvitedUsers([]);
    setOpen(false);
  };

  const handleSelectApp = (appId: string) => {
    selectApp(appId);
    navigate(`/apps/${appId}/overview`);
  };

  const handleDeleteApp = () => {
    if (!deleteAppId) return;
    const app = apps.find(a => a.id === deleteAppId);
    deleteApp(deleteAppId);
    toast({ title: "App deleted", description: `${app?.name} has been deleted.` });
    setDeleteAppId(null);
  };

  const handleDuplicateApp = (appId: string) => {
    duplicateApp(appId);
    const app = apps.find(a => a.id === appId);
    toast({ title: "App duplicated", description: `${app?.name} has been duplicated.` });
  };

  const filteredApps = apps.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return app.name.toLowerCase().includes(q) || app.id.toLowerCase().includes(q);
  });

  const envColors: Record<AppEnvironment, string> = {
    production: "bg-success/10 text-success border-success/20",
    staging: "bg-warning/10 text-warning border-warning/20",
    development: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border flex items-center justify-between px-6">
        <span className="font-semibold tracking-tight">helo.ai</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">{accountName}</span>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Apps</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Create App</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create App</DialogTitle>
                <DialogDescription>Apps are containers for your messaging products and API credentials.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="app-name">App Name <span className="text-destructive">*</span></Label>
                  <Input id="app-name" placeholder="My App" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-email">Email Account <span className="text-destructive">*</span></Label>
                  <Input id="app-email" type="email" placeholder="admin@company.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Select value={newEnv} onValueChange={(v) => setNewEnv(v as AppEnvironment)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-desc">Description</Label>
                  <Textarea id="app-desc" placeholder="Describe what this app does..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Invite Users <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                  <EmailTagInput users={invitedUsers} onChange={setInvitedUsers} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newName.trim() || !newEmail.trim()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search / Filter */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by app name or app ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredApps.map((app) => {
            const enabledCount = app.products.filter((p) => p.status !== "disabled").length;
            return (
              <Card key={app.id} className="hover:border-foreground/20 transition-colors cursor-pointer" onClick={() => handleSelectApp(app.id)}>
                <CardContent className="p-5">
                  {/* Top row: icon + name | health + menu */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Box className="h-5 w-5" />
                      </div>
                      <h3 className="font-medium">{app.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {app.status === "healthy" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleDuplicateApp(app.id)}>
                            <Copy className="h-4 w-4 mr-2" />Duplicate App
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteAppId(app.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete App
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Body: ID + description */}
                  <div className="mt-2 ml-[44px]">
                    <p className="text-[11px] font-mono text-muted-foreground">{app.id}</p>
                    {app.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{app.description}</p>
                    )}
                  </div>

                  {/* Badges row */}
                  <div className="flex items-center gap-2 mt-3 ml-[44px]">
                    <Badge variant="outline" className={`text-[10px] ${envColors[app.environment]}`}>
                      {app.environment}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 text-[10px] bg-role-admin/10 text-role-admin-foreground border-role-admin/20">
                      <ShieldCheck className="h-3 w-3" />Admin
                    </Badge>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 mt-4 border-t border-border">
                    <span>{enabledCount} of {app.products.length} products enabled</span>
                    <span className="text-xs">{app.status === "healthy" ? "Healthy" : "Action required"}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredApps.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No apps match your search.
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAppId} onOpenChange={(open) => !open && setDeleteAppId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete App</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{apps.find(a => a.id === deleteAppId)?.name}</span> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteApp} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
