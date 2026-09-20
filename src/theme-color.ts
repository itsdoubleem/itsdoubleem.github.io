import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/* The colour Android paints an app's status bar in `display: standalone`, read from the
 * app's own shipping manifest at build time.
 *
 * It lives here rather than in a page because two pages now draw the phone — the
 * homepage hero and each app's own page — and a second copy of this would be a second
 * place for it to go wrong. `public/<slug>/manifest.webmanifest` is the file the phone
 * itself reads, so the mockup cannot drift from the device.
 *
 * null means unknown, and unknown means PhoneDevice draws no status bar and no camera
 * rather than inventing a colour. Never make this return a default.
 */
export function themeColor(slug: string): string | null {
  try {
    const raw = readFileSync(join(process.cwd(), 'public', slug, 'manifest.webmanifest'), 'utf8');
    const c = JSON.parse(raw).theme_color;
    return typeof c === 'string' && /^#[0-9a-f]{3,8}$/i.test(c.trim()) ? c.trim() : null;
  } catch {
    return null;
  }
}
