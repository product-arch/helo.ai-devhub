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
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Key, Globe, Server, Copy, Check, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle2, X, Loader2, ChevronDown, Download } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConsentFlowPreview } from "@/components/ConsentFlowPreview";
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

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "wa.template": "Create & send message templates",
  "wa.send": "Send outbound messages",
  "wa.status": "Receive delivery status updates",
  "wa.interactive": "Send buttons, lists, and reply flows",
  "sms.send": "Send SMS messages",
  "sms.status": "Receive SMS delivery receipts",
  "sms.list": "List sent SMS messages",
  "rcs.send": "Send RCS messages",
  "rcs.status": "Receive RCS delivery receipts",
  "rcs.rich_card": "Send rich card messages",
  "rcs.carousel": "Send carousel messages",
  "webhook.subscribe": "Register and receive webhooks",
  "webhook.manage": "Manage webhook configurations",
};

const EXPIRY_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "none", label: "No expiry" },
];

const STEP_LABELS = ["Identity", "Permissions", "Review & Create"];

// Scope presets
const ALL_SCOPES = Object.entries(PRODUCT_PERMISSIONS).flatMap(([product, perms]) =>
  perms.map(p => ({ product, permission: p }))
);

const SEND_ONLY_PERMS = ["wa.send", "sms.send", "rcs.send"];
const READ_ONLY_PERMS = ["wa.status", "wa.template", "sms.status", "sms.list", "rcs.status", "webhook.subscribe"];

function validatePEM(key: string): { validFormat: boolean; rsaType: boolean; minBits: boolean } {
  const trimmed = key.trim();
  const validFormat = trimmed.startsWith("-----BEGIN") && trimmed.includes("-----END");
  const rsaType = trimmed.includes("PUBLIC KEY") || trimmed.includes("RSA");
  const base64Content = trimmed.replace(/-----[A-Z\s]+-----/g, "").replace(/\s/g, "");
  const minBits = base64Content.length >= 360;
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

function scopesToSummary(scopes: CredentialScope[]): string {
  const abilities: string[] = [];
  const allPerms = scopes.flatMap(s => s.permissions);
  if (allPerms.some(p => p.includes(".send"))) abilities.push("Send messages");
  if (allPerms.some(p => p.includes(".status"))) abilities.push("Read delivery status");
  if (allPerms.some(p => p.includes(".template") || p.includes(".list"))) abilities.push("Read templates");
  if (allPerms.some(p => p.includes("webhook"))) abilities.push("Manage webhooks");
  if (allPerms.some(p => p.includes("rich_card") || p.includes("carousel") || p.includes("interactive"))) abilities.push("Send rich content");
  return abilities.length > 0 ? `This key can: ${abilities.join(" · ")}` : "No permissions selected";
}

export function CreateCredentialModal({ open, onOpenChange, appId }: CreateCredentialModalProps) {
  const { apps, createCredential } = useApp();
  const app = apps.find((a) => a.id === appId);
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<CredentialType>("api_key");
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<"live" | "sandbox">("live");
  const [expiryOption, setExpiryOption] = useState("90");
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
  const isRevealed = step === 3 && !!createdCredential;

  // --- Scope handlers (preserved) ---
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

  // --- Scope presets ---
  const applyPreset = (preset: "full" | "send" | "read") => {
    setScopeError(false);
    const enabledProductIds = enabledProducts.filter(p => p.id !== "webhooks").map(p => p.id);
    const newScopes: CredentialScope[] = [];

    enabledProductIds.forEach(pid => {
      const productPerms = PRODUCT_PERMISSIONS[pid] || [];
      let selected: string[] = [];
      if (preset === "full") {
        selected = [...productPerms];
      } else if (preset === "send") {
        selected = productPerms.filter(p => SEND_ONLY_PERMS.includes(p));
      } else if (preset === "read") {
        selected = productPerms.filter(p => READ_ONLY_PERMS.includes(p));
      }
      if (selected.length > 0) {
        newScopes.push({ product: pid, permissions: selected });
      }
    });

    // Always include webhooks for full access
    if (preset === "full") {
      const webhookPerms = PRODUCT_PERMISSIONS["webhooks"] || [];
      newScopes.push({ product: "webhooks", permissions: [...webhookPerms] });
    } else if (preset === "read") {
      newScopes.push({ product: "webhooks", permissions: ["webhook.subscribe"] });
    }

    setSelectedScopes(newScopes);
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

  const computeExpiresAt = (): string | null => {
    if (expiryOption === "none") return null;
    const d = new Date();
    d.setDate(d.getDate() + Number(expiryOption));
    return d.toISOString().split("T")[0];
  };

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
      const expiresAt = computeExpiresAt();
      const prefix = environment === "live" ? "helo_live_" : "helo_test_";

      const base: Omit<AppCredential, "id" | "createdAt"> = {
        name: name.trim(),
        type,
        status: "active",
        createdBy: app.email,
        lastUsedAt: null,
        expiresAt,
        scopes: selectedScopes,
      };

      if (type === "api_key") {
        base.apiKey = `${prefix}${Math.random().toString(36).substring(2, 26)}`;
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
      setIsCreating(false);
      toast({ title: "Credential created", description: `${base.name} has been created successfully.` });
    }, 600);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadEnv = () => {
    if (!createdCredential) return;
    const lines = [
      "# helo.ai API Credentials",
      `# Generated: ${new Date().toISOString()}`,
      `# Credential: ${createdCredential.name}`,
      `# Environment: ${environment}`,
      "",
    ];
    if (createdCredential.type === "api_key" && createdCredential.apiKey) {
      lines.push(`HELO_API_KEY=${createdCredential.apiKey}`);
    } else if (createdCredential.type === "oauth2") {
      if (createdCredential.clientId) lines.push(`HELO_CLIENT_ID=${createdCredential.clientId}`);
      if (createdCredential.clientSecret) lines.push(`HELO_CLIENT_SECRET=${createdCredential.clientSecret}`);
    }
    lines.push(`HELO_BASE_URL=https://api.helo.ai/v1`);
    lines.push(`HELO_ENVIRONMENT=${environment}`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${createdCredential.name.replace(/\s+/g, "_").toLowerCase()}.env`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (isRevealed && !confirmed) return;
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setType("api_key");
      setName("");
      setEnvironment("live");
      setExpiryOption("90");
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

  const canProceedStep1 = name.trim().length >= 3 && !nameError;

  const canProceedStep2 = (() => {
    if (selectedScopes.length === 0) return false;
    if (type === "oauth2") {
      if (grantTypes.length === 0) return false;
      if (grantTypes.includes("authorization_code") && redirectUriPills.length === 0) return false;
    }
    if (type === "service_account") {
      if (!pemValidation) return false;
      if (!pemValidation.validFormat || !pemValidation.rsaType || !pemValidation.minBits) return false;
    }
    return true;
  })();

  const handleNextStep2 = () => {
    if (selectedScopes.length === 0) {
      setScopeError(true);
      return;
    }
    setStep(3);
  };

  const typeIcon = typeOptions.find(t => t.value === type)?.icon || Key;
  const TypeIcon = typeIcon;

  return (
    <Dialog open={open} onOpenChange={isRevealed ? undefined : handleClose}>
      <DialogContent
        className="sm:max-w-xl max-h-[90vh] flex flex-col"
        onPointerDownOutside={isRevealed ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isRevealed ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {isRevealed ? "Credential Created Successfully" : "Create Credential"}
          </DialogTitle>
          <DialogDescription>
            {isRevealed
              ? "Store these credentials securely — they won't be shown again"
              : step === 1 ? "Set up your credential identity and type"
              : step === 2 ? "Configure permissions and access scope"
              : "Review your credential before generating"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator — hidden after creation */}
        {!isRevealed && (
          <div className="flex items-center justify-between px-2">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div key={label} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                        isCompleted && "bg-primary border-primary text-primary-foreground",
                        isActive && "border-primary text-primary bg-primary/10",
                        !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                    </div>
                    <span className={cn(
                      "text-[11px] font-medium whitespace-nowrap",
                      isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-3 rounded-full transition-colors mt-[-18px]",
                      step > stepNum + 1 ? "bg-primary" : step > stepNum ? "bg-primary/40" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* ============ STEP 1: Identity ============ */}
          {step === 1 && !isRevealed && (
            <div className="space-y-5 py-2">
              {/* Credential Name */}
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

              {/* Type selector */}
              <div className="space-y-2">
                <Label>Credential Type</Label>
                <div className="space-y-2">
                  {typeOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setType(opt.value)}
                        className={cn(
                          "w-full flex items-center gap-4 p-3.5 rounded-lg border text-left transition-colors",
                          type === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-foreground/20"
                        )}
                      >
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-4 w-4" />
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
              </div>

              {/* Environment toggle */}
              <div className="space-y-2">
                <Label>Environment</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={environment === "live" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnvironment("live")}
                    className="flex-1"
                  >
                    🟢 Live
                  </Button>
                  <Button
                    type="button"
                    variant={environment === "sandbox" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnvironment("sandbox")}
                    className="flex-1"
                  >
                    🧪 Sandbox
                  </Button>
                </div>
                {environment === "live" ? (
                  <Badge variant="outline" className="text-[11px] border-warning/30 bg-warning/10 text-warning">
                    Affects real data and live messages
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] border-primary/30 bg-primary/10 text-primary">
                    Safe for testing
                  </Badge>
                )}
              </div>

              {/* Expiry dropdown */}
              <div className="space-y-2">
                <Label>Expiry</Label>
                <Select value={expiryOption} onValueChange={setExpiryOption}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Shorter expiry = better security. Keys can be rotated at any time.</p>
              </div>

              {/* Key prefix preview */}
              <div className="rounded-md bg-muted/50 border p-3">
                <p className="text-xs text-muted-foreground mb-1">Key prefix preview</p>
                <code className="text-sm font-mono">
                  {environment === "live" ? "helo_live_" : "helo_test_"}••••••••••
                </code>
              </div>
            </div>
          )}

          {/* ============ STEP 2: Permissions ============ */}
          {step === 2 && !isRevealed && (
            <div className="space-y-4 py-2">
              {/* Quick presets */}
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="flex gap-2">
                  {([
                    { key: "full", label: "Full Access" },
                    { key: "send", label: "Send Only" },
                    { key: "read", label: "Read Only" },
                  ] as const).map(p => (
                    <Button
                      key={p.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(p.key)}
                      className="text-xs"
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Scope grid */}
              <div className="space-y-2">
                <Label>API Scopes <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Select products and permissions this credential can access</p>
                {scopeError && (
                  <p className="text-xs text-destructive">Select at least one scope to continue.</p>
                )}
                <TooltipProvider delayDuration={200}>
                  <div className="space-y-3">
                    {enabledProducts.filter((p) => p.id !== "webhooks").map((product) => {
                      const perms = PRODUCT_PERMISSIONS[product.id] || [];
                      const existing = selectedScopes.find((s) => s.product === product.id);
                      const selectedCount = existing ? existing.permissions.length : 0;
                      const allSelected = existing && existing.permissions.length === perms.length;
                      return (
                        <div key={product.id} className="rounded-lg border p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{product.name}</p>
                              <Badge variant="secondary" className="text-[10px]">
                                {selectedCount} of {perms.length} selected
                              </Badge>
                            </div>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground cursor-pointer">
                              <Checkbox
                                checked={!!allSelected}
                                onCheckedChange={() => handleSelectAllProduct(product.id)}
                              />
                              Select all
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {perms.map((perm) => (
                              <Tooltip key={perm}>
                                <TooltipTrigger asChild>
                                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                                    <Checkbox
                                      checked={isScopeSelected(product.id, perm)}
                                      onCheckedChange={() => handleToggleScope(product.id, perm)}
                                    />
                                    <code className="font-mono">{perm}</code>
                                  </label>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">{SCOPE_DESCRIPTIONS[perm] || perm}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {enabledProducts.filter((p) => p.id !== "webhooks").length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No products enabled. Enable products first to assign scopes.</p>
                    )}
                  </div>
                </TooltipProvider>
                <p className="text-xs text-muted-foreground">{scopesToSummary(selectedScopes)}</p>
              </div>

              {/* OAuth 2.0 Configuration */}
              {type === "oauth2" && (
                <div className="space-y-4 border-t pt-4">
                  <p className="text-sm font-semibold">OAuth 2.0 Configuration</p>
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
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Third-Party App Name <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                    <Input value={thirdPartyAppName} onChange={(e) => setThirdPartyAppName(e.target.value)} placeholder="e.g. CRM Integration" />
                  </div>
                </div>
              )}

              {/* Service Account Configuration */}
              {type === "service_account" && (
                <div className="space-y-4 border-t pt-4">
                  <p className="text-sm font-semibold">Service Account Configuration</p>
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

          {/* ============ STEP 3: Review & Create / Reveal ============ */}
          {step === 3 && !isRevealed && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold">Review Summary</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Name</p>
                    <p className="font-medium">{name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Type</p>
                    <div className="flex items-center gap-1.5">
                      <TypeIcon className="h-3.5 w-3.5" />
                      <span className="font-medium">{typeOptions.find(t => t.value === type)?.label}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Environment</p>
                    <Badge variant="outline" className={cn(
                      "text-[10px]",
                      environment === "live"
                        ? "border-warning/30 bg-warning/10 text-warning"
                        : "border-primary/30 bg-primary/10 text-primary"
                    )}>
                      {environment === "live" ? "🟢 Live" : "🧪 Sandbox"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Expiry</p>
                    <p className="font-medium">
                      {expiryOption === "none" ? "No expiry" : EXPIRY_OPTIONS.find(o => o.value === expiryOption)?.label}
                    </p>
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
                {type === "oauth2" && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Grant Types</p>
                      <p className="font-medium">{grantTypes.map(g => g === "client_credentials" ? "Client Credentials" : "Auth Code").join(", ")}</p>
                    </div>
                    {redirectUriPills.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Redirect URIs</p>
                        <p className="font-medium">{redirectUriPills.length} configured</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 p-3 rounded-md bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">Your secret will only be shown once after creation. Make sure you're ready to copy it.</p>
              </div>
            </div>
          )}

          {/* ============ Reveal State (replaces step 3 content) ============ */}
          {isRevealed && createdCredential && (
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
                <div className="rounded-md border p-3 space-y-1">
                  <p className="text-xs font-medium">Service Account</p>
                  <p className="text-xs text-muted-foreground">Public key has been registered. Sign JWTs with your private key using RS256 for authentication.</p>
                </div>
              )}

              {/* Download .env */}
              {(createdCredential.type === "api_key" || createdCredential.type === "oauth2") && (
                <Button variant="outline" size="sm" className="w-full" onClick={handleDownloadEnv}>
                  <Download className="h-4 w-4 mr-2" /> Download as .env
                </Button>
              )}

              {createdCredential.type === "oauth2" && createdCredential.grantTypes?.includes("authorization_code") && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline w-full py-1">
                    <ChevronDown className="h-3 w-3 transition-transform [[data-state=open]_&]:rotate-180" />
                    Test your consent flow
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <ConsentFlowPreview credential={createdCredential} collapsible />
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="rounded-md border p-3 space-y-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Credential ID</p>
                    <code className="font-mono text-muted-foreground">{createdCredential.id}</code>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Created</p>
                    <p>{new Date(createdCredential.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Name</p>
                    <p className="font-medium">{createdCredential.name}</p>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer pt-2">
                <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
                I have copied and stored my credentials securely
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          {!isRevealed && (
            <div className="flex w-full justify-between">
              <Button variant="outline" onClick={() => step === 1 ? handleClose() : setStep(step - 1)}>
                {step === 1 ? "Cancel" : <><ArrowLeft className="h-4 w-4 mr-1" /> Back</>}
              </Button>
              {step === 1 && (
                <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {step === 2 && (
                <Button onClick={handleNextStep2} disabled={!canProceedStep2}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {step === 3 && (
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
                  ) : (
                    "Generate Credential"
                  )}
                </Button>
              )}
            </div>
          )}
          {isRevealed && (
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
