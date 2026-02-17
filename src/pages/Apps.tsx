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
import { Badge } from "@/components/ui/badge";
import { Plus, Box, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun, LogOut } from "lucide-react";
import { EmailTagInput } from "@/components/EmailTagInput";

export default function Apps() {
  const { apps, createApp, selectApp, logout, accountName } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newEnv, setNewEnv] = useState<AppEnvironment>("production");
  const [newDescription, setNewDescription] = useState("");
  const [invitedDevs, setInvitedDevs] = useState<string[]>([]);

  const handleCreate = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    createApp(newName.trim(), newEmail.trim(), newEnv, newDescription.trim(), invitedDevs);
    toast({ title: "App created", description: `${newName} has been created.` });
    setNewName("");
    setNewEmail("");
    setNewEnv("production");
    setNewDescription("");
    setInvitedDevs([]);
    setOpen(false);
  };

  const handleSelectApp = (appId: string) => {
    selectApp(appId);
    navigate(`/apps/${appId}/overview`);
  };

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
        <div className="flex items-center justify-between mb-8">
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
                  <Label>Invite Developers <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                  <EmailTagInput emails={invitedDevs} onChange={setInvitedDevs} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newName.trim() || !newEmail.trim()}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {apps.map((app) => {
            const enabledCount = app.products.filter((p) => p.status !== "disabled").length;
            return (
              <Card key={app.id} className="hover:border-foreground/20 transition-colors cursor-pointer" onClick={() => handleSelectApp(app.id)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Box className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{app.name}</h3>
                        {app.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{app.description}</p>
                        )}
                        <Badge variant="outline" className={`mt-1 text-[10px] ${envColors[app.environment]}`}>
                          {app.environment}
                        </Badge>
                      </div>
                    </div>
                    {app.status === "healthy" ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{enabledCount} of {app.products.length} products enabled</span>
                    <span className="text-xs">{app.status === "healthy" ? "Healthy" : "Action required"}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
