import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Eye, EyeOff, MessageSquare, Smartphone, MessageCircle, Webhook } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChannelConfigModal } from "@/components/ChannelConfigModal";
import type { Product } from "@/contexts/AppContext";

const productIcons: Record<string, React.ReactNode> = {
  sms: <MessageSquare className="h-5 w-5" />,
  rcs: <Smartphone className="h-5 w-5" />,
  whatsapp: <MessageCircle className="h-5 w-5" />,
  webhooks: <Webhook className="h-5 w-5" />,
};

export default function Overview() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, updateProduct } = useApp();
  const app = apps.find((a) => a.id === appId);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [configProduct, setConfigProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  if (!app) return <Navigate to="/apps" replace />;

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({ title: "Copied", description: `${field} copied to clipboard` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const maskedSecret = app.apiKey.slice(0, 10) + "••••••••••••••••••••";

  const handleChannelSave = (productId: string) => {
    updateProduct(app.id, productId, { status: "configured" });
  };

  return (
    <DashboardLayout>
      <PageHeader title="Overview" breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Overview" }]} />

      {/* Credentials Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">App Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* App ID */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">App ID</span>
              <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded">{app.id}</code>
            </div>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(app.id, "App ID")} className="shrink-0">
              {copiedField === "App ID" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {/* App Secret */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">App Secret</span>
              <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded">{showSecret ? app.apiKey : maskedSecret}</code>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowSecret(!showSecret)} className="shrink-0">
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(app.apiKey, "App Secret")} className="shrink-0">
                {copiedField === "App Secret" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Channel Products */}
      <h2 className="text-lg font-medium mb-4">Channel Products</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {app.products.map((product) => (
          <Card
            key={product.id}
            className="hover:border-foreground/20 transition-colors cursor-pointer"
            onClick={() => setConfigProduct(product)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-muted">{productIcons[product.id]}</div>
                  <h3 className="font-medium text-sm">{product.name}</h3>
                </div>
              </div>
              <StatusBadge status={product.status} />
              <p className="text-xs text-muted-foreground mt-2">{product.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {configProduct && (
        <ChannelConfigModal
          product={configProduct}
          appId={app.id}
          open={!!configProduct}
          onOpenChange={(open) => !open && setConfigProduct(null)}
          onSave={handleChannelSave}
        />
      )}
    </DashboardLayout>
  );
}
