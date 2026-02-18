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
import { Eye, EyeOff, Copy, Check, Save, Zap, Loader2 } from "lucide-react";
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

export default function Webhooks() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, setWebhookUrl } = useApp();
  const app = apps.find((a) => a.id === appId);
  const [url, setUrl] = useState(app?.webhookUrl || "");
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>(buildInitialSubscriptions);
  const [testingEvents, setTestingEvents] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

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
    setTestingEvents((prev) => ({ ...prev, [eventId]: true }));
    setTimeout(() => {
      setTestingEvents((prev) => ({ ...prev, [eventId]: false }));
      toast({
        title: "Test event sent",
        description: `A test ${eventId} payload was delivered to your endpoint`,
      });
    }, 1500);
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
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/webhooks/helo"
                  className="font-mono text-sm"
                />
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />Save
                </Button>
              </div>
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
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">Retry Policy</h4>
              <p className="text-sm text-muted-foreground">
                Failed deliveries are retried up to 5 times with exponential backoff: 30s, 2m, 10m, 1h, 6h
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Event Subscriptions ─────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Webhook Event Subscriptions</CardTitle>
              <CardDescription>Subscribe to events your endpoint will receive from WhatsApp</CardDescription>
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
                          const isTesting = testingEvents[event.id];
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

                              {/* Test button */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0 gap-1.5 text-xs h-8 px-3"
                                onClick={() => handleTest(event.id)}
                                disabled={isTesting}
                              >
                                {isTesting ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Sending
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-3 w-3" />
                                    Test
                                  </>
                                )}
                              </Button>
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
    </DashboardLayout>
  );
}
