const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

export function looksLikeHtml(value: string): boolean {
  return HTML_TAG_PATTERN.test(value);
}

export function sanitizeBasicHtml(value: string): string {
  let sanitized = value;

  sanitized = sanitized.replace(/<\/?(script|style|iframe|object|embed|link|meta)[^>]*>/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  sanitized = sanitized.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, ' $1="#"');

  return sanitized;
}
