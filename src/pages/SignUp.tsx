import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { getPasswordStrength } from "@/lib/password";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [company, setCompany] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();

  const strength = password ? getPasswordStrength(password) : null;
  const strengthColor = strength === "strong" ? "bg-green-500" : strength === "fair" ? "bg-yellow-500" : "bg-red-500";
  const strengthWidth = strength === "strong" ? "w-full" : strength === "fair" ? "w-2/3" : "w-1/3";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Name is required";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required";
    if (password.length < 8) e.password = "Minimum 8 characters";
    if (password !== confirmPassword) e.confirmPassword = "Passwords don't match";
    if (!termsAccepted) e.terms = "You must accept the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const success = await login(email, password);
    if (success) {
      toast({ title: "Account created", description: "Welcome to helo.ai Developer Console." });
      navigate("/apps");
    }
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    const success = await login(`${provider}@mock.com`, "mock");
    if (success) {
      toast({ title: "Account created", description: `Signed up with ${provider}.` });
      navigate("/apps");
    }
    setIsLoading(false);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Create your account</h2>
          <p className="text-sm text-muted-foreground mt-1">Get started with helo.ai</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" autoComplete="name" />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" autoComplete="email" />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {password && (
              <div className="space-y-1">
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strengthColor} ${strengthWidth}`} />
                </div>
                <p className="text-xs text-muted-foreground capitalize">{strength}</p>
              </div>
            )}
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" autoComplete="organization" />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(v === true)} className="mt-0.5" />
            <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground cursor-pointer leading-snug">
              I agree to the Terms of Service and Privacy Policy
            </Label>
          </div>
          {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">OR</span></div>
        </div>

        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => handleSocialLogin("Google")} disabled={isLoading}>
            Continue with Google
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
