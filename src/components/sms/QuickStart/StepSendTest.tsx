import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CheckCircle2, ChevronDown, Send, XCircle, Copy, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { phoneSchema, messageBodySchema } from "../lib/smsValidators";
import { smsSimulator, ERROR_TIPS, type ApiError } from "../lib/smsSimulator";
import type { SmsSendResponse, SmsStatus } from "../lib/smsTypes";
import { DlrStatusTimeline } from "./DlrStatusTimeline";
import { CodeSnippetTabs } from "./CodeSnippetTabs";
import { Confetti } from "./Confetti";

interface Props {
  apiKey: string;
  fromNumber: string;
  defaultTo?: string;
  onDelivered: () => void;
}

export function StepSendTest({ apiKey, fromNumber, defaultTo, onDelivered }: Props) {
  const [to, setTo] = useState(defaultTo || "");
  const [body, setBody] = useState(
    "Hello from helo.ai! Your SMS integration is working. 🎉",
  );
  const [errors, setErrors] = useState<{ to?: string; body?: string }>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<SmsSendResponse | null>(null);
  const [status, setStatus] = useState<SmsStatus>("queued");
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [dlrTimedOut, setDlrTimedOut] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const { toast } = useToast();

  const pollRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const stopPoller = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startPolling = (messageId: string) => {
    stopPoller();
    setDlrTimedOut(false);
    const startedAt = Date.now();
    const tick = async () => {
      try {
        const r = await smsSimulator.getStatus(messageId);
        setStatus(r.status);
        if (r.status === "delivered") {
          stopPoller();
          onDelivered();
        } else if (r.status === "failed") {
          stopPoller();
          setApiError({
            status: 200,
            code: r.errorCode || "unknown",
            message: r.errorMessage || "Delivery failed.",
          });
        } else if (Date.now() - startedAt >= 30000) {
          stopPoller();
          setDlrTimedOut(true);
        }
      } catch {
        /* ignore transient */
      }
    };
    pollRef.current = window.setInterval(tick, 2000);
    timeoutRef.current = window.setTimeout(() => {
      stopPoller();
      setDlrTimedOut(true);
    }, 30500);
    void tick();
  };

  const handleSend = async () => {
    const toResult = phoneSchema.safeParse(to);
    const bodyResult = messageBodySchema.safeParse(body);
    const fieldErrors: typeof errors = {};
    if (!toResult.success) fieldErrors.to = toResult.error.issues[0].message;
    if (!bodyResult.success) fieldErrors.body = bodyResult.error.issues[0].message;
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSending(true);
    setApiError(null);
    setSent(null);
    setStatus("queued");
    setDlrTimedOut(false);

    try {
      const res = await smsSimulator.sendSms({
        to: toResult.data,
        from: fromNumber,
        body: bodyResult.data,
        apiKey,
      });
      setSent(res);
      setStatus("queued");
      startPolling(res.messageId);
    } catch (e) {
      setApiError(e as ApiError);
    } finally {
      setSending(false);
    }
  };

  const copyMessageId = async () => {
    if (!sent) return;
    await navigator.clipboard.writeText(sent.messageId);
    setCopiedId(true);
    toast({ title: "Copied", description: "Message ID copied" });
    setTimeout(() => setCopiedId(false), 1500);
  };

  const tips = apiError ? ERROR_TIPS[apiError.code] : undefined;

  return (
    <div className="relative space-y-4">
      <Confetti active={status === "delivered"} />
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <div className="space-y-1.5">
          <Label htmlFor="sms-to">To</Label>
          <Input
            id="sms-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="+91XXXXXXXXXX"
            className="font-mono text-sm"
            aria-invalid={!!errors.to}
          />
          {errors.to && <p className="text-xs text-destructive">{errors.to}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sms-body">Message</Label>
          <Textarea
            id="sms-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            aria-invalid={!!errors.body}
          />
          <div className="flex justify-between">
            {errors.body ? (
              <p className="text-xs text-destructive">{errors.body}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted-foreground">{body.length} / 1600</p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSend}
        disabled={sending}
        size="lg"
        className="gap-2"
      >
        <Send className="h-4 w-4" />
        {sending ? "Sending…" : "Send Test Message"}
      </Button>

      {apiError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium text-destructive">
                Error {apiError.code} — {apiError.message}
              </div>
              {tips && (
                <Collapsible open={showTips} onOpenChange={setShowTips}>
                  <CollapsibleTrigger className="text-xs underline underline-offset-2 hover:text-foreground">
                    What went wrong?
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
                      {tips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        </div>
      )}

      {sent && !apiError && (
        <div className="space-y-3 rounded-md border border-success/30 bg-success/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <span>Message sent. Check your phone.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>messageId:</span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                  {sent.messageId}
                </code>
                <button
                  onClick={copyMessageId}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Copy message ID"
                >
                  {copiedId ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <DlrStatusTimeline status={status} />
              {status === "delivered" && (
                <div className="flex items-center gap-1.5 pt-1 text-sm font-medium text-success">
                  Your SMS integration is working.
                  <button
                    onClick={() =>
                      document
                        .getElementById("sms-production-config")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center gap-1 underline underline-offset-2"
                  >
                    Ready to go to production <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {dlrTimedOut && (
                <div className="text-xs text-muted-foreground">
                  Status unknown —{" "}
                  <Link to="../logs" className="underline underline-offset-2">
                    check Logs &amp; Events
                  </Link>{" "}
                  for delivery confirmation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Collapsible open={showRequest} onOpenChange={setShowRequest}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showRequest ? "rotate-180" : ""}`}
          />
          Show request
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <CodeSnippetTabs
            apiKey={apiKey}
            from={fromNumber}
            to={to || "+14155550100"}
            body={body}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
