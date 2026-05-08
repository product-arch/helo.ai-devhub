/** Tiny token highlighter — JSON + a handful of languages.
 *  Returns React-friendly nodes via JSX (caller passes className -> color). */
import type { ReactNode } from "react";
import React from "react";

type Tok = { kind: "key" | "str" | "num" | "bool" | "null" | "punct" | "kw" | "comment" | "text"; value: string };

const COLORS: Record<Tok["kind"], string> = {
  key: "text-primary",
  str: "text-[hsl(var(--success))]",
  num: "text-[hsl(var(--warning))]",
  bool: "text-[hsl(var(--warning))]",
  null: "text-[hsl(var(--warning))]",
  punct: "text-muted-foreground",
  kw: "text-primary",
  comment: "text-muted-foreground italic",
  text: "text-foreground/90",
};

/* ---------------- JSON ---------------- */

export function highlightJson(input: string): ReactNode {
  // Match: strings, numbers, booleans, null, punctuation
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([\{\}\[\],])|(\s+)/g;
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  let last = 0;
  let i = 0;
  while ((m = re.exec(input))) {
    if (m.index > last) out.push(input.slice(last, m.index));
    if (m[1]) {
      const isKey = !!m[2];
      out.push(
        <span key={i++} className={isKey ? COLORS.key : COLORS.str}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(<span key={i++} className={COLORS.punct}>{m[2]}</span>);
    } else if (m[3]) {
      out.push(<span key={i++} className={COLORS.num}>{m[3]}</span>);
    } else if (m[4]) {
      out.push(<span key={i++} className={COLORS.bool}>{m[4]}</span>);
    } else if (m[5]) {
      out.push(<span key={i++} className={COLORS.null}>{m[5]}</span>);
    } else if (m[6]) {
      out.push(<span key={i++} className={COLORS.punct}>{m[6]}</span>);
    } else if (m[7]) {
      out.push(m[7]);
    }
    last = re.lastIndex;
  }
  if (last < input.length) out.push(input.slice(last));
  return out;
}

/* ---------------- Generic code ---------------- */

const KEYWORDS = new Set([
  "import","from","const","let","var","function","return","if","else","for","while",
  "new","await","async","class","public","static","void","string","int","using","package",
  "func","def","require","echo","puts","val","null","true","false","print","map","interface",
  "type","switch","case","break","continue","try","catch","finally","throw","throws",
  "namespace","module","Get","Post","object","main","int64","String","Map","Println",
]);

export function highlightCode(input: string): ReactNode {
  // tokenize: comments (// and #), strings, numbers, words, rest
  const re = /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_][A-Za-z0-9_]*)|(\s+)/g;
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  let last = 0;
  let i = 0;
  while ((m = re.exec(input))) {
    if (m.index > last) out.push(input.slice(last, m.index));
    if (m[1]) out.push(<span key={i++} className={COLORS.comment}>{m[1]}</span>);
    else if (m[2]) out.push(<span key={i++} className={COLORS.str}>{m[2]}</span>);
    else if (m[3]) out.push(<span key={i++} className={COLORS.num}>{m[3]}</span>);
    else if (m[4]) {
      if (KEYWORDS.has(m[4])) out.push(<span key={i++} className={COLORS.kw}>{m[4]}</span>);
      else out.push(m[4]);
    } else if (m[5]) out.push(m[5]);
    last = re.lastIndex;
  }
  if (last < input.length) out.push(input.slice(last));
  return out;
}