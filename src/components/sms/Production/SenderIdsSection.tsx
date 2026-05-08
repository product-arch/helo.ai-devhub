import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smsStorage } from "../lib/smsStorage";
import type { SenderId, SenderIdType } from "../lib/smsTypes";
import { senderIdValidators } from "../lib/smsValidators";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "BR", name: "Brazil" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "SG", name: "Singapore" },
];

const TYPE_LABELS: Record<SenderIdType, string> = {
  alphanumeric: "Alphanumeric",
  shortcode: "Shortcode",
  longcode: "Longcode",
  tollfree: "Toll-free",
};

function statusVariant(s: SenderId["status"]) {
  switch (s) {
    case "approved":
    case "active":
      return "border-success/40 bg-success/10 text-success";
    case "pending":
      return "border-warning/40 bg-warning/10 text-warning";
    case "rejected":
      return "border-destructive/40 bg-destructive/10 text-destructive";
  }
}

export function SenderIdsSection({ appId }: { appId: string }) {
  const [senders, setSenders] = useState<SenderId[]>(() => smsStorage.getSenders(appId));
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState("US");
  const [countryQuery, setCountryQuery] = useState("");
  const [type, setType] = useState<SenderIdType>("alphanumeric");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const persist = (next: SenderId[]) => {
    setSenders(next);
    smsStorage.setSenders(appId, next);
  };

  const submit = () => {
    const result = senderIdValidators[type].safeParse(value);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    const next: SenderId[] = [
      ...senders,
      {
        id: "sid_" + Math.random().toString(36).slice(2, 8),
        value: result.data,
        type,
        country,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ];
    persist(next);
    toast({ title: "Sender ID submitted", description: "Awaiting approval." });
    setOpen(false);
    setValue("");
    setError(null);
  };

  const remove = (id: string) => persist(senders.filter((s) => s.id !== id));

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countryQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Registered Sender IDs for production traffic.
        </p>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Register Sender ID
        </Button>
      </div>

      {senders.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center">
          <p className="text-sm font-medium">No Sender IDs registered.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add one to go live with production traffic.
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen(true)}>
            Register Sender ID
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sender ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {senders.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-sm">{s.value}</TableCell>
                <TableCell className="text-sm">{TYPE_LABELS[s.type]}</TableCell>
                <TableCell className="text-sm">{s.country}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusVariant(s.status)}>
                    {s.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Register Sender ID</SheetTitle>
            <SheetDescription>
              Submit a Sender ID for carrier approval.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                placeholder="Search country…"
                value={countryQuery}
                onChange={(e) => setCountryQuery(e.target.value)}
              />
              <div className="max-h-40 overflow-auto rounded-md border">
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCountry(c.code)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent ${
                      country === c.code ? "bg-accent" : ""
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Sender Type</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => {
                  setType(v as SenderIdType);
                  setError(null);
                }}
              >
                {(Object.keys(TYPE_LABELS) as SenderIdType[]).map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <RadioGroupItem value={t} id={`sid-${t}`} />
                    <Label htmlFor={`sid-${t}`} className="text-sm font-normal">
                      {TYPE_LABELS[t]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1.5">
              <Label>Sender ID Value</Label>
              <Input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder={
                  type === "alphanumeric"
                    ? "ACME"
                    : type === "shortcode"
                    ? "12345"
                    : "+14155550100"
                }
                className="font-mono"
                aria-invalid={!!error}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Submit</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
