import type {
  Environment,
  HistoryEntry,
  SavedNumber,
  StepperState,
} from "./types";

const KEYS = {
  env: "helo:wa:env",
  stepper: "helo:wa:stepper",
  saved: "helo:wa:savedNumbers",
  history: "helo:wa:history",
  apiKey: "helo:wa:apiKey",
  insertKey: "helo:wa:insertKey",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

export const storage = {
  getEnv: (): Environment => read<Environment>(KEYS.env, "sandbox"),
  setEnv: (e: Environment) => write(KEYS.env, e),

  getStepper: (): StepperState =>
    read<StepperState>(KEYS.stepper, {
      keyCopied: false,
      headerCopied: false,
      baseUrlCopied: false,
      requestSent: false,
    }),
  setStepper: (s: StepperState) => write(KEYS.stepper, s),

  getSaved: (): SavedNumber[] => read<SavedNumber[]>(KEYS.saved, []),
  setSaved: (s: SavedNumber[]) => write(KEYS.saved, s),

  getHistory: (): HistoryEntry[] => read<HistoryEntry[]>(KEYS.history, []),
  setHistory: (h: HistoryEntry[]) => write(KEYS.history, h.slice(0, 10)),

  getInsertKey: (): boolean => read<boolean>(KEYS.insertKey, false),
  setInsertKey: (v: boolean) => write(KEYS.insertKey, v),
};