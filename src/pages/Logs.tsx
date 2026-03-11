import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp, LogEvent, LogCategory } from "@/contexts/AppContext";
import { usePermission } from "@/hooks/usePermission";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Copy, Check, X, MessageSquare, Smartphone, MessageCircle, Webhook, Activity, TrendingUp, AlertTriangle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

// --- Event type parsing ---

const GROUP_LABELS: Record<string, string> = {
  message: "Message",
  webhook: "Webhook",
  config: "Configuration",
  token: "Token",
  auth: "Authentication",
  credential: "Credential",
  role: "Role",
  product: "Product",
};

const NAME_LABELS: Record<string, string> = {
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
  triggered: "Triggered",
  updated: "Updated",
  received: "Received",
  issued: "Issued",
  refreshed: "Refreshed",
  revoked: "Revoked",
  retried: "Retried",
  created: "Created",
  rotated: "Rotated",
  changed: "Changed",
  subscribed: "Subscribed",
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function parseEventType(eventType: string): { group: string; name: string } {
  const [groupKey, nameKey] = eventType.split(".");
  return {
    group: GROUP_LABELS[groupKey] || capitalize(groupKey),
    name: NAME_LABELS[nameKey] || capitalize(nameKey ?? ""),
  };
}

// --- Product health helpers ---

const PRODUCT_LATENCY: Record<string, string | null> = {
  "SMS Messaging": "142",
  "RCS Messaging": "287",
  "WhatsApp Messaging": null,
  "Webhooks": "58",
};

const PRODUCT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "SMS Messaging": MessageSquare,
  "RCS Messaging": Smartphone,
  "WhatsApp Messaging": MessageCircle,
  "Webhooks": Webhook,
};

// --- Monitoring chart data generators ---

function generateChartData() {
  const hours = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(Date.now() - i * 3600000);
    hours.push({
      time: `${hour.getHours()}:00`,
      requests: Math.floor(Math.random() * 1500) + 200,
      errors: Math.floor(Math.random() * 50),
      authFailures: Math.floor(Math.random() * 15),
      rateLimited: Math.floor(Math.random() * 10),
    });
  }
  return hours;
}

const CATEGORY_LABELS: Record<LogCategory, { label: string; icon: React.ElementType; description: string }> = {
  api_activity: { label: "API Activity", icon: Activity, description: "All API requests with credential, endpoint, and response data" },
  auth_token: { label: "Auth & Token", icon: Shield, description: "OAuth token lifecycle and authentication events" },
  webhook_delivery: { label: "Webhook Delivery", icon: Webhook, description: "Per-webhook delivery attempts and retry status" },
  governance_audit: { label: "Governance & Audit", icon: AlertTriangle, description: "Configuration changes and admin actions" },
};

export default function Logs() {
  const { appId } = useParams<{ appId: string }>();
  const { apps } = useApp();
  const app = apps.find((a) => a.id === appId);
  const canViewAudit = usePermission("logs.view_audit");

  const [activeCategory, setActiveCategory] = useState<LogCategory | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<LogEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  const chartData = generateChartData();

  // Filter events
  const filteredEvents = app.logEvents.filter((event) => {
    if (activeCategory !== "all" && event.category !== activeCategory) return false;
    if (activeCategory === "governance_audit" && !canViewAudit) return false;
    if (selectedProduct !== "all" && event.product !== selectedProduct) return false;
    return true;
  });

  // Success rate per product
  const productSuccessRate = (productName: string): string | null => {
    const productKey = productName.split(" ")[0];
    const events = app.logEvents.filter((e) => e.product === productKey || e.product === productName);
    if (!events.length) return null;
    const successes = events.filter((e) => e.status === "success").length;
    return ((successes / events.length) * 100).toFixed(1);
  };

  const copyPayload = () => {
    if (selectedEvent) {
      navigator.clipboard.writeText(JSON.stringify(selectedEvent.payload, null, 2));
      setCopied(true);
      toast({ title: "Copied", description: "Payload copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Summary stats
  const totalRequests = app.logEvents.filter((e) => e.category === "api_activity").length;
  const totalErrors = app.logEvents.filter((e) => e.status === "failed").length;
  const totalRateLimited = app.logEvents.filter((e) => e.status === "rate_limited").length;
  const totalAuthFailures = app.logEvents.filter((e) => e.category === "auth_token" && e.status === "failed").length;

  const availableCategories = canViewAudit
    ? (Object.keys(CATEGORY_LABELS) as LogCategory[])
    : (Object.keys(CATEGORY_LABELS) as LogCategory[]).filter((c) => c !== "governance_audit");

  return (
    <DashboardLayout>
      <PageHeader title="Logs & Events" breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Logs & Events" }]} />

      {/* Monitoring Dashboard */}
      <div className="space-y-6 mb-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "API Requests", value: totalRequests, icon: Activity },
            { label: "Errors", value: totalErrors, icon: AlertTriangle, variant: totalErrors > 10 ? "warning" : "default" },
            { label: "Auth Failures", value: totalAuthFailures, icon: Shield },
            { label: "Rate Limited", value: totalRateLimited, icon: TrendingUp },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                  </div>
                  <p className="text-2xl font-semibold">{metric.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">API Request Volume (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Error Rate (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="errors" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Health Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {app.products.map((product) => {
          const Icon = PRODUCT_ICON[product.name] || MessageSquare;
          const latency = PRODUCT_LATENCY[product.name];
          const successRate = productSuccessRate(product.name);

          return (
            <div key={product.id} className="rounded-lg border bg-card p-4 shadow-block">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium leading-tight">{product.name}</span>
              </div>
              <StatusBadge status={product.status} className="mb-3" />
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-0.5">p95 Latency</p>
                {latency ? (
                  <p className="text-xl font-bold leading-none">
                    {latency}<span className="text-xs font-normal text-muted-foreground ml-0.5">ms</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">N/A</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Success rate</p>
                  {successRate ? <p className="text-xs font-semibold">{successRate}%</p> : <p className="text-xs text-muted-foreground">—</p>}
                </div>
                {successRate && <Progress value={parseFloat(successRate)} className="h-1.5" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as LogCategory | "all")} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Logs</TabsTrigger>
          {availableCategories.map((cat) => {
            const config = CATEGORY_LABELS[cat];
            return <TabsTrigger key={cat} value={cat}>{config.label}</TabsTrigger>;
          })}
        </TabsList>
      </Tabs>

      {/* Filter Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Filter by product" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {app.products.map((product) => (
                    <SelectItem key={product.id} value={product.name.split(" ")[0]}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProduct !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedProduct("all")}>Clear filters</Button>
            )}
            <span className="text-xs text-muted-foreground self-center ml-auto">
              {filteredEvents.length} events
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                {activeCategory === "api_activity" && <TableHead>Endpoint</TableHead>}
                {activeCategory === "api_activity" && <TableHead>IP</TableHead>}
                {activeCategory === "webhook_delivery" && <TableHead>Target</TableHead>}
                {activeCategory === "webhook_delivery" && <TableHead>Retries</TableHead>}
                {activeCategory === "governance_audit" && <TableHead>Actor</TableHead>}
                {activeCategory === "governance_audit" && <TableHead>Action</TableHead>}
                {activeCategory === "auth_token" && <TableHead>Credential</TableHead>}
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.slice(0, 50).map((event) => {
                const { group, name } = parseEventType(event.eventType);
                return (
                  <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvent(event)}>
                    <TableCell className="font-mono text-xs">{new Date(event.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {CATEGORY_LABELS[event.category]?.label || event.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{event.product}</TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{name}</code>
                    </TableCell>
                    <TableCell><StatusBadge status={event.status} /></TableCell>
                    {activeCategory === "api_activity" && <TableCell className="text-xs font-mono">{event.endpoint || "—"}</TableCell>}
                    {activeCategory === "api_activity" && <TableCell className="text-xs font-mono">{event.ipAddress || "—"}</TableCell>}
                    {activeCategory === "webhook_delivery" && <TableCell className="text-xs font-mono truncate max-w-[150px]">{event.targetUrl || "—"}</TableCell>}
                    {activeCategory === "webhook_delivery" && <TableCell className="text-xs">{event.retryCount ?? 0}</TableCell>}
                    {activeCategory === "governance_audit" && <TableCell className="text-xs">{event.actor || "—"}</TableCell>}
                    {activeCategory === "governance_audit" && <TableCell className="text-xs">{event.action || "—"}</TableCell>}
                    {activeCategory === "auth_token" && <TableCell className="text-xs font-mono">{event.credentialId || "—"}</TableCell>}
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{event.message}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Event Detail Sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Event Details
              <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}><X className="h-4 w-4" /></Button>
            </SheetTitle>
            <SheetDescription>
              {selectedEvent && (() => {
                const { group, name } = parseEventType(selectedEvent.eventType);
                return (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{group}</span>
                    <span className="text-muted-foreground">/</span>
                    <code className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{name}</code>
                  </span>
                );
              })()}
            </SheetDescription>
          </SheetHeader>
          {selectedEvent && (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Timestamp</span><span className="font-mono">{new Date(selectedEvent.timestamp).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Category</span><Badge variant="outline" className="text-xs">{CATEGORY_LABELS[selectedEvent.category]?.label}</Badge></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Product</span><span>{selectedEvent.product}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><StatusBadge status={selectedEvent.status} /></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Correlation ID</span><span className="font-mono text-xs">{selectedEvent.correlationId}</span></div>
                {selectedEvent.credentialId && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Credential ID</span><span className="font-mono text-xs">{selectedEvent.credentialId}</span></div>}
                {selectedEvent.credentialType && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Credential Type</span><Badge variant="outline" className="text-xs">{selectedEvent.credentialType}</Badge></div>}
                {selectedEvent.endpoint && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Endpoint</span><span className="font-mono text-xs">{selectedEvent.endpoint}</span></div>}
                {selectedEvent.httpMethod && <div className="flex justify-between text-sm"><span className="text-muted-foreground">HTTP Method</span><span className="font-mono text-xs">{selectedEvent.httpMethod}</span></div>}
                {selectedEvent.httpStatus && <div className="flex justify-between text-sm"><span className="text-muted-foreground">HTTP Status</span><Badge variant="outline" className="font-mono text-xs">{selectedEvent.httpStatus}</Badge></div>}
                {selectedEvent.ipAddress && <div className="flex justify-between text-sm"><span className="text-muted-foreground">IP Address</span><span className="font-mono text-xs">{selectedEvent.ipAddress}</span></div>}
                {selectedEvent.webhookId && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Webhook ID</span><span className="font-mono text-xs">{selectedEvent.webhookId}</span></div>}
                {selectedEvent.targetUrl && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Target URL</span><span className="font-mono text-xs break-all">{selectedEvent.targetUrl}</span></div>}
                {selectedEvent.actor && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Actor</span><span className="text-xs">{selectedEvent.actor}</span></div>}
                {selectedEvent.externalRefId && <div className="flex justify-between text-sm"><span className="text-muted-foreground">External Ref ID</span><span className="font-mono text-xs">{selectedEvent.externalRefId}</span></div>}
                {selectedEvent.providerRef && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Provider Ref</span><span className="font-mono text-xs">{selectedEvent.providerRef}</span></div>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Payload</span>
                  <Button variant="ghost" size="sm" onClick={copyPayload}>{copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}</Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">{JSON.stringify(selectedEvent.payload, null, 2)}</pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
