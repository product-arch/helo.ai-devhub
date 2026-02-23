import { useParams, Navigate, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  AlertTriangle, ArrowRight, Activity,
  MessageSquare, Smartphone, MessageCircle, Webhook,
  Copy, Check,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Icons map ---
const productIcons: Record<string, React.ReactNode> = {
  sms: <MessageSquare className="h-4 w-4" />,
  rcs: <Smartphone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  webhooks: <Webhook className="h-4 w-4" />,
};

// --- Mocked last-activity per channel ---
const lastActivity: Record<string, string> = {
  sms: "2 hours ago",
  rcs: "1 day ago",
  whatsapp: "No activity",
  webhooks: "35 min ago",
};

// --- Mocked operational metrics ---
const operationalMetrics = [
  { label: "Messages sent (24h)", value: "12,847", link: "logs", linkLabel: "View logs" },
  { label: "Failure rate", value: "0.3%", link: "logs", linkLabel: "View logs" },
  { label: "Webhook delivery rate", value: "98.7%", link: "webhooks", linkLabel: "View webhooks" },
  { label: "API requests (24h)", value: "34,219", link: "logs", linkLabel: "View logs" },
];

// --- Mocked system activity ---
const systemActivity = [
  { ts: "Feb 20, 15:42", event: "SMS Messaging enabled", product: "SMS", status: "success" as const },
  { ts: "Feb 20, 14:18", event: "API key rotated", product: "System", status: "success" as const },
  { ts: "Feb 20, 11:05", event: "WhatsApp capability restricted", product: "WhatsApp", status: "failed" as const },
  { ts: "Feb 19, 22:30", event: "Webhook delivery failures detected", product: "Webhooks", status: "failed" as const },
  { ts: "Feb 19, 18:12", event: "RCS Messaging configured", product: "RCS", status: "success" as const },
  { ts: "Feb 19, 16:00", event: "Execution paused", product: "System", status: "pending" as const },
  { ts: "Feb 19, 10:45", event: "Two-Way SMS capability enabled", product: "SMS", status: "success" as const },
  { ts: "Feb 18, 20:22", event: "Webhook URL updated", product: "Webhooks", status: "success" as const },
  { ts: "Feb 18, 14:55", event: "API key rotated", product: "System", status: "success" as const },
  { ts: "Feb 18, 09:10", event: "Execution resumed", product: "System", status: "success" as const },
];

// --- Environment badge config ---
const envBadge: Record<string, { label: string; className: string }> = {
  production: { label: "Production", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  staging: { label: "Staging", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  development: { label: "Development", className: "bg-muted text-muted-foreground border-border" },
};

export default function Overview() {
  const { appId } = useParams<{ appId: string }>();
  const { apps } = useApp();
  const app = apps.find((a) => a.id === appId);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  const copyAppId = () => {
    navigator.clipboard.writeText(app.id);
    setCopied(true);
    toast({ title: "Copied", description: "App ID copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCount = app.products.filter((p) => p.status !== "disabled").length;
  const totalCount = app.products.length;
  const isProduction = app.environment === "production";
  const healthLabel = app.status === "healthy" ? "healthy" : "action_required";

  // Blocking issues
  const blockingIssues = app.products
    .filter((p) => p.blockingReason || p.status === "restricted")
    .map((p) => ({
      productId: p.id,
      message: p.blockingReason
        ? `${p.name} restricted — ${p.blockingReason}`
        : `${p.name} restricted`,
    }));

  return (
    <DashboardLayout>
      <PageHeader
        title="Overview"
        breadcrumbs={[
          { label: "Apps", href: "/apps" },
          { label: app.name },
          { label: "Overview" },
        ]}
      />

      {/* Section 1: App Status Header */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-6 p-4 rounded-lg bg-muted/30 mb-8"
        )}
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">App ID</span>
          <div className="flex items-center gap-1">
            <code className="text-xs font-mono">{app.id}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAppId}>
              {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Environment</span>
          <Badge variant="outline" className={envBadge[app.environment]?.className}>
            {envBadge[app.environment]?.label}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Execution Status</span>
          <StatusBadge status="active" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">App Health</span>
          <StatusBadge status={healthLabel === "healthy" ? "active" : "restricted"} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Active Products</span>
          <span className="text-sm font-medium">
            {activeCount} of {totalCount} active
          </span>
        </div>
      </div>

      {/* Section 2: Blocking Issues */}
      {blockingIssues.length > 0 && (
        <Card className="mb-8 bg-warning/5 border-warning/20">
          <CardContent className="py-4 space-y-3">
            {blockingIssues.map((issue) => (
              <div key={issue.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <span className="text-sm">{issue.message}</span>
                </div>
                <button
                  onClick={() => navigate(`/apps/${appId}/products/${issue.productId}`)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                >
                  Resolve <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Section 3: Channel Status Grid */}
      <h2 className="text-lg font-medium mb-4">Channel Status</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {app.products.map((product) => {
          const enabledCaps = product.capabilities.filter((c) => c.status === "enabled").length;
          const totalCaps = product.capabilities.length;
          const identityPresent = product.status !== "disabled";

          return (
            <Card
              key={product.id}
              className="cursor-pointer hover:border-foreground/20 transition-colors"
              onClick={() => navigate(`/apps/${appId}/products/${product.id}`)}
            >
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-muted">{productIcons[product.id]}</div>
                  <span className="font-medium text-sm">{product.name}</span>
                </div>
                <StatusBadge status={product.status} />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>{enabledCaps} of {totalCaps} capabilities enabled</div>
                  <div>Identity: {identityPresent ? "Configured" : "Missing"}</div>
                  <div>Last activity: {lastActivity[product.id] || "—"}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section 4: Operational Pulse */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" /> Operational Pulse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {operationalMetrics.map((m) => (
              <div key={m.label} className="space-y-1">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <p className="text-2xl font-semibold">{m.value}</p>
                <button
                  onClick={() => navigate(`/apps/${appId}/${m.link}`)}
                  className="text-xs text-primary hover:underline"
                >
                  {m.linkLabel}
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Recent System Activity */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Recent System Activity</CardTitle>
          <button
            onClick={() => navigate(`/apps/${appId}/logs`)}
            className="text-xs text-primary hover:underline"
          >
            View all
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemActivity.map((row, i) => (
                <TableRow
                  key={i}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/apps/${appId}/logs`)}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {row.ts}
                  </TableCell>
                  <TableCell className="text-sm">{row.event}</TableCell>
                  <TableCell className="text-sm">{row.product}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
