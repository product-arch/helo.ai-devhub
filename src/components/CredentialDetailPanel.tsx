import { useState } from "react";
import { AppCredential } from "@/contexts/AppContext";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StepUpAuthModal } from "@/components/StepUpAuthModal";
import { ConsentFlowPreview } from "@/components/ConsentFlowPreview";
import {
  Copy, Check, Key, Globe, Server, Pause, Play, RefreshCw, XCircle, Trash2,
  Clock, User, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CredentialDetailPanelProps {
  credential: AppCredential | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  onRotate: () => void;
  onSuspend: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  onUpdateName: (name: string) => void;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  api_key: { label: "API Key", icon: Key },
  oauth2: { label: "OAuth 2.0", icon: Globe },
  service_account: { label: "Service Account", icon: Server },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  suspended: { label: "Suspended", className: "bg-warning/10 text-warning border-warning/20" },
  revoked: { label: "Revoked", className: "bg-destructive/10 text-destructive border-destructive/20" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
};

// Mock audit timeline
const MOCK_TIMELINE = [
  { action: "Created", actor: "admin@acme.com", date: "Jan 15, 2026 · 09:00" },
  { action: "Key Rotated", actor: "admin@acme.com", date: "Jan 28, 2026 · 14:22" },
  { action: "Suspended", actor: "admin@acme.com", date: "Feb 05, 2026 · 11:15" },
  { action: "Reactivated", actor: "admin@acme.com", date: "Feb 05, 2026 · 16:40" },
];

export function CredentialDetailPanel({
  credential,
  open,
  onOpenChange,
  isAdmin = false,
  onRotate,
  onSuspend,
  onRevoke,
  onDelete,
  onUpdateName,
}: CredentialDetailPanelProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  // Step-up auth
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Action modals
  const [rotateOpen, setRotateOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revokeConfirmName, setRevokeConfirmName] = useState("");
  const [gracePeriod, setGracePeriod] = useState<"immediate" | "15" | "custom">("immediate");
  const [customGrace, setCustomGrace] = useState(60);

  if (!credential) return null;

  const type = typeConfig[credential.type] || typeConfig.api_key;
  const status = statusConfig[credential.status] || statusConfig.active;
  const isRevoked = credential.status === "revoked";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const triggerStepUp = (action: string) => {
    setPendingAction(action);
    setStepUpOpen(true);
  };

  const handleStepUpSuccess = () => {
    if (pendingAction === "rotate") setRotateOpen(true);
    if (pendingAction === "suspend") setSuspendOpen(true);
    if (pendingAction === "revoke") setRevokeOpen(true);
    if (pendingAction === "delete") setDeleteOpen(true);
    setPendingAction(null);
  };

  const handleSaveName = () => {
    if (nameValue.trim() && nameValue.trim() !== credential.name) {
      onUpdateName(nameValue.trim());
      toast({ title: "Name updated" });
    }
    setEditingName(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    onBlur={handleSaveName}
                  />
                </div>
              ) : (
                <span
                  className="cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5"
                  onClick={() => {
                    setNameValue(credential.name);
                    setEditingName(true);
                  }}
                >
                  {credential.name}
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </span>
              )}
            </SheetTitle>
            <SheetDescription>Credential details and management</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pb-8">
            {/* Identity section */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Credential ID</p>
                <div className="flex items-center gap-1.5">
                  <code className="text-xs font-mono truncate">{credential.id}</code>
                  <button onClick={() => handleCopy(credential.id, "ID")} className="shrink-0 text-muted-foreground hover:text-foreground">
                    {copied === "ID" ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <Badge variant="outline" className="text-[10px]">{type.label}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className={cn("text-[10px]", status.className)}>{status.label}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-xs">{new Date(credential.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created by</p>
                <p className="text-xs">{credential.createdBy}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last used</p>
                <p className="text-xs">{credential.lastUsedAt ? new Date(credential.lastUsedAt).toLocaleDateString() : "Never"}</p>
              </div>
              {credential.expiresAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Expires</p>
                  <p className="text-xs">{new Date(credential.expiresAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* OAuth details */}
            {credential.type === "oauth2" && (
              <div className="space-y-3 rounded-md border p-3">
                <p className="text-xs font-medium">OAuth 2.0 Details</p>
                {credential.clientId && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Client ID</span>
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono">{credential.clientId}</code>
                      <button onClick={() => handleCopy(credential.clientId!, "Client ID")} className="text-muted-foreground hover:text-foreground">
                        {copied === "Client ID" ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                )}
                {credential.grantTypes && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Grant Types: </span>
                    {credential.grantTypes.join(", ")}
                  </div>
                )}
                {credential.redirectUris && credential.redirectUris.length > 0 && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Redirect URIs:</span>
                    <div className="mt-1 space-y-0.5">
                      {credential.redirectUris.map((uri) => (
                        <code key={uri} className="block font-mono text-[11px]">{uri}</code>
                      ))}
                    </div>
                  </div>
                )}
                {credential.thirdPartyAppName && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">App Name: </span>
                    {credential.thirdPartyAppName}
                  </div>
                )}
                <ConsentFlowPreview credential={credential} />
              </div>
            )}

            {/* Service Account details */}
            {credential.type === "service_account" && credential.publicKey && (
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-xs font-medium">Service Account</p>
                <div className="text-xs">
                  <span className="text-muted-foreground">Key Format: </span>{credential.keyFormat}
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Public Key Fingerprint: </span>
                  <code className="font-mono">{credential.publicKey.slice(0, 20)}...</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => triggerStepUp("replace_key")}
                >
                  Replace Public Key
                </Button>
              </div>
            )}

            {/* Scopes */}
            {credential.scopes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Assigned Scopes</p>
                {credential.scopes.map((scope) => (
                  <div key={scope.product} className="space-y-1">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{scope.product}</p>
                    <div className="flex flex-wrap gap-1">
                      {scope.permissions.map((p) => (
                        <Badge key={p} variant="outline" className="text-[10px] font-mono">{p}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status History Timeline */}
            <div className="space-y-3">
              <p className="text-xs font-medium">Status History</p>
              <div className="relative pl-4 border-l border-border space-y-4">
                {MOCK_TIMELINE.map((entry, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full bg-muted border-2 border-border" />
                    <p className="text-xs font-medium">{entry.action}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3 w-3" /> {entry.actor} · <Clock className="h-3 w-3" /> {entry.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
              <p className="text-xs font-medium text-destructive">Danger Zone</p>
              <div className="flex flex-wrap gap-2">
                {!isRevoked && credential.status !== "expired" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => triggerStepUp("rotate")}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Rotate
                  </Button>
                )}
                {!isRevoked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("text-xs h-8", credential.status === "suspended" ? "text-success border-success/20 hover:bg-success/10" : "text-warning border-warning/20 hover:bg-warning/10")}
                    onClick={() => triggerStepUp("suspend")}
                  >
                    {credential.status === "suspended" ? (
                      <><Play className="h-3.5 w-3.5 mr-1.5" /> Reactivate</>
                    ) : (
                      <><Pause className="h-3.5 w-3.5 mr-1.5" /> Suspend</>
                    )}
                  </Button>
                )}
                {!isRevoked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                    onClick={() => triggerStepUp("revoke")}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Revoke
                  </Button>
                )}
                {isRevoked && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => triggerStepUp("delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Step-Up Auth */}
      <StepUpAuthModal
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        onSuccess={handleStepUpSuccess}
        actionLabel={pendingAction === "rotate" ? "rotating this credential" : pendingAction === "suspend" ? "changing credential status" : pendingAction === "revoke" ? "revoking this credential" : pendingAction === "delete" ? "deleting this credential" : "this action"}
      />

      {/* Rotate Modal */}
      <AlertDialog open={rotateOpen} onOpenChange={setRotateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate Credential Key</AlertDialogTitle>
            <AlertDialogDescription>
              Your current key will be invalidated. Any system using it must be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs">Grace Period</Label>
            <div className="space-y-2">
              {[
                { value: "immediate" as const, label: "Immediate", desc: "Old key invalidated instantly" },
                { value: "15" as const, label: "15-minute grace period", desc: "Old key valid for 15 more minutes" },
                { value: "custom" as const, label: "Custom", desc: "Set a custom grace period" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                    gracePeriod === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20"
                  )}
                >
                  <input
                    type="radio"
                    name="grace"
                    checked={gracePeriod === opt.value}
                    onChange={() => setGracePeriod(opt.value)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
              {gracePeriod === "custom" && (
                <div className="flex items-center gap-2 pl-8">
                  <Input
                    type="number"
                    value={customGrace}
                    onChange={(e) => setCustomGrace(Math.min(1440, Number(e.target.value)))}
                    min={1}
                    max={1440}
                    className="w-24 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">minutes (max 24h)</span>
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onRotate(); setRotateOpen(false); }}>Rotate Key</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend / Reactivate Modal */}
      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {credential.status === "suspended" ? "Reactivate this credential?" : "Suspend this credential?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {credential.status === "suspended"
                ? "This credential will resume accepting API calls immediately."
                : "All API calls using this credential will immediately return 403 Forbidden. You can reactivate it at any time."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onSuspend(); setSuspendOpen(false); }}
              className={credential.status === "suspended" ? "bg-success text-success-foreground hover:bg-success/90" : "bg-warning text-warning-foreground hover:bg-warning/90"}
            >
              {credential.status === "suspended" ? "Confirm Reactivation" : "Confirm Suspension"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Modal */}
      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Revoke this credential?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. This credential will immediately stop working and cannot be restored. All issued tokens will be invalidated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs">Type <span className="font-mono font-bold">{credential.name}</span> to confirm</Label>
            <Input
              value={revokeConfirmName}
              onChange={(e) => setRevokeConfirmName(e.target.value)}
              placeholder="Type credential name to confirm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRevokeConfirmName("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onRevoke(); setRevokeOpen(false); setRevokeConfirmName(""); }}
              disabled={revokeConfirmName !== credential.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              Revoke Credential
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Modal */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this credential record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the credential from your list. All audit log entries will be permanently retained regardless.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onDelete(); setDeleteOpen(false); onOpenChange(false); }}>
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
