import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSignIn } from "@clerk/react/legacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function SsoLogin() {
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isLoaded, signIn } = useSignIn();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || !isLoaded || !signIn) return;
    setIsLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "enterprise_sso",
        identifier: domain.trim(),
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/apps",
      } as any);
    } catch (err: any) {
      toast({ title: "SSO error", description: err?.errors?.[0]?.message || "Could not initiate SSO login.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Button variant="ghost" size="icon" onClick={toggleTheme} className="absolute top-4 left-4">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Card className="w-full max-w-sm border-border">
        <CardHeader className="text-center pb-2">
          <h1 className="text-lg font-semibold tracking-tight">Enterprise SSO</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your company email or domain</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Company domain</Label>
              <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue with SSO
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
