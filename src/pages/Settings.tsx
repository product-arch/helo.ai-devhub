import { useState, useRef, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Save, Copy, Eye, EyeOff, RefreshCw, Lock, ShieldCheck, ShieldAlert,
  AlertTriangle, CheckCircle2, XCircle, Zap, Database, Activity,
  Gauge, FileText, Trash2, PowerOff, RotateCcw, ClipboardCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  danger?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "general", label: "General" },
  { id: "environment", label: "Environment & Mode" },
  { id: "credentials", label: "API Credentials" },
  { id: "security", label: "Security Controls" },
  { id: "compliance", label: "Compliance & Data" },
  { id: "usage", label: "Usage Controls" },
  { id: "audit", label: "Audit & Activity" },
  { id: "danger", label: "Danger Zone", danger: true },
];

// ─── Mock audit log ───────────────────────────────────────────────────────────

const AUDIT_LOG = [
  { id: "1", ts: "Feb 19, 2025 · 14:32", actor: "soumik@helo.ai", action: "API Key Rotated", prev: "helo_live_abc3x…", next: "helo_live_xyz9k…" },
  { id: "2", ts: "Feb 19, 2025 · 09:10", actor: "soumik@helo.ai", action: "Execution Enabled", prev: "Disabled", next: "Enabled" },
  { id: "3", ts: "Feb 18, 2025 · 16:05", actor: "admin@acme.com", action: "App Name Updated", prev: '"Old Production"', next: '"Production App"' },
  { id: "4", ts: "Feb 17, 2025 · 11:44", actor: "soumik@helo.ai", action: "Rate Limit Updated", prev: "500 RPM", next: "1000 RPM" },
  { id: "5", ts: "Feb 16, 2025 · 08:20", actor: "admin@acme.com", action: "PII Masking Enabled", prev: "Off", next: "On" },
  { id: "6", ts: "Feb 15, 2025 · 17:30", actor: "soumik@helo.ai", action: "Maintenance Mode Activated", prev: "Off", next: "On" },
  { id: "7", ts: "Feb 14, 2025 · 12:00", actor: "admin@acme.com", action: "Data Retention Updated", prev: "7 days", next: "30 days" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  id, title, description, badge, children,
}: {
  id: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="mb-8 scroll-mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
            {description && <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>}
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4">
      <div className="pt-2.5">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StatusChip({ variant, label }: { variant: "green" | "amber" | "blue" | "slate" | "red"; label: string }) {
  const styles = {
    green: "bg-success/10 text-success border-success/20",
    amber: "bg-warning/10 text-warning border-warning/30",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    slate: "bg-muted text-muted-foreground border-border",
    red: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", styles[variant])}>
      {label}
    </span>
  );
}

function ToggleRow({
  label, description, checked, onCheckedChange, disabled, locked,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange?: (v: boolean) => void;
  disabled?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 pr-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled || locked} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Settings() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, accountName, updateAccountName, rotateApiKey } = useApp();
  const app = apps.find((a) => a.id === appId);
  const navigate = useNavigate();
  const { toast } = useToast();

  // General
  const [appName, setAppName] = useState(app?.name ?? "");
  const [description, setDescription] = useState(app?.description ?? "");

  // Environment & Mode
  const [executionEnabled, setExecutionEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // API Credentials
  const [keyVisible, setKeyVisible] = useState(false);
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);

  // Security
  const [rateLimit, setRateLimit] = useState("1000");
  const [throughputCap, setThroughputCap] = useState("100");
  const [ipAllowlist, setIpAllowlist] = useState("");

  // Compliance
  const [dataRetention, setDataRetention] = useState("30");
  const [logRetention, setLogRetention] = useState("90");
  const [piiMasking, setPiiMasking] = useState(true);
  const [deletionCallbackUrl, setDeletionCallbackUrl] = useState("");

  // Usage
  const [dailyCap, setDailyCap] = useState("");
  const [alertThreshold, setAlertThreshold] = useState([80]);

  // Nav
  const [activeSection, setActiveSection] = useState("general");

  // Danger Zone typed confirmations
  const [disableConfirm, setDisableConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [disableOpen, setDisableOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll spy via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  if (!app) return <Navigate to="/apps" replace />;

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyToClipboard = (text: string, label = "Copied") => {
    navigator.clipboard.writeText(text);
    toast({ title: label, description: "Copied to clipboard." });
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveGeneral = () => {
    updateAccountName(appName);
    toast({ title: "General settings saved", description: "App name and description updated." });
  };

  const handleSaveSecurity = () => {
    toast({ title: "Security settings saved", description: "Rate limits and controls updated." });
  };

  const handleSaveCompliance = () => {
    toast({ title: "Compliance settings saved", description: "Data governance policy updated." });
  };

  const handleSaveUsage = () => {
    toast({ title: "Usage controls saved", description: "Daily cap and alert threshold updated." });
  };

  const handleRotateKey = () => {
    rotateApiKey(app.id);
    const newKey = app.apiKey; // after state update it's async; mock a visible key
    const mockKey = `helo_live_${Math.random().toString(36).substring(2, 26)}`;
    setNewKeyRevealed(mockKey);
    setKeyVisible(false);
    toast({ title: "API key rotated", description: "Store the new key — it will not be shown again.", variant: "destructive" });
  };

  const handleDisableApp = () => {
    toast({ title: "App disabled", description: `${app.name} has been disabled.`, variant: "destructive" });
    setDisableOpen(false);
    setDisableConfirm("");
  };

  const handleDeleteApp = () => {
    toast({ title: "App deleted", description: `${app.name} has been permanently deleted.`, variant: "destructive" });
    setDeleteOpen(false);
    setDeleteConfirm("");
    navigate("/apps");
  };

  const handleRegenKey = () => {
    rotateApiKey(app.id);
    toast({ title: "API key regenerated", description: "A new key has been issued.", variant: "destructive" });
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const rateLimitUsage = 34; // mocked %
  const securityHealthy = rateLimitUsage < 80;
  const isCompliant = piiMasking && dataRetention !== "90";
  const envBadge = app.environment === "production"
    ? <StatusChip variant="amber" label="Production" />
    : app.environment === "staging"
    ? <StatusChip variant="blue" label="Staging" />
    : <StatusChip variant="slate" label="Development" />;

  const maskedKey = `helo_live_${"•".repeat(20)}`;
  const activeProducts = app.products.filter((p) => p.status !== "disabled");

  return (
    <DashboardLayout>
      <PageHeader
        title="App Settings"
        breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Settings" }]}
      />

      <div className="mt-2">
        {/* ── Main content ──────────────────────────────────────────────── */}
        <div ref={contentRef} className="min-w-0">

          {/* 1 · General ─────────────────────────────────────────────── */}
          <SectionCard
            id="general"
            title="General"
            description="App identity and metadata"
          >
            <FieldRow label="App Name">
              <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="e.g. Production App" className="text-sm" />
            </FieldRow>

            <FieldRow label="App ID" hint="Immutable — used in all API calls">
              <div className="flex items-center gap-2">
                <Input value={app.id} readOnly className="text-sm font-mono text-muted-foreground bg-muted border-transparent" />
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => copyToClipboard(app.id, "App ID copied")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </FieldRow>

            <FieldRow label="Environment">
              <div className="flex items-center h-9">{envBadge}</div>
            </FieldRow>

            <FieldRow label="Description" hint="Optional — internal notes only">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this app's purpose…"
                className="text-sm resize-none min-h-[72px]"
              />
            </FieldRow>

            <FieldRow label="Created Date">
              <div className="flex items-center h-9 text-sm text-muted-foreground">Feb 1, 2025</div>
            </FieldRow>

            <FieldRow label="Owner">
              <div className="flex items-center h-9 text-sm text-muted-foreground">{accountName}</div>
            </FieldRow>

            <div className="pt-2">
              <Button size="sm" onClick={handleSaveGeneral}>
                <Save className="h-3.5 w-3.5 mr-2" />Save Changes
              </Button>
            </div>
          </SectionCard>

          {/* 2 · Environment & Mode ──────────────────────────────────── */}
          <SectionCard
            id="environment"
            title="Environment & Mode"
            description="Control execution behavior and operational state"
            badge={app.environment === "production" ? (
              <div className="flex items-center gap-1.5 text-xs text-warning">
                <Lock className="h-3 w-3" />
                <span className="font-medium">Production — protected</span>
              </div>
            ) : undefined}
          >
            {!executionEnabled && (
              <div className="flex items-start gap-3 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-xs">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Outbound API calls will be blocked while message execution is disabled.</span>
              </div>
            )}

            <ToggleRow
              label="Message Execution"
              description="Allow outbound API calls from this app. Disabling blocks all message sends immediately."
              checked={executionEnabled}
              onCheckedChange={setExecutionEnabled}
            />
            <ToggleRow
              label="Maintenance Mode"
              description="Temporarily pause the app without invalidating credentials. Existing connections remain open."
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
            {app.environment !== "production" && (
              <ToggleRow
                label="Sandbox Mode"
                description="Restrict to test traffic only. Messages will not reach real recipients."
                checked={true}
                locked
              />
            )}
          </SectionCard>

          {/* 3 · API Credentials ────────────────────────────────────── */}
          <SectionCard
            id="credentials"
            title="API Credentials"
            description="Programmatic access keys for this app"
          >
            <div className="rounded-md border border-border bg-muted/40 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground mb-0.5">Primary API Key</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-muted-foreground tracking-wide">
                      {keyVisible ? app.apiKey : maskedKey}
                    </code>
                    <button
                      onClick={() => setKeyVisible((v) => !v)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {keyVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    {keyVisible && (
                      <button onClick={() => copyToClipboard(app.apiKey, "API key copied")} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
                  <p>Created Jan 15, 2025</p>
                  <p>Last used 2 hours ago</p>
                </div>
              </div>
            </div>

            {/* Revealed new key */}
            {newKeyRevealed && (
              <div className="rounded-md border border-warning/30 bg-warning/8 p-4 space-y-3">
                <div className="flex items-center gap-2 text-warning text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Store this key securely — it will not be shown again.
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-background border border-border rounded px-3 py-2 text-foreground break-all">
                    {newKeyRevealed}
                  </code>
                  <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copyToClipboard(newKeyRevealed, "New key copied")}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setNewKeyRevealed(null)}>
                  Dismiss
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />Rotate Key
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rotate API Key?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately invalidate your current API key. All integrations using this key must be updated before they can send requests again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRotateKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Rotate Key
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </SectionCard>

          {/* 4 · Security Controls ──────────────────────────────────── */}
          <SectionCard
            id="security"
            title="Security Controls"
            description="Rate limiting, traffic controls, and access policy"
            badge={
              <div className="flex items-center gap-1.5">
                {securityHealthy ? (
                  <><ShieldCheck className="h-3.5 w-3.5 text-success" /><StatusChip variant="green" label="Healthy" /></>
                ) : (
                  <><ShieldAlert className="h-3.5 w-3.5 text-warning" /><StatusChip variant="amber" label="Warning" /></>
                )}
              </div>
            }
          >
            <FieldRow label="Rate Limit" hint="Max requests per minute">
              <div className="space-y-2">
                <Input
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  className="text-sm w-40"
                />
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Current usage</span>
                    <span>{rateLimitUsage}% of limit</span>
                  </div>
                  <Progress value={rateLimitUsage} className="h-1.5" />
                </div>
              </div>
            </FieldRow>

            <FieldRow label="Throughput Cap" hint="Max messages per second">
              <Input
                type="number"
                value={throughputCap}
                onChange={(e) => setThroughputCap(e.target.value)}
                className="text-sm w-40"
              />
            </FieldRow>

            <FieldRow label="IP Allowlist" hint="Future-ready — optional. One IP or CIDR per line.">
              <Textarea
                value={ipAllowlist}
                onChange={(e) => setIpAllowlist(e.target.value)}
                placeholder={"192.168.1.0/24\n10.0.0.1"}
                className="text-xs font-mono resize-none min-h-[72px]"
              />
            </FieldRow>

            <FieldRow label="HTTPS Only">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 h-9">
                      <Switch checked disabled />
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span>Always enforced</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    HTTPS enforcement cannot be disabled
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FieldRow>

            <div className="pt-2">
              <Button size="sm" onClick={handleSaveSecurity}>
                <Save className="h-3.5 w-3.5 mr-2" />Save Security Settings
              </Button>
            </div>
          </SectionCard>

          {/* 5 · Compliance & Data Governance ─────────────────────── */}
          <SectionCard
            id="compliance"
            title="Compliance & Data Governance"
            description="Regulatory controls, retention policy, and PII handling"
            badge={
              <div className="flex items-center gap-1.5">
                {isCompliant ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-success" /><StatusChip variant="green" label="Compliant" /></>
                ) : (
                  <><XCircle className="h-3.5 w-3.5 text-warning" /><StatusChip variant="amber" label="Review Required" /></>
                )}
              </div>
            }
          >
            <FieldRow label="Data Retention" hint="How long message data is stored">
              <Select value={dataRetention} onValueChange={setDataRetention}>
                <SelectTrigger className="text-sm w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Log Retention" hint="How long API and event logs are kept">
              <Select value={logRetention} onValueChange={setLogRetention}>
                <SelectTrigger className="text-sm w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="PII Masking" hint="Masks phone numbers and identifiers in logs">
              <div className="flex items-center h-9">
                <Switch checked={piiMasking} onCheckedChange={setPiiMasking} />
              </div>
            </FieldRow>

            <FieldRow label="Deletion Callback URL" hint="GDPR data deletion webhook — optional">
              <Input
                value={deletionCallbackUrl}
                onChange={(e) => setDeletionCallbackUrl(e.target.value)}
                placeholder="https://your-service.com/gdpr/delete"
                className="text-sm"
              />
            </FieldRow>

            <div className="pt-2">
              <Button size="sm" onClick={handleSaveCompliance}>
                <Save className="h-3.5 w-3.5 mr-2" />Save Compliance Settings
              </Button>
            </div>
          </SectionCard>

          {/* 6 · Usage Controls ────────────────────────────────────── */}
          <SectionCard
            id="usage"
            title="Usage Controls"
            description="Throughput monitoring and operational limits"
          >
            {/* Current usage summary */}
            <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
              <p className="text-xs font-medium text-foreground uppercase tracking-wide">Current Usage</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Tier</p>
                  <p className="text-sm font-semibold text-foreground">Professional</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Throughput</p>
                  <p className="text-sm font-semibold text-foreground">34 msg/s</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Monthly Volume</p>
                  <p className="text-sm font-semibold text-foreground">142.5K</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Monthly volume</span>
                  <span>142,500 / 500,000</span>
                </div>
                <Progress value={28.5} className="h-1.5" />
              </div>
            </div>

            <FieldRow label="Daily Message Cap" hint="Optional — leave blank for unlimited">
              <Input
                type="number"
                value={dailyCap}
                onChange={(e) => setDailyCap(e.target.value)}
                placeholder="Unlimited"
                className="text-sm w-44"
              />
            </FieldRow>

            <FieldRow label="Alert Threshold" hint={`Notify at ${alertThreshold[0]}% of daily cap`}>
              <div className="space-y-2 pt-1">
                <Slider
                  value={alertThreshold}
                  onValueChange={setAlertThreshold}
                  min={50}
                  max={100}
                  step={5}
                  className="w-60"
                />
                <div className="text-xs text-muted-foreground">{alertThreshold[0]}%</div>
              </div>
            </FieldRow>

            <div className="pt-2">
              <Button size="sm" onClick={handleSaveUsage}>
                <Save className="h-3.5 w-3.5 mr-2" />Save Usage Controls
              </Button>
            </div>
          </SectionCard>

          {/* 7 · Audit & Activity ──────────────────────────────────── */}
          <SectionCard
            id="audit"
            title="Audit & Activity"
            description="Immutable record of configuration changes for this app"
            badge={
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                <Lock className="h-3 w-3" />
                <span>Immutable log</span>
              </div>
            }
          >
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[11px] h-8 py-0 font-medium">Timestamp</TableHead>
                    <TableHead className="text-[11px] h-8 py-0 font-medium">Actor</TableHead>
                    <TableHead className="text-[11px] h-8 py-0 font-medium">Action</TableHead>
                    <TableHead className="text-[11px] h-8 py-0 font-medium">Previous</TableHead>
                    <TableHead className="text-[11px] h-8 py-0 font-medium">New Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AUDIT_LOG.map((entry, i) => (
                    <TableRow key={entry.id} className={cn("text-xs", i % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                      <TableCell className="py-2 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{entry.ts}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{entry.actor}</TableCell>
                      <TableCell className="py-2 font-medium text-foreground">{entry.action}</TableCell>
                      <TableCell className="py-2 font-mono text-muted-foreground text-[11px]">{entry.prev}</TableCell>
                      <TableCell className="py-2 font-mono text-foreground text-[11px]">{entry.next}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          {/* 8 · Danger Zone ───────────────────────────────────────── */}
          <Card id="danger" className="mb-8 scroll-mt-6 border-destructive/30">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription className="text-xs">Irreversible actions — proceed with caution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border">

              {/* Disable App */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Disable App</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Immediately suspend all outbound and inbound traffic. Credentials remain valid.</p>
                </div>
                <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                      <PowerOff className="h-3.5 w-3.5 mr-2" />Disable App
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disable App?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately suspend all traffic. Type <strong>DISABLE</strong> to confirm.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                      value={disableConfirm}
                      onChange={(e) => setDisableConfirm(e.target.value)}
                      placeholder="Type DISABLE to confirm"
                      className="text-sm my-2"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDisableConfirm("")}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={disableConfirm !== "DISABLE"}
                        onClick={handleDisableApp}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
                      >
                        Disable App
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Regenerate API Key */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Regenerate API Key</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Issue a new key. The existing key is invalidated instantly.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                      <RotateCcw className="h-3.5 w-3.5 mr-2" />Regenerate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your current API key will be invalidated immediately. All integrations must be updated with the new key before they can send requests again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegenKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Regenerate Key
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Delete App */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Delete App</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently delete this app and all associated data.
                    {activeProducts.length > 0 && (
                      <span className="text-destructive ml-1">Disable all active products first.</span>
                    )}
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={activeProducts.length > 0}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />Delete App
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete App?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This is permanent and cannot be undone. Type <strong>{app.name}</strong> to confirm.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input
                              value={deleteConfirm}
                              onChange={(e) => setDeleteConfirm(e.target.value)}
                              placeholder={`Type "${app.name}" to confirm`}
                              className="text-sm my-2"
                            />
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                disabled={deleteConfirm !== app.name}
                                onClick={handleDeleteApp}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
                              >
                                Delete App
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </span>
                    </TooltipTrigger>
                    {activeProducts.length > 0 && (
                      <TooltipContent side="left" className="text-xs">
                        Disable all active products before deleting
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
