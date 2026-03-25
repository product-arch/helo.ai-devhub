import { AppCredential } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Key, Globe, Server, MoreVertical, RefreshCw, Pause, Play, XCircle, Trash2, Eye, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialCardProps {
  credential: AppCredential;
  onView: () => void;
  onRotate: () => void;
  onSuspend: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  onViewAudit?: () => void;
  canManage: boolean;
  isAdmin?: boolean;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  api_key: { label: "API Key", icon: Key, className: "bg-primary/10 text-primary border-primary/20" },
  oauth2: { label: "OAuth 2.0", icon: Globe, className: "bg-accent text-accent-foreground border-border" },
  service_account: { label: "Service Account", icon: Server, className: "bg-warning/10 text-warning border-warning/20" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  suspended: { label: "Suspended", className: "bg-warning/10 text-warning border-warning/20" },
  revoked: { label: "Revoked", className: "bg-destructive/10 text-destructive border-destructive/20" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
};

function getExpiryDisplay(expiresAt: string | null): { text: string; className: string } | null {
  if (!expiresAt) return { text: "Permanent", className: "text-muted-foreground" };
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Expired", className: "text-destructive" };
  if (diffDays <= 30) return { text: `Expires in ${diffDays}d`, className: "text-warning" };
  return { text: `Expires ${expiry.toLocaleDateString()}`, className: "text-muted-foreground" };
}

export function CredentialCard({
  credential,
  onView,
  onRotate,
  onSuspend,
  onRevoke,
  onDelete,
  onViewAudit,
  canManage,
  isAdmin = false,
}: CredentialCardProps) {
  const type = typeConfig[credential.type] || typeConfig.api_key;
  const status = statusConfig[credential.status] || statusConfig.active;
  const TypeIcon = type.icon;
  const expiry = getExpiryDisplay(credential.expiresAt);

  const isRevoked = credential.status === "revoked";
  const isExpired = credential.status === "expired";
  const showRotate = !isRevoked && !isExpired;
  const showSuspend = !isRevoked;
  const showRevoke = !isRevoked;
  const showDelete = isRevoked;

  return (
    <Card className="hover:border-foreground/20 transition-colors cursor-pointer" onClick={onView}>
      <CardContent className="p-5">
        {/* Top row: icon + name | badges + menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-muted shrink-0">
              <TypeIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-sm truncate">{credential.name}</h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5 truncate">{credential.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Badge variant="outline" className={cn("text-[10px]", type.className)}>
              {type.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px]", status.className)}>
              {status.label}
            </Badge>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </DropdownMenuItem>
                  {showRotate && (
                    <DropdownMenuItem onClick={onRotate}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Rotate Key
                    </DropdownMenuItem>
                  )}
                  {showSuspend && (
                    <DropdownMenuItem onClick={onSuspend}>
                      {credential.status === "suspended" ? (
                        <><Play className="h-4 w-4 mr-2" /> Reactivate</>
                      ) : (
                        <><Pause className="h-4 w-4 mr-2" /> Suspend</>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onViewAudit}>
                    <FileText className="h-4 w-4 mr-2" /> View Audit Log
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {showRevoke && (
                    <DropdownMenuItem onClick={onRevoke} className="text-destructive focus:text-destructive">
                      <XCircle className="h-4 w-4 mr-2" /> Revoke
                    </DropdownMenuItem>
                  )}
                  {showDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-muted-foreground focus:text-muted-foreground">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Scopes as pills */}
        {credential.scopes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 ml-[44px]">
            {credential.scopes.flatMap((s) =>
              s.permissions.map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] font-mono bg-muted/50 border-border px-1.5 py-0">
                  {p}
                </Badge>
              ))
            )}
          </div>
        )}

        {/* Footer: metadata row */}
        <div className="flex items-center justify-between pt-3 mt-4 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Created {new Date(credential.createdAt).toLocaleDateString()}</span>
            <span>Used {credential.lastUsedAt ? new Date(credential.lastUsedAt).toLocaleDateString() : "Never"}</span>
            {isAdmin && <span>by {credential.createdBy}</span>}
          </div>
          {expiry && (
            <span className={cn("text-xs", expiry.className)}>{expiry.text}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
