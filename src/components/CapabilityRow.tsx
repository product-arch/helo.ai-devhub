import { MessagingCapability } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldCheck, CreditCard } from "lucide-react";

const reqIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  approval: ShieldCheck,
  billing: CreditCard,
  compliance: Lock,
};

interface CapabilityRowProps {
  capability: MessagingCapability;
  onToggle: () => void;
  onRequestAccess: () => void;
}

export function CapabilityRow({ capability, onToggle, onRequestAccess }: CapabilityRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium">{capability.name}</span>
          <StatusBadge status={capability.status} />
        </div>
        <p className="text-xs text-muted-foreground">{capability.description}</p>
        {capability.requirements.length > 0 && (
          <div className="flex gap-1.5 mt-1.5">
            {capability.requirements.map((req) => {
              const Icon = reqIcons[req];
              return (
                <Badge key={req} variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                  {Icon && <Icon className="h-3 w-3" />}
                  {req}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
      <div className="shrink-0">
        {capability.status === "disabled" && (
          <Button size="sm" variant="outline" onClick={onToggle}>
            Enable
          </Button>
        )}
        {capability.status === "enabled" && (
          <Button size="sm" variant="ghost" onClick={onToggle}>
            Disable
          </Button>
        )}
        {capability.status === "restricted" && (
          <Button size="sm" variant="outline" onClick={onRequestAccess}>
            Request Access
          </Button>
        )}
      </div>
    </div>
  );
}
