import { ArrowRight, Bell, FileText, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export function WhatsNext({
  recommended,
}: {
  recommended: "webhooks" | "templates";
}) {
  const cards = [
    {
      key: "webhooks" as const,
      icon: Bell,
      title: "Set up webhooks",
      desc: "Receive delivery, read, and inbound message events on your endpoint.",
      href: "/webhooks",
      warn: recommended === "webhooks",
    },
    {
      key: "templates" as const,
      icon: FileText,
      title: "Manage templates",
      desc: "Submit and approve message templates for transactional + marketing flows.",
      href: "/templates",
      warn: false,
    },
    {
      key: "media" as const,
      icon: Paperclip,
      title: "Supported media types",
      desc: "Image, video, audio, and document size + format limits.",
      href: "/docs/media",
      warn: false,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => {
        const isRecommended = c.key === recommended;
        const Icon = c.icon;
        return (
          <a
            key={c.key}
            href={c.href}
            className={cn(
              "group relative flex flex-col rounded-lg border bg-card p-4 shadow-block transition-colors hover:border-primary/50",
              isRecommended && "border-primary/60 bg-primary/[0.04]",
            )}
          >
            {isRecommended && (
              <span className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                Start here <ArrowRight className="h-2.5 w-2.5" />
              </span>
            )}
            {c.warn && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-warning" aria-label="Action recommended" />
            )}
            <Icon className="mb-2 h-5 w-5 text-primary" />
            <div className="text-sm font-semibold">{c.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary opacity-70 transition-opacity group-hover:opacity-100">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </a>
        );
      })}
    </div>
  );
}