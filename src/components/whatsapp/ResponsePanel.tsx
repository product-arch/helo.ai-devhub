import { ArrowRight, AlertTriangle, CheckCircle2, Clock, Database } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import { highlightJson } from "./lib/syntax";
import { STATUS_EXPLAIN } from "./lib/simulator";
import type { ApiResponse } from "./lib/types";

const SAMPLE: ApiResponse = {
  status: 202,
  statusText: "Accepted",
  ok: true,
  ms: 312,
  bytes: 178,
  body: {
    messaging_product: "whatsapp",
    contacts: [{ input: "+14155550100", wa_id: "14155550100" }],
    messages: [{ id: "wamid.sample_abc123==" }],
  },
};

function statusTone(status: number) {
  if (status >= 200 && status < 300) return "bg-success text-success-foreground";
  if (status >= 300 && status < 400) return "bg-warning text-warning-foreground";
  return "bg-destructive text-destructive-foreground";
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  return `${(b / 1024).toFixed(1)} KB`;
}

export function ResponsePanel({
  response,
  loading,
}: {
  response: ApiResponse | null;
  loading: boolean;
}) {
  const r = response ?? SAMPLE;
  const isSample = !response;
  const json = JSON.stringify(r.body, null, 2);
  const errMsg =
    !r.ok && (r.body as any)?.error?.message
      ? (r.body as any).error.message
      : null;

  return (
    <div className="rounded-lg border bg-card shadow-block">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wide",
                  statusTone(r.status),
                  isSample && "opacity-50",
                )}
                aria-label={`Status ${r.status} ${r.statusText}`}
              >
                {r.status} {r.statusText}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              {STATUS_EXPLAIN[r.status] ?? "HTTP response status."}
            </TooltipContent>
          </Tooltip>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {r.ms} ms
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
            <Database className="h-3 w-3" />
            {fmtBytes(r.bytes)}
          </span>
        </div>
        <CopyButton value={json} size="icon" />
      </div>

      {isSample && (
        <div className="border-b px-3 py-1.5 text-[11px] italic text-muted-foreground">
          Sample response — send a request to see your real response.
        </div>
      )}

      {!isSample && r.ok && (
        <div className="flex items-center gap-2 border-b border-success/30 bg-success/10 px-3 py-2 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span>Message accepted by WhatsApp.</span>
          <a
            href="/logs"
            className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
          >
            View in Logs <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      )}

      {!isSample && !r.ok && errMsg && (
        <div className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wide text-destructive">
              Error · {r.status}
            </div>
            <div className="text-foreground">{errMsg}</div>
          </div>
        </div>
      )}

      <pre
        className={cn(
          "max-h-[360px] overflow-auto bg-background/40 px-4 py-3 font-mono text-xs leading-relaxed",
          isSample && "opacity-50",
          loading && "pg-fade-in-up",
          !isSample && "pg-fade-in-up",
        )}
      >
        <code>{highlightJson(json)}</code>
      </pre>
    </div>
  );
}