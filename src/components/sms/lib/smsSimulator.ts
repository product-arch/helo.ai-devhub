import type { SmsSendResponse, SmsStatus, SmsStatusResponse } from "./smsTypes";

interface SimMessage {
  messageId: string;
  to: string;
  from: string;
  body: string;
  createdAt: number;
  willFail: boolean;
  failError?: { code: string; message: string };
}

const messages = new Map<string, SimMessage>();

const ERRORS = [
  { code: "21610", message: "Recipient has unsubscribed (STOP) from this sender." },
  { code: "30003", message: "Unreachable destination handset." },
  { code: "30005", message: "Unknown destination handset." },
];

function rid() {
  return (
    "sm_" +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

function validatePhone(to: string): ApiError | null {
  if (!/^\+[1-9]\d{6,14}$/.test(to)) {
    return {
      status: 400,
      code: "21211",
      message: `The 'to' number ${to} is not a valid phone number.`,
    };
  }
  return null;
}

export const smsSimulator = {
  async sendSms(params: {
    to: string;
    from: string;
    body: string;
    apiKey: string;
  }): Promise<SmsSendResponse> {
    await wait(250 + Math.random() * 400);

    if (!params.apiKey || params.apiKey.length < 8) {
      throw {
        status: 401,
        code: "20003",
        message: "Authentication failed: invalid API key.",
      } as ApiError;
    }
    const phoneErr = validatePhone(params.to);
    if (phoneErr) throw phoneErr;
    if (!params.body || params.body.length === 0) {
      throw {
        status: 400,
        code: "21602",
        message: "Message body is required.",
      } as ApiError;
    }
    if (params.body.length > 1600) {
      throw {
        status: 400,
        code: "21617",
        message: "Message body exceeds 1600 character limit.",
      } as ApiError;
    }

    const messageId = rid();
    const willFail = Math.random() < 0.08;
    messages.set(messageId, {
      messageId,
      to: params.to,
      from: params.from,
      body: params.body,
      createdAt: Date.now(),
      willFail,
      failError: willFail
        ? ERRORS[Math.floor(Math.random() * ERRORS.length)]
        : undefined,
    });

    return {
      messageId,
      status: "queued",
      to: params.to,
      from: params.from,
      body: params.body,
      createdAt: new Date().toISOString(),
    };
  },

  async getStatus(messageId: string): Promise<SmsStatusResponse> {
    await wait(80 + Math.random() * 120);
    const m = messages.get(messageId);
    if (!m) {
      throw {
        status: 404,
        code: "20404",
        message: `Message ${messageId} not found.`,
      } as ApiError;
    }
    const elapsed = Date.now() - m.createdAt;
    let status: SmsStatus = "queued";
    if (elapsed > 1500) status = "sent";
    if (elapsed > 4500) status = m.willFail ? "failed" : "delivered";

    return {
      messageId,
      status,
      errorCode: status === "failed" ? m.failError?.code : undefined,
      errorMessage: status === "failed" ? m.failError?.message : undefined,
      timestamp: new Date().toISOString(),
    };
  },

  buildSampleDlrPayload(messageId = "sm_example1234") {
    return {
      messageId,
      to: "+14155550100",
      from: "+14155550123",
      status: "delivered",
      errorCode: null,
      errorMessage: null,
      timestamp: new Date().toISOString(),
      provider: "helo.ai",
    };
  },

  async testWebhook(url: string): Promise<{ ok: boolean; status: number; latencyMs: number; body: string }> {
    await wait(300 + Math.random() * 500);
    if (!/^https?:\/\/.+/.test(url)) {
      return {
        ok: false,
        status: 0,
        latencyMs: 0,
        body: "Invalid URL — must start with http(s)://",
      };
    }
    return {
      ok: true,
      status: 200,
      latencyMs: Math.floor(120 + Math.random() * 180),
      body: JSON.stringify({ received: true }, null, 2),
    };
  },
};

export const ERROR_TIPS: Record<string, string[]> = {
  "21211": [
    "Verify the number is in E.164 format (e.g. +14155550100).",
    "Strip spaces, dashes, and parentheses before submitting.",
  ],
  "21610": [
    "The recipient has opted out via STOP. They must opt back in (START).",
    "Use a different test number that has not opted out.",
  ],
  "30003": [
    "Recipient handset is unreachable (off, out of coverage).",
    "Retry later or test against another number.",
  ],
  "30005": [
    "The destination number does not exist or is invalid.",
    "Check for typos in the country code.",
  ],
  "20003": [
    "API key is invalid or revoked.",
    "Copy the key from Step 1 above and try again.",
  ],
  "21602": ["Message body cannot be empty."],
  "21617": ["Message body exceeds 1600 characters — split into multiple sends."],
};
