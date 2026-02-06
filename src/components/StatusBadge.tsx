import { cn } from "@/lib/utils";
import { ProductStatus } from "@/contexts/AppContext";

interface StatusBadgeProps {
  status: ProductStatus | "success" | "failed" | "pending";
  className?: string;
}

const statusConfig = {
  active: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20",
  },
  configured: {
    label: "Configured",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  disabled: {
    label: "Disabled",
    className: "bg-muted text-muted-foreground border-border",
  },
  restricted: {
    label: "Restricted",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  success: {
    label: "Success",
    className: "bg-success/10 text-success border-success/20",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          status === "active" || status === "success"
            ? "bg-success"
            : status === "failed"
            ? "bg-destructive"
            : status === "restricted" || status === "pending"
            ? "bg-warning"
            : status === "configured"
            ? "bg-primary"
            : "bg-muted-foreground"
        )}
      />
      {config.label}
    </span>
  );
}
