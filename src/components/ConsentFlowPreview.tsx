import { useState, useEffect, useCallback } from "react";
import { AppCredential } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check, ExternalLink, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ConsentFlowPreviewProps {
  credential: AppCredential;
  collapsible?: boolean;
}

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  try {
    const buffer = new Uint8Array(32);
    crypto.getRandomValues(buffer);
    const verifier = btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const encoded = new TextEncoder().encode(verifier);
    const hash = await crypto.subtle.digest("SHA-256", encoded);
    const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return { verifier, challenge };
  } catch {
    return { verifier: "fallback", challenge: "PKCE_CHALLENGE_PLACEHOLDER" };
  }
}

export function ConsentFlowPreview({ credential, collapsible = false }: ConsentFlowPreviewProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedUri, setSelectedUri] = useState(credential.redirectUris?.[0] ?? "");
  const [codeChallenge, setCodeChallenge] = useState("generating...");

  const hasAuthCodeGrant = credential.grantTypes?.includes("authorization_code");
  const isInactive = credential.status === "suspended" || credential.status === "revoked";

  const regeneratePKCE = useCallback(async () => {
    const { challenge } = await generatePKCE();
    setCodeChallenge(challenge);
  }, []);

  useEffect(() => {
    regeneratePKCE();
  }, [regeneratePKCE]);

  // Not applicable for client_credentials only
  if (!hasAuthCodeGrant) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">
          Consent flow is not applicable for Client Credentials grant. Add Authorization Code grant to enable this.
        </p>
      </div>
    );
  }

  const scopes = credential.scopes
    .flatMap((s) => s.permissions)
    .join(" ");

  const authUrl = `https://auth.helo.ai/oauth/authorize?client_id=${credential.clientId ?? ""}&response_type=code&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(selectedUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  const formattedUrl = `https://auth.helo.ai/oauth/authorize
  ?client_id=${credential.clientId ?? ""}
  &response_type=code
  &scope=${scopes}
  &redirect_uri=${selectedUri}
  &code_challenge=${codeChallenge}
  &code_challenge_method=S256`;

  const handleCopy = () => {
    navigator.clipboard.writeText(authUrl);
    setCopied(true);
    toast({ title: "Copied", description: "Authorization URL copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const redirectUris = credential.redirectUris ?? [];

  return (
    <div className={cn("space-y-3", collapsible ? "" : "rounded-md border p-3")}>
      {!collapsible && (
        <>
          <p className="text-xs font-medium">Consent Flow Preview</p>
          <p className="text-[11px] text-muted-foreground">
            Trigger the authorization flow to preview the consent screen your users will see.
          </p>
        </>
      )}

      {/* Redirect URI selector */}
      {redirectUris.length > 1 && (
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground">Redirect URI</label>
          <Select value={selectedUri} onValueChange={setSelectedUri}>
            <SelectTrigger className="h-8 text-xs font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {redirectUris.map((uri) => (
                <SelectItem key={uri} value={uri} className="text-xs font-mono">
                  {uri}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* URL block */}
      <div className={cn(
        "relative rounded-md border p-3",
        isInactive ? "bg-muted/50 opacity-60" : "bg-muted/30"
      )}>
        <pre className="text-[11px] font-mono whitespace-pre-wrap break-all text-foreground leading-relaxed">
          {formattedUrl.split("\n").map((line, i) => {
            if (line.includes("code_challenge=") && !line.includes("method")) {
              return (
                <span key={i} className="flex items-start gap-1">
                  <span>{line}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5 cursor-help inline-block" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        <p className="text-xs">A PKCE challenge has been automatically generated for this preview.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {"\n"}
                </span>
              );
            }
            return <span key={i}>{line}{i < formattedUrl.split("\n").length - 1 ? "\n" : ""}</span>;
          })}
        </pre>
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={handleCopy}
          disabled={isInactive}
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>

      {/* Action button */}
      {isInactive ? (
        <Button disabled className="w-full text-xs h-9">
          <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
          Credential is not Active
        </Button>
      ) : (
        <Button
          className="w-full text-xs h-9"
          onClick={() => window.open(authUrl, "_blank")}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Open Consent Screen
        </Button>
      )}

      {/* Info note */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {isInactive
          ? "The consent flow cannot be triggered while this credential is suspended or revoked."
          : collapsible
            ? "Use this URL to preview the consent screen your users will see. Make sure your redirect URI is reachable before testing."
            : "This triggers a live authorization flow. Your registered redirect URI must be reachable to complete the token exchange after approval. The authorization code expires in 10 minutes."
        }
      </p>
    </div>
  );
}
