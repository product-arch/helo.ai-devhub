

# Real Webhook Functionality

## What Changes

Replace the mocked `setTimeout`/`Math.random()` logic in two places with real HTTP calls to the configured webhook endpoint URL.

### 1. Endpoint Verification (`CreateWebhookModal.tsx` — Test button)

The "Test" button will send a real GET request mimicking Meta's webhook verification handshake:

```
GET {url}?hub.mode=subscribe&hub.verify_token={verificationToken}&hub.challenge={randomChallenge}
```

- If the response status is 200 and body matches the challenge string → **Verified**
- Otherwise → **Failed**
- Uses the verification token field value (falls back to empty string if not set)

### 2. Test Payload Delivery (`Webhooks.tsx` — Send Payload button)

The "Send Payload" button will POST the JSON payload to the selected endpoint's URL:

```
POST {endpoint.url}
Content-Type: application/json
Body: { object: "whatsapp_business_account", entry: [...] }
```

- If response status is 200 → success toast
- Otherwise → error toast with status code

### 3. CORS Consideration

Browser-to-Worker requests require CORS headers. The user's Cloudflare Worker needs these headers added to responses:

```javascript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
```

Plus an OPTIONS preflight handler. I'll note this in the implementation if requests fail, but the code will use real `fetch()` calls with error handling for network/CORS failures.

### Files Changed
- `src/components/CreateWebhookModal.tsx` — real GET verification in `handleTest`
- `src/pages/Webhooks.tsx` — real POST delivery in `handleSendPayload`

