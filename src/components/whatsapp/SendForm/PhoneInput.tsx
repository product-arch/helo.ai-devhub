import { useState } from "react";
import { Bookmark, BookmarkCheck, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isValidPhone } from "../lib/payload";
import type { SavedNumber } from "../lib/types";
import { cn } from "@/lib/utils";

const COUNTRIES: { code: string; flag: string; name: string }[] = [
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+90", flag: "🇹🇷", name: "Türkiye" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
];

function detectCountry(phone: string) {
  const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  return sorted.find((c) => phone.startsWith(c.code)) ?? COUNTRIES[0];
}

export function PhoneInput({
  value,
  onChange,
  saved,
  onSave,
  onLoad,
}: {
  value: string;
  onChange: (v: string) => void;
  saved: SavedNumber[];
  onSave: (n: SavedNumber) => void;
  onLoad: (n: SavedNumber) => void;
}) {
  const country = detectCountry(value || "+1");
  const valid = isValidPhone(value);
  const isSaved = saved.some((s) => s.number === value);
  const [picking, setPicking] = useState(false);

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-md border bg-input-background",
          value && !valid && "border-destructive",
        )}
      >
        <DropdownMenu open={picking} onOpenChange={setPicking}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 border-r bg-muted/30 px-3 text-sm hover:bg-muted/60"
              aria-label="Country code"
            >
              <span className="text-base leading-none">{country.flag}</span>
              <span className="font-mono text-xs text-muted-foreground">{country.code}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
            {COUNTRIES.map((c) => (
              <DropdownMenuItem
                key={c.code}
                onClick={() => {
                  // replace existing prefix or prepend
                  const stripped = value.replace(/^\+\d{1,4}/, "");
                  onChange(c.code + stripped);
                }}
                className="gap-2"
              >
                <span>{c.flag}</span>
                <span className="flex-1">{c.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          inputMode="tel"
          placeholder="+14155550100"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[\s\-()]/g, ""))}
          className="border-0 bg-transparent font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-none border-l"
          aria-label={isSaved ? "Saved" : "Save number"}
          disabled={!valid}
          onClick={() => {
            if (isSaved || !valid) return;
            const label = `${country.flag} Test ${saved.length + 1}`;
            onSave({ label, number: value });
          }}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 text-primary" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </Button>
        {saved.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-none border-l text-xs"
              >
                Saved
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Saved test numbers</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {saved.map((s) => (
                <DropdownMenuItem
                  key={s.number}
                  onClick={() => onLoad(s)}
                  className="font-mono text-xs"
                >
                  <span className="mr-2">{s.label}</span>
                  <span className="text-muted-foreground">{s.number}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {value && !valid && (
        <p className="text-xs text-destructive">
          Invalid number — must be E.164 format like <code>+14155550100</code>.
        </p>
      )}
    </div>
  );
}