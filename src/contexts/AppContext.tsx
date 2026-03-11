import { createContext, useContext, useState, ReactNode } from "react";

// --- Types ---

export type ProductStatus = "disabled" | "configured" | "restricted" | "active";
export type AccountStatus = "active" | "restricted" | "pending";
export type CapabilityStatus = "enabled" | "disabled" | "restricted";
export type AppEnvironment = "production" | "staging" | "development";
export type AppHealth = "healthy" | "action_required";
export type AppStatus = "active" | "suspended" | "deleted";
export type OperationalMode = "test" | "live";
export type AppRole = "admin" | "developer" | "viewer";

// --- Credential Types ---
export type CredentialType = "api_key" | "oauth2" | "service_account";
export type CredentialStatus = "active" | "suspended" | "revoked" | "expired";

export interface CredentialScope {
  product: string;
  permissions: string[];
}

export interface AppCredential {
  id: string;
  name: string;
  type: CredentialType;
  status: CredentialStatus;
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  scopes: CredentialScope[];
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  grantTypes?: ("authorization_code" | "client_credentials")[];
  redirectUris?: string[];
  thirdPartyAppName?: string;
  publicKey?: string;
  keyFormat?: string;
}

// --- Webhook Types ---
export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  product: string;
  status: "active" | "suspended";
  retryCount: number;
  retryInterval: number;
  subscribedEvents: string[];
  createdBy: string;
  createdAt: string;
  verified: boolean;
}

// --- Log Types ---
export type LogCategory = "api_activity" | "auth_token" | "webhook_delivery" | "governance_audit";

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
  // Enhanced fields for Phase 4
  category: LogCategory;
  credentialId?: string;
  credentialType?: CredentialType;
  endpoint?: string;
  httpMethod?: string;
  httpStatus?: number;
  ipAddress?: string;
  rateLimitStatus?: "ok" | "warning" | "exceeded";
  webhookId?: string;
  targetUrl?: string;
  retryCount?: number;
  actor?: string;
  action?: string;
  previousValue?: string;
  newValue?: string;
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
  appStatus: AppStatus;
  operationalMode: OperationalMode;
  products: Product[];
  webhookUrl: string;
  webhookSecret: string;
  webhookEvents: WebhookEvent[];
  logEvents: LogEvent[];
  credentials: AppCredential[];
  webhookEndpoints: WebhookEndpoint[];
}

// --- Permission Types ---
export interface PermissionMatrix {
  [action: string]: {
    admin: boolean;
    developer: boolean;
    viewer: boolean;
  };
}

export const PERMISSION_MATRIX: PermissionMatrix = {
  "credentials.create": { admin: true, developer: false, viewer: false },
  "credentials.view": { admin: true, developer: true, viewer: true },
  "credentials.view_secrets": { admin: true, developer: true, viewer: false },
  "credentials.rotate": { admin: true, developer: false, viewer: false },
  "credentials.suspend": { admin: true, developer: false, viewer: false },
  "credentials.revoke": { admin: true, developer: false, viewer: false },
  "credentials.delete": { admin: true, developer: false, viewer: false },
  "app.suspend": { admin: true, developer: false, viewer: false },
  "app.delete": { admin: true, developer: false, viewer: false },
  "app.settings.edit": { admin: true, developer: false, viewer: false },
  "products.subscribe": { admin: true, developer: false, viewer: false },
  "products.configure": { admin: true, developer: true, viewer: false },
  "webhooks.create": { admin: true, developer: true, viewer: false },
  "webhooks.edit": { admin: true, developer: true, viewer: false },
  "webhooks.delete": { admin: true, developer: false, viewer: false },
  "logs.view": { admin: true, developer: true, viewer: true },
  "logs.view_audit": { admin: true, developer: false, viewer: false },
  "users.invite": { admin: true, developer: false, viewer: false },
  "users.remove": { admin: true, developer: false, viewer: false },
  "settings.security": { admin: true, developer: false, viewer: false },
  "settings.compliance": { admin: true, developer: false, viewer: false },
  "settings.general": { admin: true, developer: true, viewer: false },
};

interface AppState {
  isAuthenticated: boolean;
  accountStatus: AccountStatus;
  blockingIssues: string[];
  accountName: string;
  timezone: string;
  apps: HeloApp[];
  currentAppId: string | null;
  currentUserRole: AppRole;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createApp: (name: string, email: string, environment: AppEnvironment, description: string, invitedDevelopers: string[]) => void;
  deleteApp: (appId: string) => void;
  duplicateApp: (appId: string) => void;
  selectApp: (appId: string) => void;
  currentApp: HeloApp | null;
  rotateApiKey: (appId: string) => void;
  updateProduct: (appId: string, productId: string, updates: Partial<Product>) => void;
  setWebhookUrl: (appId: string, url: string) => void;
  toggleCapability: (appId: string, productId: string, capabilityId: string) => void;
  requestCapabilityAccess: (appId: string, productId: string, capabilityId: string) => void;
  updateAccountName: (name: string) => void;
  updateTimezone: (tz: string) => void;
  // Phase 1: Credential CRUD
  createCredential: (appId: string, credential: Omit<AppCredential, "id" | "createdAt">) => AppCredential;
  updateCredential: (appId: string, credentialId: string, updates: Partial<AppCredential>) => void;
  suspendCredential: (appId: string, credentialId: string) => void;
  revokeCredential: (appId: string, credentialId: string) => void;
  rotateCredential: (appId: string, credentialId: string) => void;
  deleteCredential: (appId: string, credentialId: string) => void;
  // Phase 2: App Lifecycle
  suspendApp: (appId: string) => void;
  reactivateApp: (appId: string) => void;
  setOperationalMode: (appId: string, mode: OperationalMode) => void;
  // Phase 3: Webhook Endpoints CRUD
  createWebhookEndpoint: (appId: string, endpoint: Omit<WebhookEndpoint, "id" | "createdAt" | "secret" | "verified">) => void;
  updateWebhookEndpoint: (appId: string, endpointId: string, updates: Partial<WebhookEndpoint>) => void;
  deleteWebhookEndpoint: (appId: string, endpointId: string) => void;
  // Phase 5: Permission check
  hasPermission: (action: string) => boolean;
}

// --- Helpers ---

const generateApiKey = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "helo_live_";
  for (let i = 0; i < 24; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
};

const generateId = () => Math.random().toString(36).substring(2, 15);

const generateClientId = () => `helo_client_${generateId()}`;
const generateClientSecret = () => `helo_secret_${generateId()}${generateId()}`;
const generateWebhookSecret = () => `whsec_${generateId()}${generateId()}`;

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
  const categories: LogCategory[] = ["api_activity", "api_activity", "api_activity", "auth_token", "webhook_delivery", "governance_audit"];
  const apiEndpoints = ["/v1/sms/send", "/v1/rcs/send", "/v1/wa/template/send", "/v1/wa/send"];
  const httpMethods = ["POST", "GET", "PUT", "DELETE"];
  const ips = ["203.0.113.10", "198.51.100.22", "10.0.0.1", "172.16.0.5"];
  const actors = ["admin@acme.com", "dev@acme.com", "system"];
  const products = ["SMS", "RCS", "WhatsApp", "Webhooks"];
  const statuses: LogEvent["status"][] = ["success", "success", "success", "failed", "pending", "retried", "queued", "rate_limited"];

  const apiEventTypes = ["message.sent", "message.delivered", "message.failed"];
  const authEventTypes = ["token.issued", "token.refreshed", "auth.failed", "token.revoked"];
  const webhookEventTypes = ["webhook.delivered", "webhook.failed", "webhook.retried"];
  const auditEventTypes = ["config.updated", "credential.created", "credential.rotated", "role.changed", "product.subscribed"];

  const messages: Record<LogEvent["status"], string> = {
    success: "Operation completed successfully",
    failed: "Delivery failed: recipient unreachable",
    pending: "Awaiting confirmation from provider",
    retried: "Retried after transient failure",
    queued: "Queued pending rate window",
    rate_limited: "Rate limit exceeded; backing off",
  };

  for (let i = 0; i < 80; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const product = products[Math.floor(Math.random() * products.length)];

    let eventType: string;
    const base: Partial<LogEvent> = {};

    switch (category) {
      case "api_activity":
        eventType = apiEventTypes[Math.floor(Math.random() * apiEventTypes.length)];
        base.endpoint = apiEndpoints[Math.floor(Math.random() * apiEndpoints.length)];
        base.httpMethod = httpMethods[Math.floor(Math.random() * 2)]; // mostly POST/GET
        base.httpStatus = status === "success" ? 200 : [400, 401, 429, 500, 502][Math.floor(Math.random() * 5)];
        base.ipAddress = ips[Math.floor(Math.random() * ips.length)];
        base.credentialId = `cred_${generateId().slice(0, 6)}`;
        base.credentialType = ["api_key", "oauth2", "service_account"][Math.floor(Math.random() * 3)] as CredentialType;
        base.rateLimitStatus = status === "rate_limited" ? "exceeded" : Math.random() > 0.8 ? "warning" : "ok";
        break;
      case "auth_token":
        eventType = authEventTypes[Math.floor(Math.random() * authEventTypes.length)];
        base.credentialId = `cred_${generateId().slice(0, 6)}`;
        base.credentialType = "oauth2";
        base.ipAddress = ips[Math.floor(Math.random() * ips.length)];
        break;
      case "webhook_delivery":
        eventType = webhookEventTypes[Math.floor(Math.random() * webhookEventTypes.length)];
        base.webhookId = `wh_${generateId().slice(0, 6)}`;
        base.targetUrl = "https://api.example.com/webhooks/helo";
        base.httpStatus = status === "success" ? 200 : [500, 502, 504][Math.floor(Math.random() * 3)];
        base.retryCount = status === "retried" ? Math.floor(Math.random() * 5) + 1 : 0;
        break;
      case "governance_audit":
        eventType = auditEventTypes[Math.floor(Math.random() * auditEventTypes.length)];
        base.actor = actors[Math.floor(Math.random() * actors.length)];
        base.action = eventType.split(".")[1];
        base.previousValue = "previous_value";
        base.newValue = "new_value";
        break;
    }

    events.push({
      id: generateId(),
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 14).toISOString(),
      product,
      eventType: eventType!,
      status,
      message: messages[status],
      payload: { messageId: `msg_${generateId()}`, recipient: "+1234567890", provider: ["Twilio", "Meta", "Google"][Math.floor(Math.random() * 3)] },
      correlationId: `cor_${generateId()}`,
      externalRefId: `ext_${generateId()}`,
      providerRef: `prov_${generateId()}`,
      category,
      ...base,
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// --- Mock Credentials ---
const generateMockCredentials = (appEmail: string): AppCredential[] => [
  {
    id: `cred_${generateId()}`,
    name: "Primary API Key",
    type: "api_key",
    status: "active",
    createdAt: "2026-01-15T09:00:00Z",
    createdBy: appEmail,
    lastUsedAt: new Date(Date.now() - 7200000).toISOString(),
    expiresAt: null,
    scopes: [
      { product: "sms", permissions: ["sms.send", "sms.status"] },
      { product: "rcs", permissions: ["rcs.send", "rcs.status"] },
    ],
    apiKey: generateApiKey(),
  },
  {
    id: `cred_${generateId()}`,
    name: "OAuth Integration",
    type: "oauth2",
    status: "active",
    createdAt: "2026-02-01T14:30:00Z",
    createdBy: appEmail,
    lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: "2027-02-01T14:30:00Z",
    scopes: [
      { product: "whatsapp", permissions: ["wa.template", "wa.send"] },
    ],
    clientId: generateClientId(),
    clientSecret: generateClientSecret(),
    grantTypes: ["client_credentials"],
    redirectUris: [],
    thirdPartyAppName: "CRM Integration",
  },
];

// --- Mock Webhook Endpoints ---
const generateMockWebhookEndpoints = (appEmail: string): WebhookEndpoint[] => [
  {
    id: `wh_${generateId()}`,
    name: "Primary Webhook",
    url: "https://api.example.com/webhooks/helo",
    secret: generateWebhookSecret(),
    product: "SMS",
    status: "active",
    retryCount: 5,
    retryInterval: 30,
    subscribedEvents: ["message.sent", "message.delivered", "message.failed"],
    createdBy: appEmail,
    createdAt: "2026-01-20T10:00:00Z",
    verified: true,
  },
  {
    id: `wh_${generateId()}`,
    name: "WhatsApp Events",
    url: "https://api.example.com/webhooks/whatsapp",
    secret: generateWebhookSecret(),
    product: "WhatsApp",
    status: "active",
    retryCount: 3,
    retryInterval: 60,
    subscribedEvents: ["messages", "message_template_quality_update"],
    createdBy: appEmail,
    createdAt: "2026-02-05T08:00:00Z",
    verified: false,
  },
];

const initialApps: HeloApp[] = [
  {
    id: "app_prod_001", name: "Production App", email: "admin@acme.com", description: "Main production messaging application", invitedDevelopers: ["dev@acme.com"],
    environment: "production",
    apiKey: generateApiKey(), status: "action_required",
    appStatus: "active",
    operationalMode: "live",
    products: buildProducts("production"),
    webhookUrl: "https://api.example.com/webhooks/helo", webhookSecret: `whsec_${generateId()}${generateId()}`,
    webhookEvents: generateMockWebhookEvents(), logEvents: generateMockLogEvents(),
    credentials: generateMockCredentials("admin@acme.com"),
    webhookEndpoints: generateMockWebhookEndpoints("admin@acme.com"),
  },
  {
    id: "app_stg_002", name: "Staging App", email: "admin@acme.com", description: "Staging environment for testing", invitedDevelopers: [],
    environment: "staging",
    apiKey: generateApiKey(), status: "healthy",
    appStatus: "active",
    operationalMode: "test",
    products: buildProducts("staging"),
    webhookUrl: "", webhookSecret: `whsec_${generateId()}${generateId()}`,
    webhookEvents: [], logEvents: generateMockLogEvents().slice(0, 10),
    credentials: [generateMockCredentials("admin@acme.com")[0]],
    webhookEndpoints: [],
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
    currentUserRole: "admin",
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
    const defaultCredential: AppCredential = {
      id: `cred_${generateId()}`,
      name: "Default API Key",
      type: "api_key",
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: email,
      lastUsedAt: null,
      expiresAt: null,
      scopes: [],
      apiKey: generateApiKey(),
    };
    const newApp: HeloApp = {
      id: `app_${generateId()}`, name, email, description, invitedDevelopers, environment,
      apiKey: defaultCredential.apiKey!, status: "healthy",
      appStatus: "active",
      operationalMode: environment === "production" ? "live" : "test",
      products: [
        { id: "sms", name: "SMS Messaging", status: "disabled", icon: "MessageSquare", description: "Send and receive SMS messages globally", externalDependency: "Carrier Networks", capabilities: smsCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
        { id: "rcs", name: "RCS Messaging", status: "disabled", icon: "Smartphone", description: "Rich Communication Services for enhanced messaging", externalDependency: "Google RCS", capabilities: rcsCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
        { id: "whatsapp", name: "WhatsApp Messaging", status: "disabled", icon: "MessageCircle", description: "Connect with customers on WhatsApp", externalDependency: "Meta", capabilities: whatsappCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
        { id: "webhooks", name: "Webhooks", status: "disabled", icon: "Webhook", description: "Receive real-time event notifications", capabilities: webhookCapabilities.map((c) => ({ ...c, status: "disabled" as CapabilityStatus })) },
      ],
      webhookUrl: "", webhookSecret: `whsec_${generateId()}${generateId()}`,
      webhookEvents: [], logEvents: [],
      credentials: [defaultCredential],
      webhookEndpoints: [],
    };
    setState((prev) => ({ ...prev, apps: [...prev.apps, newApp] }));
  };

  const selectApp = (appId: string) => setState((prev) => ({ ...prev, currentAppId: appId }));

  const deleteApp = (appId: string) => {
    setState((prev) => ({
      ...prev,
      apps: prev.apps.filter((a) => a.id !== appId),
      currentAppId: prev.currentAppId === appId ? null : prev.currentAppId,
    }));
  };

  const duplicateApp = (appId: string) => {
    setState((prev) => {
      const source = prev.apps.find((a) => a.id === appId);
      if (!source) return prev;
      const newApp: HeloApp = {
        ...source,
        id: `app_${generateId()}`,
        name: `${source.name} (Copy)`,
        apiKey: generateApiKey(),
        webhookEvents: [],
        logEvents: [],
        credentials: [{
          id: `cred_${generateId()}`,
          name: "Default API Key",
          type: "api_key",
          status: "active",
          createdAt: new Date().toISOString(),
          createdBy: source.email,
          lastUsedAt: null,
          expiresAt: null,
          scopes: [],
          apiKey: generateApiKey(),
        }],
        webhookEndpoints: [],
      };
      return { ...prev, apps: [...prev.apps, newApp] };
    });
  };

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

  // --- Phase 1: Credential CRUD ---
  const createCredential = (appId: string, credential: Omit<AppCredential, "id" | "createdAt">): AppCredential => {
    const newCred: AppCredential = {
      ...credential,
      id: `cred_${generateId()}`,
      createdAt: new Date().toISOString(),
    };
    updateAppField(appId, (a) => ({ ...a, credentials: [...a.credentials, newCred] }));
    return newCred;
  };

  const updateCredential = (appId: string, credentialId: string, updates: Partial<AppCredential>) => {
    updateAppField(appId, (a) => ({
      ...a,
      credentials: a.credentials.map((c) => (c.id === credentialId ? { ...c, ...updates } : c)),
    }));
  };

  const suspendCredential = (appId: string, credentialId: string) => {
    updateCredential(appId, credentialId, { status: "suspended" });
  };

  const revokeCredential = (appId: string, credentialId: string) => {
    updateCredential(appId, credentialId, { status: "revoked" });
  };

  const rotateCredential = (appId: string, credentialId: string) => {
    updateAppField(appId, (a) => ({
      ...a,
      credentials: a.credentials.map((c) => {
        if (c.id !== credentialId) return c;
        if (c.type === "api_key") return { ...c, apiKey: generateApiKey() };
        if (c.type === "oauth2") return { ...c, clientSecret: generateClientSecret() };
        return c;
      }),
    }));
  };

  const deleteCredential = (appId: string, credentialId: string) => {
    updateAppField(appId, (a) => ({
      ...a,
      credentials: a.credentials.filter((c) => c.id !== credentialId),
    }));
  };

  // --- Phase 2: App Lifecycle ---
  const suspendApp = (appId: string) => {
    updateAppField(appId, (a) => ({ ...a, appStatus: "suspended" as AppStatus }));
  };

  const reactivateApp = (appId: string) => {
    updateAppField(appId, (a) => ({ ...a, appStatus: "active" as AppStatus }));
  };

  const setOperationalMode = (appId: string, mode: OperationalMode) => {
    updateAppField(appId, (a) => ({ ...a, operationalMode: mode }));
  };

  // --- Phase 3: Webhook Endpoints CRUD ---
  const createWebhookEndpoint = (appId: string, endpoint: Omit<WebhookEndpoint, "id" | "createdAt" | "secret" | "verified">) => {
    const newEndpoint: WebhookEndpoint = {
      ...endpoint,
      id: `wh_${generateId()}`,
      createdAt: new Date().toISOString(),
      secret: generateWebhookSecret(),
      verified: false,
    };
    updateAppField(appId, (a) => ({ ...a, webhookEndpoints: [...a.webhookEndpoints, newEndpoint] }));
  };

  const updateWebhookEndpoint = (appId: string, endpointId: string, updates: Partial<WebhookEndpoint>) => {
    updateAppField(appId, (a) => ({
      ...a,
      webhookEndpoints: a.webhookEndpoints.map((w) => (w.id === endpointId ? { ...w, ...updates } : w)),
    }));
  };

  const deleteWebhookEndpoint = (appId: string, endpointId: string) => {
    updateAppField(appId, (a) => ({
      ...a,
      webhookEndpoints: a.webhookEndpoints.filter((w) => w.id !== endpointId),
    }));
  };

  // --- Phase 5: Permission check ---
  const hasPermission = (action: string): boolean => {
    const perm = PERMISSION_MATRIX[action];
    if (!perm) return true;
    return perm[state.currentUserRole] ?? false;
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        currentApp,
        login, logout, createApp, deleteApp, duplicateApp, selectApp,
        rotateApiKey, updateProduct, setWebhookUrl,
        toggleCapability, requestCapabilityAccess,
        updateAccountName, updateTimezone,
        createCredential, updateCredential, suspendCredential,
        revokeCredential, rotateCredential, deleteCredential,
        suspendApp, reactivateApp, setOperationalMode,
        createWebhookEndpoint, updateWebhookEndpoint, deleteWebhookEndpoint,
        hasPermission,
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
