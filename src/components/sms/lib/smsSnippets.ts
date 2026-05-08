export type SnippetLang = "curl" | "node" | "python" | "php";

interface SnippetParams {
  apiKey: string;
  from: string;
  to: string;
  body: string;
}

const URL = "https://api.helo.ai/v1/messages/sms";

const esc = (s: string) => s.replace(/"/g, '\\"');
const escSingle = (s: string) => s.replace(/'/g, "\\'");

export function buildSnippet(lang: SnippetLang, p: SnippetParams): string {
  switch (lang) {
    case "curl":
      return `curl -X POST '${URL}' \\
  -H 'Authorization: Bearer ${p.apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify({ from: p.from, to: p.to, body: p.body })}'`;
    case "node":
      return `// npm i node-fetch
import fetch from "node-fetch";

const res = await fetch("${URL}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${p.apiKey}",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "${esc(p.from)}",
    to: "${esc(p.to)}",
    body: "${esc(p.body)}",
  }),
});

console.log(await res.json());`;
    case "python":
      return `# pip install requests
import requests

res = requests.post(
    "${URL}",
    headers={
        "Authorization": "Bearer ${p.apiKey}",
        "Content-Type": "application/json",
    },
    json={
        "from": "${esc(p.from)}",
        "to": "${esc(p.to)}",
        "body": "${esc(p.body)}",
    },
)
print(res.json())`;
    case "php":
      return `<?php
$ch = curl_init('${URL}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ${p.apiKey}',
    'Content-Type: application/json',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'from' => '${escSingle(p.from)}',
    'to' => '${escSingle(p.to)}',
    'body' => '${escSingle(p.body)}',
]));

$response = curl_exec($ch);
echo $response;`;
  }
}
