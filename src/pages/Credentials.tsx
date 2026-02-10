import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Copy, Check, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Credentials() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, rotateApiKey } = useApp();
  const app = apps.find((a) => a.id === appId);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  const enabledProducts = app.products.filter((p) => p.status !== "disabled");

  const copyApiKey = () => {
    navigator.clipboard.writeText(app.apiKey);
    setCopied(true);
    toast({ title: "Copied", description: "API key copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotate = () => {
    setIsRotating(true);
    setTimeout(() => {
      rotateApiKey(app.id);
      setIsRotating(false);
      toast({ title: "API key rotated", description: "Your new API key is now active. Update your integrations." });
    }, 1000);
  };

  const handleRevoke = () => {
    toast({ title: "API key revoked", description: "Your API key has been revoked. Generate a new one to continue.", variant: "destructive" });
  };

  const maskedKey = app.apiKey.slice(0, 10) + "••••••••••••••••••••";

  return (
    <DashboardLayout>
      <PageHeader title="API Credentials" breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "API Credentials" }]} />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">App-Level API Key</CardTitle>
            <CardDescription>Use this key to authenticate all API requests for this app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input type={showKey ? "text" : "password"} value={showKey ? app.apiKey : maskedKey} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={copyApiKey}>
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isRotating}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRotating ? "animate-spin" : ""}`} />Rotate Key
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rotate API Key?</AlertDialogTitle>
                    <AlertDialogDescription>This will generate a new API key and invalidate the current one. All existing integrations will need to be updated.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRotate}>Rotate Key</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" />Revoke Key</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                    <AlertDialogDescription>This will immediately revoke your API key. All API access will be disabled until you generate a new key.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke Key</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">API Access Scope</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  API access depends on enabled products and messaging capabilities within this app.
                </p>
                <ul className="mt-3 space-y-1">
                  {enabledProducts.map((product) => (
                    <li key={product.id} className="text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      {product.name}
                      {product.status === "restricted" && <span className="text-xs text-warning">(restricted)</span>}
                      <span className="text-xs text-muted-foreground">
                        — {product.capabilities.filter((c) => c.status === "enabled").length} capabilities enabled
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Usage Example</CardTitle></CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {`curl -X POST 'https://api.helo.ai/v1/sms/send' \\
  -H 'Authorization: Bearer ${app.apiKey.slice(0, 15)}...' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "to": "+1234567890",
    "message": "Hello from helo.ai!"
  }'`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
