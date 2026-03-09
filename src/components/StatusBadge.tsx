import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProductStatus, CapabilityStatus } from "@/contexts/AppContext";

interface StatusBadgeProps {
  status: ProductStatus | CapabilityStatus | "success" | "failed" | "pending" | "retried" | "queued" | "rate_limited";
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; extraClass?: string }> = {
  active: { label: "Active", variant: "outline", extraClass: "bg-success/10 text-success border-success/20" },
  configured: { label: "Configured", variant: "outline", extraClass: "bg-primary/10 text-primary border-primary/20" },
  disabled: { label: "Disabled", variant: "secondary" },
  restricted: { label: "Restricted", variant: "outline", extraClass: "bg-warning/10 text-warning border-warning/20" },
  enabled: { label: "Enabled", variant: "outline", extraClass: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", variant: "outline", extraClass: "bg-warning/10 text-warning border-warning/20" },
  success: { label: "Success", variant: "outline", extraClass: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", variant: "destructive" },
  retried: { label: "Retried", variant: "outline", extraClass: "bg-accent text-accent-foreground border-border" },
  queued: { label: "Queued", variant: "secondary" },
  rate_limited: { label: "Rate Limited", variant: "outline", extraClass: "bg-warning/10 text-warning border-warning/20" },
};

const dotColor: Record<string, string> = {
  active: "bg-success",
  configured: "bg-primary",
  disabled: "bg-muted-foreground",
  restricted: "bg-warning",
  enabled: "bg-success",
  pending: "bg-warning",
  success: "bg-success",
  failed: "bg-destructive",
  retried: "bg-accent-foreground",
  queued: "bg-muted-foreground",
  rate_limited: "bg-warning",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.disabled;
  return (
    <Badge variant={config.variant} className={cn("inline-flex items-center gap-1.5", config.extraClass, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dotColor[status] || "bg-muted-foreground")} />
      {config.label}
    </Badge>
  );
}
