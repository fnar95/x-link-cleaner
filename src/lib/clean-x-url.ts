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
const URL_IN_TEXT_RE =
  /(?:https?:\/\/)?(?:www\.|mobile\.)?(?:x|twitter)\.com\/[^\s<>"'«»]+/i;

function extractCandidate(raw: string): string {
  const match = raw.match(URL_IN_TEXT_RE);
  return match ? match[0] : raw;
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

  // /{username}/status/{id}/...
  if (
    segments.length >= 3 &&
    USERNAME_RE.test(segments[0]) &&
    /^status(es)?$/i.test(segments[1]) &&
    ID_RE.test(segments[2])
  ) {
    username = segments[0];
    id = segments[2];
    rest = segments.slice(3);
  } else if (
    // /i/web/status/{id}
    segments.length >= 4 &&
    segments[0].toLowerCase() === "i" &&
    segments[1].toLowerCase() === "web" &&
    /^status(es)?$/i.test(segments[2]) &&
    ID_RE.test(segments[3])
  ) {
    username = "i";
    id = segments[3];
    rest = segments.slice(4);
  }

  if (!username || !id) return { ok: false, error: "not_a_post" };

  let keptPath = "";
  let removedPath: string | null = null;
  const isMedia = rest.length === 2 && MEDIA_RE.test(rest[0]) && /^\d{1,2}$/.test(rest[1]);

  if (rest.length > 0) {
    if (isMedia && !stripMedia) {
      keptPath = `/${rest[0].toLowerCase()}/${rest[1]}`;
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
