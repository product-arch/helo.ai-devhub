import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Phone } from "lucide-react";
import type { SandboxSender } from "../lib/smsTypes";

export function StepSandboxSender({ sender }: { sender: SandboxSender }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        A shared sandbox sender has been auto-assigned to this App. No registration required.
      </p>
      <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="font-mono text-sm">{sender.senderId}</div>
          <div className="text-xs text-muted-foreground">Sandbox — for testing only</div>
        </div>
        <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
          Ready
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="About sandbox sender"
                className="text-muted-foreground hover:text-foreground"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              This sandbox number is shared across test accounts. For production, register a Sender ID below.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
