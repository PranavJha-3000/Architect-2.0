/**
 * VIBING LINK CLASSIFICATION
 *
 * Pure, local, no network. A pasted URL is inspected with the URL parser and
 * mapped to one of the four sources Vibing can hand off. Nothing here fetches,
 * embeds, scrapes or authenticates — it only decides *what* to open.
 *
 * Ambiguity is never guessed. A URL that is not confidently one of the known
 * shapes returns `null`, which keeps the chooser open and lets the user name
 * the source themselves.
 */

export type VibingSource = 'reels' | 'tiktok' | 'youtube' | 'music'
/** `playlist` only ever comes from a YouTube `/playlist` URL. */
export type LinkKind = 'video' | 'playlist'

export interface ClassifiedLink {
  source: VibingSource
  kind: LinkKind
  /** Normalised absolute URL, safe to hand to `window.open`. */
  url: string
}

/** Lowercased host with a leading `www.` removed. */
function hostOf(u: URL): string {
  return u.hostname.toLowerCase().replace(/^www\./, '')
}

/**
 * Parse user input. Tolerates a missing scheme (`youtu.be/abc`) because people
 * paste bare hosts constantly, and rejects anything that is not http(s) so we
 * never hand `javascript:` to `window.open`.
 */
function parse(input: string): URL | null {
  const raw = input.trim()
  if (!raw || /\s/.test(raw)) return null
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const u = new URL(candidate)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u
  } catch {
    return null
  }
}

/** Instagram short-form: /reel/…, /reels/…, /p/… */
function instagram(u: URL, host: string): ClassifiedLink | null {
  if (host !== 'instagram.com' && host !== 'instagr.am') return null
  if (/^\/(reel|reels|p)\//i.test(u.pathname)) {
    return { source: 'reels', kind: 'video', url: u.toString() }
  }
  return null
}

/** TikTok: any single video path. A bare profile is ambiguous. */
function tiktok(u: URL, host: string): ClassifiedLink | null {
  if (host !== 'tiktok.com' && host !== 'vm.tiktok.com') return null
  if (/^\/(@[^/]+\/video\/[^/]+|t\/[^/]+|v\/[^/]+)/i.test(u.pathname)) {
    return { source: 'tiktok', kind: 'video', url: u.toString() }
  }
  return null
}

/** YouTube: watch, shorts, live, youtu.be, and playlists. */
function youtube(u: URL, host: string): ClassifiedLink | null {
  // music.youtube.com is still a YouTube URL; Music mode is chosen in the UI,
  // never inferred from the host.
  const isShortLink = host === 'youtu.be'
  const isHost =
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com' ||
    isShortLink
  if (!isHost) return null

  // A playlist link is a playlist regardless of the watch param alongside it.
  if (!isShortLink && /^\/playlist/i.test(u.pathname)) {
    return { source: 'youtube', kind: 'playlist', url: u.toString() }
  }
  if (isShortLink && /^\/[^/]+/.test(u.pathname)) {
    // youtu.be/<id> with a list param is a playlist view of that video.
    return {
      source: 'youtube',
      kind: u.searchParams.get('list') ? 'playlist' : 'video',
      url: u.toString(),
    }
  }
  if (/^\/(watch|shorts|live|embed)\b/i.test(u.pathname)) {
    return {
      source: 'youtube',
      kind: u.searchParams.get('list') ? 'playlist' : 'video',
      url: u.toString(),
    }
  }
  return null
}

/** Default feeds opened when the user picks a source without pasting a link.
 * These are feed roots (not a specific video), so watching continues until
 * work is done. Must stay http(s) so they are safe to hand to `window.open`. */
export const FEED_URLS: Record<Exclude<VibingSource, 'music'>, string> = {
  reels: 'https://www.instagram.com/reels/',
  tiktok: 'https://www.tiktok.com/explore',
  youtube: 'https://www.youtube.com/shorts/',
}

/** Classify a pasted URL, or `null` when it is not confidently recognised. */
export function classifyLink(input: string): ClassifiedLink | null {
  const u = parse(input)
  if (!u) return null
  const host = hostOf(u)
  return instagram(u, host) ?? tiktok(u, host) ?? youtube(u, host) ?? null
}
