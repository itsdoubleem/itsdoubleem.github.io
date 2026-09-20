# DOUBLEEM

One person's work, in one place. Apps, tools, and whatever else turns out to be worth
sharing. All of it free.

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
page — `/motion.js` and `/globe.js` — which move things and nothing else. On a wide screen
`/globe.js` fetches two more, `/three.min.js` and `/globe-scene.js`, to draw the globe
behind the story on the front page; on a phone it loads, finds it has nothing to do and
stops. three.js is vendored into `/public` under its MIT licence rather than loaded from a
CDN, so there are still no third-party requests, no analytics and no cookies. Keep both
true. All four are named in the about page's prose and in LOGGER's claim table; a fifth
one means editing those in the same commit.

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
from the shipping app by `tools/capture-guide.mjs`, never drawn — re-run it after any
change to the app, because a guide showing a screen that no longer exists is worse than no
guide: the reader assumes they are the one who is lost.

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → ./dist
```

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
`tools/capture-hangil.mjs`, the same way LOGGER's guide is by `tools/capture-guide.mjs`.

### Checking the downloads

The APKs this site serves are committed under `public/downloads/`. Their SHA-256 sums are

```
c180c7398240e4a1b0f1ef572418238253d373ce8d967ab314f3a32f37698dc7  logger.apk
0ed67ab7beb51714863133ae3c3e5db142e916acc35ea4cfab03d01ba67239a8  hangil.apk
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
reader who bothered to check that checking is pointless.
