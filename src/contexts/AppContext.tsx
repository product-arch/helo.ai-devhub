import { createContext, useContext, useState, ReactNode } from "react";

export type ProductStatus = "disabled" | "configured" | "restricted" | "active";
export type AccountStatus = "active" | "restricted" | "pending";

export interface Product {
  id: string;
  name: string;
  status: ProductStatus;
  icon: string;
  description: string;
  externalDependency?: string;
  blockingReason?: string;
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
  status: "success" | "failed" | "pending";
  message: string;
  payload: object;
  correlationId: string;
  externalRefId?: string;
  providerRef?: string;
}

interface AppState {
  isAuthenticated: boolean;
  apiKey: string;
  accountStatus: AccountStatus;
  blockingIssues: string[];
  products: Product[];
  webhookUrl: string;
  webhookSecret: string;
  webhookEvents: WebhookEvent[];
  logEvents: LogEvent[];
  accountName: string;
  timezone: string;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  rotateApiKey: () => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  setWebhookUrl: (url: string) => void;
  updateAccountName: (name: string) => void;
  updateTimezone: (tz: string) => void;
}

const generateApiKey = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "helo_live_";
  for (let i = 0; i < 24; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

const generateId = () => Math.random().toString(36).substring(2, 15);

const initialProducts: Product[] = [
  {
    id: "sms",
    name: "SMS Messaging",
    status: "active",
    icon: "MessageSquare",
    description: "Send and receive SMS messages globally",
    externalDependency: "Carrier Networks",
  },
  {
    id: "rcs",
    name: "RCS Messaging",
    status: "configured",
    icon: "Smartphone",
    description: "Rich Communication Services for enhanced messaging",
    externalDependency: "Google RCS",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Messaging",
    status: "restricted",
    icon: "MessageCircle",
    description: "Connect with customers on WhatsApp",
    externalDependency: "Meta",
    blockingReason: "Business verification pending",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    status: "active",
    icon: "Webhook",
    description: "Receive real-time event notifications",
  },
];

const generateMockWebhookEvents = (): WebhookEvent[] => {
  const events: WebhookEvent[] = [];
  const types = ["message.sent", "message.delivered", "message.failed", "message.received"];
  const products = ["SMS", "RCS", "WhatsApp"];
  
  for (let i = 0; i < 15; i++) {
    const isSuccess = Math.random() > 0.2;
    events.push({
      id: generateId(),
      type: types[Math.floor(Math.random() * types.length)],
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      status: isSuccess ? "success" : "failed",
      httpStatus: isSuccess ? 200 : [400, 500, 502][Math.floor(Math.random() * 3)],
      product: products[Math.floor(Math.random() * products.length)],
      payload: {
        messageId: `msg_${generateId()}`,
        to: "+1234567890",
        status: isSuccess ? "delivered" : "failed",
      },
      correlationId: `cor_${generateId()}`,
      externalRefId: `ext_${generateId()}`,
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateMockLogEvents = (): LogEvent[] => {
  const events: LogEvent[] = [];
  const eventTypes = ["message.sent", "message.delivered", "message.failed", "webhook.triggered", "config.updated"];
  const products = ["SMS", "RCS", "WhatsApp", "Webhooks"];
  const statuses: ("success" | "failed" | "pending")[] = ["success", "failed", "pending"];
  
  for (let i = 0; i < 50; i++) {
    const status = statuses[Math.floor(Math.random() * (i < 5 ? 3 : 2))];
    events.push({
      id: generateId(),
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 14).toISOString(),
      product: products[Math.floor(Math.random() * products.length)],
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      status,
      message: status === "failed" ? "Delivery failed: recipient unreachable" : "Operation completed successfully",
      payload: {
        messageId: `msg_${generateId()}`,
        recipient: "+1234567890",
        provider: ["Twilio", "Meta", "Google"][Math.floor(Math.random() * 3)],
      },
      correlationId: `cor_${generateId()}`,
      externalRefId: `ext_${generateId()}`,
      providerRef: `prov_${generateId()}`,
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    apiKey: generateApiKey(),
    accountStatus: "active",
    blockingIssues: ["WhatsApp Business verification pending approval"],
    products: initialProducts,
    webhookUrl: "https://api.example.com/webhooks/helo",
    webhookSecret: `whsec_${generateId()}${generateId()}`,
    webhookEvents: generateMockWebhookEvents(),
    logEvents: generateMockLogEvents(),
    accountName: "Acme Corp",
    timezone: "America/New_York",
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (email && password) {
      setState((prev) => ({ ...prev, isAuthenticated: true }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setState((prev) => ({ ...prev, isAuthenticated: false }));
  };

  const rotateApiKey = () => {
    setState((prev) => ({ ...prev, apiKey: generateApiKey() }));
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId ? { ...p, ...updates } : p
      ),
    }));
  };

  const setWebhookUrl = (url: string) => {
    setState((prev) => ({ ...prev, webhookUrl: url }));
  };

  const updateAccountName = (name: string) => {
    setState((prev) => ({ ...prev, accountName: name }));
  };

  const updateTimezone = (tz: string) => {
    setState((prev) => ({ ...prev, timezone: tz }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        rotateApiKey,
        updateProduct,
        setWebhookUrl,
        updateAccountName,
        updateTimezone,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
