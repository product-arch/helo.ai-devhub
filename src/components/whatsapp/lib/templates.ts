export interface WaTemplate {
  id: string;
  name: string;
  language: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  status: "APPROVED" | "PENDING" | "REJECTED";
  body: string; // contains {{1}}, {{2}}, ...
}

export const TEMPLATES: WaTemplate[] = [
  {
    id: "order_confirmation_v3",
    name: "order_confirmation_v3",
    language: "en_US",
    category: "UTILITY",
    status: "APPROVED",
    body:
      "Hi {{1}}, your order #{{2}} for {{3}} has been confirmed. Estimated delivery: {{4}}.",
  },
  {
    id: "shipping_update",
    name: "shipping_update",
    language: "en_US",
    category: "UTILITY",
    status: "APPROVED",
    body: "Hello {{1}}, your package is on the way. Track it here: {{2}}",
  },
  {
    id: "otp_login",
    name: "otp_login",
    language: "en_US",
    category: "AUTHENTICATION",
    status: "APPROVED",
    body: "Your verification code is {{1}}. It expires in 10 minutes.",
  },
  {
    id: "weekend_promo",
    name: "weekend_promo",
    language: "en_US",
    category: "MARKETING",
    status: "APPROVED",
    body:
      "Hey {{1}}, this weekend only — {{2}} off everything in store. Use code {{3}} at checkout.",
  },
  {
    id: "appointment_reminder",
    name: "appointment_reminder",
    language: "en_US",
    category: "UTILITY",
    status: "APPROVED",
    body:
      "Reminder: your appointment with {{1}} is on {{2}} at {{3}}. Reply CANCEL to cancel.",
  },
  {
    id: "abandoned_cart_v2",
    name: "abandoned_cart_v2",
    language: "en_US",
    category: "MARKETING",
    status: "PENDING",
    body: "Hi {{1}}, you left {{2}} in your cart. Come back and finish your order.",
  },
  {
    id: "payment_failed",
    name: "payment_failed",
    language: "en_US",
    category: "UTILITY",
    status: "REJECTED",
    body: "Hi {{1}}, your payment of {{2}} failed. Please update your method.",
  },
];

export function getTemplateVariables(body: string): string[] {
  const matches = body.matchAll(/\{\{(\d+)\}\}/g);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out.sort((a, b) => Number(a) - Number(b));
}

export function renderTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{(\d+)\}\}/g, (_, k) => vars[k] || `{{${k}}}`);
}