import { cn } from "@/lib/utils";
import type { HistoryEntry } from "./lib/types";

function statusTone(s: number) {
  if (s >= 200 && s < 300) return "bg-success/15 text-success border-success/30";
  if (s >= 400) return "bg-destructive/15 text-destructive border-destructive/30";
  return "bg-warning/15 text-warning border-warning/30";
}

function relTime(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function HistoryTab({
  entries,
  onReplay,
}: {
  entries: HistoryEntry[];
  onReplay: (e: HistoryEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-xs text-muted-foreground shadow-block">
        No requests yet — send your first message above.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-block">
      {entries.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => onReplay(e)}
          className="flex w-full items-center gap-3 border-b px-3 py-2 text-left text-xs last:border-b-0 hover:bg-accent"
        >
          <span
            className={cn(
              "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold",
              statusTone(e.status),
            )}
          >
            {e.status}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{e.type}</span>
          <span className="flex-1 truncate font-mono text-[11px]">{e.to}</span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {e.ms}ms
          </span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {relTime(e.ts)}
          </span>
        </button>
      ))}
    </div>
  );
}