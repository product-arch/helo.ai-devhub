import { useParams, Navigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Overview() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, accountStatus, blockingIssues } = useApp();
  const app = apps.find((a) => a.id === appId);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  const copyApiKey = () => {
    navigator.clipboard.writeText(app.apiKey);
    setCopied(true);
    toast({ title: "Copied", description: "API key copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = app.apiKey.slice(0, 10) + "••••••••••••••••••••";

  return (
    <DashboardLayout>
      <PageHeader title="Overview" breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Overview" }]} />

      {blockingIssues.length > 0 && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-destructive">Blocking Issues</h3>
            <ul className="mt-1 text-sm text-destructive/80">
              {blockingIssues.map((issue, index) => <li key={index}>• {issue}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Account Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={accountStatus === "active" ? "active" : accountStatus === "restricted" ? "restricted" : "pending"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-medium">App API Key</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded">{showKey ? app.apiKey : maskedKey}</code>
              <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)} className="shrink-0">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={copyApiKey} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Link to={`/apps/${appId}/credentials`} className="text-xs text-muted-foreground hover:text-foreground mt-2 inline-block">
              Manage credentials →
            </Link>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-medium mt-8 mb-4">Enabled Products</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {app.products.map((product) => (
          <Card key={product.id} className="hover:border-foreground/20 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{product.name}</h3>
                <StatusBadge status={product.status} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/apps/${appId}/products/${product.id}`}>
                  {product.status === "disabled" ? "Enable" : "View Details"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
