import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smsStorage } from "../lib/smsStorage";
import { smsSimulator } from "../lib/smsSimulator";
import type { DlrConfig } from "../lib/smsTypes";

export function DlrSection({ appId }: { appId: string }) {
  const [cfg, setCfg] = useState<DlrConfig>(() => smsStorage.getDlr(appId));
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    status: number;
    latencyMs: number;
    body: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const persist = (next: DlrConfig) => {
    setCfg(next);
    smsStorage.setDlr(appId, next);
  };

  const sample = JSON.stringify(smsSimulator.buildSampleDlrPayload(), null, 2);

  const copySample = async () => {
    await navigator.clipboard.writeText(sample);
    setCopied(true);
    toast({ title: "Copied", description: "Sample DLR payload copied" });
    setTimeout(() => setCopied(false), 1500);
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const r = await smsSimulator.testWebhook(cfg.webhookUrl);
    setTestResult(r);
    setTesting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2.5">
        <div>
          <Label className="text-sm">Enable delivery receipts</Label>
          <p className="text-xs text-muted-foreground">Receive DLR callbacks on every status change.</p>
        </div>
        <Switch
          checked={cfg.enabled}
          onCheckedChange={(v) => persist({ ...cfg, enabled: v })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dlr-url">Webhook URL</Label>
        <div className="flex gap-2">
          <Input
            id="dlr-url"
            value={cfg.webhookUrl}
            onChange={(e) => persist({ ...cfg, webhookUrl: e.target.value })}
            placeholder="https://api.example.com/sms/dlr"
            className="font-mono text-sm"
          />
          <Button variant="outline" onClick={runTest} disabled={!cfg.webhookUrl || testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Webhook"}
          </Button>
        </div>
      </div>

      {testResult && (
        <div
          className={`rounded-md border p-3 ${
            testResult.ok
              ? "border-success/30 bg-success/5"
              : "border-destructive/40 bg-destructive/5"
          }`}
        >
          <div className="mb-2 flex items-center gap-2 text-sm">
            {testResult.ok ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <span className="font-medium">
              {testResult.ok
                ? `${testResult.status} OK · ${testResult.latencyMs}ms`
                : "Test failed"}
            </span>
          </div>
          <pre className="overflow-auto rounded bg-muted/40 p-2 text-xs">
            <code>{testResult.body}</code>
          </pre>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-sm">Sample DLR payload</Label>
          <Button variant="ghost" size="sm" onClick={copySample} className="h-7 gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-xs">Copy</span>
          </Button>
        </div>
        <pre className="overflow-auto rounded-md border bg-card p-3 text-xs">
          <code>{sample}</code>
        </pre>
      </div>
    </div>
  );
}
