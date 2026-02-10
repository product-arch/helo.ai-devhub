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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Eye, EyeOff, Copy, Check, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const eventTypes = [
  { name: "message.sent", description: "Fired when a message is accepted for delivery", payload: { messageId: "msg_abc123", status: "sent", to: "+1234567890", channel: "sms" } },
  { name: "message.delivered", description: "Fired when a message is delivered to the recipient", payload: { messageId: "msg_abc123", status: "delivered", deliveredAt: "2024-01-15T10:30:00Z" } },
  { name: "message.failed", description: "Fired when message delivery fails", payload: { messageId: "msg_abc123", status: "failed", error: { code: "UNREACHABLE", message: "Recipient unreachable" } } },
  { name: "message.received", description: "Fired when an inbound message is received", payload: { messageId: "msg_xyz789", from: "+1234567890", body: "Hello!", receivedAt: "2024-01-15T10:35:00Z" } },
];

export default function Webhooks() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, setWebhookUrl } = useApp();
  const app = apps.find((a) => a.id === appId);
  const [url, setUrl] = useState(app?.webhookUrl || "");
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
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

  return (
    <DashboardLayout>
      <PageHeader title="Webhooks" breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Webhooks" }]} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook Configuration</CardTitle>
            <CardDescription>Configure your endpoint to receive real-time event notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <div className="flex gap-2">
                <Input id="endpoint" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/webhooks/helo" className="font-mono text-sm" />
                <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Shared Secret</Label>
              <div className="flex items-center gap-2">
                <Input type={showSecret ? "text" : "password"} value={showSecret ? app.webhookSecret : "••••••••••••••••••••••••"} readOnly className="font-mono text-sm" />
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
              <p className="text-sm text-muted-foreground">Failed deliveries are retried up to 5 times with exponential backoff: 30s, 2m, 10m, 1h, 6h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Types</CardTitle>
            <CardDescription>Events that will be sent to your webhook endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {eventTypes.map((event) => (
                <AccordionItem key={event.name} value={event.name}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{event.name}</code>
                      <span className="text-sm text-muted-foreground">{event.description}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-muted p-4 rounded-lg relative">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => copyToClipboard(JSON.stringify(event.payload, null, 2), event.name)}>
                        {copied === event.name ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <pre className="text-sm font-mono overflow-x-auto">{JSON.stringify(event.payload, null, 2)}</pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

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
    </DashboardLayout>
  );
}
