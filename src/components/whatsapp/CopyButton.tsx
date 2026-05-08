import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label,
  onCopied,
  size = "sm",
  variant = "ghost",
  className,
}: {
  value: string;
  label?: string;
  onCopied?: () => void;
  size?: "sm" | "icon";
  variant?: "ghost" | "outline";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };
  return (
    <Button
      type="button"
      variant={variant}
      size={size === "icon" ? "icon" : "sm"}
      onClick={handle}
      aria-live="polite"
      className={cn("h-7 gap-1.5 text-xs", size === "icon" && "h-7 w-7", className)}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      {label && size !== "icon" ? (copied ? "Copied" : label) : null}
    </Button>
  );
}