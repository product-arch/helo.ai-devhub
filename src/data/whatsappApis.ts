export interface MessagingApi {
  id: string;
  category: string;
  endpoint: string;
  method: string;
  requiredId: string;
  purpose: string;
  scope: string;
  classification: string;
  layer: string;
  accessType: "toggle" | "request";
  isEssential: boolean;
}

/** @deprecated Use MessagingApi instead */
export type WhatsAppApi = MessagingApi;

// Seeded pseudo-random for consistent accessType on unclassified APIs
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const rawApis: Omit<WhatsAppApi, "id" | "accessType" | "isEssential">[] = [
  { category: "Activities Log", endpoint: "/{WABA_ID}/activities", method: "GET", requiredId: "WABA_ID", purpose: "Account activity history", scope: "whatsapp_business_management", classification: "Internal Only", layer: "WABA" },
  { category: "AI Thread Search", endpoint: "/{PHONE_NUMBER_ID}/meta_ai_business_agent_thread_search", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "AI-powered thread search", scope: "whatsapp_business_management", classification: "Future Scope", layer: "Phone" },
  { category: "Assigned Users", endpoint: "/{WABA_ID}/assigned_users", method: "GET", requiredId: "WABA_ID", purpose: "List users mapped to WABA", scope: "whatsapp_business_management", classification: "Internal Only", layer: "WABA" },
  { category: "Audiences", endpoint: "/{WABA_ID}/audiences", method: "GET", requiredId: "WABA_ID", purpose: "Marketing audience data", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Block Users", endpoint: "/{PHONE_NUMBER_ID}/block_users", method: "GET/POST", requiredId: "PHONE_NUMBER_ID", purpose: "Manage blocked users", scope: "whatsapp_business_messaging", classification: "MVP", layer: "Phone" },
  { category: "Business Compliance Info", endpoint: "/{PHONE_NUMBER_ID}/business_compliance_info", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "Compliance enforcement state", scope: "whatsapp_business_management", classification: "BSP Required", layer: "Phone" },
  { category: "Business Profile (GET)", endpoint: "/{PHONE_NUMBER_ID}/whatsapp_business_profile", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "Fetch business profile", scope: "whatsapp_business_management", classification: "MVP", layer: "Phone" },
  { category: "Business Profile (POST)", endpoint: "/{PHONE_NUMBER_ID}/whatsapp_business_profile", method: "POST", requiredId: "PHONE_NUMBER_ID", purpose: "Update business profile", scope: "whatsapp_business_management", classification: "MVP", layer: "Phone" },
  { category: "Call Analytics", endpoint: "/{WABA_ID}/call_analytics", method: "GET", requiredId: "WABA_ID", purpose: "Voice performance analytics", scope: "whatsapp_business_management", classification: "Internal Only", layer: "WABA" },
  { category: "Call Permissions", endpoint: "/{PHONE_NUMBER_ID}/call_permissions", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "Calling capability control", scope: "whatsapp_business_management", classification: "BSP Required", layer: "Phone" },
  { category: "Commerce Settings", endpoint: "/{PHONE_NUMBER_ID}/whatsapp_commerce_settings", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "Commerce configuration", scope: "whatsapp_business_management", classification: "Future Scope", layer: "Phone" },
  { category: "Conversation Analytics", endpoint: "/{WABA_ID}/conversation_analytics", method: "GET", requiredId: "WABA_ID", purpose: "Billing & usage", scope: "whatsapp_business_management", classification: "BSP Required", layer: "WABA" },
  { category: "Dataset", endpoint: "/{WABA_ID}/dataset", method: "GET", requiredId: "WABA_ID", purpose: "Data source linkage", scope: "whatsapp_business_management", classification: "Internal Only", layer: "WABA" },
  { category: "Degrees of Freedom Spec", endpoint: "/{WABA_ID}/degrees_of_freedom_spec", method: "GET", requiredId: "WABA_ID", purpose: "Advanced ad optimization controls", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Deregister", endpoint: "/{PHONE_NUMBER_ID}/deregister", method: "POST", requiredId: "PHONE_NUMBER_ID", purpose: "Deregister number", scope: "whatsapp_business_management", classification: "BSP Required", layer: "Phone" },
  { category: "Encryption Status", endpoint: "/{PHONE_NUMBER_ID}/whatsapp_business_encryption", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "Retrieve encryption configuration and key status", scope: "whatsapp_business_management", classification: "BSP Required", layer: "Phone" },
  { category: "Configure Encryption", endpoint: "/{PHONE_NUMBER_ID}/whatsapp_business_encryption", method: "POST", requiredId: "PHONE_NUMBER_ID", purpose: "Upload/update public key and manage E2EE settings", scope: "whatsapp_business_management", classification: "BSP Required", layer: "Phone" },
  { category: "Flows", endpoint: "/{WABA_ID}/flows", method: "GET/POST", requiredId: "WABA_ID", purpose: "Manage WhatsApp Flows", scope: "whatsapp_business_management", classification: "BSP Required", layer: "WABA" },
  { category: "Group Analytics", endpoint: "/{WABA_ID}/group_analytics", method: "GET", requiredId: "WABA_ID", purpose: "Group-level messaging insights", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Groups", endpoint: "/{PHONE_NUMBER_ID}/groups", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "Group associations", scope: "whatsapp_business_management", classification: "Future Scope", layer: "Phone" },
  { category: "Marketing Campaigns", endpoint: "/{WABA_ID}/marketing_campaigns", method: "GET", requiredId: "WABA_ID", purpose: "Campaign orchestration", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Media Delete", endpoint: "/{MEDIA_ID}", method: "DELETE", requiredId: "MEDIA_ID", purpose: "Delete media", scope: "whatsapp_business_messaging", classification: "MVP", layer: "Media" },
  { category: "Media Retrieve", endpoint: "/{MEDIA_ID}", method: "GET", requiredId: "MEDIA_ID", purpose: "Retrieve media", scope: "whatsapp_business_messaging", classification: "MVP", layer: "Media" },
  { category: "Media Upload", endpoint: "/{PHONE_NUMBER_ID}/media", method: "POST", requiredId: "PHONE_NUMBER_ID", purpose: "Upload media assets", scope: "whatsapp_business_messaging", classification: "MVP", layer: "Phone" },
  { category: "Message Campaigns", endpoint: "/{WABA_ID}/message_campaigns", method: "GET", requiredId: "WABA_ID", purpose: "Message-level campaigns", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Message History", endpoint: "/{PHONE_NUMBER_ID}/message_history", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "Message tracking history", scope: "whatsapp_business_messaging", classification: "Internal Only", layer: "Phone" },
  { category: "Message QR Links", endpoint: "/{PHONE_NUMBER_ID}/message_qrdls", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "Generate QR deep links", scope: "whatsapp_business_messaging", classification: "Future Scope", layer: "Phone" },
  { category: "Meta AI Business Agent", endpoint: "/{PHONE_NUMBER_ID}/meta_ai_business_agent", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "AI agent configuration", scope: "whatsapp_business_management", classification: "Future Scope", layer: "Phone" },
  { category: "Number Health", endpoint: "/{PHONE_NUMBER_ID}?fields=status,quality_score,throughput,whatsapp_business_manager_messaging_limit", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "Quality & limits monitoring", scope: "whatsapp_business_management", classification: "MVP", layer: "Phone" },
  { category: "Payment Configuration", endpoint: "/{WABA_ID}/payment_configuration", method: "GET", requiredId: "WABA_ID", purpose: "View billing setup", scope: "whatsapp_business_management", classification: "BSP Required", layer: "WABA" },
  { category: "Payment Configurations", endpoint: "/{WABA_ID}/payment_configurations", method: "GET", requiredId: "WABA_ID", purpose: "List billing configurations", scope: "whatsapp_business_management", classification: "BSP Required", layer: "WABA" },
  { category: "Payments", endpoint: "/{PHONE_NUMBER_ID}/payments", method: "GET", requiredId: "PHONE_NUMBER_ID", purpose: "In-chat payment transactions", scope: "whatsapp_business_management", classification: "Future Scope", layer: "Phone" },
  { category: "Phone Numbers", endpoint: "/{WABA_ID}/phone_numbers", method: "GET", requiredId: "WABA_ID", purpose: "List all numbers", scope: "whatsapp_business_management", classification: "MVP", layer: "WABA" },
  { category: "Pricing Analytics", endpoint: "/{WABA_ID}/pricing_analytics", method: "GET", requiredId: "WABA_ID", purpose: "Conversation pricing data", scope: "whatsapp_business_management", classification: "BSP Required", layer: "WABA" },
  { category: "Product Catalogs", endpoint: "/{WABA_ID}/product_catalogs", method: "GET", requiredId: "WABA_ID", purpose: "Commerce catalog linkage", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Registration", endpoint: "/{PHONE_NUMBER_ID}/register", method: "POST", requiredId: "PHONE_NUMBER_ID", purpose: "Register number", scope: "whatsapp_business_management", classification: "BSP Required", layer: "Phone" },
  { category: "Request Verification Code", endpoint: "/{PHONE_NUMBER_ID}/request_code", method: "POST", requiredId: "PHONE_NUMBER_ID", purpose: "Request OTP verification", scope: "whatsapp_business_management", classification: "BSP Required", layer: "Phone" },
  { category: "Schedules", endpoint: "/{WABA_ID}/schedules", method: "GET", requiredId: "WABA_ID", purpose: "Scheduled campaign data", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Send Message", endpoint: "/{PHONE_NUMBER_ID}/messages", method: "POST", requiredId: "PHONE_NUMBER_ID", purpose: "Send test & production messages", scope: "whatsapp_business_messaging", classification: "MVP", layer: "Phone" },
  { category: "Solutions", endpoint: "/{WABA_ID}/solutions", method: "GET", requiredId: "WABA_ID", purpose: "Linked solution providers", scope: "whatsapp_business_management", classification: "Internal Only", layer: "WABA" },
  { category: "Subscribe App", endpoint: "/{WABA_ID}/subscribed_apps", method: "POST", requiredId: "WABA_ID", purpose: "Subscribe webhook", scope: "whatsapp_business_management", classification: "BSP Required", layer: "WABA" },
  { category: "Subscribed Apps", endpoint: "/{WABA_ID}/subscribed_apps", method: "GET", requiredId: "WABA_ID", purpose: "Check webhook subscription", scope: "whatsapp_business_management", classification: "BSP Required", layer: "WABA" },
  { category: "Template Analytics", endpoint: "/{WABA_ID}/template_analytics", method: "GET", requiredId: "WABA_ID", purpose: "Template performance", scope: "whatsapp_business_management", classification: "BSP Required", layer: "WABA" },
  { category: "Template Create", endpoint: "/{WABA_ID}/message_templates", method: "POST", requiredId: "WABA_ID", purpose: "Create template", scope: "whatsapp_business_management", classification: "MVP", layer: "WABA" },
  { category: "Template Delete", endpoint: "/{WABA_ID}/message_templates?name=", method: "DELETE", requiredId: "WABA_ID", purpose: "Delete template", scope: "whatsapp_business_management", classification: "MVP", layer: "WABA" },
  { category: "Template Group Analytics", endpoint: "/{WABA_ID}/template_group_analytics", method: "GET", requiredId: "WABA_ID", purpose: "Group-level performance metrics", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Template Groups", endpoint: "/{WABA_ID}/template_groups", method: "GET", requiredId: "WABA_ID", purpose: "Logical grouping of templates", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Template Performance Metrics", endpoint: "/{WABA_ID}/template_performance_metrics", method: "GET", requiredId: "WABA_ID", purpose: "Deep template analytics", scope: "whatsapp_business_management", classification: "Future Scope", layer: "WABA" },
  { category: "Template Previews", endpoint: "/{WABA_ID}/message_template_previews", method: "GET", requiredId: "WABA_ID", purpose: "Preview templates before send", scope: "whatsapp_business_management", classification: "MVP", layer: "WABA" },
  { category: "Templates List", endpoint: "/{WABA_ID}/message_templates", method: "GET", requiredId: "WABA_ID", purpose: "List templates", scope: "whatsapp_business_management", classification: "MVP", layer: "WABA" },
  { category: "Unsubscribe App", endpoint: "/{WABA_ID}/subscribed_apps", method: "DELETE", requiredId: "WABA_ID", purpose: "Remove webhook subscription", scope: "whatsapp_business_management", classification: "BSP Required", layer: "WABA" },
  { category: "Verify Code", endpoint: "/{PHONE_NUMBER_ID}/verify_code", method: "POST", requiredId: "PHONE_NUMBER_ID", purpose: "Verify OTP for number", scope: "whatsapp_business_management", classification: "BSP Required", layer: "Phone" },
];

export const whatsappApis: WhatsAppApi[] = rawApis.map((api, index) => {
  const id = api.category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
  const isEssential = api.classification === "MVP";
  const accessType: "toggle" | "request" = isEssential ? "toggle" : (seededRandom(index + 42) > 0.3 ? "request" : "toggle");

  return { ...api, id, accessType, isEssential };
});
