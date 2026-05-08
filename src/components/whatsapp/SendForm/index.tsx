import { Loader2, Send, Sparkles, Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import type {
  FormState,
  MessageType,
  SavedNumber,
} from "../lib/types";
import { TEMPLATES, getTemplateVariables } from "../lib/templates";
import { PhoneInput } from "./PhoneInput";
import { WhatsAppPreview } from "./WhatsAppPreview";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: { value: MessageType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "template", label: "Template" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Document" },
  { value: "interactive_buttons", label: "Interactive · Buttons" },
  { value: "interactive_list", label: "Interactive · List" },
  { value: "location", label: "Location" },
  { value: "reaction", label: "Reaction" },
];

function FormatHelp() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="rounded-sm border px-1.5 py-0.5 text-[10px] font-mono uppercase text-muted-foreground hover:bg-accent"
        >
          format?
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        <div><code>*bold*</code></div>
        <div><code>_italic_</code></div>
        <div><code>~strike~</code></div>
        <div><code>```mono```</code></div>
      </TooltipContent>
    </Tooltip>
  );
}

export function samplePrefill(t: MessageType): Partial<FormState> {
  switch (t) {
    case "text":
      return { body: "Hi 👋 — this is a *test* message from the helo.ai playground." };
    case "template":
      return {
        templateId: "order_confirmation_v3",
        templateVars: { "1": "Alex", "2": "84251", "3": "Espresso Machine", "4": "Tue 14 May" },
      };
    case "image":
      return {
        mediaUrl: "https://placehold.co/600x400/png",
        mediaCaption: "Your weekly catalog",
      };
    case "video":
      return {
        mediaUrl: "https://example.com/promo.mp4",
        mediaCaption: "30-second product tour",
      };
    case "audio":
      return { mediaUrl: "https://example.com/voice.ogg" };
    case "document":
      return {
        mediaUrl: "https://example.com/invoice.pdf",
        documentFilename: "invoice-84251.pdf",
        mediaCaption: "Your invoice",
      };
    case "interactive_buttons":
      return {
        interactiveBody: "Confirm your order?",
        buttons: [
          { id: "yes", type: "reply", label: "Yes, confirm" },
          { id: "no", type: "reply", label: "No, cancel" },
        ],
      };
    case "interactive_list":
      return {
        interactiveBody: "Pick a delivery slot",
        listButtonText: "Choose slot",
        listSections: [
          {
            id: "today",
            title: "Today",
            rows: [
              { id: "morning", title: "9–12", description: "Morning slot" },
              { id: "afternoon", title: "12–17", description: "Afternoon slot" },
            ],
          },
        ],
      };
    case "location":
      return {
        locationLat: "37.7749",
        locationLng: "-122.4194",
        locationName: "helo.ai HQ",
        locationAddress: "535 Mission St, San Francisco, CA",
      };
    case "reaction":
      return { reactionMessageId: "wamid.sample123==", reactionEmoji: "🎉" };
  }
}

export function SendForm({
  form,
  setForm,
  saved,
  onSaveNumber,
  onSendRequest,
  loading,
  shake,
}: {
  form: FormState;
  setForm: (f: FormState | ((p: FormState) => FormState)) => void;
  saved: SavedNumber[];
  onSaveNumber: (n: SavedNumber) => void;
  onSendRequest: () => void;
  loading: boolean;
  shake: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* To */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-muted-foreground">
              To
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-[10px]">(?)</span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  E.164 format. Test only WhatsApp-registered numbers in production.
                </TooltipContent>
              </Tooltip>
            </Label>
            <PhoneInput
              value={form.to}
              onChange={(v) => setForm((p) => ({ ...p, to: v }))}
              saved={saved}
              onSave={onSaveNumber}
              onLoad={(n) => setForm((p) => ({ ...p, to: n.number }))}
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
              Message type
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((p) => ({ ...p, type: v as MessageType }))}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type-specific body */}
          <TypeSpecificForm form={form} setForm={setForm} />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                setForm((p) => ({ ...p, ...samplePrefill(p.type) } as FormState))
              }
            >
              <Sparkles className="h-3.5 w-3.5" />
              Pre-fill sample data
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <WhatsAppPreview form={form} />
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        onClick={onSendRequest}
        disabled={loading}
        className={cn(
          "h-12 w-full gap-2 text-base font-semibold shadow-block",
          shake && "pg-shake",
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending request…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send request
          </>
        )}
      </Button>
    </div>
  );
}

function TypeSpecificForm({
  form,
  setForm,
}: {
  form: FormState;
  setForm: (f: FormState | ((p: FormState) => FormState)) => void;
}) {
  switch (form.type) {
    case "text":
      return <TextSection form={form} setForm={setForm} />;
    case "template":
      return <TemplateSection form={form} setForm={setForm} />;
    case "image":
    case "video":
    case "audio":
    case "document":
      return <MediaSection form={form} setForm={setForm} />;
    case "interactive_buttons":
      return <ButtonsSection form={form} setForm={setForm} />;
    case "interactive_list":
      return <ListSection form={form} setForm={setForm} />;
    case "location":
      return <LocationSection form={form} setForm={setForm} />;
    case "reaction":
      return <ReactionSection form={form} setForm={setForm} />;
  }
}

/* ── Text ── */
function TextSection({ form, setForm }: { form: FormState; setForm: any }) {
  const max = 4096;
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center justify-between text-xs font-mono uppercase tracking-wide text-muted-foreground">
        <span className="flex items-center gap-2">Body <FormatHelp /></span>
        <span className="tabular-nums">
          {form.body.length}/{max}
        </span>
      </Label>
      <Textarea
        value={form.body}
        rows={5}
        maxLength={max}
        onChange={(e) => setForm((p: FormState) => ({ ...p, body: e.target.value }))}
        placeholder="Type the WhatsApp message body…"
      />
    </div>
  );
}

/* ── Template ── */
function TemplateSection({ form, setForm }: { form: FormState; setForm: any }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      TEMPLATES.filter((t) =>
        (t.name + " " + t.category).toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );
  const tpl = TEMPLATES.find((t) => t.id === form.templateId);
  const vars = tpl ? getTemplateVariables(tpl.body) : [];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Template
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approved templates…"
            className="pl-9"
          />
        </div>
        <div className="max-h-56 overflow-y-auto rounded-md border bg-card">
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground">No templates match.</div>
          )}
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setForm((p: FormState) => ({
                  ...p,
                  templateId: t.id,
                  templateVars: {},
                }))
              }
              className={cn(
                "flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent",
                form.templateId === t.id && "bg-accent",
              )}
            >
              <div className="min-w-0">
                <div className="truncate font-mono text-xs">{t.name}</div>
                <div className="text-[11px] text-muted-foreground">{t.language}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {t.category}
                </Badge>
                <Badge
                  className={cn(
                    "text-[10px]",
                    t.status === "APPROVED" && "bg-success text-success-foreground",
                    t.status === "PENDING" && "bg-warning text-warning-foreground",
                    t.status === "REJECTED" && "bg-destructive text-destructive-foreground",
                  )}
                >
                  {t.status}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
      {tpl && (
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <div className="mb-2 font-mono uppercase tracking-wide text-muted-foreground">
            Body
          </div>
          <div className="font-mono">{tpl.body}</div>
        </div>
      )}
      {vars.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Variables
          </Label>
          {vars.map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span className="w-12 shrink-0 rounded bg-muted px-2 py-1 text-center font-mono text-xs">
                {`{{${v}}}`}
              </span>
              <Input
                value={form.templateVars[v] ?? ""}
                onChange={(e) =>
                  setForm((p: FormState) => ({
                    ...p,
                    templateVars: { ...p.templateVars, [v]: e.target.value },
                  }))
                }
                placeholder={`Value for variable ${v}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Media ── */
function MediaSection({ form, setForm }: { form: FormState; setForm: any }) {
  return (
    <div className="space-y-3">
      <Tabs
        value={form.mediaSource}
        onValueChange={(v) =>
          setForm((p: FormState) => ({ ...p, mediaSource: v as "url" | "upload" }))
        }
      >
        <TabsList>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="url" className="mt-3 space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Media URL
          </Label>
          <Input
            value={form.mediaUrl}
            onChange={(e) => setForm((p: FormState) => ({ ...p, mediaUrl: e.target.value }))}
            placeholder="https://…"
            className="font-mono text-xs"
          />
        </TabsContent>
        <TabsContent value="upload" className="mt-3">
          <label
            htmlFor="wa-upload"
            className="flex h-24 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-muted/30 text-xs text-muted-foreground hover:bg-muted/50"
          >
            Drag & drop or click to upload — file becomes a local URL
          </label>
          <input
            id="wa-upload"
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f)
                setForm((p: FormState) => ({
                  ...p,
                  mediaUrl: URL.createObjectURL(f),
                  documentFilename: p.documentFilename || f.name,
                }));
            }}
          />
        </TabsContent>
      </Tabs>
      {form.type === "document" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Filename
          </Label>
          <Input
            value={form.documentFilename}
            onChange={(e) =>
              setForm((p: FormState) => ({ ...p, documentFilename: e.target.value }))
            }
            placeholder="invoice.pdf"
            className="font-mono text-xs"
          />
        </div>
      )}
      {form.type !== "audio" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Caption (optional)
          </Label>
          <Textarea
            value={form.mediaCaption}
            rows={2}
            onChange={(e) =>
              setForm((p: FormState) => ({ ...p, mediaCaption: e.target.value }))
            }
          />
        </div>
      )}
    </div>
  );
}

/* ── Interactive Buttons ── */
function ButtonsSection({ form, setForm }: { form: FormState; setForm: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Header (optional)
          </Label>
          <Input
            value={form.interactiveHeader}
            onChange={(e) =>
              setForm((p: FormState) => ({ ...p, interactiveHeader: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Footer (optional)
          </Label>
          <Input
            value={form.interactiveFooter}
            onChange={(e) =>
              setForm((p: FormState) => ({ ...p, interactiveFooter: e.target.value }))
            }
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Body
        </Label>
        <Textarea
          rows={2}
          value={form.interactiveBody}
          onChange={(e) =>
            setForm((p: FormState) => ({ ...p, interactiveBody: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Buttons (max 3)
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={form.buttons.length >= 3}
            onClick={() =>
              setForm((p: FormState) => ({
                ...p,
                buttons: [
                  ...p.buttons,
                  {
                    id: `btn_${p.buttons.length + 1}`,
                    type: "reply",
                    label: "",
                  },
                ],
              }))
            }
          >
            <Plus className="h-3 w-3" /> Add button
          </Button>
        </div>
        {form.buttons.map((b, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Select
              value={b.type}
              onValueChange={(v) =>
                setForm((p: FormState) => ({
                  ...p,
                  buttons: p.buttons.map((x, i) =>
                    i === idx ? { ...x, type: v as any } : x,
                  ),
                }))
              }
            >
              <SelectTrigger className="h-9 w-28 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reply">Reply</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={b.label}
              placeholder="Button label"
              onChange={(e) =>
                setForm((p: FormState) => ({
                  ...p,
                  buttons: p.buttons.map((x, i) =>
                    i === idx ? { ...x, label: e.target.value } : x,
                  ),
                }))
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                setForm((p: FormState) => ({
                  ...p,
                  buttons: p.buttons.filter((_, i) => i !== idx),
                }))
              }
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Interactive List ── */
function ListSection({ form, setForm }: { form: FormState; setForm: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Body
          </Label>
          <Textarea
            rows={2}
            value={form.interactiveBody}
            onChange={(e) =>
              setForm((p: FormState) => ({ ...p, interactiveBody: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            CTA button text
          </Label>
          <Input
            value={form.listButtonText}
            onChange={(e) =>
              setForm((p: FormState) => ({ ...p, listButtonText: e.target.value }))
            }
            placeholder="Choose"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
            Sections
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((p: FormState) => ({
                ...p,
                listSections: [
                  ...p.listSections,
                  { id: `sec_${p.listSections.length + 1}`, title: "Section", rows: [] },
                ],
              }))
            }
          >
            <Plus className="h-3 w-3" /> Add section
          </Button>
        </div>
        {form.listSections.map((s, sIdx) => (
          <div key={sIdx} className="space-y-2 rounded-md border p-3">
            <Input
              value={s.title}
              onChange={(e) =>
                setForm((p: FormState) => ({
                  ...p,
                  listSections: p.listSections.map((x, i) =>
                    i === sIdx ? { ...x, title: e.target.value } : x,
                  ),
                }))
              }
              placeholder="Section title"
              className="font-medium"
            />
            {s.rows.map((r, rIdx) => (
              <div key={rIdx} className="flex items-center gap-2">
                <Input
                  value={r.title}
                  placeholder="Row title"
                  onChange={(e) =>
                    setForm((p: FormState) => ({
                      ...p,
                      listSections: p.listSections.map((x, i) =>
                        i === sIdx
                          ? {
                              ...x,
                              rows: x.rows.map((y, j) =>
                                j === rIdx ? { ...y, title: e.target.value } : y,
                              ),
                            }
                          : x,
                      ),
                    }))
                  }
                />
                <Input
                  value={r.description ?? ""}
                  placeholder="Description"
                  onChange={(e) =>
                    setForm((p: FormState) => ({
                      ...p,
                      listSections: p.listSections.map((x, i) =>
                        i === sIdx
                          ? {
                              ...x,
                              rows: x.rows.map((y, j) =>
                                j === rIdx ? { ...y, description: e.target.value } : y,
                              ),
                            }
                          : x,
                      ),
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setForm((p: FormState) => ({
                      ...p,
                      listSections: p.listSections.map((x, i) =>
                        i === sIdx
                          ? { ...x, rows: x.rows.filter((_, j) => j !== rIdx) }
                          : x,
                      ),
                    }))
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setForm((p: FormState) => ({
                  ...p,
                  listSections: p.listSections.map((x, i) =>
                    i === sIdx
                      ? {
                          ...x,
                          rows: [
                            ...x.rows,
                            { id: `row_${x.rows.length + 1}`, title: "", description: "" },
                          ],
                        }
                      : x,
                  ),
                }))
              }
            >
              <Plus className="h-3 w-3" /> Add row
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Location ── */
function LocationSection({ form, setForm }: { form: FormState; setForm: any }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Latitude
        </Label>
        <Input
          inputMode="decimal"
          value={form.locationLat}
          onChange={(e) =>
            setForm((p: FormState) => ({ ...p, locationLat: e.target.value }))
          }
          className="font-mono text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Longitude
        </Label>
        <Input
          inputMode="decimal"
          value={form.locationLng}
          onChange={(e) =>
            setForm((p: FormState) => ({ ...p, locationLng: e.target.value }))
          }
          className="font-mono text-xs"
        />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Name (optional)
        </Label>
        <Input
          value={form.locationName}
          onChange={(e) =>
            setForm((p: FormState) => ({ ...p, locationName: e.target.value }))
          }
        />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Address (optional)
        </Label>
        <Input
          value={form.locationAddress}
          onChange={(e) =>
            setForm((p: FormState) => ({ ...p, locationAddress: e.target.value }))
          }
        />
      </div>
    </div>
  );
}

/* ── Reaction ── */
function ReactionSection({ form, setForm }: { form: FormState; setForm: any }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Target message id
        </Label>
        <Input
          value={form.reactionMessageId}
          onChange={(e) =>
            setForm((p: FormState) => ({ ...p, reactionMessageId: e.target.value }))
          }
          placeholder="wamid.…"
          className="font-mono text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
          Emoji
        </Label>
        <Input
          value={form.reactionEmoji}
          maxLength={4}
          className="w-20 text-center text-lg"
          onChange={(e) =>
            setForm((p: FormState) => ({ ...p, reactionEmoji: e.target.value }))
          }
        />
      </div>
    </div>
  );
}