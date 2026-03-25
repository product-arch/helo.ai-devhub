import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const clientId = params.get("client_id") ?? "unknown";
  const scopes = (params.get("scope") ?? "").split(" ").filter(Boolean);
  const redirectUri = params.get("redirect_uri") ?? "";
  const state = params.get("state") ?? "";
  const codeChallenge = params.get("code_challenge") ?? "";

  const handleAllow = () => {
    const mockCode = `MOCK_AUTH_CODE_${Math.random().toString(36).slice(2, 10)}`;
    const url = new URL(redirectUri);
    url.searchParams.set("code", mockCode);
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  };

  const handleDeny = () => {
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center space-y-3 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">helo.ai</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Authorization Request</h1>
            <p className="text-sm text-muted-foreground">
              An application is requesting access to your account
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Client info */}
          <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
            <p className="text-xs text-muted-foreground">Client ID</p>
            <p className="text-xs font-mono break-all text-foreground">{clientId}</p>
          </div>

          {/* Scopes */}
          {scopes.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium">This application would like to:</p>
              <div className="space-y-2">
                {scopes.map((scope) => (
                  <label key={scope} className="flex items-center gap-2.5">
                    <Checkbox checked disabled className="pointer-events-none" />
                    <span className="text-sm text-foreground">{scope}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Redirect URI */}
          {redirectUri && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Redirect URI
              </p>
              <p className="text-xs font-mono break-all text-foreground">{redirectUri}</p>
            </div>
          )}

          {codeChallenge && (
            <p className="text-[11px] text-muted-foreground">
              PKCE code challenge verified (S256)
            </p>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-4">
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDeny}>
              Deny
            </Button>
            <Button className="flex-1" onClick={handleAllow}>
              Allow
            </Button>
          </div>

          <Separator />

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            By approving, you agree to share the listed permissions with this application.
            This is a simulated consent screen for development purposes.
          </p>

          <p className="text-[11px] text-muted-foreground/60 text-center">
            Powered by helo.ai
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
