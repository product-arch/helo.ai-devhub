import { AppCredential } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Key, Globe, Server, MoreVertical, RefreshCw, Pause, Play, XCircle, Trash2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialCardProps {
  credential: AppCredential;
  onView: () => void;
  onRotate: () => void;
  onSuspend: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  canManage: boolean;
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

export function CredentialCard({ credential, onView, onRotate, onSuspend, onRevoke, onDelete, canManage }: CredentialCardProps) {
  const type = typeConfig[credential.type] || typeConfig.api_key;
  const status = statusConfig[credential.status] || statusConfig.active;
  const TypeIcon = type.icon;

  const scopeSummary = credential.scopes.length > 0
    ? credential.scopes.map((s) => s.product).join(", ")
    : "No scopes";

  return (
    <Card className="hover:border-foreground/20 transition-colors cursor-pointer" onClick={onView}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <TypeIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{credential.name}</h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{credential.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                  <DropdownMenuItem onClick={onRotate} disabled={credential.status === "revoked"}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Rotate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSuspend} disabled={credential.status === "revoked"}>
                    {credential.status === "suspended" ? (
                      <><Play className="h-4 w-4 mr-2" /> Reactivate</>
                    ) : (
                      <><Pause className="h-4 w-4 mr-2" /> Suspend</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onRevoke} disabled={credential.status === "revoked"} className="text-warning focus:text-warning">
                    <XCircle className="h-4 w-4 mr-2" /> Revoke
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="mb-0.5">Created</p>
            <p className="text-foreground">{new Date(credential.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="mb-0.5">Last Used</p>
            <p className="text-foreground">{credential.lastUsedAt ? new Date(credential.lastUsedAt).toLocaleDateString() : "Never"}</p>
          </div>
          <div>
            <p className="mb-0.5">Scopes</p>
            <p className="text-foreground truncate">{scopeSummary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
