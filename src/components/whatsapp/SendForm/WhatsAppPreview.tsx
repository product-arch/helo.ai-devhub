import { MessageSquare } from "lucide-react";
import type { FormState } from "../lib/types";
import { TEMPLATES, renderTemplate } from "../lib/templates";
import { cn } from "@/lib/utils";

/* WhatsApp formatting renderer: *bold*, _italic_, ~strike~, ```mono``` */
function fmt(text: string) {
  if (!text) return null;
  const out: (string | JSX.Element)[] = [];
  const re = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[\s\S]+?```)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const v = m[1];
    if (v.startsWith("```"))
      out.push(<code key={i++} className="rounded bg-black/10 px-1 font-mono text-[12px]">{v.slice(3, -3)}</code>);
    else if (v.startsWith("*"))
      out.push(<strong key={i++}>{v.slice(1, -1)}</strong>);
    else if (v.startsWith("_"))
      out.push(<em key={i++}>{v.slice(1, -1)}</em>);
    else if (v.startsWith("~"))
      out.push(<span key={i++} className="line-through">{v.slice(1, -1)}</span>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function WhatsAppPreview({ form }: { form: FormState }) {
  let bodyText = "";
  let mediaPreview: JSX.Element | null = null;
  let footerText = "";
  let buttons: string[] = [];

  switch (form.type) {
    case "text":
      bodyText = form.body || "Your message body…";
      break;
    case "template": {
      const tpl = TEMPLATES.find((t) => t.id === form.templateId);
      bodyText = tpl
        ? renderTemplate(tpl.body, form.templateVars)
        : "Pick a template to preview…";
      break;
    }
    case "image":
      mediaPreview = form.mediaUrl ? (
        <img
          src={form.mediaUrl}
          alt=""
          className="h-32 w-full rounded object-cover"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center rounded bg-black/5 text-xs text-muted-foreground">
          Image
        </div>
      );
      bodyText = form.mediaCaption;
      break;
    case "video":
      mediaPreview = (
        <div className="flex h-32 w-full items-center justify-center rounded bg-black/5 text-xs text-muted-foreground">
          ▶ Video
        </div>
      );
      bodyText = form.mediaCaption;
      break;
    case "audio":
      mediaPreview = (
        <div className="flex h-12 w-full items-center justify-center rounded bg-black/5 text-xs text-muted-foreground">
          🎵 Voice message
        </div>
      );
      break;
    case "document":
      mediaPreview = (
        <div className="flex h-12 w-full items-center gap-2 rounded bg-black/5 px-3 text-xs">
          📎 <span className="font-mono">{form.documentFilename || "document.pdf"}</span>
        </div>
      );
      bodyText = form.mediaCaption;
      break;
    case "interactive_buttons":
      bodyText = form.interactiveBody || "Pick an option";
      footerText = form.interactiveFooter;
      buttons = form.buttons.map((b) => b.label).filter(Boolean).slice(0, 3);
      break;
    case "interactive_list":
      bodyText = form.interactiveBody || "Pick from the list";
      footerText = form.interactiveFooter;
      buttons = [form.listButtonText || "Choose"];
      break;
    case "location":
      mediaPreview = (
        <div className="flex h-24 w-full items-center justify-center rounded bg-black/5 text-xs text-muted-foreground">
          📍 {form.locationName || `${form.locationLat || "—"}, ${form.locationLng || "—"}`}
        </div>
      );
      bodyText = form.locationAddress;
      break;
    case "reaction":
      bodyText = `Reacted ${form.reactionEmoji || "👍"} to a message`;
      break;
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-[#0b141a] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-white/60">
        <MessageSquare className="h-3.5 w-3.5" />
        WhatsApp preview
      </div>
      <div
        className="rounded-2xl bg-[#202c33] p-3 text-sm text-white/95"
        style={{ maxWidth: "85%", marginLeft: "auto" }}
      >
        {mediaPreview && <div className="mb-2">{mediaPreview}</div>}
        {bodyText && (
          <div className="whitespace-pre-wrap break-words leading-snug">{fmt(bodyText)}</div>
        )}
        {form.interactiveHeader && (
          <div className="mb-1 text-[13px] font-semibold">{form.interactiveHeader}</div>
        )}
        {footerText && (
          <div className="mt-1 text-[11px] text-white/50">{footerText}</div>
        )}
        <div className="mt-1 text-right text-[10px] text-white/40">12:34 PM ✓✓</div>
      </div>
      {buttons.length > 0 && (
        <div className={cn("mt-2 grid gap-1.5", buttons.length === 1 ? "" : "grid-cols-1")}>
          {buttons.map((b, i) => (
            <button
              key={i}
              className="rounded-lg bg-[#202c33] py-2 text-xs font-medium text-[#00a884] hover:bg-[#2a3942]"
              type="button"
            >
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}