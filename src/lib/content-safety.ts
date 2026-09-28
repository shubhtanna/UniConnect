const blockedTerms = [
  "asshole",
  "bastard",
  "bitch",
  "cunt",
  "fuck",
  "motherfucker",
  "shit",
  "behenchod",
  "bhenchod",
  "chutiya",
  "gandu",
  "harami",
  "madarchod",
  "randi",
];

const shortenerHosts = new Set([
  "bit.ly",
  "cutt.ly",
  "goo.gl",
  "is.gd",
  "ow.ly",
  "rebrand.ly",
  "shorturl.at",
  "tiny.cc",
  "tinyurl.com",
  "t.co",
]);

export function contentSafetyIssue(
  value: string,
  options: { allowLinks?: boolean } = {},
) {
  const normalized = normalizeForModeration(value);
  const compact = normalized.replace(/[^a-z0-9]+/g, "");
  const words: string[] = normalized.match(/[a-z0-9]+/g) ?? [];
  const blocked = blockedTerms.find(
    (term) =>
      words.includes(term) || (term.length >= 6 && compact.includes(term)),
  );
  if (blocked) return "Please remove abusive or inappropriate language.";
  if (/<\s*\/?\s*(script|iframe|object|embed|form|svg)\b/i.test(value)) {
    return "HTML or executable content is not allowed.";
  }
  if (/(?:javascript|data|vbscript|file)\s*:/i.test(value)) {
    return "Executable or local-file links are not allowed.";
  }

  const links = extractLinks(value);
  if (!options.allowLinks && links.length)
    return "Links are not allowed in this field.";
  if (links.length > 3) return "Use no more than three links.";
  for (const link of links) {
    if (!isSafePublicHttpsUrl(link))
      return "Use a direct public HTTPS link; shortened, local, credentialed, or IP-address links are not allowed.";
  }
  return null;
}

export function isSafePublicHttpsUrl(value: string) {
  try {
    const url = new URL(value.startsWith("www.") ? `https://${value}` : value);
    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (!host.includes(".") || host === "localhost" || shortenerHosts.has(host))
      return false;
    if (
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) ||
      host.startsWith("[") ||
      host.endsWith(".local")
    )
      return false;
    return true;
  } catch {
    return false;
  }
}

function extractLinks(value: string) {
  return value.match(/\b(?:https?:\/\/|www\.)[^\s<>{}"']+/gi) ?? [];
}

function normalizeForModeration(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t");
}
