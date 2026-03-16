import { useState, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Copy, Check, Send, ChevronDown, Clock, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { HeloApp, Product } from "@/contexts/AppContext";

interface Props {
  app: HeloApp;
  appId: string;
  product: Product;
}

interface HistoryEntry {
  id: string;
  method: string;
  endpoint: string;
  status: number | null;
  timestamp: Date;
  responseBody: string;
  responseTime: number;
  requestHeaders: Record<string, string>;
  requestBody: string;
  error?: string;
}

function CodeBlock({ code, onCopy }: { code: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted rounded-md p-4 overflow-x-auto text-sm font-mono text-foreground">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

function generateCurl(apiKey: string, to: string, type: string, body: string) {
  const payload = JSON.stringify(
    {
      to,
      type: type.toLowerCase(),
      ...(type === "Text"
        ? { text: { body } }
        : type === "Image"
        ? { image: { link: body } }
        : { template: { name: body } }),
    },
    null,
    2
  );
  return `curl -X POST 'https://api.helo.ai/v1/messages' \\
  -H 'Authorization: Bearer ${apiKey || "YOUR_API_KEY"}' \\
  -H 'Content-Type: application/json' \\
  -d '${payload}'`;
}

function generateJS(apiKey: string, to: string, type: string, body: string) {
  const payload = JSON.stringify(
    {
      to,
      type: type.toLowerCase(),
      ...(type === "Text"
        ? { text: { body } }
        : type === "Image"
        ? { image: { link: body } }
        : { template: { name: body } }),
    },
    null,
    2
  );
  return `const response = await fetch('https://api.helo.ai/v1/messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey || "YOUR_API_KEY"}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(${payload}),
});

const data = await response.json();
console.log(data);`;
}

function generatePython(apiKey: string, to: string, type: string, body: string) {
  const bodyField =
    type === "Text"
      ? `"text": {"body": "${body}"}`
      : type === "Image"
      ? `"image": {"link": "${body}"}`
      : `"template": {"name": "${body}"}`;
  return `import requests

response = requests.post(
    "https://api.helo.ai/v1/messages",
    headers={
        "Authorization": "Bearer ${apiKey || "YOUR_API_KEY"}",
        "Content-Type": "application/json",
    },
    json={
        "to": "${to}",
        "type": "${type.toLowerCase()}",
        ${bodyField},
    },
)

print(response.json())`;
}

function StatusPill({ status }: { status: number | null }) {
  if (!status) return null;
  const isOk = status >= 200 && status < 300;
  return (
    <Badge
      variant="outline"
      className={
        isOk
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }
    >
      {status} {isOk ? "OK" : "Error"}
    </Badge>
  );
}

function errorExplanation(status: number | null, body: string): string | null {
  if (!status || (status >= 200 && status < 300)) return null;
  switch (status) {
    case 401:
      return "Your API key is missing or invalid. Paste it in the field above.";
    case 403:
      return "You don't have permission to access this resource. Check your API key scopes.";
    case 404:
      return "The endpoint was not found. Verify the URL and method.";
    case 422:
      return "The request body is invalid. Check your parameters and try again.";
    case 429:
      return "Rate limit exceeded. Wait a moment and try again.";
    case 500:
      return "Server error on helo.ai's side. Try again later.";
    default:
      return `Unexpected status ${status}. Check the response body for details.`;
  }
}

export function WhatsAppGettingStarted({ app, appId, product }: Props) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [to, setTo] = useState("");
  const [messageType, setMessageType] = useState("Text");
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);

  // Response state
  const [currentResponse, setCurrentResponse] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [viewerTab, setViewerTab] = useState("response");
  const [requestExpanded, setRequestExpanded] = useState(false);

  const handleSend = useCallback(async () => {
    setSending(true);
    const startTime = performance.now();
    const requestBody = JSON.stringify({
      to,
      type: messageType.toLowerCase(),
      ...(messageType === "Text"
        ? { text: { body: messageBody } }
        : messageType === "Image"
        ? { image: { link: messageBody } }
        : { template: { name: messageBody } }),
    });
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey || "YOUR_API_KEY"}`,
      "Content-Type": "application/json",
    };

    // Simulate a short delay then return a dummy success response
    await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));
    const elapsed = Math.round(performance.now() - startTime);

    const dummyResponse = {
      messaging_product: "whatsapp",
      contacts: [{ input: to || "+919876543210", wa_id: (to || "+919876543210").replace("+", "") }],
      messages: [{ id: `wamid.${crypto.randomUUID().replace(/-/g, "")}` }],
    };

    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      method: "POST",
      endpoint: "/v1/messages",
      status: 200,
      timestamp: new Date(),
      responseBody: JSON.stringify(dummyResponse, null, 2),
      responseTime: elapsed,
      requestHeaders: headers,
      requestBody,
    };

    setCurrentResponse(entry);
    setHistory((prev) => [entry, ...prev].slice(0, 5));
    setViewerTab("response");
    setSending(false);
  }, [apiKey, to, messageType, messageBody]);

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setCurrentResponse(entry);
    setViewerTab("response");
  };

  const formatJson = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Getting Started"
        breadcrumbs={[
          { label: "Apps", href: "/apps" },
          { label: app.name, href: `/apps/${appId}/overview` },
          { label: "Products", href: `/apps/${appId}/products` },
          { label: product.name },
        ]}
      />

      <div className="flex gap-6 items-start">
        {/* LEFT COLUMN — Guide */}
        <div className="w-[55%] space-y-6 min-w-0">
          {/* 1. What is this API? */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What is this API?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                helo.ai's WhatsApp Business API lets you send and receive messages,
                media, and notifications programmatically via a simple REST API.
                Integrate WhatsApp into your product in minutes — no phone or
                infrastructure to manage.
              </p>
            </CardContent>
          </Card>

          {/* 2. Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                All requests require a Bearer token in the <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">Authorization</code> header.
              </p>
              <div className="space-y-2">
                <Label htmlFor="apiKey">Your API key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk_live_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <CodeBlock code={`Authorization: Bearer ${apiKey || "YOUR_API_KEY"}`} />
            </CardContent>
          </Card>

          {/* 3. Base URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Base URL</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock code="https://api.helo.ai/v1" />
            </CardContent>
          </Card>

          {/* 4. Try your first request */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Try your first request — Send a message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">POST</Badge>
                <span className="font-mono text-sm text-muted-foreground">/v1/messages</span>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    placeholder="+919876543210"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message type</Label>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Text">Text</SelectItem>
                      <SelectItem value="Image">Image</SelectItem>
                      <SelectItem value="Template">Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messageBody">
                    {messageType === "Image" ? "Image URL" : messageType === "Template" ? "Template name" : "Message body"}
                  </Label>
                  <Textarea
                    id="messageBody"
                    placeholder={
                      messageType === "Image"
                        ? "https://example.com/image.jpg"
                        : messageType === "Template"
                        ? "hello_world"
                        : "Hello from helo.ai!"
                    }
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Code snippets */}
              <Tabs defaultValue="curl">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>
                <TabsContent value="curl">
                  <CodeBlock code={generateCurl(apiKey, to, messageType, messageBody)} />
                </TabsContent>
                <TabsContent value="js">
                  <CodeBlock code={generateJS(apiKey, to, messageType, messageBody)} />
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock code={generatePython(apiKey, to, messageType, messageBody)} />
                </TabsContent>
              </Tabs>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Send request"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {}}
                >
                  Go to API Docs
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — Response viewer (sticky) */}
        <div className="w-[45%] sticky top-6">
          <Card className="min-h-[400px]">
            <CardHeader className="pb-3">
              <Tabs value={viewerTab} onValueChange={setViewerTab}>
                <TabsList>
                  <TabsTrigger value="response">Response</TabsTrigger>
                  <TabsTrigger value="history">
                    History
                    {history.length > 0 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">({history.length})</span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent>
              {viewerTab === "response" && (
                <>
                  {!currentResponse ? (
                    <div className="flex items-center justify-center min-h-[300px] rounded-md border-2 border-dashed border-border">
                      <p className="text-sm text-muted-foreground">Your response will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Status bar */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <StatusPill status={currentResponse.status} />
                        <span className="text-xs text-muted-foreground font-mono">
                          {currentResponse.responseTime}ms
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {currentResponse.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Error explanation */}
                      {currentResponse.error && (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                          {currentResponse.error}
                        </div>
                      )}
                      {!currentResponse.error &&
                        currentResponse.status &&
                        errorExplanation(currentResponse.status, currentResponse.responseBody) && (
                          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                            {errorExplanation(currentResponse.status, currentResponse.responseBody)}
                          </div>
                        )}

                      {/* Response body */}
                      {currentResponse.responseBody && (
                        <CodeBlock code={formatJson(currentResponse.responseBody)} />
                      )}

                      {/* Request details (collapsible) */}
                      <Collapsible open={requestExpanded} onOpenChange={setRequestExpanded}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                            Request sent
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${requestExpanded ? "rotate-180" : ""}`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 pt-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Headers</p>
                            <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto text-foreground">
                              {Object.entries(currentResponse.requestHeaders)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join("\n")}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Body</p>
                            <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto text-foreground">
                              {formatJson(currentResponse.requestBody)}
                            </pre>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </>
              )}

              {viewerTab === "history" && (
                <>
                  {history.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[300px] rounded-md border-2 border-dashed border-border">
                      <p className="text-sm text-muted-foreground">No requests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {history.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => loadHistoryEntry(entry)}
                          className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted/60 transition-colors text-left"
                        >
                          <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {entry.method}
                          </Badge>
                          <span className="font-mono text-sm text-foreground truncate flex-1">
                            {entry.endpoint}
                          </span>
                          <StatusPill status={entry.status} />
                          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
