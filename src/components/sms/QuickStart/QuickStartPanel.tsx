import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Key, Phone, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { smsStorage } from "../lib/smsStorage";
import type { SandboxSender, WizardState } from "../lib/smsTypes";
import { StepCredentials } from "./StepCredentials";
import { StepSandboxSender } from "./StepSandboxSender";
import { StepSendTest } from "./StepSendTest";

interface Props {
  appId: string;
  apiKey: string;
  apiSecret: string;
  defaultTo?: string;
}

const STEPS = [
  { key: "credentials" as const, label: "Credentials", icon: Key },
  { key: "sender" as const, label: "Sender", icon: Phone },
  { key: "send" as const, label: "Send", icon: Send },
];

function provisionSandbox(): SandboxSender {
  return {
    senderId: "+1 415 555 0123",
    type: "sandbox",
    status: "ready",
    country: "US",
  };
}

export function QuickStartPanel({ appId, apiKey, apiSecret, defaultTo }: Props) {
  const [wizard, setWizard] = useState<WizardState>(() => smsStorage.getWizard(appId));
  const [sandbox, setSandbox] = useState<SandboxSender | null>(() =>
    smsStorage.getSandbox(appId),
  );

  // Auto-provision sandbox + auto-complete steps 1 & 2
  useEffect(() => {
    if (!sandbox) {
      const s = provisionSandbox();
      smsStorage.setSandbox(appId, s);
      setSandbox(s);
    }
    if (apiKey && (!wizard.credentials || !wizard.sender)) {
      const next: WizardState = { ...wizard, credentials: true, sender: true };
      setWizard(next);
      smsStorage.setWizard(appId, next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, apiKey]);

  const markSent = () => {
    if (wizard.send) return;
    const next: WizardState = { ...wizard, send: true };
    setWizard(next);
    smsStorage.setWizard(appId, next);
  };

  const completed = [wizard.credentials, wizard.sender, wizard.send];
  const activeIndex = completed.findIndex((c) => !c);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Quick Start</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Send your first test SMS in under 60 seconds.
            </p>
          </div>
        </div>
        <ol className="mt-4 flex w-full items-center gap-0">
          {STEPS.map((s, i) => {
            const done = completed[i];
            const active = activeIndex === i;
            const Icon = s.icon;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-3">
                <div className="flex flex-1 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      done && "border-success bg-success text-success-foreground",
                      active && !done && "border-primary text-primary ring-2 ring-primary/20",
                      !done && !active && "border-border text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                      Step {i + 1}
                    </div>
                    <div
                      className={cn(
                        "text-sm",
                        done || active ? "text-foreground" : "text-muted-foreground",
                        active && "font-semibold",
                      )}
                    >
                      {s.label}
                    </div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      "h-px flex-1",
                      done ? "bg-success/60" : "bg-border",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </CardHeader>
      <CardContent className="space-y-8 pt-2">
        <section>
          <h3 className="mb-3 text-sm font-semibold">1. API Credentials</h3>
          <StepCredentials apiKey={apiKey} apiSecret={apiSecret} />
        </section>
        <section>
          <h3 className="mb-3 text-sm font-semibold">2. Sandbox Sender</h3>
          {sandbox ? (
            <StepSandboxSender sender={sandbox} />
          ) : (
            <p className="text-sm text-muted-foreground">Provisioning sandbox sender…</p>
          )}
        </section>
        <section>
          <h3 className="mb-3 text-sm font-semibold">3. Send a Test Message</h3>
          <StepSendTest
            apiKey={apiKey}
            fromNumber={sandbox?.senderId || "+1 415 555 0123"}
            defaultTo={defaultTo}
            onDelivered={markSent}
          />
        </section>
      </CardContent>
    </Card>
  );
}
