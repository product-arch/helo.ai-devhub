import { cn } from "@/lib/utils";
import { ProductStatus, CapabilityStatus } from "@/contexts/AppContext";

interface StatusBadgeProps {
  status: ProductStatus | CapabilityStatus | "success" | "failed" | "pending";
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
};

const dotColor: Record<string, string> = {
  active: "bg-success", configured: "bg-primary", disabled: "bg-muted-foreground",
  restricted: "bg-warning", enabled: "bg-success", pending: "bg-warning",
  success: "bg-success", failed: "bg-destructive",
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
