import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Lock } from "lucide-react";
import { CodeSample } from "@/components/CodeSample";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { WhatsAppApi } from "@/data/whatsappApis";

const methodColors: Record<string, string> = {
  GET: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  POST: "bg-green-500/15 text-green-600 dark:text-green-400",
  DELETE: "bg-red-500/15 text-red-600 dark:text-red-400",
  "GET/POST": "bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

const layerColors: Record<string, string> = {
  WABA: "bg-accent text-accent-foreground",
  Phone: "bg-secondary text-secondary-foreground",
  Media: "bg-muted text-muted-foreground",
};

interface ApiLineItemProps {
  api: WhatsAppApi;
}

export function ApiLineItem({ api }: ApiLineItemProps) {
  const [enabled, setEnabled] = useState(false);
  const [requested, setRequested] = useState(false);
  const { toast } = useToast();

  const isExpanded = enabled;

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    toast({
      title: checked ? "API Activated" : "API Deactivated",
      description: api.category,
    });
  };

  const handleRequestAccess = () => {
    setRequested(true);
    toast({
      title: "Access Requested",
      description: `Your request for "${api.category}" has been submitted for review.`,
    });
  };

  return (
    <Collapsible open={isExpanded}>
      <div className={cn(
        "border-b border-border last:border-0 transition-colors",
        isExpanded && "bg-muted/30"
      )}>
        <CollapsibleTrigger asChild disabled={!enabled}>
          <div className="flex items-center gap-3 px-4 py-3 cursor-default">
            {/* Method badge */}
            <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 w-16 text-center", methodColors[api.method] || "bg-muted text-muted-foreground")}>
              {api.method}
            </span>

            {/* Category + purpose */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{api.category}</span>
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", layerColors[api.layer])}>
                  {api.layer}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{api.purpose}</p>
            </div>

            {/* Endpoint */}
            <code className="hidden lg:block text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded max-w-[280px] truncate shrink-0">
              {api.endpoint}
            </code>

            {/* Control */}
            <div className="shrink-0 flex items-center gap-2">
              {api.accessType === "toggle" ? (
                <Switch checked={enabled} onCheckedChange={handleToggle} />
              ) : (
                requested ? (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    <Lock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleRequestAccess}>
                    Request Access
                  </Button>
                )
              )}
              {enabled && (
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1">
            <CodeSample api={api} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
