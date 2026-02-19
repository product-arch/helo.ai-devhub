import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp, LogEvent } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Copy, Check, X, MessageSquare, Smartphone, MessageCircle, Webhook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- Event type parsing ---

const GROUP_LABELS: Record<string, string> = {
  message: "Message",
  webhook: "Webhook",
  config: "Configuration",
};

const NAME_LABELS: Record<string, string> = {
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
  triggered: "Triggered",
  updated: "Updated",
  received: "Received",
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

const STATUS_BORDER: Record<string, string> = {
  active: "border-l-success",
  configured: "border-l-primary",
  restricted: "border-l-warning",
  disabled: "border-l-border",
};

// All unique event groups for the filter
const EVENT_GROUPS = Object.values(GROUP_LABELS);

export default function Logs() {
  const { appId } = useParams<{ appId: string }>();
  const { apps } = useApp();
  const app = apps.find((a) => a.id === appId);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedEventGroup, setSelectedEventGroup] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<LogEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  // Success rate per product
  const productSuccessRate = (productName: string): string | null => {
    const productKey = productName.split(" ")[0]; // "SMS", "RCS", etc.
    const events = app.logEvents.filter((e) => e.product === productKey || e.product === productName);
    if (!events.length) return null;
    const successes = events.filter((e) => e.status === "success").length;
    return ((successes / events.length) * 100).toFixed(1);
  };

  const filteredEvents = app.logEvents.filter((event) => {
    if (selectedProduct !== "all" && event.product !== selectedProduct) return false;
    if (selectedEventGroup !== "all") {
      const { group } = parseEventType(event.eventType);
      if (group !== selectedEventGroup) return false;
    }
    return true;
  });

  const copyPayload = () => {
    if (selectedEvent) {
      navigator.clipboard.writeText(JSON.stringify(selectedEvent.payload, null, 2));
      setCopied(true);
      toast({ title: "Copied", description: "Payload copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Logs & Events" breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Logs & Events" }]} />

      {/* Product Health & Latency Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {app.products.map((product) => {
          const Icon = PRODUCT_ICON[product.name] || MessageSquare;
          const latency = PRODUCT_LATENCY[product.name];
          const successRate = productSuccessRate(product.name);
          const borderColor = STATUS_BORDER[product.status] || STATUS_BORDER.disabled;

          return (
            <div
              key={product.id}
              className={cn(
                "rounded-lg border bg-card p-4 border-l-4",
                borderColor
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium leading-tight">{product.name}</span>
              </div>
              <StatusBadge status={product.status} className="mb-3" />

              {/* Latency */}
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

              {/* Success rate */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Success rate</p>
                  {successRate ? (
                    <p className="text-xs font-semibold">{successRate}%</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
                </div>
                {successRate && (
                  <Progress value={parseFloat(successRate)} className="h-1.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>

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
            <div className="w-48">
              <Select value={selectedEventGroup} onValueChange={setSelectedEventGroup}>
                <SelectTrigger><SelectValue placeholder="Filter by event group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Groups</SelectItem>
                  {EVENT_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(selectedProduct !== "all" || selectedEventGroup !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct("all"); setSelectedEventGroup("all"); }}>Clear filters</Button>
            )}
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
                <TableHead>Product</TableHead>
                <TableHead>Event Group</TableHead>
                <TableHead>Event Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => {
                const { group, name } = parseEventType(event.eventType);
                return (
                  <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvent(event)}>
                    <TableCell className="font-mono text-xs">{new Date(event.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{event.product}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {group}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {name}
                      </code>
                    </TableCell>
                    <TableCell><StatusBadge status={event.status} /></TableCell>
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
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Product</span><span>{selectedEvent.product}</span></div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Event Group</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{parseEventType(selectedEvent.eventType).group}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Event Name</span>
                  <code className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{parseEventType(selectedEvent.eventType).name}</code>
                </div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><StatusBadge status={selectedEvent.status} /></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Correlation ID</span><span className="font-mono text-xs">{selectedEvent.correlationId}</span></div>
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
