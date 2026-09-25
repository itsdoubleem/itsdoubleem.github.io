/* The facts about a release that the site prints, worked out from the files it serves.
 *
 * An app page used to carry its APK's size, its SHA-256 and its version as words typed
 * into prose — the hash in a verify entry, the size in a download note, the version in a
 * platform note — and README.md typed the hash a second time. Nothing tied any of them to
 * the file. HANGIL's page said 1.4 MB about a 2.6 MB APK, and later 899 KB about a web
 * build that had grown to 897 KiB, and both looked exactly as right as the true number.
 *
 * Now `release:` in the app's frontmatter is the one place a release is described:
 *
 *   version  typed once, because it lives inside the APK and a build here cannot read it
 *   apk      the path it is served at
 *   sha256   typed once, and the build fails if it is not the file's hash
 *   web      optional: the offline web build, measured rather than described
 *
 * and the size is never typed at all — it is measured here, at build time. Prose that
 * needs one of these writes a token instead: {version}, {apkSize}, {sha256}, {webSize}.
 * An unknown token fails the build rather than printing braces on the live page.
 *
 * Sizes follow the rest of the site: binary units written as KB and MB, which is what a
 * phone's file manager shows and how "589 KB" is meant on the about page.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = join(process.cwd(), 'public');

/** Where a site path like /downloads/x.apk or /hangil/ lives on disk. A query or hash
 *  is not part of the file's name, so it is dropped. */
export const publicPath = (href: string) =>
  join(PUBLIC, href.split(/[?#]/)[0].replace(/^\//, ''));

/** A site path the build can serve: a file, or a folder with an index.html. */
export function servable(href: string): boolean {
  const p = publicPath(href);
  if (!existsSync(p)) return false;
  return statSync(p).isDirectory() ? existsSync(join(p, 'index.html')) : true;
}

/** A PNG's width and height from its header, or null if the file is not a PNG. */
export function pngSize(href: string): { width: number; height: number } | null {
  const b = readFileSync(publicPath(href));
  if (b.length < 24 || b.toString('latin1', 1, 4) !== 'PNG' || b.toString('latin1', 12, 16) !== 'IHDR') {
    return null;
  }
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/** The icons a web build declares for ordinary use, by pixel size — e.g.
 *  { 192: '/hangil/icon-192.png', 512: '/hangil/icon-512.png' }. Read from the build's
 *  manifest.webmanifest rather than guessed from file names, so a build that renames
 *  its icons is still found. Maskable icons are left out: they are padded for a
 *  launcher's mask and look shrunken anywhere else. Empty when there is no manifest. */
export function webIcons(web: string): Record<number, string> {
  const dir = web.split(/[?#]/)[0].replace(/\/?$/, '/');
  const file = publicPath(`${dir}manifest.webmanifest`);
  if (!existsSync(file)) return {};
  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`${dir}manifest.webmanifest is not valid JSON: ${(e as Error).message}`);
  }
  return manifestIcons(manifest, dir);
}

/** The parsing half of webIcons, kept apart from the disk so it can be tested. `dir` is
 *  the site folder the manifest sits in, with a trailing slash. */
export function manifestIcons(manifest: any, dir: string): Record<number, string> {
  const icons: { src?: unknown; sizes?: string; purpose?: string }[] =
    Array.isArray(manifest?.icons) ? manifest.icons : [];
  const out: Record<number, string> = {};
  for (const icon of icons) {
    const src = icon?.src;
    if (typeof src !== 'string') continue;
    // "any maskable" is one padded file offered for both uses, and it looks shrunken on
    // a page just the same, so any mention of maskable (or monochrome) rules it out.
    const purposes = icon.purpose?.split(/\s+/) ?? ['any'];
    if (!purposes.includes('any') || purposes.some((p) => p === 'maskable' || p === 'monochrome')) continue;
    const href = src.startsWith('/') ? src : dir + src.replace(/^\.\//, '');
    // `sizes` may list several ("192x192 512x512") and the x may be capital.
    for (const token of icon.sizes?.split(/\s+/) ?? []) {
      const m = token.match(/^(\d+)[xX]\1$/);
      // The first entry of a size wins, as it does for a browser choosing among equals.
      if (m && !(Number(m[1]) in out)) out[Number(m[1])] = href;
    }
  }
  return out;
}

export const sha256Of = (href: string) =>
  createHash('sha256').update(readFileSync(publicPath(href))).digest('hex');

/* Every file under the folder except the READMEs, which are notes for whoever copies the
 * build in and are never fetched by the app. */
function folderBytes(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) total += folderBytes(p);
    else if (!/^readme/i.test(entry.name)) total += statSync(p).size;
  }
  return total;
}

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;
const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

type Release = { version: string; apk: string; sha256: string; web?: string };

/** The tokens prose may use for this app, and what each one prints. */
export function releaseFacts(release: Release | undefined): Record<string, string> {
  if (!release) return {};
  const facts: Record<string, string> = {
    version: release.version,
    sha256: release.sha256,
    apkSize: mb(statSync(publicPath(release.apk)).size),
  };
  if (release.web) facts.webSize = kb(folderBytes(publicPath(release.web)));
  return facts;
}

const TOKEN = /\{(\w+)\}/g;

/** The tokens in a string that `facts` cannot fill. */
export const unknownTokens = (text: string, known: string[]) =>
  [...text.matchAll(TOKEN)].map((m) => m[1]).filter((t) => !known.includes(t));

export function fill(text: string, facts: Record<string, string>): string {
  return text.replace(TOKEN, (whole, name) => {
    if (!(name in facts)) throw new Error(`Unknown token ${whole} in: ${text}`);
    return facts[name];
  });
}

/* A notice with an `until` date stops rendering the day after it. The site is static, so
 * "stops rendering" means "is left out of the next build" — deploy.yml rebuilds once a
 * day for exactly this reason, so an expired notice is gone within a day of its date. */
export function noticeIsLive(notice: { until?: Date } | undefined, today = new Date()) {
  if (!notice) return false;
  if (!notice.until) return true;
  const lastDay = new Date(notice.until);
  lastDay.setUTCHours(23, 59, 59, 999);
  return today <= lastDay;
}
