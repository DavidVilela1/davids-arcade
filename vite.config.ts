import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

interface VercelHeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

/**
 * The security headers live in vercel.json (production). `vite preview` reads
 * the same rules so the CSP can be exercised locally before deploying.
 */
function previewHeadersFromVercel(): Record<string, string> {
  const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as {
    headers?: VercelHeaderRule[];
  };
  const globalRule = vercel.headers?.find((rule) => rule.source === '/(.*)');
  return Object.fromEntries((globalRule?.headers ?? []).map((h) => [h.key, h.value]));
}

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
    // Phaser alone is ~1.2 MB minified; it is split into its own long-cached chunk.
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
      },
    },
  },
  preview: {
    headers: previewHeadersFromVercel(),
  },
});
