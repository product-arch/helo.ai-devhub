import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MessagingApi } from "@/data/whatsappApis";

const WHATSAPP_BASE_URL = "https://graph.facebook.com/v24.0";

function getBaseUrl(api: MessagingApi, baseUrl?: string): string {
  if (baseUrl) return baseUrl;
  if (api.scope === "rcsbusinessmessaging") return "https://rcsbusinessmessaging.googleapis.com";
  if (api.scope === "businesscommunications") return "https://businesscommunications.googleapis.com";
  return WHATSAPP_BASE_URL;
}

function getPostBody(api: MessagingApi): string | null {
  const method = api.method.includes("/") ? api.method.split("/")[0] : api.method;
  if (method !== "POST") return null;
  if (api.scope === "whatsapp_business_messaging" || api.scope === "whatsapp_business_management") {
    return '{\n    "messaging_product": "whatsapp"\n  }';
  }
  return '{\n  }';
}

function generateCurl(api: MessagingApi, base: string): string {
  const url = `${base}${api.endpoint}`;
  const method = api.method.includes("/") ? api.method.split("/")[0] : api.method;
  let cmd = `curl -X ${method} \\
  '${url}' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json'`;
  const body = getPostBody(api);
  if (body) {
    cmd += ` \\
  -d '${body}'`;
  }
  return cmd;
}

function generatePython(api: MessagingApi, base: string): string {
  const url = `${base}${api.endpoint}`;
  const method = api.method.includes("/") ? api.method.split("/")[0].toLowerCase() : api.method.toLowerCase();
  const body = getPostBody(api);
  return `import requests

url = "${url}"
headers = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json"
}${body ? `
payload = ${body.replace(/\n  /g, "\n")}

response = requests.${method}(url, headers=headers, json=payload)` : `

response = requests.${method}(url, headers=headers)`}
print(response.json())`;
}

function generateNode(api: MessagingApi, base: string): string {
  const url = `${base}${api.endpoint}`;
  const method = api.method.includes("/") ? api.method.split("/")[0] : api.method;
  const body = getPostBody(api);
  return `const response = await fetch("${url}", {
  method: "${method}",
  headers: {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json",
  },${body ? `
  body: JSON.stringify(${body.replace(/\n  /g, "\n")}),` : ""}
});

const data = await response.json();
console.log(data);`;
}

function generatePhp(api: MessagingApi, base: string): string {
  const url = `${base}${api.endpoint}`;
  const method = api.method.includes("/") ? api.method.split("/")[0] : api.method;
  const body = getPostBody(api);
  return `<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${url}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer YOUR_ACCESS_TOKEN",
    "Content-Type: application/json",
]);${body ? `
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${body.replace(/\n  /g, "\n")}));` : ""}

$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
}

interface CodeSampleProps {
  api: MessagingApi;
  baseUrl?: string;
}

export function CodeSample({ api, baseUrl }: CodeSampleProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const base = getBaseUrl(api, baseUrl);

  const samples: Record<string, string> = {
    curl: generateCurl(api, base),
    python: generatePython(api, base),
    nodejs: generateNode(api, base),
    php: generatePhp(api, base),
  };

  const [activeTab, setActiveTab] = useState("curl");

  const handleCopy = () => {
    navigator.clipboard.writeText(samples[activeTab]);
    setCopied(true);
    toast({ title: "Copied", description: "Code copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Request info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Base URL:</span>
          <code className="ml-2 font-mono text-xs bg-muted px-2 py-0.5 rounded">{base}</code>
        </div>
        <div>
          <span className="text-muted-foreground">Scope:</span>
          <code className="ml-2 font-mono text-xs bg-muted px-2 py-0.5 rounded">{api.scope}</code>
        </div>
        <div>
          <span className="text-muted-foreground">Required ID:</span>
          <code className="ml-2 font-mono text-xs bg-muted px-2 py-0.5 rounded">{api.requiredId}</code>
        </div>
        <div>
          <span className="text-muted-foreground">Auth:</span>
          <code className="ml-2 font-mono text-xs bg-muted px-2 py-0.5 rounded">Bearer token</code>
        </div>
      </div>

      {/* Code tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="nodejs">Node.js</TabsTrigger>
            <TabsTrigger value="php">PHP</TabsTrigger>
          </TabsList>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        {Object.entries(samples).map(([key, code]) => (
          <TabsContent key={key} value={key}>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
              {code}
            </pre>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
