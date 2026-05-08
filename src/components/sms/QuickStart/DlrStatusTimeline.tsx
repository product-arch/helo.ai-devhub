import { Check, Clock, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SmsStatus } from "../lib/smsTypes";

const ORDER: SmsStatus[] = ["queued", "sent", "delivered"];

function rank(s: SmsStatus) {
  if (s === "failed") return -1;
  return ORDER.indexOf(s);
}

export function DlrStatusTimeline({ status }: { status: SmsStatus }) {
  const failed = status === "failed";
  const current = rank(status);
  return (
    <ol className="flex items-center gap-2">
      {ORDER.map((s, i) => {
        const done = current > i;
        const active = current === i && !failed;
        const isFinal = i === ORDER.length - 1;
        return (
          <li key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs",
                done && "border-success bg-success/10 text-success",
                active && "border-primary bg-primary/10 text-primary",
                !done && !active && !failed && "border-border text-muted-foreground",
                failed && isFinal && "border-destructive bg-destructive/10 text-destructive",
              )}
            >
              {failed && isFinal ? (
                <X className="h-3.5 w-3.5" />
              ) : done ? (
                <Check className="h-3.5 w-3.5" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
            </div>
            <span
              className={cn(
                "text-xs capitalize",
                done && "text-foreground",
                active && "font-medium text-foreground",
                !done && !active && "text-muted-foreground",
              )}
            >
              {s}
            </span>
            {i < ORDER.length - 1 && (
              <span
                className={cn(
                  "mx-1 h-px w-6",
                  done ? "bg-success" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
      {failed && (
        <li className="ml-2 text-xs font-medium text-destructive">Failed</li>
      )}
    </ol>
  );
}
