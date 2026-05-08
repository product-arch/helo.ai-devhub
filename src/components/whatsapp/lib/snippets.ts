import type { Environment, FormState } from "./types";
import { buildPayload } from "./payload";

export type Lang =
  | "curl"
  | "js-fetch"
  | "js-axios"
  | "node"
  | "py-requests"
  | "py-httpx"
  | "php"
  | "ruby"
  | "go"
  | "java"
  | "csharp"
  | "sdk";

export const LANG_LABELS: Record<Lang, string> = {
  curl: "cURL",
  "js-fetch": "JS · fetch",
  "js-axios": "JS · axios",
  node: "Node.js",
  "py-requests": "Python · requests",
  "py-httpx": "Python · httpx",
  php: "PHP",
  ruby: "Ruby",
  go: "Go",
  java: "Java",
  csharp: ".NET (C#)",
  sdk: "helo SDK",
};

export function baseUrlFor(env: Environment) {
  return env === "sandbox"
    ? "https://sandbox.api.helo.ai/v1"
    : "https://api.helo.ai/v1";
}

function indent(s: string, n = 2) {
  const pad = " ".repeat(n);
  return s.split("\n").map((l) => pad + l).join("\n");
}

interface Ctx {
  env: Environment;
  form: FormState;
  apiKey: string; // already either YOUR_API_KEY or real
}

export function renderSnippet(lang: Lang, ctx: Ctx): string {
  const url = `${baseUrlFor(ctx.env)}/messages`;
  const payload = buildPayload(ctx.form);
  const json = JSON.stringify(payload, null, 2);
  const auth = `Bearer ${ctx.apiKey}`;

  switch (lang) {
    case "curl":
      return `curl -X POST '${url}' \\
  -H 'Authorization: ${auth}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(payload)}'`;

    case "js-fetch":
      return `const res = await fetch("${url}", {
  method: "POST",
  headers: {
    "Authorization": "${auth}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${json}),
});
const data = await res.json();
console.log(res.status, data);`;

    case "js-axios":
      return `import axios from "axios";

const { data, status } = await axios.post(
  "${url}",
  ${json},
  { headers: { Authorization: "${auth}" } }
);
console.log(status, data);`;

    case "node":
      return `import { request } from "node:https";

const body = JSON.stringify(${json});
const req = request("${url}", {
  method: "POST",
  headers: {
    "Authorization": "${auth}",
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  },
}, (res) => {
  let chunks = "";
  res.on("data", (c) => (chunks += c));
  res.on("end", () => console.log(res.statusCode, chunks));
});
req.write(body);
req.end();`;

    case "py-requests":
      return `import requests

resp = requests.post(
    "${url}",
    headers={
        "Authorization": "${auth}",
        "Content-Type": "application/json",
    },
    json=${pyDict(payload)},
    timeout=10,
)
print(resp.status_code, resp.json())`;

    case "py-httpx":
      return `import httpx

with httpx.Client(timeout=10) as client:
    resp = client.post(
        "${url}",
        headers={"Authorization": "${auth}"},
        json=${pyDict(payload)},
    )
print(resp.status_code, resp.json())`;

    case "php":
      return `<?php
$ch = curl_init("${url}");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: ${auth}",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode(${phpArray(payload)}),
]);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo $status . PHP_EOL . $response;`;

    case "ruby":
      return `require "net/http"
require "json"
require "uri"

uri = URI("${url}")
req = Net::HTTP::Post.new(uri)
req["Authorization"] = "${auth}"
req["Content-Type"] = "application/json"
req.body = ${rubyHash(payload)}.to_json

res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |h| h.request(req) }
puts res.code
puts res.body`;

    case "go":
      return `package main

import (
\t"bytes"
\t"fmt"
\t"io"
\t"net/http"
)

func main() {
\tbody := []byte(\`${JSON.stringify(payload)}\`)
\treq, _ := http.NewRequest("POST", "${url}", bytes.NewReader(body))
\treq.Header.Set("Authorization", "${auth}")
\treq.Header.Set("Content-Type", "application/json")
\tres, err := http.DefaultClient.Do(req)
\tif err != nil { panic(err) }
\tdefer res.Body.Close()
\tb, _ := io.ReadAll(res.Body)
\tfmt.Println(res.StatusCode, string(b))
}`;

    case "java":
      return `import java.net.URI;
import java.net.http.*;

HttpRequest req = HttpRequest.newBuilder(URI.create("${url}"))
    .header("Authorization", "${auth}")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(${javaString(JSON.stringify(payload))}))
    .build();

HttpResponse<String> res = HttpClient.newHttpClient()
    .send(req, HttpResponse.BodyHandlers.ofString());

System.out.println(res.statusCode());
System.out.println(res.body());`;

    case "csharp":
      return `using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;

using var http = new HttpClient();
http.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", "${ctx.apiKey}");

var body = new StringContent(${csharpString(JSON.stringify(payload))},
    Encoding.UTF8, "application/json");

var res = await http.PostAsync("${url}", body);
Console.WriteLine((int)res.StatusCode);
Console.WriteLine(await res.Content.ReadAsStringAsync());`;

    case "sdk":
      return `import { Helo } from "@helo.ai/sdk";

const helo = new Helo({
  apiKey: "${ctx.apiKey}",
  environment: "${ctx.env}",
});

const result = await helo.whatsapp.messages.send(${json});
console.log(result.id, result.status);`;
  }
}

/* helpers to render dict literals per-language */

function pyDict(v: unknown, depth = 0): string {
  return toLiteral(v, depth, {
    open: "{",
    close: "}",
    arrOpen: "[",
    arrClose: "]",
    keyQuote: '"',
    bool: (b) => (b ? "True" : "False"),
    nullVal: "None",
    sep: ": ",
  });
}

function phpArray(v: unknown, depth = 0): string {
  return toLiteral(v, depth, {
    open: "[",
    close: "]",
    arrOpen: "[",
    arrClose: "]",
    keyQuote: '"',
    bool: (b) => (b ? "true" : "false"),
    nullVal: "null",
    sep: " => ",
  });
}

function rubyHash(v: unknown, depth = 0): string {
  return toLiteral(v, depth, {
    open: "{",
    close: "}",
    arrOpen: "[",
    arrClose: "]",
    keyQuote: '"',
    bool: (b) => (b ? "true" : "false"),
    nullVal: "nil",
    sep: " => ",
  });
}

interface Fmt {
  open: string;
  close: string;
  arrOpen: string;
  arrClose: string;
  keyQuote: string;
  bool: (b: boolean) => string;
  nullVal: string;
  sep: string;
}

function toLiteral(v: unknown, depth: number, f: Fmt): string {
  const pad = " ".repeat(depth * 4);
  const padIn = " ".repeat((depth + 1) * 4);
  if (v === null || v === undefined) return f.nullVal;
  if (typeof v === "boolean") return f.bool(v);
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return `${f.arrOpen}${f.arrClose}`;
    const items = v.map((x) => `${padIn}${toLiteral(x, depth + 1, f)}`).join(",\n");
    return `${f.arrOpen}\n${items}\n${pad}${f.arrClose}`;
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return `${f.open}${f.close}`;
    const items = entries
      .map(
        ([k, val]) =>
          `${padIn}${f.keyQuote}${k}${f.keyQuote}${f.sep}${toLiteral(val, depth + 1, f)}`,
      )
      .join(",\n");
    return `${f.open}\n${items}\n${pad}${f.close}`;
  }
  return String(v);
}

function javaString(s: string) {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
function csharpString(s: string) {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}