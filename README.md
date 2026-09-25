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
from the shipping app by `tools/capture-logger.mjs`, never drawn — re-run it after any
change to the app, because a guide showing a screen that no longer exists is worse than no
guide: the reader assumes they are the one who is lost.

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → ./dist, and fails on a missing asset or a hash that is not the file's
npm run check    # downloads match their release: block and README; every #link lands
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
authority on what that app is. HANGIL's screenshots are captured from the shipping build by
`tools/capture-hangil.mjs`, the same way LOGGER's guide is by `tools/capture-logger.mjs`.

### Checking the downloads

The APKs this site serves are committed under `public/downloads/`. Their SHA-256 sums are

```
c180c7398240e4a1b0f1ef572418238253d373ce8d967ab314f3a32f37698dc7  logger.apk
3846f5c0552d45d79bdd47818819be7486751a61d23fa193de740119df7fff75  hangil.apk
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

So an update is:

1. Copy the new build into `public/downloads/<slug>.apk` (and `public/<slug>/` for the web
   build).
2. `shasum -a 256 public/downloads/<slug>.apk`. Put the hash in `release.sha256` **and** on
   that APK's line in the list above, in the same commit.
3. Set `release.version`.
4. If the app has an update notice with a `version:`, the build now fails until you rewrite
   it for this release or delete it (see below).
5. `npm run build && npm run check`.

### Update notices

When an update needs the reader to do something first, such as take a backup before a key
change, give the app a `notice:`. The page then shows:

- a **red badge** on the corner of one download button, which links to the notice. It is a
  separate link beside the button rather than part of it, so the button still downloads.
- a **notice section** at the top of the reading column, with an anchor the badge jumps to.

```yaml
notice:
  badge: Had 1.0? Read first      # on the button; 28 characters at most
  heading: Had version 1.0? Take a backup before you update
  body: |                         # paragraphs, separated by a blank line; tokens allowed
    Version {version} is signed with a new key, so Android will not install it over 1.0.

    Updates after this one install over the top.
  version: 1.0.1                  # optional: the release this was written for
  until: 2026-12-31               # optional: the last day it shows
  download: /downloads/hangil.apk # optional: which button wears the badge
  id: update-notice               # optional: the anchor; this is the default
```

- **`version`** ties the notice to one release. When `release.version` changes, the build
  fails with "notice was written for 1.0.1 but release.version is 1.0.2", so a notice
  about one update can never sit silently on the next one.
- **`until`** takes the notice down after that date. The site is static, so the notice goes
  at the next build after the date. The deploy workflow rebuilds once a day for this
  reason, so it is gone within a day.
- **`download`** defaults to the `release.apk` button, or the first download if the app
  has no release.

Only one notice per app. The red (`--alert` in `global.css`) is used for nothing else, so
a page with no notice has no red on it. To remove a notice, delete the `notice:` block, and
any sentence elsewhere on the page that points to it.
