import { cn } from "@/lib/utils";

export function RateLimitMeter({ count, limit }: { count: number; limit: number }) {
  const pct = Math.min(100, (count / limit) * 100);
  const tone =
    pct >= 95 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-primary";
  const toneText =
    pct >= 95 ? "text-destructive" : pct >= 80 ? "text-warning" : "text-muted-foreground";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        <span>Rate limit</span>
        <span className={cn("tabular-nums", toneText)}>
          {count} / {limit} per minute
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}