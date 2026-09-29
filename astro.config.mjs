// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL / BASE_PATH let the same code deploy to production (yahiafouad.com)
// or to a preview host such as GitHub Pages (https://<user>.github.io/<repo>/).
const site = process.env.SITE_URL || 'https://yahiafouad.com';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  image: { layout: 'constrained', responsiveStyles: true },
  devToolbar: { enabled: false },
});
