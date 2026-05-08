import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ApiHealthDot({
  status = "operational",
  checkedAgoMin = 2,
}: {
  status?: "operational" | "degraded" | "incident";
  checkedAgoMin?: number;
}) {
  const tone =
    status === "operational"
      ? "bg-success"
      : status === "degraded"
        ? "bg-warning"
        : "bg-destructive";
  const label =
    status === "operational" ? "Operational" : status === "degraded" ? "Degraded" : "Incident";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href="#status"
          className="inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
                tone,
              )}
            />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", tone)} />
          </span>
          <span className="font-mono uppercase tracking-wide">{label}</span>
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        WhatsApp API: {label} — last checked {checkedAgoMin} min ago
      </TooltipContent>
    </Tooltip>
  );
}