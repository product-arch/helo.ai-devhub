import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiHealthDot } from "./ApiHealthDot";
import { ApiKeyPanel, useApiKey } from "./ApiKeyPanel";
import { CodeSnippets } from "./CodeSnippets";
import { CopyButton } from "./CopyButton";
import { EnvBanner, EnvSwitcher } from "./EnvSwitcher";
import { HistoryTab } from "./HistoryTab";
import { RateLimitMeter } from "./RateLimitMeter";
import { ResponsePanel } from "./ResponsePanel";
import { SendForm, samplePrefill } from "./SendForm";
import { Stepper } from "./Stepper";
import { WebhookSimulator } from "./WebhookSimulator";
import { WhatsNext } from "./WhatsNext";
import { storage } from "./lib/storage";
import { simulateSend } from "./lib/simulator";
import { baseUrlFor } from "./lib/snippets";
import { buildPayload } from "./lib/payload";
import type {
  ApiResponse,
  Environment,
  FormState,
  HistoryEntry,
  SavedNumber,
  StepperState,
} from "./lib/types";
import { useToast } from "@/hooks/use-toast";

const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

const DEFAULT_FORM: FormState = {
  to: "+14155550100",
  type: "text",
  body: "",
  templateId: "",
  templateVars: {},
  mediaSource: "url",
  mediaUrl: "",
  mediaCaption: "",
  documentFilename: "",
  interactiveHeader: "",
  interactiveBody: "",
  interactiveFooter: "",
  buttons: [],
  listSections: [],
  listButtonText: "Choose",
  locationLat: "",
  locationLng: "",
  locationName: "",
  locationAddress: "",
  reactionMessageId: "",
  reactionEmoji: "",
};

export function PlaygroundPage() {
  const { toast } = useToast();

  /* ── env, key, stepper, saved, history (persisted) ── */
  const [env, setEnv] = useState<Environment>(() => storage.getEnv());
  const { apiKey, regenerate } = useApiKey(env);
  const [stepper, setStepper] = useState<StepperState>(() => storage.getStepper());
  const [saved, setSaved] = useState<SavedNumber[]>(() => storage.getSaved());
  const [history, setHistory] = useState<HistoryEntry[]>(() => storage.getHistory());
  const [insertKey, setInsertKey] = useState<boolean>(() => storage.getInsertKey());

  useEffect(() => storage.setEnv(env), [env]);
  useEffect(() => storage.setStepper(stepper), [stepper]);
  useEffect(() => storage.setSaved(saved), [saved]);
  useEffect(() => storage.setHistory(history), [history]);
  useEffect(() => storage.setInsertKey(insertKey), [insertKey]);

  /* ── form, fill with text sample on first mount ── */
  const [form, setForm] = useState<FormState>(() => ({
    ...DEFAULT_FORM,
    ...samplePrefill("text"),
  }));

  /* ── send state ── */
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  /* ── rate limit window ── */
  const [stamps, setStamps] = useState<number[]>([]);
  const recentStamps = useMemo(
    () => stamps.filter((t) => Date.now() - t < RATE_WINDOW_MS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stamps, response],
  );
  // periodic refresh so meter ticks down
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  /* ── derived ── */
  const baseUrl = baseUrlFor(env);
  const authHeader = `Authorization: Bearer ${apiKey}`;
  const recommended: "webhooks" | "templates" = stepper.requestSent
    ? "webhooks"
    : "templates";

  /* ── handlers ── */
  const onSaveNumber = (n: SavedNumber) => {
    setSaved((s) => (s.some((x) => x.number === n.number) ? s : [n, ...s].slice(0, 8)));
    toast({ title: "Saved test number", description: n.number });
  };

  const onSendRequest = async () => {
    setLoading(true);
    setResponse(null);
    const liveStamps = stamps.filter((t) => Date.now() - t < RATE_WINDOW_MS);
    const rateLimited = liveStamps.length >= RATE_LIMIT;

    const res = await simulateSend({
      env,
      form,
      apiKey,
      rateLimited,
    });
    setLoading(false);
    setResponse(res);
    setStamps((s) => [...s.filter((t) => Date.now() - t < RATE_WINDOW_MS), Date.now()]);

    if (!res.ok) {
      setShake(true);
      setTimeout(() => setShake(false), 380);
    }

    // history
    const entry: HistoryEntry = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ts: Date.now(),
      to: form.to,
      type: form.type,
      status: res.status,
      ms: res.ms,
      request: buildPayload(form),
      response: res,
      env,
    };
    setHistory((h) => [entry, ...h].slice(0, 10));

    // stepper auto-completion
    if (res.ok) {
      setStepper((s) => ({
        keyCopied: true,
        headerCopied: true,
        baseUrlCopied: true,
        requestSent: true,
      }));
    }

    if (responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const onReplay = (e: HistoryEntry) => {
    setForm((p) => ({ ...p, to: e.to, type: e.type }));
    setResponse(e.response);
    toast({ title: "Loaded request", description: `${e.type} → ${e.to}` });
  };

  return (
    <div className="playground-theme space-y-5">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <EnvSwitcher value={env} onChange={setEnv} />
        </div>
        <ApiHealthDot status="operational" checkedAgoMin={2} />
      </div>

      <EnvBanner env={env} />

      {/* Stepper */}
      <div className="rounded-lg border bg-card p-3 shadow-block">
        <Stepper state={stepper} />
      </div>

      {/* Two-column grid */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* LEFT */}
        <div className="min-w-0 space-y-5">
          {/* Step 1 — API key */}
          <section
            id="step-key"
            className="rounded-lg border bg-card p-4 shadow-block"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">1. Get your API key</h3>
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                {env === "sandbox" ? "Sandbox" : "Live"}
              </span>
            </div>
            <ApiKeyPanel
              env={env}
              apiKey={apiKey}
              onRegenerate={() => {
                regenerate();
                toast({ title: "Key regenerated", description: "Old key has been revoked." });
              }}
              onCopied={() =>
                setStepper((s) => ({ ...s, keyCopied: true }))
              }
            />
          </section>

          {/* Step 2 — Authorization header */}
          <section
            id="step-auth"
            className="rounded-lg border bg-card p-4 shadow-block"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">2. Set the Authorization header</h3>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              Every request must include a Bearer token in the <code>Authorization</code>{" "}
              header.
            </p>
            <div className="flex items-center gap-1 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs">
              <code className="flex-1 truncate">{authHeader.replace(apiKey, "***")}</code>
              <CopyButton
                value={authHeader}
                size="icon"
                onCopied={() =>
                  setStepper((s) => ({ ...s, headerCopied: true }))
                }
              />
            </div>
          </section>

          {/* Step 3 — Base URL */}
          <section
            id="step-url"
            className="rounded-lg border bg-card p-4 shadow-block"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">3. Confirm the Base URL</h3>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              All endpoints are versioned under <code>/v1</code>.
            </p>
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs">
              <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                POST
              </span>
              <code className="flex-1 truncate">{baseUrl}/messages</code>
              <CopyButton
                value={`${baseUrl}/messages`}
                size="icon"
                onCopied={() =>
                  setStepper((s) => ({ ...s, baseUrlCopied: true }))
                }
              />
            </div>
          </section>

          {/* Step 4 — Send form */}
          <section
            id="step-send"
            className="rounded-lg border bg-card p-4 shadow-block"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">4. Send your first message</h3>
              {stepper.requestSent && (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-success">
                  ✓ Onboarding complete
                </span>
              )}
            </div>
            <SendForm
              form={form}
              setForm={setForm}
              saved={saved}
              onSaveNumber={onSaveNumber}
              onSendRequest={onSendRequest}
              loading={loading}
              shake={shake}
            />
          </section>

          {/* Code snippets */}
          <section>
            <CodeSnippets
              env={env}
              form={form}
              apiKey={apiKey}
              insertKey={insertKey}
              onInsertKeyChange={setInsertKey}
            />
          </section>

          {/* Webhook simulator */}
          <WebhookSimulator />

          {/* What's next */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">What's next</h3>
            <WhatsNext recommended={recommended} />
          </div>
        </div>

        {/* RIGHT (sticky) */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-4 space-y-3">
            <div className="rounded-lg border bg-card p-3 shadow-block">
              <RateLimitMeter count={recentStamps.length} limit={RATE_LIMIT} />
            </div>
            <Tabs defaultValue="response">
              <TabsList className="w-full">
                <TabsTrigger value="response" className="flex-1">
                  Response
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  History
                  {history.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                      {history.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="response" className="mt-2" ref={responseRef as any}>
                <ResponsePanel response={response} loading={loading} />
              </TabsContent>
              <TabsContent value="history" className="mt-2">
                <HistoryTab entries={history} onReplay={onReplay} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}