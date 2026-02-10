import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Save, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const timezones = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Singapore",
  "Australia/Sydney", "Pacific/Auckland",
];

export default function Settings() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, accountName, timezone, updateAccountName, updateTimezone, updateProduct, rotateApiKey } = useApp();
  const app = apps.find((a) => a.id === appId);
  const [name, setName] = useState(accountName);
  const [tz, setTz] = useState(timezone);
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  const handleSaveGeneral = () => {
    updateAccountName(name);
    updateTimezone(tz);
    toast({ title: "Settings saved", description: "Your account settings have been updated." });
  };

  const handleDisableProduct = (productId: string, productName: string) => {
    updateProduct(app.id, productId, { status: "disabled" });
    toast({ title: "Product disabled", description: `${productName} has been disabled.`, variant: "destructive" });
  };

  const handleRevokeApiKey = () => {
    rotateApiKey(app.id);
    toast({ title: "API key revoked", description: "Your API key has been revoked and a new one generated.", variant: "destructive" });
  };

  const enabledProducts = app.products.filter((p) => p.status !== "disabled");

  return (
    <DashboardLayout>
      <PageHeader title="Settings" breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Settings" }]} />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your company name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={tz} onValueChange={setTz}>
                <SelectTrigger id="timezone"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                <SelectContent>
                  {timezones.map((zone) => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveGeneral}><Save className="h-4 w-4 mr-2" />Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" />Danger Zone</CardTitle>
            <CardDescription>Destructive actions that cannot be undone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Disable Products</h4>
              <div className="space-y-3">
                {enabledProducts.length > 0 ? enabledProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <span className="text-sm font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({product.status})</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Switch checked={true} /></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disable {product.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This will immediately disable API access for {product.name}. You can re-enable it later from the Products page.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDisableProduct(product.id, product.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Disable</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No products enabled</p>}
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Revoke API Key</h4>
                  <p className="text-xs text-muted-foreground mt-1">Immediately invalidate your current API key</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" />Revoke</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                      <AlertDialogDescription>This will immediately revoke your current API key and generate a new one. All existing integrations will stop working until updated.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRevokeApiKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke Key</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
