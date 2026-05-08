import { Beaker, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Environment } from "./lib/types";

export function EnvSwitcher({
  value,
  onChange,
}: {
  value: Environment;
  onChange: (e: Environment) => void;
}) {
  const isSb = value === "sandbox";
  return (
    <div
      role="tablist"
      aria-label="Environment"
      className="relative inline-flex items-center rounded-full border bg-card p-1 shadow-block"
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 w-1/2 rounded-full bg-primary/10 ring-1 ring-primary/30 transition-all duration-200",
          isSb ? "left-1" : "left-[calc(50%-0px)]",
        )}
      />
      <button
        role="tab"
        aria-selected={isSb}
        onClick={() => onChange("sandbox")}
        className={cn(
          "relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
          isSb ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Beaker className="h-3.5 w-3.5" /> Sandbox
      </button>
      <button
        role="tab"
        aria-selected={!isSb}
        onClick={() => onChange("production")}
        className={cn(
          "relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
          !isSb ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Radio className="h-3.5 w-3.5" /> Production
        {!isSb && (
          <span className="ml-1 rounded-sm bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground">
            LIVE
          </span>
        )}
      </button>
    </div>
  );
}

export function EnvBanner({ env }: { env: Environment }) {
  if (env !== "sandbox") return null;
  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground"
    >
      <Beaker className="h-3.5 w-3.5 shrink-0 text-warning" />
      <span className="text-foreground">
        <span className="font-semibold">Sandbox Mode</span> — safe for testing, no real
        messages will be sent. Switch to Production when you're ready to go live.
      </span>
    </div>
  );
}