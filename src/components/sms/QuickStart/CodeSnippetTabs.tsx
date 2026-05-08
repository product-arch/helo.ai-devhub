import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildSnippet, type SnippetLang } from "../lib/smsSnippets";

const LANGS: { id: SnippetLang; label: string }[] = [
  { id: "curl", label: "curl" },
  { id: "node", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
];

interface Props {
  apiKey: string;
  from: string;
  to: string;
  body: string;
}

export function CodeSnippetTabs(props: Props) {
  const [lang, setLang] = useState<SnippetLang>("curl");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const code = buildSnippet(lang, props);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied", description: `${lang} snippet copied to clipboard` });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-md border bg-card">
      <Tabs value={lang} onValueChange={(v) => setLang(v as SnippetLang)}>
        <div className="flex items-center justify-between border-b px-2 py-1.5">
          <TabsList className="h-8 bg-transparent">
            {LANGS.map((l) => (
              <TabsTrigger
                key={l.id}
                value={l.id}
                className="h-7 px-3 text-xs data-[state=active]:bg-muted"
              >
                {l.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button variant="ghost" size="sm" onClick={copy} className="h-7 gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-xs">Copy</span>
          </Button>
        </div>
        {LANGS.map((l) => (
          <TabsContent key={l.id} value={l.id} className="m-0">
            <pre className="max-h-72 overflow-auto p-4 text-xs leading-relaxed">
              <code className="font-mono">{buildSnippet(l.id, props)}</code>
            </pre>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
