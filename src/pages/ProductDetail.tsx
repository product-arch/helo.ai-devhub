import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, ExternalLink, Copy, Check as CheckIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const productConfigs: Record<string, { fields: { name: string; label: string; placeholder: string; required: boolean }[]; endpoints: { method: string; path: string; description: string }[]; prerequisites: { name: string; required: boolean; completed: boolean; source: string }[] }> = {
  sms: {
    fields: [
      { name: "senderId", label: "Sender ID", placeholder: "ACME", required: true },
      { name: "callbackUrl", label: "Callback URL", placeholder: "https://api.example.com/sms/callback", required: false },
    ],
    endpoints: [
      { method: "POST", path: "/v1/sms/send", description: "Send an SMS message" },
      { method: "GET", path: "/v1/sms/{messageId}", description: "Get message status" },
      { method: "GET", path: "/v1/sms/messages", description: "List sent messages" },
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
      { method: "POST", path: "/v1/rcs/send", description: "Send an RCS message" },
      { method: "POST", path: "/v1/rcs/rich-card", description: "Send a rich card" },
      { method: "GET", path: "/v1/rcs/{messageId}", description: "Get message status" },
    ],
    prerequisites: [
      { name: "Account verification", required: true, completed: true, source: "Internal" },
      { name: "Google RCS partner access", required: true, completed: true, source: "Google" },
      { name: "Agent verification", required: true, completed: false, source: "Google" },
    ],
  },
  whatsapp: {
    fields: [
      { name: "phoneNumberId", label: "Phone Number ID", placeholder: "1234567890", required: true },
      { name: "accessToken", label: "Access Token", placeholder: "EAAGm...", required: true },
      { name: "businessAccountId", label: "Business Account ID", placeholder: "9876543210", required: true },
    ],
    endpoints: [
      { method: "POST", path: "/v1/whatsapp/send", description: "Send a WhatsApp message" },
      { method: "POST", path: "/v1/whatsapp/template", description: "Send a template message" },
      { method: "GET", path: "/v1/whatsapp/{messageId}", description: "Get message status" },
    ],
    prerequisites: [
      { name: "Account verification", required: true, completed: true, source: "Internal" },
      { name: "Meta Business verification", required: true, completed: false, source: "Meta" },
      { name: "WhatsApp Business API access", required: true, completed: false, source: "Meta" },
    ],
  },
  webhooks: {
    fields: [
      { name: "endpointUrl", label: "Endpoint URL", placeholder: "https://api.example.com/webhooks", required: true },
      { name: "authHeader", label: "Authorization Header", placeholder: "Bearer token...", required: false },
    ],
    endpoints: [],
    prerequisites: [
      { name: "Account verification", required: true, completed: true, source: "Internal" },
      { name: "HTTPS endpoint", required: true, completed: true, source: "Customer" },
    ],
  },
};

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const { products, logEvents, updateProduct } = useApp();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const product = products.find((p) => p.id === productId);
  const config = productId ? productConfigs[productId] : null;

  if (!product || !config) {
    return <Navigate to="/products" replace />;
  }

  const productEvents = logEvents
    .filter((e) => e.product.toLowerCase() === product.name.split(" ")[0].toLowerCase())
    .slice(0, 10);

  const copyCurl = (endpoint: { method: string; path: string }) => {
    const curl = `curl -X ${endpoint.method} \\
  'https://api.helo.ai${endpoint.path}' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`;
    navigator.clipboard.writeText(curl);
    setCopied(endpoint.path);
    toast({ title: "Copied", description: "cURL command copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = () => {
    toast({ title: "Configuration saved", description: "Your changes have been saved successfully." });
  };

  const handleEnable = () => {
    updateProduct(product.id, { status: "configured" });
    toast({ title: "Product enabled", description: `${product.name} has been enabled.` });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={product.name}
        breadcrumbs={[
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
        actions={
          product.status === "disabled" ? (
            <Button onClick={handleEnable}>Enable Product</Button>
          ) : null
        }
      />

      <div className="space-y-6">
        {/* Status Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Operational State</span>
              <StatusBadge status={product.status} />
            </div>
            {product.externalDependency && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">External Dependency</span>
                <span className="text-sm flex items-center gap-1">
                  {product.externalDependency}
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            )}
            {product.blockingReason && (
              <div className="p-3 bg-warning/10 border border-warning/20 rounded text-sm text-warning">
                {product.blockingReason}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prerequisites Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prerequisites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {config.prerequisites.map((prereq, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {prereq.completed ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{prereq.name}</span>
                    {prereq.required && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Required</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{prereq.source}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={field.name}
                  placeholder={field.placeholder}
                  className="font-mono text-sm"
                />
              </div>
            ))}
            <Button onClick={handleSave}>Save Configuration</Button>
          </CardContent>
        </Card>

        {/* API Surface Section */}
        {product.status !== "disabled" && config.endpoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {config.endpoints.map((endpoint) => (
                    <TableRow key={endpoint.path}>
                      <TableCell>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {endpoint.method}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {endpoint.path}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {endpoint.description}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyCurl(endpoint)}
                        >
                          {copied === endpoint.path ? (
                            <CheckIcon className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Execution Feedback Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Events</CardTitle>
          </CardHeader>
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
                      <TableCell className="font-mono text-xs">
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{event.eventType}</TableCell>
                      <TableCell>
                        <StatusBadge status={event.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {event.providerRef || "—"}
                      </TableCell>
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
