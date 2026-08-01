import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const PRICE_WORDS = /(?:price|pricing|prices|service|services|menu|ц[іi]н|прайс|послуг|cennik|uslug|usług|preise|leistungen)/i;
const MAX_BYTES = 2_000_000;
const MAX_TEXT = 60_000;

function privateIp(address: string) {
  const value = address.toLowerCase();
  if (value === "::1" || value === "0:0:0:0:0:0:0:1" || value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd")) return true;
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || parts[0] >= 224;
}

export function parsePublicWebsite(raw: string | null | undefined): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    if (url.port && !["80", "443"].includes(url.port)) return null;
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) return null;
    if (isIP(hostname) && privateIp(hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

async function assertPublicDns(url: URL) {
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => privateIp(address))) throw new Error("Сайт веде на приватну або недоступну адресу");
}

async function safeFetch(start: URL): Promise<{ url: URL; html: string }> {
  let url = start;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    await assertPublicDns(url);
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(12_000), headers: { "User-Agent": "EasyServicePriceImporter/1.0" } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const next = location ? parsePublicWebsite(new URL(location, url).toString()) : null;
      if (!next) throw new Error("Сайт повернув небезпечне перенаправлення");
      url = next;
      continue;
    }
    if (!response.ok) throw new Error(`Сайт повернув HTTP ${response.status}`);
    if (!(response.headers.get("content-type") ?? "").toLowerCase().includes("text/html")) throw new Error("Сторінка не є HTML");
    const size = Number(response.headers.get("content-length") ?? 0);
    if (size > MAX_BYTES) throw new Error("Сторінка завелика для імпорту");
    const html = (await response.text()).slice(0, MAX_BYTES);
    return { url, html };
  }
  throw new Error("Забагато перенаправлень");
}

function plainText(html: string) {
  return html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ").trim();
}

export function discoverPriceLinks(html: string, base: URL): URL[] {
  const links: URL[] = [];
  const matcher = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(matcher)) {
    if (!PRICE_WORDS.test(`${match[1]} ${plainText(match[2])}`)) continue;
    const candidate = parsePublicWebsite(new URL(match[1], base).toString());
    if (candidate && candidate.hostname === base.hostname && !links.some((item) => item.href === candidate.href)) links.push(candidate);
  }
  return links.slice(0, 3);
}

export async function collectWebsitePriceText(rawUrl: string) {
  const homepage = parsePublicWebsite(rawUrl);
  if (!homepage) throw new Error("Для закладу не вказано підтримуваний публічний сайт");
  const first = await safeFetch(homepage);
  const pages = [{ url: first.url.toString(), text: plainText(first.html) }];
  for (const link of discoverPriceLinks(first.html, first.url)) {
    try {
      const page = await safeFetch(link);
      pages.push({ url: page.url.toString(), text: plainText(page.html) });
    } catch {
      // One unavailable candidate must not discard usable pages.
    }
  }
  return { sourceUrls: pages.map((page) => page.url), text: pages.map((page) => `SOURCE: ${page.url}\n${page.text}`).join("\n\n").slice(0, MAX_TEXT) };
}
