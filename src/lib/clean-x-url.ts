/**
 * Pure, offline X/Twitter post URL cleaner. No network, no storage.
 */

export const ALLOWED_HOSTS = [
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
] as const;

export const MAX_INPUT_LENGTH = 2048;

export type CleanErrorCode =
  | "empty"
  | "too_long"
  | "invalid_url"
  | "unsupported_host"
  | "not_a_post";

export interface CleanSuccess {
  ok: true;
  url: string;
  username: string;
  id: string;
  /** Query parameters that were removed, as "key=value" (or "key"). */
  removedParams: string[];
  /** Fragment that was removed (without "#"), if any. */
  removedHash: string | null;
  /** Extra path removed after the status id, e.g. "/photo/1". */
  removedPath: string | null;
  /** True when the input host differed from x.com. */
  hostChanged: boolean;
}

export interface CleanFailure {
  ok: false;
  error: CleanErrorCode;
}

export type CleanResult = CleanSuccess | CleanFailure;

export interface CleanOptions {
  /** Remove trailing /photo/N or /video/N segments. Default true. */
  stripMedia?: boolean;
}

const USERNAME_RE = /^[A-Za-z0-9_]{1,15}$/;
const ID_RE = /^\d{1,20}$/;
const MEDIA_RE = /^(photo|video)$/i;
const LOOKS_LIKE_X_URL_RE = /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com(?:[/?#]|$)/i;

/**
 * When the pasted text contains spaces (e.g. a shared message), pick the first
 * whitespace-separated token that starts like an X/Twitter URL. Matching is
 * anchored to the token start so "evilx.com" or "user@x.com" never match.
 */
function extractCandidate(raw: string): string {
  if (!/\s/.test(raw)) return raw;
  const tokens = raw.split(/\s+/).map((t) => t.replace(/^[«"'(<\[]+|[»"')>\],.،]+$/g, ""));
  return tokens.find((t) => LOOKS_LIKE_X_URL_RE.test(t)) ?? raw;
}

export function cleanXUrl(input: string, options: CleanOptions = {}): CleanResult {
  const stripMedia = options.stripMedia ?? true;
  const trimmed = (input ?? "").trim();

  if (!trimmed) return { ok: false, error: "empty" };
  if (trimmed.length > MAX_INPUT_LENGTH) return { ok: false, error: "too_long" };

  let candidate = extractCandidate(trimmed);

  // Add scheme when the user pasted "x.com/..." without it.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, "")}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: "invalid_url" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "invalid_url" };
  }
  if (parsed.username || parsed.password || parsed.port) {
    return { ok: false, error: "invalid_url" };
  }

  const host = parsed.hostname.toLowerCase();
  if (!(ALLOWED_HOSTS as readonly string[]).includes(host)) {
    return { ok: false, error: "unsupported_host" };
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  let username: string | null = null;
  let id: string | null = null;
  let rest: string[] = [];
  const [s0 = "", s1 = "", s2 = "", s3 = ""] = segments;
  const isStatus = (s: string) => /^status(es)?$/i.test(s);

  if (USERNAME_RE.test(s0) && isStatus(s1) && ID_RE.test(s2)) {
    // /{username}/status/{id}/...
    username = s0;
    id = s2;
    rest = segments.slice(3);
  } else if (s0.toLowerCase() === "i" && s1.toLowerCase() === "web" && isStatus(s2) && ID_RE.test(s3)) {
    // /i/web/status/{id}
    username = "i";
    id = s3;
    rest = segments.slice(4);
  }

  if (!username || !id) return { ok: false, error: "not_a_post" };

  let keptPath = "";
  let removedPath: string | null = null;
  const [r0 = "", r1 = ""] = rest;
  const isMedia = rest.length === 2 && MEDIA_RE.test(r0) && /^\d{1,2}$/.test(r1);

  if (rest.length > 0) {
    if (isMedia && !stripMedia) {
      keptPath = `/${r0.toLowerCase()}/${r1}`;
    } else {
      removedPath = `/${rest.join("/")}`;
    }
  }

  const removedParams: string[] = [];
  parsed.searchParams.forEach((value, key) => {
    removedParams.push(value ? `${key}=${value}` : key);
  });

  const removedHash = parsed.hash ? parsed.hash.slice(1) || null : null;

  return {
    ok: true,
    url: `https://x.com/${username}/status/${id}${keptPath}`,
    username,
    id,
    removedParams,
    removedHash,
    removedPath,
    hostChanged: host !== "x.com",
  };
}

export const EXAMPLE_URL =
  "https://x.com/NASA/status/1834567890123456789?a=Xy7Tq_2pLmN9vB&s=48&t=kD3fG8hJ2lQ";
