import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
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
import { Eye, EyeOff, Copy, Check, Save, Zap, Loader2, Send, FlaskConical, XCircle, CheckCircle2, X } from "lucide-react";
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

// Pre-seeded subscribed events matching the PDF screenshot
const INITIAL_SUBSCRIBED = new Set([
  "account_alerts",
  "account_update",
  "flows",
  "message_template_components_update",
  "message_template_quality_update",
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

// ─── Component ────────────────────────────────────────────────────────────────

// ─── Payload helper ───────────────────────────────────────────────────────────

function getPayloadForEvent(eventId: string): string {
  const wrap = (field: string, value: object) => ({
    object: "whatsapp_business_account",
    entry: [{ id: "WABA_ID", changes: [{ value, field }] }],
  });

  const payloads: Record<string, object> = {
    messages: wrap("messages", {
      messaging_product: "whatsapp",
      metadata: { display_phone_number: "15550001234", phone_number_id: "PHONE_NUMBER_ID" },
      contacts: [{ profile: { name: "John Doe" }, wa_id: "15551234567" }],
      messages: [{ from: "15551234567", id: "wamid.TEST123", timestamp: "1700000000", text: { body: "Hello, world!" }, type: "text" }],
    }),
    message_echoes: wrap("message_echoes", {
      messaging_product: "whatsapp",
      metadata: { display_phone_number: "15550001234", phone_number_id: "PHONE_NUMBER_ID" },
      messages: [{ from: "15550001234", id: "wamid.ECHO456", timestamp: "1700000001", text: { body: "Echo from your app" }, type: "text" }],
    }),
    message_reactions: wrap("message_reactions", {
      messaging_product: "whatsapp",
      metadata: { display_phone_number: "15550001234", phone_number_id: "PHONE_NUMBER_ID" },
      messages: [{ from: "15551234567", id: "wamid.REACT789", timestamp: "1700000002", reaction: { message_id: "wamid.TEST123", emoji: "👍" }, type: "reaction" }],
    }),
    calls: wrap("calls", {
      messaging_product: "whatsapp",
      metadata: { display_phone_number: "15550001234", phone_number_id: "PHONE_NUMBER_ID" },
      calls: [{ from: "15551234567", id: "call.TEST001", timestamp: "1700000003", status: "missed" }],
    }),
    account_alerts: wrap("account_alerts", {
      alert_severity: "WARNING",
      alert_type: "ACCOUNT_MESSAGING_LIMIT_REACHED",
      entity_type: "PHONE_NUMBER",
      entity_id: "PHONE_NUMBER_ID",
    }),
    account_review_update: wrap("account_review_update", {
      decision: "APPROVED",
      entity_type: "WHATSAPP_BUSINESS_ACCOUNT",
      entity_id: "WABA_ID",
    }),
    account_settings_update: wrap("account_settings_update", {
      phone_number: "15550001234",
      event: "ACCOUNT_SETTINGS_UPDATED",
      ban_info: { waba_ban_state: "NONE", waba_ban_date: "" },
    }),
    account_update: wrap("account_update", {
      phone_number: "15550001234",
      event: "ACCOUNT_UPDATE",
      ban_info: { waba_ban_state: "NONE" },
    }),
    business_capability_update: wrap("business_capability_update", {
      max_daily_conversation_per_phone: 1000,
      max_phone_numbers_per_business: 20,
    }),
    business_status_update: wrap("business_status_update", {
      business_id: "BUSINESS_ID",
      status: "ACTIVE",
      previous_status: "PENDING",
    }),
    message_template_components_update: wrap("message_template_components_update", {
      message_template_id: "TEMPLATE_ID",
      message_template_name: "order_confirmation",
      message_template_language: "en_US",
      event: "APPROVED",
    }),
    message_template_quality_update: wrap("message_template_quality_update", {
      message_template_id: "TEMPLATE_ID",
      message_template_name: "promo_message",
      message_template_language: "en_US",
      previous_quality_score: "GREEN",
      new_quality_score: "YELLOW",
    }),
    group_lifecycle_update: wrap("group_lifecycle_update", {
      group_id: "GROUP_ID",
      actor: "15551234567",
      event: "GROUP_CREATED",
    }),
    group_participants_update: wrap("group_participants_update", {
      group_id: "GROUP_ID",
      actor: "15551234567",
      event: "MEMBER_ADDED",
      members: ["15559876543"],
    }),
    group_settings_update: wrap("group_settings_update", {
      group_id: "GROUP_ID",
      actor: "15551234567",
      event: "SUBJECT_CHANGED",
      new_subject: "Team Announcements",
    }),
    group_status_update: wrap("group_status_update", {
      group_id: "GROUP_ID",
      event: "GROUP_SUSPENDED",
    }),
    automatic_events: wrap("automatic_events", {
      event: "AUTOMATED_RESPONSE_TRIGGERED",
      phone_number_id: "PHONE_NUMBER_ID",
      triggered_at: "1700000010",
    }),
    flows: wrap("flows", {
      flow_id: "FLOW_ID",
      flow_name: "Customer Onboarding",
      event: "FLOW_COMPLETED",
      wa_id: "15551234567",
      timestamp: "1700000005",
    }),
    history: wrap("history", {
      sync_id: "SYNC_ID",
      event: "HISTORY_SYNC_STARTED",
      phone_number_id: "PHONE_NUMBER_ID",
    }),
    phone_number_name_update: wrap("phone_number_name_update", {
      phone_number_id: "PHONE_NUMBER_ID",
      display_name: "My Business",
      decision: "APPROVED",
    }),
    phone_number_quality_update: wrap("phone_number_quality_update", {
      phone_number: "15550001234",
      event: "QUALITY_UPDATED",
      current_limit: "TIER_50K",
      previous_quality_score: "GREEN",
      new_quality_score: "RED",
    }),
  };

  const payload = payloads[eventId] ?? wrap(eventId, { event: eventId, timestamp: "1700000000" });
  return JSON.stringify(payload, null, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Webhooks() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, setWebhookUrl } = useApp();
  const app = apps.find((a) => a.id === appId);
  const [url, setUrl] = useState(app?.webhookUrl || "");
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>(buildInitialSubscriptions);
  const [testModalEvent, setTestModalEvent] = useState<string | null>(null);
  const [isSendingPayload, setIsSendingPayload] = useState(false);
  const [payloadCopied, setPayloadCopied] = useState(false);
  const [retryCount, setRetryCount] = useState("5");
  const [retryInterval, setRetryInterval] = useState("30");
  const { toast } = useToast();

  // ── Endpoint test state ───────────────────────────────────────────────────
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [urlTestStatus, setUrlTestStatus] = useState<"idle" | "success" | "failed">("idle");
  const [urlTestLatency, setUrlTestLatency] = useState<number | null>(null);

  const endpointVerified = urlTestStatus === "success";

  const handleTestUrl = () => {
    if (!url || isTestingUrl) return;
    setIsTestingUrl(true);
    setUrlTestStatus("idle");
    setUrlTestLatency(null);
    const latency = Math.floor(Math.random() * (300 - 80 + 1)) + 80;
    setTimeout(() => {
      const success = Math.random() < 0.8;
      setIsTestingUrl(false);
      if (success) {
        setUrlTestStatus("success");
        setUrlTestLatency(latency);
      } else {
        setUrlTestStatus("failed");
        setUrlTestLatency(null);
      }
    }, 1800);
  };

  const urlInputRef = (el: HTMLInputElement | null) => {
    if (el) (window as any).__webhookUrlInput = el;
  };


  if (!app) return <Navigate to="/apps" replace />;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = () => {
    setWebhookUrl(app.id, url);
    toast({ title: "Webhook saved", description: "Your webhook configuration has been updated." });
  };

  const handleToggle = (eventId: string, checked: boolean) => {
    setSubscriptions((prev) => ({ ...prev, [eventId]: checked }));
    toast({
      title: checked ? "Subscribed" : "Unsubscribed",
      description: checked
        ? `Now receiving ${eventId} events`
        : `Stopped receiving ${eventId} events`,
    });
  };

  const handleTest = (eventId: string) => {
    setTestModalEvent(eventId);
    setPayloadCopied(false);
  };

  const handleSendPayload = () => {
    const eventId = testModalEvent;
    setTestModalEvent(null);
    setIsSendingPayload(true);
    setTimeout(() => {
      setIsSendingPayload(false);
      toast({
        title: "Test event sent",
        description: `A test ${eventId} payload was delivered to your endpoint`,
      });
    }, 1500);
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Webhooks"
        breadcrumbs={[
          { label: "Apps", href: "/apps" },
          { label: app.name },
          { label: "Webhooks" },
        ]}
      />

      <div className="space-y-6">
        {/* ── Webhook Configuration ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook Configuration</CardTitle>
            <CardDescription>Configure your endpoint to receive real-time event notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <div className="flex gap-2">
                <Input
                  id="endpoint"
                  ref={urlInputRef}
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlTestStatus("idle");
                    setUrlTestLatency(null);
                  }}
                  placeholder="https://api.example.com/webhooks/helo"
                  className="font-mono text-sm"
                />
                {/* Test Endpoint button */}
                <Button
                  variant="outline"
                  onClick={handleTestUrl}
                  disabled={!url || isTestingUrl}
                  className={
                    urlTestStatus === "success"
                      ? "border-success text-success hover:bg-success/10 hover:text-success"
                      : urlTestStatus === "failed"
                      ? "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                      : ""
                  }
                >
                  {isTestingUrl ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing…</>
                  ) : urlTestStatus === "success" ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" />Endpoint Verified</>
                  ) : urlTestStatus === "failed" ? (
                    <><XCircle className="h-4 w-4 mr-2" />Test Failed</>
                  ) : (
                    <><FlaskConical className="h-4 w-4 mr-2" />Test Endpoint</>
                  )}
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />Save
                </Button>
              </div>

              {/* Result strip */}
              {urlTestStatus !== "idle" && (
                <div
                  className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${
                    urlTestStatus === "success"
                      ? "bg-success/10 border-success/30 text-success"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {urlTestStatus === "success" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Endpoint responded with HTTP 200 in {urlTestLatency}ms</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 shrink-0" />
                        <span>No response received — check your URL and try again</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => { setUrlTestStatus("idle"); setUrlTestLatency(null); }}
                    className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Shared Secret</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={showSecret ? app.webhookSecret : "••••••••••••••••••••••••"}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(app.webhookSecret, "Secret")}>
                  {copied === "Secret" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Use this secret to verify webhook signatures</p>
            </div>
            <div className="pt-2 space-y-4 border-t border-border mt-2">
              <h4 className="text-sm font-medium pt-2">Retry Policy</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retryCount">Max Retry Attempts</Label>
                  <Select value={retryCount} onValueChange={setRetryCount}>
                    <SelectTrigger id="retryCount">
                      <SelectValue placeholder="Select retry count" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 8, 10].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} {n === 1 ? "retry" : "retries"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Number of times a failed delivery will be retried</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retryInterval">Initial Retry Interval</Label>
                  <Select value={retryInterval} onValueChange={setRetryInterval}>
                    <SelectTrigger id="retryInterval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Starting delay — each retry doubles the interval (exponential backoff)</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  With current settings: retried up to <span className="font-medium text-foreground">{retryCount}×</span> starting at <span className="font-medium text-foreground">{retryInterval}s</span> with exponential backoff
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast({ title: "Retry policy saved", description: `Up to ${retryCount} retries, starting at ${retryInterval}s with exponential backoff.` })}
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Event Subscriptions ─────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Webhook Event Subscriptions</CardTitle>
              <CardDescription><CardDescription>Subscribe to events your endpoint will receive from messaging products</CardDescription></CardDescription>
            </div>
            <Badge variant="secondary" className="shrink-0 mt-0.5">
              {totalSubscribed} subscribed
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion
              type="multiple"
              defaultValue={webhookEventGroups.map((g) => g.id)}
              className="w-full"
            >
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
                          <Badge
                            variant={subscribedCount > 0 ? "default" : "secondary"}
                            className="shrink-0 text-xs"
                          >
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
                                {/* Event name chip */}
                                <code className="font-mono text-xs bg-muted px-2 py-1 rounded shrink-0 min-w-0 max-w-[220px] truncate">
                                  {event.name}
                                </code>

                                {/* Description */}
                                <p className="flex-1 text-sm text-muted-foreground leading-snug hidden sm:block">
                                  {event.description}
                                </p>

                                {/* Test button — only visible when subscribed, left of status badge */}
                                <div className="shrink-0 w-[72px] flex justify-end hidden md:flex">
                                  {isSubscribed && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 text-xs h-8 px-3"
                                      onClick={() => handleTest(event.id)}
                                    >
                                      <Zap className="h-3 w-3" />
                                      Test
                                    </Button>
                                  )}
                                </div>

                                {/* Status badge */}
                                <Badge
                                  variant={isSubscribed ? "default" : "secondary"}
                                  className={`shrink-0 text-xs hidden md:flex ${
                                    isSubscribed
                                      ? "bg-success/15 text-success border-success/30 hover:bg-success/20"
                                      : ""
                                  }`}
                                >
                                  {isSubscribed ? "Subscribed" : "Unsubscribed"}
                                </Badge>

                                {/* Toggle */}
                                <Switch
                                  checked={isSubscribed}
                                  onCheckedChange={(checked) => handleToggle(event.id, checked)}
                                  className="shrink-0"
                                />
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

        {/* ── Delivery History ────────────────────────────────────────────── */}
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
                    <TableCell className="font-mono text-xs">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{event.type}</code>
                    </TableCell>
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

      {/* ── Test Payload Modal ──────────────────────────────────────────── */}
      <Dialog open={!!testModalEvent} onOpenChange={(open) => { if (!open) setTestModalEvent(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Webhook Event</DialogTitle>
            <DialogDescription>
              Payload preview for{" "}
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{testModalEvent}</code>
            </DialogDescription>
          </DialogHeader>

          {/* Payload code block */}
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-2 h-7 px-2 text-xs z-10"
              onClick={handleCopyPayload}
            >
              {payloadCopied ? (
                <><Check className="h-3 w-3 mr-1" />Copied</>
              ) : (
                <><Copy className="h-3 w-3 mr-1" />Copy</>
              )}
            </Button>
            <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-auto max-h-72 leading-relaxed">
              {testModalEvent ? getPayloadForEvent(testModalEvent) : ""}
            </pre>
          </div>

          <DialogFooter className="flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              This payload will be sent to your configured endpoint
            </p>
            <Button onClick={handleSendPayload} disabled={isSendingPayload} className="shrink-0">
              {isSendingPayload ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Send Payload</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
