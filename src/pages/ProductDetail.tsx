import { useParams, Navigate, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { CapabilityRow } from "@/components/CapabilityRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Check, X, ExternalLink, Copy, Check as CheckIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { whatsappApis } from "@/data/whatsappApis";
import { ApiLineItem } from "@/components/ApiLineItem";

interface EndpointDef {
  id: string;
  method: string;
  path: string;
  description: string;
  capabilityId: string;
}

const productConfigs: Record<string, {
  fields: { name: string; label: string; placeholder: string; required: boolean }[];
  endpoints: EndpointDef[];
  prerequisites: { name: string; required: boolean; completed: boolean; source: string }[];
}> = {
  sms: {
    fields: [
      { name: "senderId", label: "Sender ID", placeholder: "ACME", required: true },
      { name: "callbackUrl", label: "Callback URL", placeholder: "https://api.example.com/sms/callback", required: false },
    ],
    endpoints: [
      { id: "sms_send", method: "POST", path: "/v1/sms/send", description: "Send an SMS message", capabilityId: "sms_basic_mt" },
      { id: "sms_status", method: "GET", path: "/v1/sms/{messageId}", description: "Get message status", capabilityId: "sms_dlr" },
      { id: "sms_list", method: "GET", path: "/v1/sms/messages", description: "List sent messages", capabilityId: "sms_dlr" },
      { id: "sms_inbound", method: "GET", path: "/v1/sms/inbound", description: "List inbound messages", capabilityId: "sms_two_way" },
    ],
    prerequisites: [
      { name: "Account verification", required: true, completed: true, source: "Internal" },
      { name: "Sender ID registration", required: true, completed: true, source: "Carrier" },
      { name: "DLT registration (India)", required: false, completed: false, source: "TRAI" },
    ],
  },
  rcs: {
    fields: [
      { name: "agentId", label: "RCS Agent ID", placeholder: "your-agent-id", required: true },
      { name: "verificationToken", label: "Verification Token", placeholder: "token-from-google", required: true },
    ],
    endpoints: [
      { id: "rcs_send", method: "POST", path: "/v1/rcs/send", description: "Send an RCS message", capabilityId: "rcs_text" },
      { id: "rcs_rich_card", method: "POST", path: "/v1/rcs/rich-card", description: "Send a rich card", capabilityId: "rcs_rich_card" },
      { id: "rcs_carousel", method: "POST", path: "/v1/rcs/carousel", description: "Send a carousel", capabilityId: "rcs_carousel" },
      { id: "rcs_status", method: "GET", path: "/v1/rcs/{messageId}", description: "Get message status", capabilityId: "rcs_text" },
      { id: "rcs_file", method: "POST", path: "/v1/rcs/file", description: "Send a file", capabilityId: "rcs_file" },
    ],
    prerequisites: [
      { name: "Account verification", required: true, completed: true, source: "Internal" },
      { name: "Google RCS partner access", required: true, completed: true, source: "Google" },
      { name: "Agent verification", required: true, completed: false, source: "Google" },
    ],
  },
};

export default function ProductDetail() {
  const { appId, productId } = useParams<{ appId: string; productId: string }>();
  const { apps, updateProduct, toggleCapability, requestCapabilityAccess } = useApp();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const app = apps.find((a) => a.id === appId);
  const product = app?.products.find((p) => p.id === productId);

  if (!app || !product) return <Navigate to={appId ? `/apps/${appId}/overview` : "/apps"} replace />;

  // WhatsApp gets the API catalog view
  if (productId === "whatsapp") {
    return (
      <DashboardLayout>
        <PageHeader
          title="WhatsApp Messaging"
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: app.name, href: `/apps/${appId}/overview` },
            { label: "Products", href: `/apps/${appId}/products` },
            { label: "WhatsApp Messaging" },
          ]}
          actions={<StatusBadge status={product.status} />}
        />

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">API Catalog</CardTitle>
              <span className="text-xs text-muted-foreground">{whatsappApis.length} APIs</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {whatsappApis.map((api) => (
              <ApiLineItem key={api.id} api={api} />
            ))}
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Webhooks is a top-level page — redirect to the correct route
  if (productId === "webhooks") {
    return <Navigate to={`/apps/${appId}/webhooks`} replace />;
  }

  // Non-WhatsApp: standard product detail view
  const config = productConfigs[productId!];
  if (!config) return <Navigate to={`/apps/${appId}/overview`} replace />;

  const enabledCapabilityEndpoints = new Set(
    product.capabilities.filter((c) => c.status === "enabled").flatMap((c) => c.linkedEndpoints)
  );
  const visibleEndpoints = config.endpoints.filter((e) => enabledCapabilityEndpoints.has(e.id));

  const productEvents = app.logEvents
    .filter((e) => e.product.toLowerCase() === product.name.split(" ")[0].toLowerCase())
    .slice(0, 10);

  const copyCurl = (endpoint: EndpointDef) => {
    const curl = `curl -X ${endpoint.method} \\
  'https://api.helo.ai${endpoint.path}' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`;
    navigator.clipboard.writeText(curl);
    setCopied(endpoint.path);
    toast({ title: "Copied", description: "cURL command copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = () => toast({ title: "Configuration saved", description: "Your changes have been saved successfully." });

  const handleEnable = () => {
    updateProduct(app.id, product.id, { status: "configured" });
    toast({ title: "Product enabled", description: `${product.name} has been enabled.` });
  };

  const handleToggleCap = (capId: string) => {
    toggleCapability(app.id, product.id, capId);
    toast({ title: "Capability updated" });
  };

  const handleRequestAccess = (capId: string) => {
    requestCapabilityAccess(app.id, product.id, capId);
    toast({ title: "Access requested", description: "Your request has been submitted for review." });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={product.name}
        breadcrumbs={[
          { label: "Apps", href: "/apps" },
          { label: app.name, href: `/apps/${appId}/overview` },
          { label: "Products", href: `/apps/${appId}/products` },
          { label: product.name },
        ]}
        actions={product.status === "disabled" ? <Button onClick={handleEnable}>Enable Product</Button> : null}
      />

      <div className="space-y-6">
        {/* Section A: Status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Operational State</span>
              <StatusBadge status={product.status} />
            </div>
            {product.externalDependency && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">External Dependency</span>
                <span className="text-sm flex items-center gap-1">{product.externalDependency}<ExternalLink className="h-3 w-3" /></span>
              </div>
            )}
            {product.blockingReason && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded text-sm text-warning">{product.blockingReason}</div>
            )}
          </CardContent>
        </Card>

        {/* Section B: Messaging Capabilities */}
        <Card>
          <CardHeader><CardTitle className="text-base">Messaging Capabilities</CardTitle></CardHeader>
          <CardContent>
            {product.capabilities.map((cap) => (
              <CapabilityRow
                key={cap.id}
                capability={cap}
                onToggle={() => handleToggleCap(cap.id)}
                onRequestAccess={() => handleRequestAccess(cap.id)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Prerequisites */}
        <Card>
          <CardHeader><CardTitle className="text-base">Prerequisites</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.prerequisites.map((prereq, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    {prereq.completed ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm">{prereq.name}</span>
                    {prereq.required && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Required</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{prereq.source}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                <Input id={field.name} placeholder={field.placeholder} className="font-mono text-sm" />
              </div>
            ))}
            <Button onClick={handleSave}>Save Configuration</Button>
          </CardContent>
        </Card>

        {/* Section C: API Surface */}
        {product.status !== "disabled" && (
          <Card>
            <CardHeader><CardTitle className="text-base">API Endpoints</CardTitle></CardHeader>
            <CardContent>
              {visibleEndpoints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleEndpoints.map((endpoint) => (
                      <TableRow key={endpoint.path}>
                        <TableCell><span className="font-mono text-xs bg-muted px-2 py-1 rounded">{endpoint.method}</span></TableCell>
                        <TableCell className="font-mono text-sm">{endpoint.path}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{endpoint.description}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => copyCurl(endpoint)}>
                            {copied === endpoint.path ? <CheckIcon className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Enable messaging capabilities above to see available API endpoints.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section E: Recent Events */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Events</CardTitle></CardHeader>
          <CardContent>
            {productEvents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-xs">{new Date(event.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{event.eventType}</TableCell>
                      <TableCell><StatusBadge status={event.status} /></TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{event.providerRef || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No recent events</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
