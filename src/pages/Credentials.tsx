import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
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
import {
  Eye, EyeOff, Copy, Check, RefreshCw, Trash2, AlertTriangle,
  CheckCircle2, XCircle, Lock, Pause, Shield, ChevronDown, Play,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const { apps, rotateApiKey } = useApp();
  const app = apps.find((a) => a.id === appId);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"active" | "suspended" | "revoked">("active");
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  const isProduction = app.environment === "production";
  const maskedKey = app.apiKey.slice(0, 10) + "••••••••••••••••••••";
  const keyId = `app_${app.environment === "production" ? "prod" : "stg"}_${app.id.slice(-3)}`;
  const baseUrl = isProduction ? "https://api.helo.ai" : "https://sandbox.helo.ai";

  const copyApiKey = () => {
    navigator.clipboard.writeText(app.apiKey);
    setCopied(true);
    toast({ title: "Copied", description: "API key copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => {
      rotateApiKey(app.id);
      setIsRotating(false);
      toast({ title: "API key rotated", description: "Your new API key is now active. Update your integrations." });
    }, 1000);
  };

  const handleRevoke = () => {
    setKeyStatus("revoked");
    toast({ title: "API key revoked", description: "Your API key has been revoked.", variant: "destructive" });
  };

  const handleSuspendToggle = () => {
    if (keyStatus === "suspended") {
      setKeyStatus("active");
      toast({ title: "Key reactivated", description: "API key is now active." });
    } else {
      setKeyStatus("suspended");
      toast({ title: "Key suspended", description: "API calls will be rejected until reactivated." });
    }
  };

  const statusBadgeMap: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
    suspended: { label: "Suspended", className: "bg-warning/10 text-warning border-warning/20" },
    revoked: { label: "Revoked", className: "bg-destructive/10 text-destructive border-destructive/20" },
  };

  const getCapabilityIcon = (status: string) => {
    if (status === "enabled") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === "restricted") return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <XCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const hasEnabledCapabilities = (product: Product) =>
    product.status !== "disabled" && product.capabilities.some((c) => c.status === "enabled" || c.status === "restricted");

  return (
    <DashboardLayout>
      <PageHeader
        title="API Credentials"
        breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "API Credentials" }]}
      />

      <div className="space-y-8">
        {/* Suspended banner */}
        {keyStatus === "suspended" && (
          <div className="flex items-center gap-3 rounded-lg border border-warning/50 bg-warning/10 p-4">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium text-warning">This API key is suspended. API calls will be rejected.</p>
          </div>
        )}

        {/* ── Section 1: Credential Overview ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Credential Overview
                </CardTitle>
                <CardDescription>Identity and lifecycle for this API key</CardDescription>
              </div>
              <Badge variant="outline" className={isProduction ? "bg-success/10 text-success border-success/20 hover:bg-success/10" : "bg-warning/10 text-warning border-warning/20 hover:bg-warning/10"}>
                {isProduction ? "Production" : "Staging"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Metadata grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">App ID</p>
                <p className="font-mono">{keyId}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeMap[keyStatus].className}`}>
                  {statusBadgeMap[keyStatus].label}
                </span>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Environment</p>
                <p>{app.environment.charAt(0).toUpperCase() + app.environment.slice(1)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Created</p>
                <p>Jan 15, 2026</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Created by</p>
                <p>{app.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Last used</p>
                <p>2 hours ago</p>
              </div>
            </div>

            {/* API Key row */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type={showKey ? "text" : "password"}
                  value={showKey ? app.apiKey : maskedKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={copyApiKey}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {showKey && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Key is visible. Hide when done.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isRotating || keyStatus === "revoked"}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRotating ? "animate-spin" : ""}`} />Rotate Key
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rotate API Key?</AlertDialogTitle>
                    <AlertDialogDescription>This will generate a new API key and invalidate the current one. All existing integrations will need to be updated.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRotate}>Rotate Key</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={keyStatus === "revoked"}>
                    {keyStatus === "suspended" ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                    {keyStatus === "suspended" ? "Reactivate Key" : "Suspend Key"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{keyStatus === "suspended" ? "Reactivate API Key?" : "Suspend API Key?"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {keyStatus === "suspended"
                        ? "This will reactivate the key. API calls will be accepted again."
                        : "This will temporarily disable the key. All API calls will be rejected until you reactivate it."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSuspendToggle}>
                      {keyStatus === "suspended" ? "Reactivate" : "Suspend"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={keyStatus === "revoked"}>
                    <Trash2 className="h-4 w-4 mr-2" />Revoke Key
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                    <AlertDialogDescription>This will immediately and permanently revoke your API key. All API access will be disabled.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke Key</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Effective API Scope ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Effective API Scope</CardTitle>
            <CardDescription>API access is enforced by enabled products and messaging capabilities within this App.</CardDescription>
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

        {/* ── Section 3: Usage & Operational Metrics ── */}
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

        {/* ── Section 4: Credential Audit Trail ── */}
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

        {/* ── Section 5: Usage Example (Multi-Channel) ── */}
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
                return (
                  <TabsContent key={channel} value={channel}>
                    {enabled ? (
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono mt-2">
                        {`curl -X POST '${baseUrl}${example.endpoint.replace("POST ", "")}' \\
  -H 'Authorization: Bearer ${maskedKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${example.body}'`}
                      </pre>
                    ) : (
                      <div className="flex items-start gap-3 rounded-lg border border-muted bg-muted/30 p-4 mt-2">
                        <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          {product?.name || channel} is not enabled for this App. Enable it in Product Settings to use this API.
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
