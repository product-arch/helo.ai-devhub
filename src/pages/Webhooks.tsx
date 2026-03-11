import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp, WebhookEndpoint } from "@/contexts/AppContext";
import { usePermission } from "@/hooks/usePermission";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreateWebhookModal } from "@/components/CreateWebhookModal";
import {
  Eye, EyeOff, Copy, Check, Save, Zap, FlaskConical, XCircle, CheckCircle2, X,
  Plus, ArrowLeft, Trash2, Pause, Play,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface WebhookEventField {
  id: string;
  name: string;
  description: string;
}

interface WebhookEventGroup {
  id: string;
  label: string;
  description: string;
  events: WebhookEventField[];
}

const webhookEventGroups: WebhookEventGroup[] = [
  {
    id: "account_business",
    label: "Account & Business",
    description: "Account-level and business management events",
    events: [
      { id: "account_alerts", name: "account_alerts", description: "Account-level alerts and notifications from Meta" },
      { id: "account_review_update", name: "account_review_update", description: "Status changes resulting from Meta account reviews" },
      { id: "account_settings_update", name: "account_settings_update", description: "Changes to account configuration and settings" },
      { id: "account_update", name: "account_update", description: "General account-level updates and modifications" },
      { id: "business_capability_update", name: "business_capability_update", description: "Changes to business-level capabilities and permissions" },
      { id: "business_status_update", name: "business_status_update", description: "Business account status changes from Meta" },
    ],
  },
  {
    id: "messaging",
    label: "Messaging",
    description: "Inbound and outbound message events",
    events: [
      { id: "messages", name: "messages", description: "Inbound and outbound message events — the core messaging event" },
      { id: "message_echoes", name: "message_echoes", description: "Copies of messages sent by your app to users" },
      { id: "message_reactions", name: "message_reactions", description: "Emoji reaction events from message recipients" },
      { id: "calls", name: "calls", description: "Voice call events initiated or received on WhatsApp" },
    ],
  },
  {
    id: "message_templates",
    label: "Message Templates",
    description: "Template lifecycle and quality events",
    events: [
      { id: "message_template_components_update", name: "message_template_components_update", description: "Changes to template components, headers, or body content" },
      { id: "message_template_quality_update", name: "message_template_quality_update", description: "Template quality rating changes from Meta's review system" },
    ],
  },
  {
    id: "groups",
    label: "Groups",
    description: "WhatsApp group management events",
    events: [
      { id: "group_lifecycle_update", name: "group_lifecycle_update", description: "Group created, modified, or deleted lifecycle events" },
      { id: "group_participants_update", name: "group_participants_update", description: "Members added to or removed from groups" },
      { id: "group_settings_update", name: "group_settings_update", description: "Group setting changes such as name or description" },
      { id: "group_status_update", name: "group_status_update", description: "Group status changes including archive and suspension" },
    ],
  },
  {
    id: "platform_flows",
    label: "Platform & Flows",
    description: "Platform automation and flow interaction events",
    events: [
      { id: "automatic_events", name: "automatic_events", description: "System-generated automatic events from the platform" },
      { id: "flows", name: "flows", description: "WhatsApp Flows interaction and completion events" },
      { id: "history", name: "history", description: "Message history sync events for connected devices" },
      { id: "phone_number_name_update", name: "phone_number_name_update", description: "Business display name changes for phone numbers" },
      { id: "phone_number_quality_update", name: "phone_number_quality_update", description: "Phone number quality rating changes from Meta" },
    ],
  },
];

const INITIAL_SUBSCRIBED = new Set([
  "account_alerts", "account_update", "flows",
  "message_template_components_update", "message_template_quality_update",
]);

function buildInitialSubscriptions(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  webhookEventGroups.forEach((group) => {
    group.events.forEach((event) => {
      result[event.id] = INITIAL_SUBSCRIBED.has(event.id);
    });
  });
  return result;
}

function getPayloadForEvent(eventId: string): string {
  const wrap = (field: string, value: object) => ({
    object: "whatsapp_business_account",
    entry: [{ id: "WABA_ID", changes: [{ value, field }] }],
  });
  const payload = wrap(eventId, { event: eventId, timestamp: "1700000000" });
  return JSON.stringify(payload, null, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Webhooks() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, setWebhookUrl, updateWebhookEndpoint, deleteWebhookEndpoint } = useApp();
  const app = apps.find((a) => a.id === appId);
  const canCreate = usePermission("webhooks.create");
  const canEdit = usePermission("webhooks.edit");
  const canDelete = usePermission("webhooks.delete");

  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Detail view state
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>(buildInitialSubscriptions);
  const [testModalEvent, setTestModalEvent] = useState<string | null>(null);
  const [payloadCopied, setPayloadCopied] = useState(false);
  const [payloadCopied, setPayloadCopied] = useState(false);
  const [retryCount, setRetryCount] = useState("5");
  const [retryInterval, setRetryInterval] = useState("30");
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleToggle = (eventId: string, checked: boolean) => {
    setSubscriptions((prev) => ({ ...prev, [eventId]: checked }));
    toast({
      title: checked ? "Subscribed" : "Unsubscribed",
      description: checked ? `Now receiving ${eventId} events` : `Stopped receiving ${eventId} events`,
    });
  };

  const handleCopyCurl = () => {
    const eventId = testModalEvent;
    const endpoint = app.webhookEndpoints.find((w) => w.id === selectedEndpoint?.id);
    if (!endpoint || !eventId) return;
    const payload = getPayloadForEvent(eventId);
    const curl = `curl -X POST '${endpoint.url}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${payload.replace(/'/g, "'\\''")}'`;
    navigator.clipboard.writeText(curl);
    toast({ title: "cURL copied", description: "Paste in your terminal to send the test payload" });
    setTestModalEvent(null);
  };

  const handleCopyPayload = () => {
    if (!testModalEvent) return;
    navigator.clipboard.writeText(getPayloadForEvent(testModalEvent));
    setPayloadCopied(true);
    setTimeout(() => setPayloadCopied(false), 2000);
  };

  const getGroupSubscribedCount = (group: WebhookEventGroup) =>
    group.events.filter((e) => subscriptions[e.id]).length;

  const totalSubscribed = Object.values(subscriptions).filter(Boolean).length;

  // Detail view for a selected endpoint
  if (selectedEndpoint) {
    const endpoint = app.webhookEndpoints.find((w) => w.id === selectedEndpoint.id) || selectedEndpoint;

    return (
      <DashboardLayout>
        <PageHeader
          title="Webhooks"
          breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Webhooks", href: `/apps/${appId}/webhooks` }, { label: endpoint.name }]}
        />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setSelectedEndpoint(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Webhooks
            </Button>
            <div className="flex items-center gap-2">
              <StatusBadge status={endpoint.status === "active" ? "active" : "disabled"} />
              <Badge variant="outline" className="text-xs">{endpoint.product}</Badge>
            </div>
          </div>

          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Webhook Configuration</CardTitle>
              <CardDescription>Configure endpoint for {endpoint.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Endpoint URL</Label>
                <Input value={endpoint.url} readOnly className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Shared Secret</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={showSecret ? endpoint.secret : "••••••••••••••••••••••••"}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(endpoint.secret, "Secret")}>
                    {copied === "Secret" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Retry Policy */}
              <div className="pt-2 space-y-4 border-t border-border mt-2">
                <h4 className="text-sm font-medium pt-2">Retry Policy</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max Retry Attempts</Label>
                    <Select value={retryCount} onValueChange={setRetryCount}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 5, 8, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "retry" : "retries"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Retry Interval</Label>
                    <Select value={retryInterval} onValueChange={setRetryInterval}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {canEdit && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => {
                    updateWebhookEndpoint(app.id, endpoint.id, {
                      status: endpoint.status === "active" ? "suspended" : "active"
                    });
                    toast({ title: endpoint.status === "active" ? "Webhook suspended" : "Webhook reactivated" });
                  }}>
                    {endpoint.status === "active" ? <><Pause className="h-4 w-4 mr-2" /> Suspend</> : <><Play className="h-4 w-4 mr-2" /> Reactivate</>}
                  </Button>
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete {endpoint.name}.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => {
                            deleteWebhookEndpoint(app.id, endpoint.id);
                            setSelectedEndpoint(null);
                            toast({ title: "Webhook deleted", variant: "destructive" });
                          }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Subscriptions */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Webhook Event Subscriptions</CardTitle>
                <CardDescription>Subscribe to events your endpoint will receive</CardDescription>
              </div>
              <Badge variant="secondary" className="shrink-0 mt-0.5">{totalSubscribed} subscribed</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" defaultValue={webhookEventGroups.map((g) => g.id)} className="w-full">
                {webhookEventGroups.map((group) => {
                  const subscribedCount = getGroupSubscribedCount(group);
                  return (
                    <AccordionItem key={group.id} value={group.id} className="border-b last:border-0">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between w-full pr-2 gap-4">
                          <div className="text-left">
                            <p className="font-medium text-sm">{group.label}</p>
                            <p className="text-xs text-muted-foreground font-normal mt-0.5">{group.description}</p>
                          </div>
                          <Badge variant={subscribedCount > 0 ? "default" : "secondary"} className="shrink-0 text-xs">
                            {subscribedCount} / {group.events.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <div className="border-t border-border/50">
                          {group.events.map((event, idx) => {
                            const isSubscribed = subscriptions[event.id];
                            return (
                              <div
                                key={event.id}
                                className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
                                  idx < group.events.length - 1 ? "border-b border-border/30" : ""
                                } ${isSubscribed ? "bg-primary/[0.03]" : ""}`}
                              >
                                <code className="font-mono text-xs bg-muted px-2 py-1 rounded shrink-0 min-w-0 max-w-[220px] truncate">
                                  {event.name}
                                </code>
                                <p className="flex-1 text-sm text-muted-foreground leading-snug hidden sm:block">{event.description}</p>
                                <div className="shrink-0 w-[72px] flex justify-end hidden md:flex">
                                  {isSubscribed && (
                                    <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 px-3"
                                      onClick={() => { setTestModalEvent(event.id); setPayloadCopied(false); }}>
                                      <Zap className="h-3 w-3" /> Test
                                    </Button>
                                  )}
                                </div>
                                <Badge
                                  variant={isSubscribed ? "default" : "secondary"}
                                  className={`shrink-0 text-xs hidden md:flex ${isSubscribed ? "bg-success/15 text-success border-success/30 hover:bg-success/20" : ""}`}
                                >
                                  {isSubscribed ? "Subscribed" : "Unsubscribed"}
                                </Badge>
                                <Switch checked={isSubscribed} onCheckedChange={(checked) => handleToggle(event.id, checked)} className="shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          {/* Delivery History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery History</CardTitle>
              <CardDescription>Recent webhook delivery attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP Status</TableHead>
                    <TableHead>Product</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {app.webhookEvents.slice(0, 10).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-xs">{new Date(event.timestamp).toLocaleString()}</TableCell>
                      <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{event.type}</code></TableCell>
                      <TableCell><StatusBadge status={event.status} /></TableCell>
                      <TableCell className="font-mono text-sm">{event.httpStatus}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{event.product}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Test Payload Modal */}
        <Dialog open={!!testModalEvent} onOpenChange={(open) => { if (!open) setTestModalEvent(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Test Webhook Event</DialogTitle>
              <DialogDescription>
                Payload preview for <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{testModalEvent}</code>
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Button size="sm" variant="ghost" className="absolute right-2 top-2 h-7 px-2 text-xs z-10" onClick={handleCopyPayload}>
                {payloadCopied ? <><Check className="h-3 w-3 mr-1" />Copied</> : <><Copy className="h-3 w-3 mr-1" />Copy</>}
              </Button>
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-auto max-h-72 leading-relaxed">
                {testModalEvent ? getPayloadForEvent(testModalEvent) : ""}
              </pre>
            </div>
            <DialogFooter>
              <Button onClick={handleCopyCurl}>
                <Copy className="h-4 w-4 mr-2" />Copy as cURL
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  // --- Webhook List View ---
  return (
    <DashboardLayout>
      <PageHeader
        title="Webhooks"
        breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Webhooks" }]}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {app.webhookEndpoints.length} webhook endpoint{app.webhookEndpoints.length !== 1 ? "s" : ""} configured
          </p>
          {canCreate && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Webhook
            </Button>
          )}
        </div>

        {/* Webhook Endpoints Table */}
        {app.webhookEndpoints.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {app.webhookEndpoints.map((endpoint) => (
                    <TableRow
                      key={endpoint.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedEndpoint(endpoint)}
                    >
                      <TableCell className="font-medium">{endpoint.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{endpoint.product}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-xs truncate">{endpoint.url}</TableCell>
                      <TableCell><StatusBadge status={endpoint.status === "active" ? "active" : "disabled"} /></TableCell>
                      <TableCell className="text-sm">{endpoint.subscribedEvents.length} events</TableCell>
                      <TableCell>
                        {endpoint.verified ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No webhook endpoints configured. Create one to start receiving events.
          </div>
        )}

        {/* Legacy webhook config if URL exists */}
        {app.webhookUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Legacy Webhook</CardTitle>
              <CardDescription>Original webhook endpoint — migrate to named endpoints above</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <code className="font-mono text-xs text-muted-foreground">{app.webhookUrl}</code>
                <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">Legacy</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateWebhookModal open={createModalOpen} onOpenChange={setCreateModalOpen} appId={app.id} />
    </DashboardLayout>
  );
}
