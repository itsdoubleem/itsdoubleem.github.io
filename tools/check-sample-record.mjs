/* Checks that the sample 근무내역서 in LOGGER's guide was made by the LOGGER this site serves.
 *
 *   node tools/check-sample-record.mjs   (or: npm run check)
 *
 * The record prints the app's version in its footer ("작성 도구: 근무기록 LOGGER 1.2.8"),
 * and the guide shows it as 12-record.png. Nothing regenerates it when LOGGER is
 * updated, so it said "LOGGER v2" through 1.0 and into 1.2.8 without anyone noticing. This
 * compares the footer of tools/sample-output/record.html with release.version in
 * apps/logger.md. It cannot read the PNG, but make-sample-record.mjs writes both in one run,
 * rendering the PNG from the record it has just saved.
 *
 * When the hourly sync (tools/sync-apps.mjs) has moved LOGGER on without re-capturing — it
 * cannot drive the app on a Linux runner — it writes `captured:` with the version the
 * captures came from, and the record is held to that instead. Re-capture, then delete it.
 */
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const md = await readFile(new URL('apps/logger.md', root), 'utf8');
const html = await readFile(new URL('tools/sample-output/record.html', root), 'utf8');

const block = md.match(/^release:\n((?:[ \t]+.*\n)+)/m)?.[1] ?? '';
const served = block.match(/^\s+version:\s*['"]?([^'"\s]+)/m)?.[1];
const captured = block.match(/^\s+captured:\s*['"]?([^'"\s]+)/m)?.[1];
const version = captured ?? served;
const footer = html.match(/근무기록 LOGGER (\S+)/)?.[1];

if (!version || !footer) {
  console.error(`check-sample-record: could not read ${!version ? 'release.version in apps/logger.md' : 'the footer of tools/sample-output/record.html'} — has the layout moved?`);
  process.exit(1);
}
if (footer !== version) {
  console.error(`check-sample-record: the sample record was made by LOGGER ${footer}, the site serves ${version}.
  Regenerate it (README.md § Shipping an app update):
    npm run dev   (in another terminal)
    node tools/make-sample-record.mjs   (writes record.html and 12-record.png)`);
  process.exit(1);
}
console.log(captured
  ? `check-sample-record: the sample record was made by LOGGER ${captured}, as captured: says (the site serves ${served} — re-capture when you can)`
  : `check-sample-record: the sample record was made by LOGGER ${version}, the version served`);
