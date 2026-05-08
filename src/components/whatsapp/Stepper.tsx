import { Check, Key, Globe, Link2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepperState } from "./lib/types";

const STEPS = [
  { key: "keyCopied", label: "Get API Key", icon: Key, target: "step-key" },
  { key: "headerCopied", label: "Set Authorization", icon: Globe, target: "step-auth" },
  { key: "baseUrlCopied", label: "Confirm Base URL", icon: Link2, target: "step-url" },
  { key: "requestSent", label: "Send First Message", icon: Send, target: "step-send" },
] as const;

export function Stepper({ state }: { state: StepperState }) {
  const completed = STEPS.map((s) => state[s.key]);
  const activeIndex = completed.findIndex((c) => !c);

  return (
    <ol className="flex w-full items-center gap-0">
      {STEPS.map((s, i) => {
        const done = completed[i];
        const active = activeIndex === i;
        const Icon = s.icon;
        const onClick = () => {
          document.getElementById(s.target)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        };
        return (
          <li key={s.key} className="flex flex-1 items-center gap-3">
            <button
              onClick={onClick}
              aria-current={active ? "step" : undefined}
              className="group flex flex-1 items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent/50"
            >
              <span
                className={cn(
                  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all",
                  done && "border-primary bg-primary text-primary-foreground",
                  active &&
                    !done &&
                    "border-primary text-primary pg-pulse-glow ring-2 ring-primary/20",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-[11px] font-mono uppercase tracking-wide",
                    done || active ? "text-muted-foreground" : "text-muted-foreground/60",
                  )}
                >
                  Step {i + 1}
                </div>
                <div
                  className={cn(
                    "truncate text-sm transition-colors",
                    done && "text-foreground",
                    active && !done && "font-semibold text-foreground",
                    !done && !active && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </div>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px flex-1 transition-colors",
                  done ? "bg-primary/60" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}