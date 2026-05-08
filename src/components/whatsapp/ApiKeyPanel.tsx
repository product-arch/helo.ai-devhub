import { useState } from "react";
import { Eye, EyeOff, RotateCw, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./CopyButton";
import { cn } from "@/lib/utils";
import type { Environment } from "./lib/types";

function genKey(env: Environment) {
  const prefix = env === "sandbox" ? "sk_sb_" : "sk_live_";
  const rand = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 36).toString(36),
  ).join("");
  return prefix + rand;
}

export function useApiKey(env: Environment) {
  const [keys, setKeys] = useState<Record<Environment, string>>(() => ({
    sandbox: genKey("sandbox"),
    production: genKey("production"),
  }));
  const apiKey = keys[env];
  const regenerate = () => setKeys((k) => ({ ...k, [env]: genKey(env) }));
  return { apiKey, regenerate };
}

export function ApiKeyPanel({
  env,
  apiKey,
  onRegenerate,
  onCopied,
}: {
  env: Environment;
  apiKey: string;
  onRegenerate: () => void;
  onCopied: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const masked = apiKey.slice(0, 8) + "•".repeat(20) + apiKey.slice(-4);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Key className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          {env === "sandbox" ? "Sandbox key" : "Live key"}
        </span>
      </div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs",
          env === "production" && "border-destructive/30",
        )}
      >
        <code className="flex-1 truncate">{revealed ? apiKey : masked}</code>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? "Hide key" : "Reveal key"}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </Button>
        <CopyButton value={apiKey} size="icon" onCopied={onCopied} />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onRegenerate}
          aria-label="Regenerate key"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}