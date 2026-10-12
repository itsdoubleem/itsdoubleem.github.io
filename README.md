# DOUBLEEM

One person's work, in one place. Apps so far, and whatever else turns out to be worth
sharing. Each app says on its own page what it costs.

**Live at [itsdoubleem.github.io](https://itsdoubleem.github.io)** — deploys on push to
`main`.

This is a studio site, not a marketplace and not a blog. Every page answers three things
for a stranger who lands on it: what does this person make, can I get it right now and
does it cost anything, and who made it. Anything serving none of those does not belong
here.

## The rules

Three, and they are not style preferences.

1. **No invented numbers.** No install counts, no download totals, no star ratings, no
   "trusted by N users", no testimonials — unless the figure is real and you can say where
   it came from. One honest page beats ten fabricated metrics, and a visitor who catches a
   single made-up figure is right to discount everything else on it. Where there is no
   number yet, say what the thing *does* instead.
2. **Do not promise that anything stays free.** Everything here is free today, and each
   app says so on its own page, where it is a fact about that app. "Free, always" and
   "and it stays free" are promises about work that does not exist yet — the only way to
   keep one is to never charge for anything, ever — so they are not made. If something
   here is ever paid, put the price plainly on its page. What stays banned is the
   furniture around money, not money: no tiers, no "pro" version held back, no upgrade
   prompts, no email-gated downloads.
3. **Verify a claim against the running app, not against a grep.** Check that a feature
   exists by using it on screen, and that it is gone by failing to find it on screen. This
   applies doubly to privacy claims: if a page says data never leaves the device, someone
   checked that recently.

The site collects nothing, so it needs no cookie banner. It loads two scripts on every
page — `/motion.js` and `/globe.js` — which move things and nothing else. `/globe.js`
paints nothing itself; it measures the device and fetches one of two fields. A window
over 1200px, or a narrower one with a mouse, gets `/three.min.js` and `/globe-scene.js`,
which draw the globe behind the story on the front page and, on every other page, the orb
field that globe sits in — that covers laptops, desktops and tablets. A phone gets
`/sky-mobile.js`, about 20 KB, which draws that same orb field in a 2D canvas with no globe
and no library, so a handset still never downloads the 589 KB one even when it asks for
the desktop site. three.js is vendored into `/public` under its MIT licence rather than
loaded from a CDN, so there are still no third-party requests, no analytics and no
cookies. Keep both true. All five are named in the about page's prose and in the claim every
app page carries (`siteClaim` in `src/site.ts`); a sixth one means editing those in the same commit.

## Adding a piece of work

Adding something is adding **one markdown file** to `apps/`. Nothing in `src/` names an
app, and no page is written by hand. The frontmatter contract is
[`src/content.config.ts`](src/content.config.ts); it validates at build time, so a typo
fails the build rather than shipping a broken page.

Each entry declares a `type` — `app`, `tool`, `writing`, `novel`, `bot` or `other` — and
the homepage renders one section per type. **A section appears only when something is in
it**, because an empty "Novels" heading would advertise work that does not exist, which is
rule 1 wearing a different hat.

Optional frontmatter grows the detail page, each part appearing only once filled:
`screenshots` (real captures, never mock-ups), `platformNotes` (what differs per
platform), and `verify` — a claim paired with the way a reader can check it themselves.
That last one is this site's answer to install counters: a number you are asked to
believe, swapped for something you can confirm.

A walkthrough is optional and lives in `guides/<slug>.md`. Its screenshots are captured
from the shipping app by that app's script — `tools/capture-logger.mjs`,
`tools/capture-hangil-guide.mjs` — never drawn — re-run it after any
change to the app, because a guide showing a screen that no longer exists is worse than no
guide: the reader assumes they are the one who is lost.

Install steps in the app's own languages are optional too, in `install/<slug>.md`. They
add a line of language names under the download buttons and a section with one row per
language. A translation no native speaker has checked says so on the page. See
`install/README.md`.

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → ./dist, and fails on a missing asset or a hash that is not the file's
npm run check    # downloads match their release: block and README, and the web build
                 # inside each APK matches release.web; the sample record matches
                 # LOGGER's version; every #link lands
npm test         # unit tests in tests/ — Node's own runner, nothing to install
```

CI runs `npm test`, `npm run build` and then `npm run check`, and a failure in any of them
stops the deploy.

Astro, static output, no client framework and no adapter. The content is markdown, it
builds to plain HTML that works with JavaScript switched off, and GitHub Pages serves the
files. If `astro build` ever prints an `adapter:` line, something has reintroduced one —
take it out, because Pages cannot run a server entrypoint.

## A note on the apps

Every app is a separate project in its own folder and none of their source is vendored
here. This repo carries their **built output** — LOGGER's Android package and offline web
build in `public/downloads/` and `public/logger/`, HANGIL's in `public/hangil/` — so the
download buttons have something to point at on a CI runner, which builds from the
repository and cannot see an ignored file. Re-copy after any rebuild of an app; these
files are committed deliberately, not by accident.

| App | Source | Built into |
|---|---|---|
| LOGGER | `~/Logger_app` | `public/logger/`, `public/downloads/logger.apk` |
| HANGIL | `~/Hangil_app` | `public/hangil/`, `public/downloads/hangil.apk` |

Each has its own `DEPLOY.md` with the exact copy step, and its own `CLAUDE.md` that is the
authority on what that app is. HANGIL's page screenshots are captured from the shipping build
by `tools/capture-hangil.mjs` and its guide's by `tools/capture-hangil-guide.mjs`, the same
way LOGGER's guide is by `tools/capture-logger.mjs`.

### Checking the downloads

The APKs this site serves are committed under `public/downloads/`. Their SHA-256 sums are

```
87b8c78ff10bc9cc04a07824290e408152421d54ee77cd8484d50d937357e272  logger.apk
31c03f7cdd8da5a1579745c215707947757ce4fd7939f8caaadbc5732e4fac53  hangil.apk
```

The app page prints the same hash, but a hash is only worth as much as the page it sits
on — anyone who could swap the APK on the site could swap the hash printed beside it. This
copy is the second opinion. It lives on github.com rather than on the site, so a tampered
download has to survive two places instead of one.

Regenerate them in the same commit that replaces an APK, never later:

```bash
shasum -a 256 public/downloads/*.apk
```

A hash here that does not match the file is worse than no hash at all — it teaches the one
reader who bothered to check that checking is pointless. `npm run check` fails if the line
for an APK is missing or wrong.

### Shipping an app update

Every fact about a release lives in one place: the `release:` block in `apps/<slug>.md`.

```yaml
release:
  version: 1.0.1                  # typed once; the build cannot read it out of the APK
  date: 2026-10-11                # the day it was published — starts the "New" pill
  apk: /downloads/hangil.apk      # must also be one of the page's downloads
  sha256: 3846f5c0…df7fff75       # the build fails if this is not the file's hash
  web: /hangil/                   # optional: the offline web build, measured at build time
```

The page never types these values into prose. It writes a token, and the build fills it in:

| Token | Prints | From |
|---|---|---|
| `{version}` | `1.0.1` | `release.version` |
| `{apkSize}` | `1.6 MB` | measured from the APK |
| `{sha256}` | the full hash | `release.sha256`, checked against the APK |
| `{webSize}` | `897 KB` | measured from the `release.web` folder, READMEs left out |

Tokens work in download notes, platform notes, verify entries, the update notice (badge
included) and the `wrong` aside. An
unknown token fails the build, and so does a hash or an APK size typed out by hand
(`npm run check`). Sizes are binary units written as KB and MB, which is what a phone's
file manager shows.

**An app with `source:` in its `release:` block updates itself.** Every hour, the deploy
workflow runs `tools/sync-apps.mjs`, which reads that repo's Latest GitHub Release. If it
is newer than what the site serves, the sync:

- downloads its APK (the asset named `asset:`, or its only `.apk`) and refuses it unless
  its versionName matches the tag, it is signed by the certificate in `signer:`, and it
  asks for no Android permission the served APK does not (and never for INTERNET — both
  pages say the app cannot reach the network);
- works the whole update out before writing anything, so an app that fails leaves the tree
  as it was;
- copies the APK to `public/downloads/`, its `assets/www/` into `release.web`, and rewrites
  `version`, `sha256`, `date` and the hash in the list above;
- writes the release's notes to `releases/<slug>.md` (cleaned: no HTML, PR numbers, hashes or
  links into the app's repo), which the page shows as **What's new** for the same seven days;
- commits to `main` as the owner's noreply address and pushes. The same run then builds,
  checks and deploys that commit — so a check that fails after the push leaves `main` red
  and undeployed until someone fixes it, rather than publishing it.

A release with no APK attached is skipped with a warning on the run — so **attach the APK to
every app release on GitHub**, or the site never sees it. HANGIL's releases up to v1.0.2
carried none. A refusal (signer, version, permission, a notice tied to the old version)
fails the run and publishes nothing for that app. It fails again every hour, with a GitHub
email each time, until someone acts: read the run's red `::error::` line, then either fix
the release or update the app by hand.

What the sync cannot do is look at the app: screenshots and LOGGER's sample record need the
running app on a Mac (step 5 below). The first time it moves an app past them it writes
`captured: '<old version>'`, and the sample-record check holds the record to that. Do steps
5 and 6 when you can, then delete the `captured:` line. Run `node tools/sync-apps.mjs` by hand
to do the same sync locally without committing.

Without `source:`, or to update by hand, an update is:

1. Copy the new APK into `public/downloads/<slug>.apk`. Take the web build out of that
   APK, not out of the app's own build folder, which may have been rebuilt since the
   release: `unzip public/downloads/<slug>.apk 'assets/www/*'` into a scratch folder and copy
   its files into `public/<slug>/`. Keep any file the site adds, such as HANGIL's `sw.js`.
2. `shasum -a 256 public/downloads/<slug>.apk`. Put the hash in `release.sha256` **and** on
   that APK's line in the list above, in the same commit.
3. Set `release.version` and `release.date` (the day the version was published). For
   seven days from that date the download button wears a red **New · {version}** pill,
   on every app, with nothing else to switch on — see § The release pill.
4. If the app has an update notice with a `version:`, the build now fails until you rewrite
   it for this release or delete it (see below). The same goes for `releases/<slug>.md`,
   the What's new notes: the build fails while its `version:` is not `release.version`.
   With `source:` set, delete the file and run `node tools/sync-apps.mjs` to write it from
   the GitHub Release; otherwise edit it by hand (`releases/README.md`).
5. Re-run the app's capture scripts with `npm run dev` running, and look at what changed:
   `node tools/capture-logger.mjs` for LOGGER; `node tools/capture-hangil.mjs` and
   `node tools/capture-hangil-guide.mjs` for HANGIL.
6. **LOGGER only:** regenerate the sample work record in its guide, whose footer prints the
   app's version. With `npm run dev` running, `node tools/make-sample-record.mjs` writes
   both the record and `12-record.png`, the guide's picture of it. It writes all three
   files only at the very end, one after another. If the record is missing the invented
   worker, the shifts or the pay period, it exits 1 and writes none of them, and a crash
   before the end leaves them as they were too. Look at the picture, and at `git status`,
   before committing.
7. `npm run build && npm run check`. The check fails if the sample record's footer and
   LOGGER's `release.version` disagree, or if any file in an APK's `assets/www/` differs
   from the one served under `release.web`.

### The release pill

Every app with a `release:` gets a red **New · {version}** pill on the corner of its APK's
download button for `NEW_FOR_DAYS` (7, in `src/release.ts`) from `release.date`, the release
day counting as the first. Days are Korean days. Then it goes by itself: the site is
static, so it drops out of the next build, and the deploy workflow rebuilds once a day for
this reason. Shipping the next version with a new date brings it back.

It links to what there is to read: an update notice if there is one, else **What's new in
{version}** (`releases/<slug>.md`), which shows in red at the top of the reading column for
the same seven days. With neither it is a label. As a link it sits beside the button rather
than inside it, so the button still downloads.

### Update notices

When an update needs the reader to do something first, such as take a backup before a key
change, give the app a `notice:`. The page then shows:

- the **release pill** on the download button, linking to the notice. If the notice is kept
  up past the release's new days with an `until`, the pill stays too and shows the
  notice's `badge` instead.
- a **notice section** at the top of the reading column, headed by its `badge` in red, with
  an anchor the pill jumps to.

```yaml
notice:
  badge: Had 1.0? Read first      # the notice's red tag; 28 characters at most
  heading: Had version 1.0? Take a backup before you update
  body: |                         # paragraphs, separated by a blank line; tokens allowed
    Version {version} is signed with a new key, so Android will not install it over 1.0.

    Updates after this one install over the top.
  version: 1.0.1                  # optional: the release this was written for
  until: 2026-12-31               # optional: the last day it shows (default: while the release is new)
  download: /downloads/hangil.apk # optional: which button wears the pill
  id: update-notice               # optional: the anchor; this is the default
```

- **`version`** ties the notice to one release. When `release.version` changes, the build
  fails with "notice was written for 1.0.1 but release.version is 1.0.2", so a notice
  about one update can never sit silently on the next one.
- **`until`** takes the notice down after that date. Without it the notice goes when the
  release pill does, seven days from `release.date` — HANGIL's 1.0 notice had no end date
  and stayed up for weeks, which is why that is the default. Either way it goes at the
  next daily build, so it is gone within a day.
- **`download`** defaults to the `release.apk` button, or the first download if the app
  has no release.

A notice with a `version:` also stops the hourly sync for that app when a newer release
appears: a person wrote it about one update, so a person decides what becomes of it.

Most releases need no notice: the release notes already show as **What's new**. A notice is
for the rare update that asks the reader to do something first. The pill links to the
notice when there is one, and to What's new otherwise.

Only one notice per app. The red (`--alert` in `global.css`) is used for nothing but the
pill, What's new and the notice, so a page whose release is not new has no red on it. Since a notice goes by itself,
no other part of the page may depend on it being there — say the caveat in full where it
matters, as HANGIL's Android note does, rather than "see the note at the top".
