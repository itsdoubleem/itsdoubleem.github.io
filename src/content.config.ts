import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { existsSync } from 'node:fs';
import { fill, pngSize, releaseFacts, servable, sha256Of, unknownTokens, webIcons } from './release';

// The apps live in /apps at the repo root, not under src/ — they are the content
// source of truth and are meant to be editable without opening the site code.
// The schema below is the whole contract — adding an app means adding one file
// that satisfies it, and nothing in src/ ever names an app.
const apps = defineCollection({
  loader: glob({ pattern: ['*.md', '!README.md'], base: './apps' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    nativeName: z.string().optional(),
    tagline: z.string().max(90, 'Taglines over 90 characters wrap badly on a phone.'),
    // Who the work is for, named plainly — rendered in the hero, directly under the
    // tagline, because "is this for me?" is the question a stranger asks before "what
    // does it do?". Optional: leave it out when the honest answer is "anyone", and never
    // use it to make an audience sound larger than it is. For LOGGER the true answer
    // names a visa, and a page that does not say so leaves the reader guessing.
    audience: z
      .string()
      .max(120, 'The hero audience line is one or two short sentences, not a paragraph.')
      .optional(),
    // What KIND of work this is — how the homepage groups it. Distinct from `category`,
    // which is the subject matter. A novel and an app are both work; only one is an app.
    type: z.enum(['app', 'tool', 'writing', 'novel', 'bot', 'other']).default('app'),
    category: z.enum(['Work', 'Study', 'Health', 'Productivity', 'Tools']),
    status: z.enum(['live', 'beta']),
    platforms: z.array(z.enum(['android', 'ios', 'web', 'macos', 'windows'])).nonempty(),
    price: z.literal('free'),
    privacy: z.enum(['on-device', 'account-required']),
    languages: z.array(z.string()).optional(),
    icon: z.string(),
    // A real screenshot of the app, captured from the running build — never an
    // illustration. Falls back to the icon when absent.
    card: z.string().optional(),
    // Real captures of the shipping build, shown as a strip on the detail page. `alt`
    // describes what is on the screen for someone who cannot see it; `caption` says why
    // the screen is worth looking at. Where a capture shows amounts, say in the caption
    // that the figures are invented — a stranger cannot tell sample data from a real
    // payslip, and letting them assume is the same sin as inventing a number outright.
    // `shape` says what the capture is OF, so the page can stop treating a sheet of paper
    // like a phone screen: 'phone' sits in the strip at 390/844, 'page' spans the full
    // width and is cropped to its head. Getting this wrong is what made the 근무내역서
    // capture a two-metre column on the first attempt.
    screenshots: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
          shape: z.enum(['phone', 'page']).default('phone'),
        }),
      )
      .default([]),
    // What is different about this app on each platform it runs on. Optional: a piece of
    // work with nothing platform-specific to say simply has no such section, the same way
    // an empty kind never gets a heading on the homepage.
    platformNotes: z
      .array(
        z.object({
          platform: z.enum(['android', 'ios', 'web', 'macos', 'windows']),
          note: z.string(),
        }),
      )
      .default([]),
    // A claim this page makes, paired with how a stranger can confirm it for themselves.
    // This is the site's answer to the install counters and star ratings it refuses to
    // carry: proof someone can check beats a number they have to take on faith. Every
    // entry must have been checked on the shipping build by whoever wrote it.
    verify: z
      .array(z.object({ claim: z.string(), how: z.string() }))
      .default([]),
    /* The closing "tell me if this is wrong" aside. It is optional, and where it is
     * absent the page falls back to copy that is true of anything.
     *
     * It exists because that aside used to be hardcoded in src/pages/apps/[slug].astro
     * in LOGGER's words — "this does not match my payslip", "a wage figure that is
     * quietly wrong" — and so HANGIL, a Korean study app with no payslip and no wage
     * figures in it, asked its readers to report a mismatched payslip. CLAUDE.md § How
     * to add an app: nothing in src/ may name an app, and copy that only makes sense
     * for one app is naming it.
     *
     * Write the body for the thing THIS app gets wrong. The heading should name the
     * kind of error a reader would actually notice. */
    wrong: z
      .object({ heading: z.string(), body: z.string() })
      .optional(),
    order: z.number(),
    sourceUrl: z.string().optional(),
    downloads: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          note: z.string().optional(),
        }),
      )
      .nonempty('An app with no way to get it does not belong on the site.'),
    // The one place a release is described. See src/release.ts: the size is measured
    // from the file, the hash is checked against it, and prose elsewhere in this file
    // writes {version}, {apkSize}, {sha256} or {webSize} instead of typing the value.
    release: z
      .object({
        version: z.string(),
        apk: z.string().startsWith('/downloads/'),
        sha256: z.string().regex(/^[0-9a-f]{64}$/, 'sha256 is 64 lowercase hex characters.'),
        web: z.string().optional(),
      })
      .optional(),
    // A time-limited note for people updating — a key change, a backup to take first. It
    // renders as its own section near the top of the page, with a red badge on the
    // download button that links to it. README.md § Update notices has the how-to.
    notice: z
      .object({
        // The section's id, so the badge (and anyone else) can link to #<id>.
        id: z.string().regex(/^[a-z][a-z0-9-]*$/).default('update-notice'),
        badge: z.string().max(28, 'The badge sits on a button — keep it to a few words.'),
        heading: z.string(),
        // Paragraphs separated by a blank line. May use the release tokens.
        body: z.string(),
        // The href of the download whose button wears the badge. Defaults to the
        // release APK, else the first download.
        download: z.string().optional(),
        // The release this notice was written for. When `release.version` moves on the
        // build fails, so the notice is rewritten or deleted rather than left to go stale.
        version: z.string().optional(),
        // The last day it shows. Optional — leave it out for "until I remove it".
        until: z.coerce.date().optional(),
      })
      .optional(),
  })
  // Checks that need the disk. Each one is a mistake that used to ship silently: a
  // broken image, a download link to nothing, a hash that is not the file's.
  .superRefine((d, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });

    const assets = [d.icon, d.card, ...d.screenshots.map((s) => s.src)].filter(Boolean) as string[];
    for (const href of assets) if (!servable(href)) fail(`${href} is not in public/`);

    // The icon is drawn beside the name at up to ~60px, so up to 180 device pixels on a
    // 3x phone, and clipped to a rounded square — a wide one would be squashed.
    if (servable(d.icon)) {
      const s = pngSize(d.icon);
      if (!s) fail(`icon ${d.icon} must be a PNG`);
      else if (s.width !== s.height) fail(`icon ${d.icon} is ${s.width}×${s.height} — it must be square`);
      else if (s.width < 192) fail(`icon ${d.icon} is ${s.width}px — it must be at least 192px`);
    }
    for (const dl of d.downloads) {
      if (dl.href.startsWith('/') && !servable(dl.href)) fail(`download ${dl.href} is not in public/`);
    }

    const r = d.release;
    if (r) {
      if (!servable(r.apk)) fail(`release.apk ${r.apk} is not in public/`);
      else if (sha256Of(r.apk) !== r.sha256) {
        fail(`release.sha256 is not the hash of ${r.apk} — it is ${sha256Of(r.apk)}`);
      }
      if (!d.downloads.some((dl) => dl.href === r.apk)) {
        fail(`release.apk ${r.apk} is not one of the downloads, so its size is printed nowhere`);
      }
      if (r.web && !servable(r.web)) fail(`release.web ${r.web} is not in public/`);

      // The page's icon must be the one the app itself ships. HANGIL's artwork changed
      // in its own repo and the build here kept serving the old one for a week, because
      // the copy in public/assets/ is made by hand. The web build's manifest names the
      // real icon, so compare against it — and fail, not skip, when it cannot be found,
      // or a renamed file would switch the check off without anyone noticing.
      if (r.web && servable(r.web)) {
        const icons = webIcons(r.web);
        const shipped = icons[512];
        if (!shipped) {
          fail(`release.web ${r.web} has no manifest.webmanifest declaring a 512x512 icon to check the page icon against`);
        } else if (!servable(shipped)) {
          fail(`${r.web}manifest.webmanifest names ${shipped}, which is not in public/`);
        } else if (servable(d.icon) && sha256Of(shipped) !== sha256Of(d.icon)) {
          fail(`icon ${d.icon} is not the icon the app ships — copy ${shipped} over it`);
        }
        if (icons[192] && !servable(icons[192])) {
          fail(`${r.web}manifest.webmanifest names ${icons[192]}, which is not in public/`);
        }
      }
    }

    const n = d.notice;
    if (n) {
      if (n.download && !d.downloads.some((dl) => dl.href === n.download)) {
        fail(`notice.download ${n.download} is not one of the downloads`);
      }
      if (n.version && n.version !== r?.version) {
        fail(
          `notice was written for ${n.version} but release.version is ${r?.version ?? 'unset'} — ` +
            'rewrite the notice for this release or delete it',
        );
      }
    }

    // Every token must be one this app can fill, or the page would print "{sha256}".
    const known = [
      ...(r ? ['version', 'apkSize', 'sha256'] : []),
      ...(r?.web ? ['webSize'] : []),
    ];
    const prose = [
      ...d.downloads.map((dl) => dl.note ?? ''),
      ...d.platformNotes.map((p) => p.note),
      ...d.verify.flatMap((v) => [v.claim, v.how]),
      ...(n ? [n.badge, n.heading, n.body] : []),
      ...(d.wrong ? [d.wrong.heading, d.wrong.body] : []),
    ];
    for (const text of prose) {
      for (const t of unknownTokens(text, known)) fail(`{${t}} cannot be filled for this app`);
    }

    // The 28-character limit above counts the badge as typed. Count it as printed too,
    // or `badge: {sha256}` would pass and put 64 characters on a button.
    if (n && r && servable(r.apk) && unknownTokens(n.badge, known).length === 0) {
      const printed = fill(n.badge, releaseFacts(r));
      if (printed.length > 28) fail(`notice.badge prints as ${printed.length} characters — keep it to 28`);
    }
  }),
});

// Guides are optional and keyed to an app by slug. An app without one simply has no
// guide link — nothing else changes.
const stepSchema = z.object({
  image: z.string(),
  alt: z.string(),
  kicker: z.string(),
  title: z.string(),
  body: z.string(),
  note: z.string().optional(),
});

const guides = defineCollection({
  loader: glob({ pattern: ['*.md', '!README.md'], base: './guides' }),
  schema: z.object({
    app: z.string(),
    title: z.string(),
    lead: z.string(),
    // The "What you end up with" sentence. It lives here, not in the template, because
    // only the guide knows what is true of its app — connection, account, device.
    outcome: z.string(),
    before: z.object({
      heading: z.string(),
      body: z.string(),
      items: z.array(z.string()).nonempty(),
    }),
    steps: z.array(stepSchema).nonempty(),
    after: z.array(stepSchema).default([]),
  })
  // A guide whose `app` names nothing used to vanish without a word — guide.astro drops
  // it — and a mistyped step image shipped as a broken picture. Both fail here now.
  .superRefine((g, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (!existsSync(new URL(`../apps/${g.app}.md`, import.meta.url))) {
      fail(`app: ${g.app} — there is no apps/${g.app}.md`);
    }
    for (const s of [...g.steps, ...g.after]) {
      const href = `/assets/${g.app}/guide/${s.image}.png`;
      if (!servable(href)) fail(`step image ${href} is not in public/`);
    }
  }),
});

export const collections = { apps, guides };
