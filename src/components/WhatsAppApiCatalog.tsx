import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiLineItem } from "@/components/ApiLineItem";
import type { WhatsAppApi } from "@/data/whatsappApis";
import type { HeloApp, Product } from "@/contexts/AppContext";

interface Props {
  app: HeloApp;
  appId: string;
  product: Product;
  essentialApis: WhatsAppApi[];
  advancedApis: WhatsAppApi[];
}

function SectionHeader({
  label,
  subtitle,
  isOpen,
  onToggle,
}: {
  label: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between hover:bg-muted/60 transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <div>
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

export function WhatsAppApiCatalog({ app, appId, product, essentialApis, advancedApis }: Props) {
  const [essentialOpen, setEssentialOpen] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  return (
    <DashboardLayout>
      <PageHeader
        title="WhatsApp Messaging"
        breadcrumbs={[
          { label: "Apps", href: "/apps" },
          { label: app.name, href: `/apps/${appId}/overview` },
          { label: "Products", href: `/apps/${appId}/products` },
          { label: "WhatsApp Messaging" },
        ]}
        actions={<StatusBadge status={product.status} />}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">API Catalog</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Essential section */}
          <SectionHeader
            label="Essential APIs"
            subtitle="Always active · Core capabilities included in all plans"
            isOpen={essentialOpen}
            onToggle={() => setEssentialOpen((v) => !v)}
          />
          {essentialOpen && essentialApis.map((api) => (
            <ApiLineItem key={api.id} api={api} isEssential />
          ))}

          {/* Advanced section */}
          <SectionHeader
            label="Advanced APIs"
            subtitle="Opt-in access · Enable per your integration requirements"
            isOpen={advancedOpen}
            onToggle={() => setAdvancedOpen((v) => !v)}
          />
          {advancedOpen && advancedApis.map((api) => (
            <ApiLineItem key={api.id} api={api} />
          ))}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
