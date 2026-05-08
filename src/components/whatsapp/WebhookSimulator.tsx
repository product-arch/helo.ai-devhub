import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Webhook, Play } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { highlightJson } from "./lib/syntax";
import { cn } from "@/lib/utils";

export function WebhookSimulator({ webhookUrl }: { webhookUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("+14155550199");
  const [type, setType] = useState<"text" | "image" | "interactive">("text");
  const [body, setBody] = useState("Hi, can I get an order update?");
  const [shouldFail, setShouldFail] = useState(false);
  const [response, setResponse] = useState<{ status: number; body: unknown } | null>(null);
  const [pending, setPending] = useState(false);

  const payload = useMemo(() => {
    const messages: Record<string, unknown> = {
      from: from.replace(/^\+/, ""),
      id: `wamid.${Math.random().toString(36).slice(2, 14)}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type,
    };
    if (type === "text") messages.text = { body };
    if (type === "image") messages.image = { id: "media_" + Math.random().toString(36).slice(2, 8), mime_type: "image/jpeg" };
    if (type === "interactive")
      messages.interactive = {
        type: "button_reply",
        button_reply: { id: "yes", title: body },
      };
    return {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "15550000000", phone_number_id: "PHONE_ID" },
                contacts: [{ profile: { name: "Test User" }, wa_id: from.replace(/^\+/, "") }],
                messages: [messages],
              },
            },
          ],
        },
      ],
    };
  }, [from, type, body]);

  const fire = async () => {
    setPending(true);
    setResponse(null);
    await new Promise((r) => setTimeout(r, 350));
    if (shouldFail) {
      setResponse({
        status: 500,
        body: { error: "Webhook handler returned 500 — check your endpoint logs." },
      });
    } else {
      setResponse({ status: 200, body: { received: true } });
    }
    setPending(false);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card shadow-block">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            <Webhook className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Test Incoming Messages</div>
              <div className="text-xs text-muted-foreground">
                Simulate an inbound WhatsApp event to your webhook handler — no network
                calls, payload-shape only.
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 border-t p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
                  From
                </Label>
                <Input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
                  Type
                </Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="interactive">Interactive reply</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
                  Webhook URL
                </Label>
                <Input
                  value={webhookUrl ?? "https://your-app.example.com/webhooks/whatsapp"}
                  readOnly
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
                Body / payload value
              </Label>
              <Textarea
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={shouldFail} onCheckedChange={setShouldFail} />
                Simulate handler failure (500)
              </label>
              <Button type="button" onClick={fire} disabled={pending} className="gap-2">
                <Play className="h-3.5 w-3.5" />
                {pending ? "Firing…" : "Fire webhook"}
              </Button>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  POST payload
                </span>
                <CopyButton value={JSON.stringify(payload, null, 2)} size="icon" />
              </div>
              <pre className="max-h-56 overflow-auto rounded-md border bg-background/40 px-3 py-2 font-mono text-[11px] leading-relaxed">
                <code>{highlightJson(JSON.stringify(payload, null, 2))}</code>
              </pre>
            </div>
            {response && (
              <div>
                <div className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  Webhook response
                </div>
                <pre
                  className={cn(
                    "rounded-md border px-3 py-2 font-mono text-[11px] pg-fade-in-up",
                    response.status >= 200 && response.status < 300
                      ? "border-success/30 bg-success/10"
                      : "border-destructive/30 bg-destructive/10",
                  )}
                >
                  <span className="font-bold">{response.status}</span>{" "}
                  <code>{highlightJson(JSON.stringify(response.body, null, 2))}</code>
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}