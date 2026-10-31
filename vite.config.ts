import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.BASE_PATH ?? '/rifdan-site/';
// SITE_URL is the deployed origin; social networks need absolute image URLs.
const siteUrl = `${(process.env.SITE_URL ?? '').replace(/\/$/, '')}${base}`;
// PREVIEW=1 keeps review deployments out of search engines.
const robots = process.env.PREVIEW ? 'noindex, nofollow' : 'index, follow';

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'rifdan-meta',
      transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl).replaceAll('__ROBOTS__', robots),
      // Production builds only: both files need the real public address.
      generateBundle() {
        if (!process.env.SITE_URL || process.env.PREVIEW) return;
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n` });
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc></url>\n</urlset>\n` });
      },
    },
  ],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
