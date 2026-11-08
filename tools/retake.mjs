/* Takes an app's screenshots again from the build the site serves, in one command.
 *
 *   npm run retake -- <slug>
 *
 * On the Mac only: Linux renders Korean differently, which is why the sync cannot do this.
 * It starts the dev server on a spare port (or uses the one you have running), runs the app's capture scripts in order
 * (tools/captures-lib.mjs, RETAKE), stops the server, and deletes the `captured:` line from
 * apps/<slug>.md. If any script fails it stops there and leaves that line alone; scripts that
 * finished may already have written their pictures, which `git status` shows. It also stops
 * if two of the new pictures are the same image, which is what a script that could not get
 * past a screen produces while still exiting 0.
 *
 * It commits nothing. Look at every picture first: a screen that changed may need the alt
 * text, a caption or a guide step rewritten too (CLAUDE.md: never describe a screen you have
 * not seen). */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RETAKE, duplicates, withoutCaptured } from './captures-lib.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
const slug = process.argv[2];
const fail = (msg) => { console.error(`retake: ${msg}`); process.exit(1); };

const app = RETAKE[slug];
if (!app) fail(`say which app: ${Object.keys(RETAKE).join(', ')}`);
if (process.platform !== 'darwin' && !process.argv.includes('--any-os')) {
  fail('run this on the Mac. Linux renders Korean differently, so its pictures would not match the rest (--any-os to try anyway).');
}
const mdPath = join(root, 'apps', `${slug}.md`);
if (!existsSync(join(root, 'public', app.page))) fail(`public${app.page} is missing — the site has no build of ${slug} to photograph`);

const astro = join(root, 'node_modules', '.bin', 'astro');
if (!existsSync(astro)) fail('run npm install first');
/* Astro 7 runs the dev server as a background process with its own status and stop commands.
 * One you already have running is used and left running; one started here is stopped here. */
const dev = (...args) => {
  const r = spawnSync(astro, ['dev', ...args], { cwd: root, encoding: 'utf8' });
  return `${r.stdout}${r.stderr}`;
};
const urlIn = (out) => out.match(/running at (https?:\/\/[^\s"\\)]+)/)?.[1]?.replace(/\/$/, '');
let base = urlIn(dev('status'));
const ours = !base;
if (ours) base = urlIn(dev('--background', '--port', String(4300 + Math.floor(Math.random() * 90))));
const stop = () => { if (ours) dev('stop'); };
if (!base) fail('could not start the dev server; `npx astro dev` shows why');

let up = false;
for (let i = 0; i < 120; i++) {
  try {
    if ((await fetch(`${base}${app.page}`)).ok) { up = true; break; }
  } catch { /* not listening yet */ }
  await new Promise((r) => setTimeout(r, 500));
}
if (!up) { stop(); fail(`the dev server at ${base} did not serve ${app.page} within a minute`); }
console.log(`retake: photographing ${base}${app.page}${ours ? '' : ' (your dev server, left running)'}`);

const started = Date.now();
// Pictures written by this run that are the same image: a script stuck on one screen. Asked
// after each script, so the message names the one that got stuck.
const walk = (d) => (existsSync(d) ? readdirSync(d) : []).flatMap((e) => {
  const p = join(d, e);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const stuck = (script) => {
  const fresh = walk(join(root, 'public', 'assets', slug))
    .filter((p) => p.endsWith('.png') && statSync(p).mtimeMs >= started - 1000)
    .map((p) => [p.slice(root.length + 1), readFileSync(p)]);
  const same = duplicates(fresh);
  if (!same.length) return;
  for (const g of same) console.error(`retake: ${g.length} pictures are the same image: ${g.join(', ')}`);
  stop();
  fail(`${script} photographed one screen over and over, so it did not get where it meant to, and captured: stays in apps/${slug}.md. The app's screens have probably changed: update the script, or put the old pictures back with git checkout -- public/assets/${slug}`);
};

for (const script of app.scripts) {
  console.log(`retake: ${script}`);
  const r = spawnSync(process.execPath, [script], { cwd: root, stdio: 'inherit', env: { ...process.env, [app.env]: `${base}${app.page}` } });
  stuck(script);
  if (r.status !== 0) { stop(); fail(`${script} failed, so captured: stays in apps/${slug}.md`); }
}
stop();

const md = readFileSync(mdPath, 'utf8');
const next = withoutCaptured(md);
if (next !== md) writeFileSync(mdPath, next);
console.log(`retake: done${next !== md ? `, and captured: is gone from apps/${slug}.md` : ''}. Look at every picture before you commit:`);
spawnSync('git', ['status', '--short', '--', `public/assets/${slug}`, 'tools/sample-output', `apps/${slug}.md`], { cwd: root, stdio: 'inherit' });
