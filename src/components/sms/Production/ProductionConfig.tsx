import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SenderIdsSection } from "./SenderIdsSection";
import { DltSection } from "./DltSection";
import { DlrSection } from "./DlrSection";
import { SettingsSection } from "./SettingsSection";

export function ProductionConfig({ appId }: { appId: string }) {
  return (
    <div id="sms-production-config" className="space-y-2">
      <div>
        <h2 className="text-lg font-semibold">Production Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Configure registered senders, compliance, and delivery for production traffic.
        </p>
      </div>
      <Accordion type="multiple" className="rounded-lg border bg-card shadow-block">
        <AccordionItem value="senders" className="px-4">
          <AccordionTrigger className="text-sm font-medium">Sender IDs</AccordionTrigger>
          <AccordionContent>
            <SenderIdsSection appId={appId} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="dlt" className="px-4">
          <AccordionTrigger className="text-sm font-medium">
            DLT Configuration (India)
          </AccordionTrigger>
          <AccordionContent>
            <DltSection appId={appId} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="dlr" className="px-4">
          <AccordionTrigger className="text-sm font-medium">Delivery Receipts (DLRs)</AccordionTrigger>
          <AccordionContent>
            <DlrSection appId={appId} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="settings" className="border-b-0 px-4">
          <AccordionTrigger className="text-sm font-medium">Settings</AccordionTrigger>
          <AccordionContent>
            <SettingsSection appId={appId} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
