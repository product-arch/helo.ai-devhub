import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { HeloApp } from "@/contexts/AppContext";
import { QuickStartPanel } from "./QuickStart/QuickStartPanel";
import { ProductionConfig } from "./Production/ProductionConfig";

interface Props {
  app: HeloApp;
}

function pickCredentials(app: HeloApp) {
  const cred = app.credentials.find((c) => c.apiKey) || app.credentials[0];
  return {
    apiKey: cred?.apiKey || app.apiKey || "helo_test_pk_missing",
    apiSecret:
      cred?.clientSecret ||
      "sec_" + (cred?.id || "default").padEnd(32, "x").slice(0, 32),
  };
}

export function SmsDetailPage({ app }: Props) {
  const { apiKey, apiSecret } = pickCredentials(app);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="border-success/40 bg-success/10 text-success">
          Active
        </Badge>
        <p className="text-sm text-muted-foreground">
          Send and receive SMS globally using the helo.ai API.
        </p>
        <a
          href="https://docs.helo.ai/sms"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View full API reference <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <QuickStartPanel
        appId={app.id}
        apiKey={apiKey}
        apiSecret={apiSecret}
        defaultTo=""
      />

      <ProductionConfig appId={app.id} />
    </div>
  );
}
