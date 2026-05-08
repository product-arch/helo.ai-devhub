export type SmsStatus = "queued" | "sent" | "delivered" | "failed";

export interface SmsSendResponse {
  messageId: string;
  status: SmsStatus;
  to: string;
  from: string;
  body: string;
  createdAt: string;
}

export interface SmsStatusResponse {
  messageId: string;
  status: SmsStatus;
  errorCode?: string;
  errorMessage?: string;
  timestamp: string;
}

export interface SandboxSender {
  senderId: string;
  type: "sandbox";
  status: "ready";
  country: string;
}

export type SenderIdType = "alphanumeric" | "shortcode" | "longcode" | "tollfree";
export type SenderIdStatus = "pending" | "approved" | "rejected" | "active";

export interface SenderId {
  id: string;
  value: string;
  type: SenderIdType;
  country: string;
  status: SenderIdStatus;
  createdAt: string;
}

export type DltTemplateType =
  | "transactional"
  | "promotional"
  | "service_implicit"
  | "service_explicit";

export type DltApprovalStatus = "pending" | "approved" | "rejected";

export interface DltHeader {
  id: string;
  name: string;
  status: DltApprovalStatus;
}

export interface DltTemplate {
  id: string;
  templateId: string;
  content: string;
  type: DltTemplateType;
  headerId: string | null;
  status: DltApprovalStatus;
}

export interface DltConfig {
  peId: string;
  telemarketerId: string;
  headers: DltHeader[];
  templates: DltTemplate[];
}

export interface DlrConfig {
  enabled: boolean;
  webhookUrl: string;
}

export type SmsEncoding = "gsm7" | "ucs2";
export type LongMessageHandling = "concatenate" | "truncate";

export interface SmsSettings {
  encoding: SmsEncoding;
  autoUnicode: boolean;
  longMessage: LongMessageHandling;
  maxRetries: 0 | 1 | 2 | 3;
}

export interface WizardState {
  credentials: boolean;
  sender: boolean;
  send: boolean;
}
