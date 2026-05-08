import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { smsStorage } from "../lib/smsStorage";
import type { SmsSettings } from "../lib/smsTypes";

export function SettingsSection({ appId }: { appId: string }) {
  const [s, setS] = useState<SmsSettings>(() => smsStorage.getSettings(appId));

  const persist = (next: SmsSettings) => {
    setS(next);
    smsStorage.setSettings(appId, next);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm">Default Encoding</Label>
        <RadioGroup
          value={s.encoding}
          onValueChange={(v) => persist({ ...s, encoding: v as SmsSettings["encoding"] })}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="gsm7" id="enc-gsm" />
            <Label htmlFor="enc-gsm" className="font-normal">GSM-7</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="ucs2" id="enc-ucs" />
            <Label htmlFor="enc-ucs" className="font-normal">UCS-2 (Unicode)</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2.5">
        <div>
          <Label className="text-sm">Auto-detect Unicode</Label>
          <p className="text-xs text-muted-foreground">
            Automatically switch to UCS-2 when non-GSM7 characters are detected.
          </p>
        </div>
        <Switch
          checked={s.autoUnicode}
          onCheckedChange={(v) => persist({ ...s, autoUnicode: v })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Long Message Handling</Label>
        <RadioGroup
          value={s.longMessage}
          onValueChange={(v) => persist({ ...s, longMessage: v as SmsSettings["longMessage"] })}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="concatenate" id="long-concat" />
            <Label htmlFor="long-concat" className="font-normal">Concatenate (multipart)</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="truncate" id="long-trunc" />
            <Label htmlFor="long-trunc" className="font-normal">Truncate</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Max retries on failure</Label>
        <Select
          value={String(s.maxRetries)}
          onValueChange={(v) =>
            persist({ ...s, maxRetries: Number(v) as SmsSettings["maxRetries"] })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
