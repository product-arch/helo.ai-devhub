import type { FormState } from "./types";
import { getTemplateVariables, TEMPLATES } from "./templates";

/** Build the WhatsApp Cloud-API style JSON request body from form state. */
export function buildPayload(f: FormState): Record<string, unknown> {
  const base = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: f.to.replace(/^\+/, ""),
  };
  switch (f.type) {
    case "text":
      return { ...base, type: "text", text: { body: f.body, preview_url: false } };
    case "template": {
      const tpl = TEMPLATES.find((t) => t.id === f.templateId);
      const vars = tpl ? getTemplateVariables(tpl.body) : [];
      return {
        ...base,
        type: "template",
        template: {
          name: tpl?.name ?? f.templateId,
          language: { code: tpl?.language ?? "en_US" },
          components: vars.length
            ? [
                {
                  type: "body",
                  parameters: vars.map((k) => ({
                    type: "text",
                    text: f.templateVars[k] ?? "",
                  })),
                },
              ]
            : [],
        },
      };
    }
    case "image":
      return {
        ...base,
        type: "image",
        image: { link: f.mediaUrl, caption: f.mediaCaption || undefined },
      };
    case "video":
      return {
        ...base,
        type: "video",
        video: { link: f.mediaUrl, caption: f.mediaCaption || undefined },
      };
    case "audio":
      return { ...base, type: "audio", audio: { link: f.mediaUrl } };
    case "document":
      return {
        ...base,
        type: "document",
        document: {
          link: f.mediaUrl,
          filename: f.documentFilename || undefined,
          caption: f.mediaCaption || undefined,
        },
      };
    case "interactive_buttons":
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "button",
          ...(f.interactiveHeader
            ? { header: { type: "text", text: f.interactiveHeader } }
            : {}),
          body: { text: f.interactiveBody },
          ...(f.interactiveFooter
            ? { footer: { text: f.interactiveFooter } }
            : {}),
          action: {
            buttons: f.buttons.slice(0, 3).map((b) => ({
              type: "reply",
              reply: { id: b.id, title: b.label },
            })),
          },
        },
      };
    case "interactive_list":
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "list",
          ...(f.interactiveHeader
            ? { header: { type: "text", text: f.interactiveHeader } }
            : {}),
          body: { text: f.interactiveBody },
          ...(f.interactiveFooter
            ? { footer: { text: f.interactiveFooter } }
            : {}),
          action: {
            button: f.listButtonText || "Choose",
            sections: f.listSections.map((s) => ({
              title: s.title,
              rows: s.rows.map((r) => ({
                id: r.id,
                title: r.title,
                ...(r.description ? { description: r.description } : {}),
              })),
            })),
          },
        },
      };
    case "location":
      return {
        ...base,
        type: "location",
        location: {
          latitude: Number(f.locationLat) || 0,
          longitude: Number(f.locationLng) || 0,
          name: f.locationName || undefined,
          address: f.locationAddress || undefined,
        },
      };
    case "reaction":
      return {
        ...base,
        type: "reaction",
        reaction: { message_id: f.reactionMessageId, emoji: f.reactionEmoji },
      };
  }
}

export function isValidPhone(p: string) {
  return /^\+[1-9]\d{6,14}$/.test(p);
}

/** Validate the payload against trivial rules. Returns first error or null. */
export function validate(f: FormState): string | null {
  if (!isValidPhone(f.to)) return "Recipient number must be in E.164 format (e.g. +14155550100).";
  switch (f.type) {
    case "text":
      if (!f.body.trim()) return "Message body is required.";
      break;
    case "template":
      if (!f.templateId) return "Pick a template.";
      break;
    case "image":
    case "video":
    case "audio":
    case "document":
      if (!f.mediaUrl.trim()) return "Media URL is required.";
      break;
    case "interactive_buttons":
      if (!f.interactiveBody.trim()) return "Body text is required.";
      if (f.buttons.length === 0) return "Add at least one button.";
      break;
    case "interactive_list":
      if (!f.interactiveBody.trim()) return "Body text is required.";
      if (!f.listSections.some((s) => s.rows.length > 0))
        return "Add at least one list row.";
      break;
    case "location":
      if (!f.locationLat || !f.locationLng) return "Latitude and longitude are required.";
      break;
    case "reaction":
      if (!f.reactionMessageId || !f.reactionEmoji)
        return "Message id and emoji are required.";
      break;
  }
  return null;
}