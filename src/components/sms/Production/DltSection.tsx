import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { smsStorage } from "../lib/smsStorage";
import type {
  DltConfig,
  DltHeader,
  DltTemplate,
  DltTemplateType,
} from "../lib/smsTypes";
import { peIdSchema, headerSchema } from "../lib/smsValidators";

const TEMPLATE_TYPES: { id: DltTemplateType; label: string }[] = [
  { id: "transactional", label: "Transactional" },
  { id: "promotional", label: "Promotional" },
  { id: "service_implicit", label: "Service Implicit" },
  { id: "service_explicit", label: "Service Explicit" },
];

function statusVariant(s: "pending" | "approved" | "rejected") {
  if (s === "approved") return "border-success/40 bg-success/10 text-success";
  if (s === "pending") return "border-warning/40 bg-warning/10 text-warning";
  return "border-destructive/40 bg-destructive/10 text-destructive";
}

export function DltSection({ appId }: { appId: string }) {
  const [cfg, setCfg] = useState<DltConfig>(() => smsStorage.getDlt(appId));
  const [peError, setPeError] = useState<string | null>(null);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [headerValue, setHeaderValue] = useState("");
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplContent, setTplContent] = useState("");
  const [tplType, setTplType] = useState<DltTemplateType>("transactional");
  const [tplDltId, setTplDltId] = useState("");
  const [tplHeader, setTplHeader] = useState<string>("");
  const [tplError, setTplError] = useState<string | null>(null);
  const { toast } = useToast();

  const persist = (next: DltConfig) => {
    setCfg(next);
    smsStorage.setDlt(appId, next);
  };

  const onPeChange = (v: string) => {
    const next = { ...cfg, peId: v };
    persist(next);
    if (v && !peIdSchema.safeParse(v).success) {
      setPeError("PE ID must be exactly 19 digits");
    } else {
      setPeError(null);
    }
  };

  const addHeader = () => {
    const result = headerSchema.safeParse(headerValue.toUpperCase());
    if (!result.success) {
      setHeaderError(result.error.issues[0].message);
      return;
    }
    const h: DltHeader = {
      id: "h_" + Math.random().toString(36).slice(2, 8),
      name: result.data,
      status: "pending",
    };
    persist({ ...cfg, headers: [...cfg.headers, h] });
    setHeaderOpen(false);
    setHeaderValue("");
    setHeaderError(null);
    toast({ title: "Header added" });
  };

  const addTemplate = () => {
    if (!tplContent.trim()) {
      setTplError("Template content is required");
      return;
    }
    if (!tplDltId.trim()) {
      setTplError("DLT Template ID is required");
      return;
    }
    const t: DltTemplate = {
      id: "t_" + Math.random().toString(36).slice(2, 8),
      templateId: tplDltId.trim(),
      content: tplContent.trim(),
      type: tplType,
      headerId: tplHeader || null,
      status: "pending",
    };
    persist({ ...cfg, templates: [...cfg.templates, t] });
    setTplOpen(false);
    setTplContent("");
    setTplDltId("");
    setTplError(null);
    toast({ title: "Template submitted" });
  };

  const removeHeader = (id: string) =>
    persist({ ...cfg, headers: cfg.headers.filter((h) => h.id !== id) });
  const removeTemplate = (id: string) =>
    persist({ ...cfg, templates: cfg.templates.filter((t) => t.id !== id) });

  const headerName = (id: string | null) =>
    cfg.headers.find((h) => h.id === id)?.name || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/5 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
        <p className="text-sm text-foreground">
          Required for sending SMS to Indian mobile numbers. Messages without DLT
          registration will be blocked by Indian carriers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pe-id">Principal Entity (PE) ID</Label>
          <Input
            id="pe-id"
            value={cfg.peId}
            onChange={(e) => onPeChange(e.target.value)}
            placeholder="1234567890123456789"
            className="font-mono"
            aria-invalid={!!peError}
          />
          {peError && <p className="text-xs text-destructive">{peError}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tm-id">Telemarketer ID (optional)</Label>
          <Input
            id="tm-id"
            value={cfg.telemarketerId}
            onChange={(e) => persist({ ...cfg, telemarketerId: e.target.value })}
            placeholder="100123456"
            className="font-mono"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Sender Headers</h4>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setHeaderOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Header
          </Button>
        </div>
        {cfg.headers.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            No headers registered.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Header</TableHead>
                <TableHead>DLT Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cfg.headers.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-mono text-sm">{h.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusVariant(h.status)}>{h.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeHeader(h.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Message Templates</h4>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setTplOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Template
          </Button>
        </div>
        {cfg.templates.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
            No templates registered.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template ID</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Header</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cfg.templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.templateId}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{t.content}</TableCell>
                  <TableCell className="text-sm capitalize">{t.type.replace("_", " ")}</TableCell>
                  <TableCell className="font-mono text-xs">{headerName(t.headerId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusVariant(t.status)}>{t.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeTemplate(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Header dialog */}
      <Dialog open={headerOpen} onOpenChange={setHeaderOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Sender Header</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Header (1–6 alphanumeric)</Label>
            <Input
              value={headerValue}
              onChange={(e) => {
                setHeaderValue(e.target.value.toUpperCase());
                setHeaderError(null);
              }}
              maxLength={6}
              className="font-mono"
            />
            {headerError && <p className="text-xs text-destructive">{headerError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHeaderOpen(false)}>Cancel</Button>
            <Button onClick={addHeader}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Template dialog */}
      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Message Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Template Content</Label>
              <Textarea
                value={tplContent}
                onChange={(e) => setTplContent(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{tplContent.length} characters</p>
            </div>
            <div className="space-y-1.5">
              <Label>Template Type</Label>
              <RadioGroup value={tplType} onValueChange={(v) => setTplType(v as DltTemplateType)}>
                {TEMPLATE_TYPES.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <RadioGroupItem value={t.id} id={`tpl-${t.id}`} />
                    <Label htmlFor={`tpl-${t.id}`} className="text-sm font-normal">{t.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1.5">
              <Label>DLT Template ID</Label>
              <Input value={tplDltId} onChange={(e) => setTplDltId(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Associated Header</Label>
              <Select value={tplHeader} onValueChange={setTplHeader}>
                <SelectTrigger>
                  <SelectValue placeholder={cfg.headers.length === 0 ? "No headers available" : "Select header"} />
                </SelectTrigger>
                <SelectContent>
                  {cfg.headers.map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {tplError && <p className="text-xs text-destructive">{tplError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTplOpen(false)}>Cancel</Button>
            <Button onClick={addTemplate}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
