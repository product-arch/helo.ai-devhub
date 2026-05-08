import type {
  DltConfig,
  DlrConfig,
  SandboxSender,
  SenderId,
  SmsSettings,
  WizardState,
} from "./smsTypes";

const k = {
  wizard: (a: string) => `helo:sms:wizard:${a}`,
  sandbox: (a: string) => `helo:sms:sandbox:${a}`,
  senders: (a: string) => `helo:sms:senders:${a}`,
  dlt: (a: string) => `helo:sms:dlt:${a}`,
  dlr: (a: string) => `helo:sms:dlr:${a}`,
  settings: (a: string) => `helo:sms:settings:${a}`,
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const smsStorage = {
  getWizard: (appId: string): WizardState =>
    read(k.wizard(appId), { credentials: false, sender: false, send: false }),
  setWizard: (appId: string, state: WizardState) => write(k.wizard(appId), state),

  getSandbox: (appId: string): SandboxSender | null =>
    read<SandboxSender | null>(k.sandbox(appId), null),
  setSandbox: (appId: string, s: SandboxSender) => write(k.sandbox(appId), s),

  getSenders: (appId: string): SenderId[] => read(k.senders(appId), []),
  setSenders: (appId: string, list: SenderId[]) => write(k.senders(appId), list),

  getDlt: (appId: string): DltConfig =>
    read(k.dlt(appId), {
      peId: "",
      telemarketerId: "",
      headers: [],
      templates: [],
    } as DltConfig),
  setDlt: (appId: string, cfg: DltConfig) => write(k.dlt(appId), cfg),

  getDlr: (appId: string): DlrConfig =>
    read(k.dlr(appId), { enabled: true, webhookUrl: "" } as DlrConfig),
  setDlr: (appId: string, cfg: DlrConfig) => write(k.dlr(appId), cfg),

  getSettings: (appId: string): SmsSettings =>
    read(k.settings(appId), {
      encoding: "gsm7",
      autoUnicode: true,
      longMessage: "concatenate",
      maxRetries: 3,
    } as SmsSettings),
  setSettings: (appId: string, s: SmsSettings) => write(k.settings(appId), s),
};
