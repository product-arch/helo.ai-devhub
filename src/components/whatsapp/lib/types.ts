export type Environment = "sandbox" | "production";

export type MessageType =
  | "text"
  | "template"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "interactive_buttons"
  | "interactive_list"
  | "location"
  | "reaction";

export interface SavedNumber {
  label: string;
  number: string;
}

export interface InteractiveButton {
  id: string;
  type: "reply" | "url" | "phone";
  label: string;
  value?: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  id: string;
  title: string;
  rows: ListRow[];
}

export interface FormState {
  to: string;
  type: MessageType;
  // text
  body: string;
  // template
  templateId: string;
  templateVars: Record<string, string>;
  // media
  mediaSource: "url" | "upload";
  mediaUrl: string;
  mediaCaption: string;
  documentFilename: string;
  // interactive
  interactiveHeader: string;
  interactiveBody: string;
  interactiveFooter: string;
  buttons: InteractiveButton[];
  listSections: ListSection[];
  listButtonText: string;
  // location
  locationLat: string;
  locationLng: string;
  locationName: string;
  locationAddress: string;
  // reaction
  reactionMessageId: string;
  reactionEmoji: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  body: unknown;
  ms: number;
  bytes: number;
  ok: boolean;
}

export interface HistoryEntry {
  id: string;
  ts: number;
  to: string;
  type: MessageType;
  status: number;
  ms: number;
  request: unknown;
  response: ApiResponse;
  env: Environment;
}

export interface StepperState {
  keyCopied: boolean;
  headerCopied: boolean;
  baseUrlCopied: boolean;
  requestSent: boolean;
}