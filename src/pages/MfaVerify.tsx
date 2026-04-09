import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function MfaVerify() {
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleVerify = async () => {
    const value = useBackup ? backupCode : code;
    if (!value || (!useBackup && value.length < 6)) return;
    setIsLoading(true);
    const success = await login("mfa@mock.com", "mock");
    if (success) {
      toast({ title: "Verified", description: "Two-factor authentication successful." });
      navigate("/apps");
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
          <h1 className="text-lg font-semibold tracking-tight">Two-factor authentication</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {useBackup ? "Enter your backup code" : "Enter the 6-digit code from your authenticator app"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {useBackup ? (
            <div className="space-y-2">
              <Label htmlFor="backup">Backup code</Label>
              <Input id="backup" value={backupCode} onChange={(e) => setBackupCode(e.target.value)} placeholder="xxxx-xxxx-xxxx" />
            </div>
          ) : (
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}

          <Button className="w-full" onClick={handleVerify} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>

          <div className="text-center space-y-1">
            <button
              type="button"
              onClick={() => setUseBackup(!useBackup)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {useBackup ? "Use authenticator app instead" : "Use a backup code instead"}
            </button>
            <div>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
