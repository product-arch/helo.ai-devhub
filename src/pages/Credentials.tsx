import { useState, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp, AppCredential } from "@/contexts/AppContext";
import { usePermission } from "@/hooks/usePermission";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CredentialCard } from "@/components/CredentialCard";
import { CreateCredentialModal } from "@/components/CreateCredentialModal";
import { CredentialDetailPanel } from "@/components/CredentialDetailPanel";
import { AuditLogDrawer } from "@/components/AuditLogDrawer";
import {
  Eye, EyeOff, Copy, Check, RefreshCw, Trash2, AlertTriangle,
  CheckCircle2, XCircle, Lock, Pause, Shield, ChevronDown, Play, Plus, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product } from "@/contexts/AppContext";

// --- Mocked data ---

const MOCK_USAGE = {
  requests24h: "12,847",
  errorRate: "0.3%",
  rateLimit: "1,000 RPM",
  topEndpoint: "POST /v1/sms/send",
};

const MOCK_ERRORS = [
  { timestamp: "Feb 20, 14:32", endpoint: "/v1/sms/send", status: 429, error: "Rate limit exceeded" },
  { timestamp: "Feb 20, 14:10", endpoint: "/v1/wa/template", status: 403, error: "Capability not enabled" },
  { timestamp: "Feb 20, 12:55", endpoint: "/v1/rcs/send", status: 400, error: "Invalid recipient format" },
  { timestamp: "Feb 20, 11:03", endpoint: "/v1/sms/send", status: 500, error: "Upstream provider timeout" },
  { timestamp: "Feb 20, 09:47", endpoint: "/v1/wa/template", status: 401, error: "Invalid API key" },
];

const MOCK_AUDIT = [
  { timestamp: "Jan 15, 2026 09:00", actor: "admin@acme.com", action: "Key created", prev: "—", next: "Active" },
  { timestamp: "Jan 28, 2026 14:22", actor: "admin@acme.com", action: "Key rotated", prev: "Active", next: "Active (new key)" },
  { timestamp: "Feb 05, 2026 11:15", actor: "admin@acme.com", action: "Key suspended", prev: "Active", next: "Suspended" },
  { timestamp: "Feb 05, 2026 16:40", actor: "admin@acme.com", action: "Key reactivated", prev: "Suspended", next: "Active" },
  { timestamp: "Feb 12, 2026 08:30", actor: "system", action: "IP change detected", prev: "203.0.113.10", next: "198.51.100.22" },
  { timestamp: "Feb 18, 2026 10:05", actor: "admin@acme.com", action: "Key rotated", prev: "Active", next: "Active (new key)" },
];

const CHANNEL_EXAMPLES: Record<string, { endpoint: string; body: string }> = {
  sms: {
    endpoint: "POST /v1/sms/send",
    body: `{
    "to": "+1234567890",
    "message": "Hello from helo.ai!"
  }`,
  },
  rcs: {
    endpoint: "POST /v1/rcs/send",
    body: `{
    "to": "+1234567890",
    "message": {
      "contentType": "richCard",
      "title": "Order Update",
      "description": "Your order #1234 has shipped.",
      "media": "https://cdn.example.com/image.jpg",
      "suggestions": [
        { "text": "Track Order", "postbackData": "track_1234" }
      ]
    }
  }`,
  },
  whatsapp: {
    endpoint: "POST /v1/wa/template/send",
    body: `{
    "to": "+1234567890",
    "template": {
      "name": "order_confirmation",
      "language": "en",
      "components": [
        { "type": "body", "parameters": [{ "type": "text", "text": "#1234" }] }
      ]
    }
  }`,
  },
  webhooks: {
    endpoint: "POST /v1/webhooks/subscribe",
    body: `{
    "url": "https://api.example.com/webhooks/helo",
    "events": [
      "message.sent",
      "message.delivered",
      "message.failed"
    ]
  }`,
  },
};

const CHANNEL_PRODUCT_MAP: Record<string, string> = {
  sms: "sms",
  rcs: "rcs",
  whatsapp: "whatsapp",
  webhooks: "webhooks",
};

// --- Component ---

export default function Credentials() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, rotateApiKey, rotateCredential, suspendCredential, revokeCredential, deleteCredential, updateCredential } = useApp();
  const app = apps.find((a) => a.id === appId);
  const canCreate = usePermission("credentials.create");
  const canManage = usePermission("credentials.rotate");
  const canViewSecrets = usePermission("credentials.view_secrets");
  const [selectedCredential, setSelectedCredential] = useState<AppCredential | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  const isProduction = app.environment === "production";
  const baseUrl = isProduction ? "https://api.helo.ai" : "https://sandbox.helo.ai";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied", description: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const getCapabilityIcon = (status: string) => {
    if (status === "enabled") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === "restricted") return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <XCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const hasEnabledCapabilities = (product: Product) =>
    product.status !== "disabled" && product.capabilities.some((c) => c.status === "enabled" || c.status === "restricted");

  // Detail view is now handled by CredentialDetailPanel (side panel)

  // --- Credentials List View ---

  const CREDENTIAL_LIMIT = 20;
  const isAdmin = true; // Derived from role context — admin sees all, developer sees own
  const currentUserEmail = app.email;

  // Role-based filtering: developer sees only own credentials
  const visibleCredentials = isAdmin
    ? app.credentials
    : app.credentials.filter((c) => c.createdBy === currentUserEmail);

  // Search & filter state already declared at top (hooks before early return)

  const filteredCredentials = visibleCredentials.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  // Summary counts
  const statusCounts = visibleCredentials.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Expiry checks
  const now = new Date();
  const expiringSoon = visibleCredentials.filter((c) => {
    if (!c.expiresAt || c.status === "revoked") return false;
    const diff = new Date(c.expiresAt).getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  });
  const alreadyExpired = visibleCredentials.filter((c) => {
    if (!c.expiresAt || c.status === "revoked") return false;
    return new Date(c.expiresAt).getTime() < now.getTime();
  });

  const usagePercent = (visibleCredentials.length / CREDENTIAL_LIMIT) * 100;
  const atLimit = visibleCredentials.length >= CREDENTIAL_LIMIT;

  return (
    <DashboardLayout>
      <PageHeader
        title="API Credentials"
        breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "API Credentials" }]}
      />

      {/* Suspended app banner */}
      {app.appStatus === "suspended" && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-6">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">This app is suspended. All API calls are rejected.</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Expiry banners */}
        {alreadyExpired.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              {alreadyExpired.length} credential{alreadyExpired.length !== 1 ? "s have" : " has"} expired. Rotate or delete to maintain security.
            </p>
          </div>
        )}
        {expiringSoon.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <p className="text-sm text-warning">
              {expiringSoon.length} credential{expiringSoon.length !== 1 ? "s" : ""} expiring soon. Review and rotate before they expire.
            </p>
          </div>
        )}

        {/* Header row: summary + create */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {visibleCredentials.length} credential{visibleCredentials.length !== 1 ? "s" : ""}
              {statusCounts.active ? ` · ${statusCounts.active} Active` : ""}
              {statusCounts.suspended ? ` · ${statusCounts.suspended} Suspended` : ""}
              {statusCounts.expired ? ` · ${statusCounts.expired} Expired` : ""}
              {statusCounts.revoked ? ` · ${statusCounts.revoked} Revoked` : ""}
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateModalOpen(true)} disabled={atLimit}>
              <Plus className="h-4 w-4 mr-2" /> Create Credential
            </Button>
          )}
        </div>

        {/* Credential limit warning */}
        {usagePercent >= 80 && (
          <div className="flex items-center justify-between text-sm">
            <span className={cn("text-xs", atLimit ? "text-destructive" : "text-warning")}>
              {atLimit
                ? "Credential limit reached. Revoke or delete unused credentials to create new ones."
                : `You are using ${visibleCredentials.length} of ${CREDENTIAL_LIMIT} allowed credentials.`}
            </span>
            <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", atLimit ? "bg-destructive" : "bg-warning")}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search credentials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Types</option>
              <option value="api_key">API Key</option>
              <option value="oauth2">OAuth 2.0</option>
              <option value="service_account">Service Account</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {/* Credential cards */}
        <div className="grid gap-4">
          {filteredCredentials.map((cred) => (
            <CredentialCard
              key={cred.id}
              credential={cred}
              canManage={canManage}
              isAdmin={isAdmin}
              onView={() => setSelectedCredential(cred)}
              onRotate={() => {
                rotateCredential(app.id, cred.id);
                toast({ title: "Credential rotated" });
              }}
              onSuspend={() => {
                if (cred.status === "suspended") {
                  updateCredential(app.id, cred.id, { status: "active" });
                  toast({ title: "Credential reactivated" });
                } else {
                  suspendCredential(app.id, cred.id);
                  toast({ title: "Credential suspended" });
                }
              }}
              onRevoke={() => {
                revokeCredential(app.id, cred.id);
                toast({ title: "Credential revoked", variant: "destructive" });
              }}
              onDelete={() => {
                deleteCredential(app.id, cred.id);
                toast({ title: "Credential deleted" });
              }}
            />
          ))}
          {filteredCredentials.length === 0 && visibleCredentials.length > 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No credentials match your filters.
            </div>
          )}
          {visibleCredentials.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mb-1">No credentials yet</h3>
              <p className="text-sm text-muted-foreground">Create a credential to authenticate API calls for this App.</p>
            </div>
          )}
        </div>
      </div>

      <CreateCredentialModal open={createModalOpen} onOpenChange={setCreateModalOpen} appId={app.id} />

      <CredentialDetailPanel
        credential={selectedCredential}
        open={!!selectedCredential}
        onOpenChange={(open) => { if (!open) setSelectedCredential(null); }}
        isAdmin={isAdmin}
        onRotate={() => {
          if (selectedCredential) {
            rotateCredential(app.id, selectedCredential.id);
            toast({ title: "Credential rotated" });
          }
        }}
        onSuspend={() => {
          if (selectedCredential) {
            if (selectedCredential.status === "suspended") {
              updateCredential(app.id, selectedCredential.id, { status: "active" });
              toast({ title: "Credential reactivated" });
            } else {
              suspendCredential(app.id, selectedCredential.id);
              toast({ title: "Credential suspended" });
            }
          }
        }}
        onRevoke={() => {
          if (selectedCredential) {
            revokeCredential(app.id, selectedCredential.id);
            toast({ title: "Credential revoked", variant: "destructive" });
          }
        }}
        onDelete={() => {
          if (selectedCredential) {
            deleteCredential(app.id, selectedCredential.id);
            toast({ title: "Credential deleted" });
            setSelectedCredential(null);
          }
        }}
        onUpdateName={(name) => {
          if (selectedCredential) {
            updateCredential(app.id, selectedCredential.id, { name });
          }
        }}
      />
    </DashboardLayout>
  );
}
