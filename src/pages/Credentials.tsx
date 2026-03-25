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

  // If a credential is selected, show detail view
  if (selectedCredential) {
    const cred = app.credentials.find((c) => c.id === selectedCredential.id) || selectedCredential;
    const maskedKey = cred.apiKey ? cred.apiKey.slice(0, 10) + "••••••••••••••••••••" : "";

    const statusBadgeMap: Record<string, { label: string; variant: "outline" | "destructive" | "secondary"; className: string }> = {
      active: { label: "Active", variant: "outline", className: "bg-success/10 text-success border-success/20" },
      suspended: { label: "Suspended", variant: "outline", className: "bg-warning/10 text-warning border-warning/20" },
      revoked: { label: "Revoked", variant: "destructive", className: "" },
      expired: { label: "Expired", variant: "secondary", className: "" },
    };

    return (
      <DashboardLayout>
        <PageHeader
          title="API Credentials"
          breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "API Credentials", href: `/apps/${appId}/credentials` }, { label: cred.name }]}
        />

        <div className="space-y-8">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCredential(null)} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Credentials
          </Button>

          {cred.status === "suspended" && (
            <div className="flex items-center gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <p className="text-sm font-medium text-warning">This credential is suspended. API calls using it will be rejected.</p>
            </div>
          )}

          {/* Credential Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" /> {cred.name}
                  </CardTitle>
                  <CardDescription>Identity and lifecycle for this credential</CardDescription>
                </div>
                <Badge variant="outline" className={isProduction ? "bg-success/10 text-success border-success/20 hover:bg-success/10" : "bg-warning/10 text-warning border-warning/20 hover:bg-warning/10"}>
                  {isProduction ? "Production" : "Staging"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Credential ID</p>
                  <p className="font-mono text-xs">{cred.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Type</p>
                  <Badge variant="outline" className="text-xs">
                    {cred.type === "api_key" ? "API Key" : cred.type === "oauth2" ? "OAuth 2.0" : "Service Account"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Status</p>
                  <Badge variant={statusBadgeMap[cred.status].variant} className={statusBadgeMap[cred.status].className}>
                    {statusBadgeMap[cred.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Created</p>
                  <p>{new Date(cred.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Created by</p>
                  <p>{cred.createdBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Last used</p>
                  <p>{cred.lastUsedAt ? new Date(cred.lastUsedAt).toLocaleDateString() : "Never"}</p>
                </div>
                {cred.expiresAt && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Expires</p>
                    <p>{new Date(cred.expiresAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Secret display */}
              {canViewSecrets && cred.type === "api_key" && cred.apiKey && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={showKey ? cred.apiKey : maskedKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(cred.apiKey!)}>
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {showKey && (
                    <p className="text-xs text-warning flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Key is visible. Hide when done.
                    </p>
                  )}
                </div>
              )}

              {canViewSecrets && cred.type === "oauth2" && (
                <div className="space-y-2 rounded-md border p-3">
                  <div className="text-xs"><span className="text-muted-foreground">Client ID:</span> <code className="font-mono">{cred.clientId}</code></div>
                  <div className="text-xs"><span className="text-muted-foreground">Client Secret:</span> <code className="font-mono">{showKey ? cred.clientSecret : "••••••••••••"}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => setShowKey(!showKey)}>
                      {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  {cred.grantTypes && <div className="text-xs"><span className="text-muted-foreground">Grant Types:</span> {cred.grantTypes.join(", ")}</div>}
                  {cred.thirdPartyAppName && <div className="text-xs"><span className="text-muted-foreground">App Name:</span> {cred.thirdPartyAppName}</div>}
                </div>
              )}

              {/* Scopes */}
              {cred.scopes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Assigned Scopes</p>
                  <div className="space-y-1">
                    {cred.scopes.map((scope) => (
                      <div key={scope.product} className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-[10px]">{scope.product}</Badge>
                        <span className="text-muted-foreground">{scope.permissions.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={cred.status === "revoked"}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Rotate
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Rotate Credential?</AlertDialogTitle>
                        <AlertDialogDescription>This will generate new secrets and invalidate the current ones.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          rotateCredential(app.id, cred.id);
                          toast({ title: "Credential rotated", description: "Update your integrations with the new secrets." });
                        }}>Rotate</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={cred.status === "revoked"}>
                        {cred.status === "suspended" ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                        {cred.status === "suspended" ? "Reactivate" : "Suspend"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{cred.status === "suspended" ? "Reactivate?" : "Suspend?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {cred.status === "suspended"
                            ? "This will reactivate the credential."
                            : "This will temporarily disable this credential."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          if (cred.status === "suspended") {
                            updateCredential(app.id, cred.id, { status: "active" });
                            toast({ title: "Credential reactivated" });
                          } else {
                            suspendCredential(app.id, cred.id);
                            toast({ title: "Credential suspended" });
                          }
                        }}>{cred.status === "suspended" ? "Reactivate" : "Suspend"}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={cred.status === "revoked"}>
                        <Trash2 className="h-4 w-4 mr-2" /> Revoke
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke Credential?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently revoke this credential. This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          revokeCredential(app.id, cred.id);
                          toast({ title: "Credential revoked", variant: "destructive" });
                        }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Effective API Scope */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Effective API Scope</CardTitle>
              <CardDescription>API access enforced by this credential's scopes and enabled capabilities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {app.products.map((product) => {
                const allDisabled = product.capabilities.every((c) => c.status === "disabled");
                return (
                  <Collapsible key={product.id}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-3 text-sm font-medium hover:bg-muted/50 transition-colors">
                      <span className="flex items-center gap-2">
                        {product.name}
                        <StatusBadge status={product.status} />
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3 pt-2 pb-1">
                      {allDisabled ? (
                        <p className="text-sm text-muted-foreground py-2">No capabilities enabled</p>
                      ) : (
                        <div className="space-y-1.5">
                          {product.capabilities.map((cap) => (
                            <div key={cap.id} className="flex items-center gap-2 text-sm py-1">
                              {getCapabilityIcon(cap.status)}
                              <span>{cap.name}</span>
                              <StatusBadge status={cap.status} className="ml-auto" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CardContent>
          </Card>

          {/* Usage & Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Usage & Operational Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { label: "Requests (24h)", value: MOCK_USAGE.requests24h },
                  { label: "Error rate", value: MOCK_USAGE.errorRate },
                  { label: "Rate limit", value: MOCK_USAGE.rateLimit },
                  { label: "Top endpoint", value: MOCK_USAGE.topEndpoint },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-muted-foreground text-xs mb-1">{item.label}</p>
                    <p className="font-medium font-mono">{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Recent API Errors</h4>
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Timestamp</TableHead>
                        <TableHead className="text-xs">Endpoint</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_ERRORS.map((e, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-mono">{e.timestamp}</TableCell>
                          <TableCell className="text-xs font-mono">{e.endpoint}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="font-mono">{e.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{e.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Audit Activity</CardTitle>
                <Badge variant="outline" className="text-xs gap-1">
                  <Lock className="h-3 w-3" /> Immutable log
                </Badge>
              </div>
              <CardDescription>Entries cannot be modified or deleted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Timestamp</TableHead>
                      <TableHead className="text-xs">Actor</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs">Previous State</TableHead>
                      <TableHead className="text-xs">New State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_AUDIT.map((entry, i) => (
                      <TableRow key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <TableCell className="text-xs font-mono">{entry.timestamp}</TableCell>
                        <TableCell className="text-xs">{entry.actor}</TableCell>
                        <TableCell className="text-xs font-medium">{entry.action}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{entry.prev}</TableCell>
                        <TableCell className="text-xs">{entry.next}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Usage Example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage Example</CardTitle>
              <CardDescription>Select a channel to see the relevant API example</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="sms">
                <TabsList>
                  <TabsTrigger value="sms">SMS</TabsTrigger>
                  <TabsTrigger value="rcs">RCS</TabsTrigger>
                  <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                  <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                </TabsList>
                {Object.entries(CHANNEL_EXAMPLES).map(([channel, example]) => {
                  const product = app.products.find((p) => p.id === CHANNEL_PRODUCT_MAP[channel]);
                  const enabled = product ? hasEnabledCapabilities(product) : false;
                  const credKey = cred.apiKey || "YOUR_API_KEY";
                  const displayKey = cred.apiKey ? cred.apiKey.slice(0, 10) + "••••••••••" : "YOUR_API_KEY";
                  return (
                    <TabsContent key={channel} value={channel}>
                      {enabled ? (
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono mt-2">
                          {`curl -X POST '${baseUrl}${example.endpoint.replace("POST ", "")}' \\
  -H 'Authorization: Bearer ${displayKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${example.body}'`}
                        </pre>
                      ) : (
                        <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/30 p-4 mt-2">
                          <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            {product?.name || channel} is not enabled for this App.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
    </DashboardLayout>
  );
}
