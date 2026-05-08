import type { ApiResponse, Environment, FormState } from "./types";
import { validate } from "./payload";
import { TEMPLATES } from "./templates";

function rand(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}

function bytes(obj: unknown) {
  return new Blob([JSON.stringify(obj)]).size;
}

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

interface SimulateOpts {
  env: Environment;
  form: FormState;
  apiKey: string;
  rateLimited: boolean;
}

export async function simulateSend(opts: SimulateOpts): Promise<ApiResponse> {
  const start = performance.now();
  const ms = rand(220, 640);

  // Rate limiting takes precedence
  if (opts.rateLimited) {
    const body = {
      error: {
        code: 130429,
        title: "Rate limit hit",
        message: "You've exceeded 100 requests per minute. Slow down and retry.",
        type: "OAuthException",
      },
    };
    return delay(
      {
        status: 429,
        statusText: "Too Many Requests",
        body,
        ms,
        bytes: bytes(body),
        ok: false,
      },
      ms,
    );
  }

  // Auth check
  if (!opts.apiKey || opts.apiKey.length < 12) {
    const body = {
      error: {
        code: 401,
        title: "Unauthorized",
        message:
          "API key missing or invalid — add a Bearer token to the Authorization header.",
        type: "OAuthException",
      },
    };
    return delay(
      {
        status: 401,
        statusText: "Unauthorized",
        body,
        ms,
        bytes: bytes(body),
        ok: false,
      },
      ms,
    );
  }

  // Field validation
  const err = validate(opts.form);
  if (err) {
    const body = {
      error: {
        code: 100,
        title: "Invalid parameter",
        message: err,
        type: "OAuthException",
      },
    };
    return delay(
      {
        status: 400,
        statusText: "Bad Request",
        body,
        ms,
        bytes: bytes(body),
        ok: false,
      },
      ms,
    );
  }

  // Template-specific 422
  if (opts.form.type === "template") {
    const tpl = TEMPLATES.find((t) => t.id === opts.form.templateId);
    if (tpl && tpl.status !== "APPROVED") {
      const body = {
        error: {
          code: 132000,
          title: "Template not approved",
          message: `Template "${tpl.name}" is currently ${tpl.status.toLowerCase()}.`,
          type: "OAuthException",
        },
      };
      return delay(
        {
          status: 422,
          statusText: "Unprocessable Entity",
          body,
          ms,
          bytes: bytes(body),
          ok: false,
        },
        ms,
      );
    }
  }

  // Production has a small chance of upstream blip
  if (opts.env === "production" && Math.random() < 0.04) {
    const body = {
      error: {
        code: 500,
        title: "Upstream error",
        message: "WhatsApp upstream is temporarily unavailable. Retry in a moment.",
        type: "OAuthException",
      },
    };
    return delay(
      { status: 500, statusText: "Internal Server Error", body, ms, bytes: bytes(body), ok: false },
      ms,
    );
  }

  // Success
  const body = {
    messaging_product: "whatsapp",
    contacts: [{ input: opts.form.to, wa_id: opts.form.to.replace(/^\+/, "") }],
    messages: [
      {
        id: `wamid.${Math.random().toString(36).slice(2, 14)}${Math.random().toString(36).slice(2, 8)}==`,
      },
    ],
  };
  void start;
  return delay(
    { status: 202, statusText: "Accepted", body, ms, bytes: bytes(body), ok: true },
    ms,
  );
}

export const STATUS_EXPLAIN: Record<number, string> = {
  200: "OK — request succeeded.",
  201: "Created — resource was created.",
  202: "Accepted — message queued for delivery.",
  204: "No Content — request succeeded with no payload.",
  301: "Moved Permanently.",
  302: "Found — temporary redirect.",
  400: "Bad Request — payload is malformed or missing fields.",
  401: "Unauthorized — your API key is invalid or missing.",
  403: "Forbidden — your key lacks access to this resource.",
  404: "Not Found — the resource does not exist.",
  409: "Conflict — request conflicts with current state.",
  422: "Unprocessable Entity — payload is valid JSON but failed business rules.",
  429: "Too Many Requests — you've hit the rate limit.",
  500: "Internal Server Error — upstream WhatsApp error.",
  502: "Bad Gateway.",
  503: "Service Unavailable.",
};