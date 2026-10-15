import { describe, expect, it } from 'vitest';
import { isSafeLocalPath, toSafeLink } from '../src/lib/links';

describe('toSafeLink', () => {
  it('accepts https URLs as external links', () => {
    expect(toSafeLink('https://example.com/a')).toEqual({
      href: 'https://example.com/a',
      external: true,
    });
  });

  it('accepts mailto links with an address', () => {
    expect(toSafeLink('mailto:dev@example.com')).toEqual({
      href: 'mailto:dev@example.com',
      external: false,
    });
    expect(toSafeLink('mailto:not-an-email')).toBeNull();
  });

  it('accepts local paths', () => {
    expect(toSafeLink('cv/cv.pdf')).toEqual({ href: 'cv/cv.pdf', external: false });
  });

  it('rejects empty, insecure and script URLs', () => {
    for (const bad of [
      null,
      undefined,
      '',
      '  ',
      'http://example.com',
      'javascript:alert(1)',
      'data:text/html,x',
      '//evil.example',
      'ftp://x.y',
    ]) {
      expect(toSafeLink(bad), String(bad)).toBeNull();
    }
  });

  it('rejects parent traversal and backslashes in local paths', () => {
    expect(isSafeLocalPath('../secret')).toBe(false);
    expect(isSafeLocalPath('a\\b')).toBe(false);
    expect(isSafeLocalPath('game/projects/x.png')).toBe(true);
  });
});
