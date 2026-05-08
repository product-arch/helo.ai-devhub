import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  apiKey: string;
  apiSecret: string;
}

function maskKey(key: string) {
  if (!key) return "";
  if (key.length <= 6) return "●".repeat(8) + key;
  return "●".repeat(Math.max(8, key.length - 6)) + key.slice(-6);
}

function CredField({
  label,
  value,
  fullyMasked,
}: {
  label: string;
  value: string;
  fullyMasked?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const display = revealed ? value : fullyMasked ? "●".repeat(24) : maskKey(value);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input value={display} readOnly className="font-mono text-sm" />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? "Hide" : "Reveal"}
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" onClick={copy} aria-label="Copy">
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export function StepCredentials({ apiKey, apiSecret }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Your API credentials for this App. Used to authenticate every SMS request.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <CredField label="API Key" value={apiKey} />
        <CredField label="API Secret" value={apiSecret} fullyMasked />
      </div>
    </div>
  );
}
