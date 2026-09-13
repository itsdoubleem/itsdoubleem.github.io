// @ts-check
import { defineConfig } from 'astro/config';

// Static output, no adapter. GitHub Pages serves plain files; an adapter would emit a
// server entrypoint it cannot run. `site` is the absolute base for meta tags — change it
// if a custom domain is ever attached, or the meta tags keep pointing at the old host.
export default defineConfig({
  site: 'https://itsdoubleem.github.io',
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
});