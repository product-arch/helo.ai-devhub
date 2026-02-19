import { cn } from "@/lib/utils";
import { ProductStatus, CapabilityStatus } from "@/contexts/AppContext";

interface StatusBadgeProps {
  status: ProductStatus | CapabilityStatus | "success" | "failed" | "pending" | "retried" | "queued" | "rate_limited";
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  configured: { label: "Configured", className: "bg-primary/10 text-primary border-primary/20" },
  disabled: { label: "Disabled", className: "bg-muted text-muted-foreground border-border" },
  restricted: { label: "Restricted", className: "bg-warning/10 text-warning border-warning/20" },
  enabled: { label: "Enabled", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  success: { label: "Success", className: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
  retried: { label: "Retried", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  queued: { label: "Queued", className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  rate_limited: { label: "Rate Limited", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
};

const dotColor: Record<string, string> = {
  active: "bg-success", configured: "bg-primary", disabled: "bg-muted-foreground",
  restricted: "bg-warning", enabled: "bg-success", pending: "bg-warning",
  success: "bg-success", failed: "bg-destructive",
  retried: "bg-blue-500", queued: "bg-purple-500", rate_limited: "bg-orange-500",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.disabled;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.className, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", dotColor[status] || "bg-muted-foreground")} />
      {config.label}
    </span>
  );
}
