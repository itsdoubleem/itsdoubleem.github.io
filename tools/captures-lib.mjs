/* Screenshots that have fallen behind the app the site serves, and how to take them again.
 *
 * The sync moves an app on from its Latest release by itself, but it cannot drive the app: it
 * runs on Linux, which renders Korean differently, so the pictures are left as they were and
 * `captured:` records the version they show (tools/sync-lib.mjs). That line is the whole signal.
 * check-captures.mjs keeps one Issue open while any app has it; retake.mjs takes the pictures
 * again on the Mac and deletes it. */
import { createHash } from 'node:crypto';
import { releaseField } from './sync-lib.mjs';

/** What retake.mjs runs for each app, in order, against the dev server. Every app with
 *  screenshots needs an entry (tests/captures.test.ts checks it). */
export const RETAKE = {
  logger: {
    page: '/logger/index.html',
    env: 'LOGGER_URL',
    scripts: ['tools/capture-logger.mjs', 'tools/make-sample-record.mjs'],
  },
  hangil: {
    page: '/hangil/index.html',
    env: 'HANGIL_URL',
    scripts: ['tools/capture-hangil.mjs', 'tools/capture-hangil-guide.mjs'],
  },
};

const nameOf = (md, slug) => md.match(/^name:\s*['"]?([^'"\n]+?)['"]?\s*$/m)?.[1] ?? slug;

/** [{ slug, name, captured, served }] for every app whose pictures show an older version. */
export function staleCaptures(apps) {
  return apps
    .map(({ slug, md }) => ({ slug, name: nameOf(md, slug), captured: releaseField(md, 'captured'), served: releaseField(md, 'version') }))
    .filter((a) => a.captured && a.captured !== a.served);
}

/** The Issue for them: one for every app at once, so a release of each does not make two. */
export function issueText(stale) {
  const title = stale.length === 1
    ? `${stale[0].name}'s screenshots are from ${stale[0].captured}; the site serves ${stale[0].served}`
    : `Screenshots are behind for ${stale.map((a) => a.name).join(' and ')}`;
  const lines = stale.map((a) => `- **${a.name}**: pictures from ${a.captured}, the site serves ${a.served}. On the Mac: \`npm run retake -- ${a.slug}\``);
  const body = `The sync updated these apps but cannot take their pictures, so the site still shows screens from an older version.\n\n${lines.join('\n')}\n\nThe command starts the dev server, runs the app's capture scripts and deletes the \`captured:\` line. Look at every picture before committing them: a screen that changed may need the text beside it rewritten too. This Issue closes itself once no app has a \`captured:\` line.`;
  return { title, body };
}

/** apps/<slug>.md without its `captured:` line. Nothing else moves. */
export function withoutCaptured(md) {
  return md.replace(/^(release:\n(?:[ \t]+.*\n|[ \t]*#.*\n)*?)[ \t]+captured:.*\n/m, '$1');
}

/** Groups of two or more paths in one folder whose files are byte for byte the same. A capture
 *  script that cannot get past a screen photographs that screen at every step and still exits
 *  0: LOGGER 1.4.1's new welcome screen made ten identical "guide" pictures on 2026-11-08.
 *  Across folders a repeat can be meant: HANGIL's exam screen is in its guide and on its page. */
export function duplicates(files) {
  const by = new Map();
  for (const [path, buf] of files) {
    const h = `${path.replace(/[^/]*$/, '')}\0${createHash('sha256').update(buf).digest('hex')}`;
    by.set(h, [...(by.get(h) ?? []), path]);
  }
  return [...by.values()].filter((g) => g.length > 1);
}

/* The address in what `astro dev status` and `astro dev --background` print, without its
 * trailing slash, or undefined when no server is running. Both print one JSON line whose
 * message reads "Dev server running at <url> (pid …)"; the second goes on with escaped \n. */
export function devUrl(out) {
  return out.match(/running at (https?:\/\/[^\s"\\)]+)/)?.[1]?.replace(/\/$/, '');
}
