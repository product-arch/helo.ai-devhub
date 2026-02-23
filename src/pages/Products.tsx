import { useParams, Navigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Smartphone, MessageCircle, Webhook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare, Smartphone, MessageCircle, Webhook,
};

export default function Products() {
  const { appId } = useParams<{ appId: string }>();
  const { apps, updateProduct } = useApp();
  const { toast } = useToast();
  const app = apps.find((a) => a.id === appId);

  if (!app) return <Navigate to="/apps" replace />;

  return (
    <DashboardLayout>
      <PageHeader title="Products" breadcrumbs={[{ label: "Apps", href: "/apps" }, { label: app.name }, { label: "Products" }]} />
      <div className="grid gap-4 md:grid-cols-2">
        {app.products.map((product) => {
          const Icon = iconMap[product.icon] || MessageSquare;
          return (
            <Card key={product.id} className="hover:border-foreground/20 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted"><Icon className="h-6 w-6" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <StatusBadge status={product.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                    {product.blockingReason && <p className="text-xs text-warning mb-3">⚠ {product.blockingReason}</p>}
                    {product.status === "disabled" ? (
                      <Button variant="default" size="sm" onClick={() => {
                        updateProduct(appId!, product.id, { status: "configured" });
                        toast({ title: "Product enabled", description: `${product.name} has been enabled.` });
                      }}>
                        Setup
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/apps/${appId}/products/${product.id}`}>
                          View Details
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
