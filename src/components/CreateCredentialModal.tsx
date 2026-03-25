import { useState, useMemo } from "react";
import { useApp, CredentialType, AppCredential, CredentialScope } from "@/contexts/AppContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Key, Globe, Server, Copy, Check, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle2, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CreateCredentialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
}

const typeOptions = [
  { value: "api_key" as CredentialType, label: "API Key", description: "Bearer token for direct server-to-server API calls", icon: Key, tag: "Most Common" },
  { value: "oauth2" as CredentialType, label: "OAuth 2.0", description: "Client credentials or authorization code flow for third-party integrations", icon: Globe },
  { value: "service_account" as CredentialType, label: "Service Account", description: "JWT-based public key authentication for automated systems", icon: Server },
];

const PRODUCT_PERMISSIONS: Record<string, string[]> = {
  sms: ["sms.send", "sms.status", "sms.list"],
  rcs: ["rcs.send", "rcs.status", "rcs.rich_card", "rcs.carousel"],
  whatsapp: ["wa.template", "wa.send", "wa.status", "wa.interactive"],
  webhooks: ["webhook.subscribe", "webhook.manage"],
};

function validatePEM(key: string): { validFormat: boolean; rsaType: boolean; minBits: boolean } {
  const trimmed = key.trim();
  const validFormat = trimmed.startsWith("-----BEGIN") && trimmed.includes("-----END");
  const rsaType = trimmed.includes("PUBLIC KEY") || trimmed.includes("RSA");
  // Simplified bit length check based on key content length
  const base64Content = trimmed.replace(/-----[A-Z\s]+-----/g, "").replace(/\s/g, "");
  const minBits = base64Content.length >= 360; // ~2048 bits
  return { validFormat, rsaType, minBits };
}

function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function CreateCredentialModal({ open, onOpenChange, appId }: CreateCredentialModalProps) {
  const { apps, createCredential } = useApp();
  const app = apps.find((a) => a.id === appId);
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<CredentialType>("api_key");
  const [name, setName] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split("T")[0];
  });
  const [selectedScopes, setSelectedScopes] = useState<CredentialScope[]>([]);
  const [scopeError, setScopeError] = useState(false);

  // OAuth specific
  const [grantTypes, setGrantTypes] = useState<("authorization_code" | "client_credentials")[]>(["client_credentials"]);
  const [redirectUris, setRedirectUris] = useState("");
  const [redirectUriPills, setRedirectUriPills] = useState<string[]>([]);
  const [thirdPartyAppName, setThirdPartyAppName] = useState("");
  const [accessTokenLifetime, setAccessTokenLifetime] = useState(60);
  const [refreshTokenLifetime, setRefreshTokenLifetime] = useState(30);

  // Service account specific
  const [publicKey, setPublicKey] = useState("");

  // Result
  const [createdCredential, setCreatedCredential] = useState<AppCredential | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Name validation (must be before early return)
  const nameError = useMemo(() => {
    if (!app || !name.trim()) return null;
    if (name.trim().length < 3) return "Name must be at least 3 characters";
    if (name.trim().length > 64) return "Name must be 64 characters or less";
    const duplicate = app.credentials.some(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) return "A credential with this name already exists in this App";
    return null;
  }, [name, app]);

  const pemValidation = useMemo(() => {
    if (!publicKey.trim()) return null;
    return validatePEM(publicKey);
  }, [publicKey]);

  if (!app) return null;

  const enabledProducts = app.products.filter((p) => p.status !== "disabled");

  const handleToggleScope = (productId: string, permission: string) => {
    setScopeError(false);
    setSelectedScopes((prev) => {
      const existing = prev.find((s) => s.product === productId);
      if (existing) {
        const hasPermission = existing.permissions.includes(permission);
        if (hasPermission) {
          const newPerms = existing.permissions.filter((p) => p !== permission);
          if (newPerms.length === 0) return prev.filter((s) => s.product !== productId);
          return prev.map((s) => s.product === productId ? { ...s, permissions: newPerms } : s);
        } else {
          return prev.map((s) => s.product === productId ? { ...s, permissions: [...s.permissions, permission] } : s);
        }
      }
      return [...prev, { product: productId, permissions: [permission] }];
    });
  };

  const handleSelectAllProduct = (productId: string) => {
    const perms = PRODUCT_PERMISSIONS[productId] || [];
    const existing = selectedScopes.find((s) => s.product === productId);
    const allSelected = existing && existing.permissions.length === perms.length;
    setScopeError(false);
    if (allSelected) {
      setSelectedScopes((prev) => prev.filter((s) => s.product !== productId));
    } else {
      setSelectedScopes((prev) => {
        const without = prev.filter((s) => s.product !== productId);
        return [...without, { product: productId, permissions: [...perms] }];
      });
    }
  };

  const isScopeSelected = (productId: string, permission: string) => {
    return selectedScopes.some((s) => s.product === productId && s.permissions.includes(permission));
  };

  const handleAddRedirectUri = () => {
    const uris = redirectUris.split("\n").map((u) => u.trim()).filter(Boolean);
    const valid: string[] = [];
    uris.forEach((uri) => {
      if (isValidRedirectUri(uri) && !redirectUriPills.includes(uri) && redirectUriPills.length + valid.length < 10) {
        valid.push(uri);
      }
    });
    if (valid.length > 0) {
      setRedirectUriPills((prev) => [...prev, ...valid]);
      setRedirectUris("");
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
      const base: Omit<AppCredential, "id" | "createdAt"> = {
        name: name.trim(),
        type,
        status: "active",
        createdBy: app.email,
        lastUsedAt: null,
        expiresAt: isPermanent ? null : expiryDate || null,
        scopes: selectedScopes,
      };

      if (type === "api_key") {
        base.apiKey = `helo_live_${Math.random().toString(36).substring(2, 26)}`;
      } else if (type === "oauth2") {
        base.clientId = `helo_client_${Math.random().toString(36).substring(2, 15)}`;
        base.clientSecret = `helo_secret_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        base.grantTypes = grantTypes;
        base.redirectUris = redirectUriPills;
        base.thirdPartyAppName = thirdPartyAppName || undefined;
      } else if (type === "service_account") {
        base.publicKey = publicKey;
        base.keyFormat = "RSA/PEM";
      }

      const result = createCredential(appId, base);
      setCreatedCredential({ ...base, id: result.id, createdAt: result.createdAt } as AppCredential);
      setStep(4);
      setIsCreating(false);
      toast({ title: "Credential created", description: `${base.name} has been created successfully.` });
    }, 600);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClose = () => {
    if (step === 4) {
      // Only close if confirmed
      if (!confirmed) return;
    }
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setType("api_key");
      setName("");
      setIsPermanent(true);
      setExpiryDate(() => {
        const d = new Date();
        d.setDate(d.getDate() + 90);
        return d.toISOString().split("T")[0];
      });
      setSelectedScopes([]);
      setScopeError(false);
      setGrantTypes(["client_credentials"]);
      setRedirectUris("");
      setRedirectUriPills([]);
      setThirdPartyAppName("");
      setAccessTokenLifetime(60);
      setRefreshTokenLifetime(30);
      setPublicKey("");
      setCreatedCredential(null);
      setCopied(null);
      setConfirmed(false);
      setIsCreating(false);
    }, 200);
  };

  const canProceedStep2 = name.trim().length >= 3 && !nameError;
  const canProceedStep2Scopes = selectedScopes.length > 0;

  const canProceedStep3 = (() => {
    if (type === "api_key") return true;
    if (type === "oauth2") {
      if (grantTypes.length === 0) return false;
      if (grantTypes.includes("authorization_code") && redirectUriPills.length === 0) return false;
      return true;
    }
    if (type === "service_account") {
      if (!pemValidation) return false;
      return pemValidation.validFormat && pemValidation.rsaType && pemValidation.minBits;
    }
    return true;
  })();

  const handleNextStep2 = () => {
    if (!canProceedStep2Scopes) {
      setScopeError(true);
      return;
    }
    setStep(3);
  };

  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={step === 4 ? undefined : handleClose}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={step === 4 ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={step === 4 ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {step === 4 ? "Credential Created Successfully" : `Create Credential — Step ${step} of ${totalSteps}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Select the type of credential to create"}
            {step === 2 && "Configure credential details and scope"}
            {step === 3 && `Configure ${typeOptions.find((t) => t.value === type)?.label} settings`}
            {step === 4 && "Store these credentials securely — they won't be shown again"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        {step < 4 && (
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        )}

        {/* Step 1: Select Type */}
        {step === 1 && (
          <div className="space-y-3 py-2">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-colors",
                    type === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/20"
                  )}
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{opt.label}</p>
                      {opt.tag && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          {opt.tag}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Name, Expiry, Scopes */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Credential Name <span className="text-destructive">*</span></Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production API Key"
                className={cn(nameError && "border-destructive")}
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>
            <div className="space-y-2">
              <Label>Expiry</Label>
              <div className="flex items-center gap-3">
                <Switch checked={isPermanent} onCheckedChange={setIsPermanent} />
                <span className="text-sm text-muted-foreground">{isPermanent ? "Permanent (no expiry)" : "Set expiry date"}</span>
              </div>
              {!isPermanent && (
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>API Scopes <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground">Select products and permissions this credential can access</p>
              {scopeError && (
                <p className="text-xs text-destructive">Select at least one scope to continue.</p>
              )}
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {enabledProducts.filter((p) => p.id !== "webhooks").map((product) => {
                  const perms = PRODUCT_PERMISSIONS[product.id] || [];
                  const existing = selectedScopes.find((s) => s.product === product.id);
                  const allSelected = existing && existing.permissions.length === perms.length;
                  return (
                    <div key={product.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{product.name}</p>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                          <Checkbox
                            checked={!!allSelected}
                            onCheckedChange={() => handleSelectAllProduct(product.id)}
                          />
                          Select all
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <label key={perm} className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox
                              checked={isScopeSelected(product.id, perm)}
                              onCheckedChange={() => handleToggleScope(product.id, perm)}
                            />
                            <code className="font-mono">{perm}</code>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {enabledProducts.filter((p) => p.id !== "webhooks").length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">No products enabled. Enable products first to assign scopes.</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Scopes are tied to your subscribed products. Subscribe to more products to unlock additional scopes.</p>
            </div>
          </div>
        )}

        {/* Step 3: Type-specific */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            {type === "api_key" && (
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium">Review & Confirm</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Name</p>
                      <p className="font-medium">{name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Expiry</p>
                      <p className="font-medium">{isPermanent ? "Permanent" : expiryDate}</p>
                    </div>
                  </div>
                  {selectedScopes.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1.5">Scopes</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedScopes.flatMap((s) =>
                          s.permissions.map((p) => (
                            <Badge key={p} variant="outline" className="text-[10px] font-mono">{p}</Badge>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API key will be generated on the next step and shown once only.
                </p>
              </div>
            )}
            {type === "oauth2" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Grant Types <span className="text-destructive">*</span></Label>
                  <div className="space-y-2">
                    {(["client_credentials", "authorization_code"] as const).map((gt) => (
                      <label key={gt} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={grantTypes.includes(gt)}
                          onCheckedChange={(checked) => {
                            setGrantTypes((prev) =>
                              checked ? [...prev, gt] : prev.filter((g) => g !== gt)
                            );
                          }}
                        />
                        {gt === "client_credentials" ? "Client Credentials" : "Authorization Code"}
                      </label>
                    ))}
                  </div>
                </div>
                {grantTypes.includes("authorization_code") && (
                  <div className="space-y-2">
                    <Label>Redirect URIs <span className="text-destructive">*</span></Label>
                    <Textarea
                      value={redirectUris}
                      onChange={(e) => setRedirectUris(e.target.value)}
                      onBlur={handleAddRedirectUri}
                      placeholder="https://your-app.com/callback"
                      className="font-mono text-xs resize-none min-h-[60px]"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>One URI per line · HTTPS required (HTTP allowed for localhost)</span>
                      <span>{redirectUriPills.length} of 10 URIs added</span>
                    </div>
                    {redirectUriPills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {redirectUriPills.map((uri) => (
                          <Badge key={uri} variant="outline" className="text-[10px] font-mono gap-1 pr-1">
                            {uri.length > 40 ? uri.slice(0, 40) + "..." : uri}
                            <button
                              onClick={() => setRedirectUriPills((prev) => prev.filter((u) => u !== uri))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Access Token Lifetime</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={accessTokenLifetime}
                        onChange={(e) => setAccessTokenLifetime(Number(e.target.value))}
                        min={1}
                        className="w-20"
                      />
                      <span className="text-xs text-muted-foreground">minutes</span>
                    </div>
                  </div>
                  {grantTypes.includes("authorization_code") && (
                    <div className="space-y-2">
                      <Label>Refresh Token Lifetime</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={refreshTokenLifetime}
                          onChange={(e) => setRefreshTokenLifetime(Number(e.target.value))}
                          min={1}
                          className="w-20"
                        />
                        <span className="text-xs text-muted-foreground">days</span>
                      </div>
                      <p className="text-xs text-muted-foreground">A rotating refresh token will be issued alongside each access token.</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Third-Party App Name <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={thirdPartyAppName} onChange={(e) => setThirdPartyAppName(e.target.value)} placeholder="e.g. CRM Integration" />
                </div>
              </div>
            )}
            {type === "service_account" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Public Key (RSA/PEM) <span className="text-destructive">*</span></Label>
                  <div className="rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-foreground/20 transition-colors">
                    <p className="text-sm text-muted-foreground">Drag & drop a .pem file here</p>
                    <p className="text-xs text-muted-foreground mt-1">or paste your public key below</p>
                  </div>
                  <Textarea
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                    className="font-mono text-xs resize-none min-h-[100px]"
                  />
                </div>
                {pemValidation && (
                  <div className="space-y-1.5 rounded-md border p-3">
                    <p className="text-xs font-medium mb-2">Key Validation</p>
                    {[
                      { label: "Valid PEM format", ok: pemValidation.validFormat },
                      { label: "RSA encryption type", ok: pemValidation.rsaType },
                      { label: "Minimum 2048-bit key length", ok: pemValidation.minBits },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs">
                        {item.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={item.ok ? "text-success" : "text-destructive"}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Created - Show Secrets */}
        {step === 4 && createdCredential && (
          <div className="space-y-4 py-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-md bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning">This secret will never be shown again. Copy it now and store it securely.</p>
            </div>

            {createdCredential.type === "api_key" && createdCredential.apiKey && (
              <SecretRow label="API Key" value={createdCredential.apiKey} copied={copied} onCopy={handleCopy} />
            )}
            {createdCredential.type === "oauth2" && (
              <>
                {createdCredential.clientId && (
                  <SecretRow label="Client ID" value={createdCredential.clientId} copied={copied} onCopy={handleCopy} note="Your Client ID is permanent and can be retrieved anytime." />
                )}
                {createdCredential.clientSecret && (
                  <SecretRow label="Client Secret" value={createdCredential.clientSecret} copied={copied} onCopy={handleCopy} note="Your Client Secret cannot be retrieved after closing this dialog." />
                )}
              </>
            )}
            {createdCredential.type === "service_account" && (
              <>
                <div className="rounded-md border p-3 space-y-1">
                  <p className="text-xs font-medium">Service Account</p>
                  <p className="text-xs text-muted-foreground">Public key has been registered. Sign JWTs with your private key using RS256 for authentication.</p>
                </div>
              </>
            )}

            <div className="rounded-md border p-3 space-y-1">
              <p className="text-xs font-medium">Credential ID</p>
              <code className="text-xs font-mono text-muted-foreground">{createdCredential.id}</code>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer pt-2">
              <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
              I have copied my credentials and stored them safely
            </label>
          </div>
        )}

        <DialogFooter>
          {step < 4 && (
            <div className="flex w-full justify-between">
              <Button variant="outline" onClick={() => step === 1 ? handleClose() : setStep(step - 1)}>
                {step === 1 ? "Cancel" : <><ArrowLeft className="h-4 w-4 mr-1" /> Back</>}
              </Button>
              {step === 1 && (
                <Button onClick={() => setStep(2)}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {step === 2 && (
                <Button onClick={handleNextStep2} disabled={!canProceedStep2}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {step === 3 && (
                <Button onClick={handleCreate} disabled={!canProceedStep3 || isCreating}>
                  {isCreating ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creating...</>
                  ) : (
                    "Create Credential"
                  )}
                </Button>
              )}
            </div>
          )}
          {step === 4 && (
            <Button onClick={handleClose} className="w-full" disabled={!confirmed}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SecretRow({ label, value, copied, onCopy, note }: { label: string; value: string; copied: string | null; onCopy: (text: string, label: string) => void; note?: string }) {
  return (
    <div className="rounded-md border p-3 space-y-1.5">
      <p className="text-xs font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded break-all">{value}</code>
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => onCopy(value, label)}>
          {copied === label ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}
