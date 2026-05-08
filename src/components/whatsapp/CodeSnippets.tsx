import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CopyButton } from "./CopyButton";
import { highlightCode } from "./lib/syntax";
import { LANG_LABELS, type Lang, renderSnippet } from "./lib/snippets";
import type { Environment, FormState } from "./lib/types";
import { cn } from "@/lib/utils";

const LANGS: Lang[] = [
  "curl",
  "js-fetch",
  "js-axios",
  "node",
  "py-requests",
  "py-httpx",
  "php",
  "ruby",
  "go",
  "java",
  "csharp",
  "sdk",
];

export function CodeSnippets({
  env,
  form,
  apiKey,
  insertKey,
  onInsertKeyChange,
}: {
  env: Environment;
  form: FormState;
  apiKey: string;
  insertKey: boolean;
  onInsertKeyChange: (v: boolean) => void;
}) {
  const [lang, setLang] = useState<Lang>("curl");
  const masked = apiKey.slice(0, 8) + "•".repeat(16) + apiKey.slice(-4);
  const keyForSnippet = insertKey ? masked : "YOUR_API_KEY";

  const code = useMemo(
    () => renderSnippet(lang, { env, form, apiKey: keyForSnippet }),
    [lang, env, form, keyForSnippet],
  );

  return (
    <div className="rounded-lg border bg-card shadow-block">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors",
                lang === l
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:bg-accent",
              )}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="wa-insert-key"
              checked={insertKey}
              onCheckedChange={onInsertKeyChange}
            />
            <Label htmlFor="wa-insert-key" className="cursor-pointer text-[11px] text-muted-foreground">
              Insert my key
            </Label>
          </div>
          <CopyButton value={code} label="Copy" variant="outline" />
        </div>
      </div>
      <pre className="max-h-[420px] overflow-auto bg-background/40 px-4 py-3 font-mono text-xs leading-relaxed">
        <code>{highlightCode(code)}</code>
      </pre>
    </div>
  );
}