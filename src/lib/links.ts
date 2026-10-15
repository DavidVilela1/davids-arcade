/**
 * Link and media-path safety. Everything rendered as an <a href> or <img src>
 * goes through these helpers, so a typo in the content files can never turn
 * into a `javascript:` URL or an unexpected remote resource.
 */

export interface SafeLink {
  readonly href: string;
  /** External links open in a new tab with rel="noopener noreferrer". */
  readonly external: boolean;
}

const EMAIL = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

/** Returns a vetted link, or null when the value is empty or unsafe. */
export function toSafeLink(value: string | null | undefined): SafeLink | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;

  if (trimmed.toLowerCase().startsWith('mailto:')) {
    const address = trimmed.slice('mailto:'.length).split('?')[0] ?? '';
    return EMAIL.test(address) ? { href: trimmed, external: false } : null;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }
    return url.protocol === 'https:' ? { href: url.href, external: true } : null;
  }

  return isSafeLocalPath(trimmed) ? { href: trimmed, external: false } : null;
}

/** A relative path inside the site (no scheme, no parent traversal, no protocol-relative). */
export function isSafeLocalPath(path: string): boolean {
  if (path === '' || path.startsWith('//') || path.includes('\\')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return false;
  return !path.split('/').includes('..');
}
