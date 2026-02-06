import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useApp } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Smartphone, MessageCircle, Webhook } from "lucide-react";
import { Link } from "react-router-dom";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Smartphone,
  MessageCircle,
  Webhook,
};

export default function Products() {
  const { products } = useApp();

  return (
    <DashboardLayout>
      <PageHeader
        title="Products"
        breadcrumbs={[{ label: "Products" }]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => {
          const Icon = iconMap[product.icon] || MessageSquare;
          return (
            <Card
              key={product.id}
              className="hover:border-foreground/20 transition-colors"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium">{product.name}</h3>
                      <StatusBadge status={product.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {product.description}
                    </p>
                    {product.blockingReason && (
                      <p className="text-xs text-warning mb-3">
                        ⚠ {product.blockingReason}
                      </p>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/products/${product.id}`}>
                        {product.status === "disabled"
                          ? "Enable"
                          : product.status === "configured"
                          ? "Configure"
                          : "View Details"}
                      </Link>
                    </Button>
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
