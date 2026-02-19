import { createContext, useContext, useState, ReactNode } from "react";

// --- Types ---

export type ProductStatus = "disabled" | "configured" | "restricted" | "active";
export type AccountStatus = "active" | "restricted" | "pending";
export type CapabilityStatus = "enabled" | "disabled" | "restricted";
export type AppEnvironment = "production" | "staging" | "development";
export type AppHealth = "healthy" | "action_required";

export interface MessagingCapability {
  id: string;
  name: string;
  description: string;
  status: CapabilityStatus;
  requirements: ("approval" | "billing" | "compliance")[];
  linkedEndpoints: string[];
}

export interface Product {
  id: string;
  name: string;
  status: ProductStatus;
  icon: string;
  description: string;
  externalDependency?: string;
  blockingReason?: string;
  capabilities: MessagingCapability[];
}

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  status: "success" | "failed";
  httpStatus?: number;
  product: string;
  payload: object;
  correlationId: string;
  externalRefId?: string;
}

export interface LogEvent {
  id: string;
  timestamp: string;
  product: string;
  eventType: string;
  status: "success" | "failed" | "pending" | "retried" | "queued" | "rate_limited";
  message: string;
  payload: object;
  correlationId: string;
  externalRefId?: string;
  providerRef?: string;
}

export interface HeloApp {
  id: string;
  name: string;
  email: string;
  description: string;
  invitedDevelopers: string[];
  environment: AppEnvironment;
  apiKey: string;
  status: AppHealth;
  products: Product[];
  webhookUrl: string;
  webhookSecret: string;
  webhookEvents: WebhookEvent[];
  logEvents: LogEvent[];
}

interface AppState {
  isAuthenticated: boolean;
  accountStatus: AccountStatus;
  blockingIssues: string[];
  accountName: string;
  timezone: string;
  apps: HeloApp[];
  currentAppId: string | null;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createApp: (name: string, email: string, environment: AppEnvironment, description: string, invitedDevelopers: string[]) => void;
  selectApp: (appId: string) => void;
  currentApp: HeloApp | null;
  rotateApiKey: (appId: string) => void;
  updateProduct: (appId: string, productId: string, updates: Partial<Product>) => void;
  setWebhookUrl: (appId: string, url: string) => void;
  toggleCapability: (appId: string, productId: string, capabilityId: string) => void;
  requestCapabilityAccess: (appId: string, productId: string, capabilityId: string) => void;
  updateAccountName: (name: string) => void;
  updateTimezone: (tz: string) => void;
}

// --- Helpers ---

const generateApiKey = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "helo_live_";
  for (let i = 0; i < 24; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
};

const generateId = () => Math.random().toString(36).substring(2, 15);

// --- Mock Data Generators ---

const smsCapabilities: MessagingCapability[] = [
  { id: "sms_basic_mt", name: "Basic MT", description: "Send standard mobile-terminated SMS messages", status: "enabled", requirements: [], linkedEndpoints: ["sms_send", "sms_status"] },
  { id: "sms_unicode", name: "Unicode & Long SMS", description: "Support for multilingual and concatenated messages", status: "enabled", requirements: ["billing"], linkedEndpoints: ["sms_send"] },
  { id: "sms_dlr", name: "Delivery Receipts", description: "Receive delivery status updates for sent messages", status: "enabled", requirements: [], linkedEndpoints: ["sms_status", "sms_list"] },
  { id: "sms_two_way", name: "Two-Way SMS", description: "Receive inbound messages from end users", status: "disabled", requirements: ["approval", "compliance"], linkedEndpoints: ["sms_inbound"] },
];

const rcsCapabilities: MessagingCapability[] = [
  { id: "rcs_text", name: "Text Messages", description: "Send plain text messages via RCS", status: "enabled", requirements: [], linkedEndpoints: ["rcs_send", "rcs_status"] },
  { id: "rcs_rich_card", name: "Rich Cards", description: "Send visually rich cards with images, titles, and actions", status: "enabled", requirements: ["approval"], linkedEndpoints: ["rcs_rich_card"] },
  { id: "rcs_carousel", name: "Carousels", description: "Send horizontally scrollable card collections", status: "disabled", requirements: ["approval"], linkedEndpoints: ["rcs_carousel"] },
  { id: "rcs_suggested", name: "Suggested Actions", description: "Add quick-reply buttons and suggested actions", status: "disabled", requirements: ["approval"], linkedEndpoints: ["rcs_send"] },
  { id: "rcs_file", name: "File Transfer", description: "Send and receive files and media via RCS", status: "restricted", requirements: ["approval", "billing"], linkedEndpoints: ["rcs_file"] },
];

const whatsappCapabilities: MessagingCapability[] = [
  { id: "wa_template", name: "Template Messages", description: "Send pre-approved template messages outside the 24h window", status: "restricted", requirements: ["approval", "compliance"], linkedEndpoints: ["wa_template"] },
  { id: "wa_session", name: "Session Messages", description: "Send free-form replies within the 24-hour session window", status: "restricted", requirements: ["approval"], linkedEndpoints: ["wa_send", "wa_status"] },
  { id: "wa_media", name: "Media Messages", description: "Send images, documents, and audio files", status: "disabled", requirements: ["approval", "billing"], linkedEndpoints: ["wa_send"] },
  { id: "wa_interactive", name: "Interactive Messages", description: "Send messages with buttons, lists, and product catalogs", status: "disabled", requirements: ["approval", "compliance"], linkedEndpoints: ["wa_interactive"] },
  { id: "wa_catalog", name: "Catalog Messages", description: "Share product catalogs from your Meta Commerce account", status: "disabled", requirements: ["approval", "billing", "compliance"], linkedEndpoints: ["wa_catalog"] },
];

const webhookCapabilities: MessagingCapability[] = [
  { id: "wh_events", name: "Event Subscriptions", description: "Subscribe to real-time delivery and status events", status: "enabled", requirements: [], linkedEndpoints: [] },
  { id: "wh_retry", name: "Retry Management", description: "Automatic retry with exponential backoff for failed deliveries", status: "enabled", requirements: [], linkedEndpoints: [] },
];

const buildProducts = (env: "production" | "staging"): Product[] => {
  if (env === "production") {
    return [
      { id: "sms", name: "SMS Messaging", status: "active", icon: "MessageSquare", description: "Send and receive SMS messages globally", externalDependency: "Carrier Networks", capabilities: smsCapabilities },
      { id: "rcs", name: "RCS Messaging", status: "configured", icon: "Smartphone", description: "Rich Communication Services for enhanced messaging", externalDependency: "Google RCS", capabilities: rcsCapabilities },
      { id: "whatsapp", name: "WhatsApp Messaging", status: "restricted", icon: "MessageCircle", description: "Connect with customers on WhatsApp", externalDependency: "Meta", blockingReason: "Business verification pending", capabilities: whatsappCapabilities },
      { id: "webhooks", name: "Webhooks", status: "active", icon: "Webhook", description: "Receive real-time event notifications", capabilities: webhookCapabilities },
    ];
  }
  return [
    { id: "sms", name: "SMS Messaging", status: "active", icon: "MessageSquare", description: "Send and receive SMS messages globally", externalDependency: "Carrier Networks", capabilities: smsCapabilities.map((c) => ({ ...c, status: "enabled" as CapabilityStatus })) },
    { id: "rcs", name: "RCS Messaging", status: "disabled", icon: "Smartphone", description: "Rich Communication Services for enhanced messaging", externalDependency: "Google RCS", capabilities: rcsCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
    { id: "whatsapp", name: "WhatsApp Messaging", status: "disabled", icon: "MessageCircle", description: "Connect with customers on WhatsApp", externalDependency: "Meta", capabilities: whatsappCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
    { id: "webhooks", name: "Webhooks", status: "disabled", icon: "Webhook", description: "Receive real-time event notifications", capabilities: webhookCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
  ];
};

const generateMockWebhookEvents = (): WebhookEvent[] => {
  const events: WebhookEvent[] = [];
  const types = ["message.sent", "message.delivered", "message.failed", "message.received"];
  const products = ["SMS", "RCS", "WhatsApp"];
  for (let i = 0; i < 15; i++) {
    const isSuccess = Math.random() > 0.2;
    events.push({
      id: generateId(), type: types[Math.floor(Math.random() * types.length)],
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      status: isSuccess ? "success" : "failed", httpStatus: isSuccess ? 200 : [400, 500, 502][Math.floor(Math.random() * 3)],
      product: products[Math.floor(Math.random() * products.length)],
      payload: { messageId: `msg_${generateId()}`, to: "+1234567890", status: isSuccess ? "delivered" : "failed" },
      correlationId: `cor_${generateId()}`, externalRefId: `ext_${generateId()}`,
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateMockLogEvents = (): LogEvent[] => {
  const events: LogEvent[] = [];
  const eventTypes = ["message.sent", "message.delivered", "message.failed", "webhook.triggered", "config.updated"];
  const products = ["SMS", "RCS", "WhatsApp", "Webhooks"];
  const statuses: LogEvent["status"][] = ["success", "success", "success", "failed", "pending", "retried", "queued", "rate_limited"];
  const messages: Record<LogEvent["status"], string> = {
    success: "Operation completed successfully",
    failed: "Delivery failed: recipient unreachable",
    pending: "Awaiting confirmation from provider",
    retried: "Retried after transient failure",
    queued: "Queued pending rate window",
    rate_limited: "Rate limit exceeded; backing off",
  };
  for (let i = 0; i < 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    events.push({
      id: generateId(), timestamp: new Date(Date.now() - Math.random() * 86400000 * 14).toISOString(),
      product: products[Math.floor(Math.random() * products.length)],
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)], status,
      message: messages[status],
      payload: { messageId: `msg_${generateId()}`, recipient: "+1234567890", provider: ["Twilio", "Meta", "Google"][Math.floor(Math.random() * 3)] },
      correlationId: `cor_${generateId()}`, externalRefId: `ext_${generateId()}`, providerRef: `prov_${generateId()}`,
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const initialApps: HeloApp[] = [
  {
    id: "app_prod_001", name: "Production App", email: "admin@acme.com", description: "Main production messaging application", invitedDevelopers: ["dev@acme.com"],
    environment: "production",
    apiKey: generateApiKey(), status: "action_required",
    products: buildProducts("production"),
    webhookUrl: "https://api.example.com/webhooks/helo", webhookSecret: `whsec_${generateId()}${generateId()}`,
    webhookEvents: generateMockWebhookEvents(), logEvents: generateMockLogEvents(),
  },
  {
    id: "app_stg_002", name: "Staging App", email: "admin@acme.com", description: "Staging environment for testing", invitedDevelopers: [],
    environment: "staging",
    apiKey: generateApiKey(), status: "healthy",
    products: buildProducts("staging"),
    webhookUrl: "", webhookSecret: `whsec_${generateId()}${generateId()}`,
    webhookEvents: [], logEvents: generateMockLogEvents().slice(0, 10),
  },
];

// --- Context ---

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    accountStatus: "active",
    blockingIssues: ["WhatsApp Business verification pending approval"],
    accountName: "Acme Corp",
    timezone: "America/New_York",
    apps: initialApps,
    currentAppId: null,
  });

  const currentApp = state.apps.find((a) => a.id === state.currentAppId) || null;

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (email && password) {
      setState((prev) => ({ ...prev, isAuthenticated: true }));
      return true;
    }
    return false;
  };

  const logout = () => setState((prev) => ({ ...prev, isAuthenticated: false, currentAppId: null }));

  const createApp = (name: string, email: string, environment: AppEnvironment, description: string, invitedDevelopers: string[]) => {
    const newApp: HeloApp = {
      id: `app_${generateId()}`, name, email, description, invitedDevelopers, environment,
      apiKey: generateApiKey(), status: "healthy",
      products: [
        { id: "sms", name: "SMS Messaging", status: "disabled", icon: "MessageSquare", description: "Send and receive SMS messages globally", externalDependency: "Carrier Networks", capabilities: smsCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
        { id: "rcs", name: "RCS Messaging", status: "disabled", icon: "Smartphone", description: "Rich Communication Services for enhanced messaging", externalDependency: "Google RCS", capabilities: rcsCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
        { id: "whatsapp", name: "WhatsApp Messaging", status: "disabled", icon: "MessageCircle", description: "Connect with customers on WhatsApp", externalDependency: "Meta", capabilities: whatsappCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
        { id: "webhooks", name: "Webhooks", status: "disabled", icon: "Webhook", description: "Receive real-time event notifications", capabilities: webhookCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
      ],
      webhookUrl: "", webhookSecret: `whsec_${generateId()}${generateId()}`,
      webhookEvents: [], logEvents: [],
    };
    setState((prev) => ({ ...prev, apps: [...prev.apps, newApp] }));
  };

  const selectApp = (appId: string) => setState((prev) => ({ ...prev, currentAppId: appId }));

  const updateAppField = (appId: string, updater: (app: HeloApp) => HeloApp) => {
    setState((prev) => ({ ...prev, apps: prev.apps.map((a) => (a.id === appId ? updater(a) : a)) }));
  };

  const rotateApiKey = (appId: string) => updateAppField(appId, (a) => ({ ...a, apiKey: generateApiKey() }));

  const updateProduct = (appId: string, productId: string, updates: Partial<Product>) => {
    updateAppField(appId, (a) => ({
      ...a,
      products: a.products.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
    }));
  };

  const setWebhookUrl = (appId: string, url: string) => updateAppField(appId, (a) => ({ ...a, webhookUrl: url }));

  const toggleCapability = (appId: string, productId: string, capabilityId: string) => {
    updateAppField(appId, (a) => ({
      ...a,
      products: a.products.map((p) =>
        p.id === productId
          ? {
              ...p,
              capabilities: p.capabilities.map((c) =>
                c.id === capabilityId ? { ...c, status: (c.status === "enabled" ? "disabled" : "enabled") as CapabilityStatus } : c
              ),
            }
          : p
      ),
    }));
  };

  const requestCapabilityAccess = (appId: string, productId: string, capabilityId: string) => {
    // Mock: mark as pending (we use "restricted" to indicate pending request)
    updateAppField(appId, (a) => ({
      ...a,
      products: a.products.map((p) =>
        p.id === productId
          ? { ...p, capabilities: p.capabilities.map((c) => (c.id === capabilityId ? { ...c, status: "restricted" as CapabilityStatus } : c)) }
          : p
      ),
    }));
  };

  const updateAccountName = (name: string) => setState((prev) => ({ ...prev, accountName: name }));
  const updateTimezone = (tz: string) => setState((prev) => ({ ...prev, timezone: tz }));

  return (
    <AppContext.Provider
      value={{
        ...state,
        currentApp,
        login, logout, createApp, selectApp,
        rotateApiKey, updateProduct, setWebhookUrl,
        toggleCapability, requestCapabilityAccess,
        updateAccountName, updateTimezone,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error("useApp must be used within an AppProvider");
  return context;
}
