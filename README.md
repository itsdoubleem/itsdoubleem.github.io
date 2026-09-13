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
2. **Everything here is free, and stays free.** That is a position, not a launch promo.
   No pricing, no tiers, no upgrade prompts, no email-gated downloads.
3. **Verify a claim against the running app, not against a grep.** Check that a feature
   exists by using it on screen, and that it is gone by failing to find it on screen. This
   applies doubly to privacy claims: if a page says data never leaves the device, someone
   checked that recently.

The site collects nothing, so it needs no cookie banner — and it loads no scripts at all.
Keep both true.

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

## A note on LOGGER

LOGGER is a separate project in its own folder and is not vendored here. This repo carries
its built output — the Android package and the offline web build — so the download buttons
have something to point at on a CI runner, which builds from the repository and cannot see
an ignored file. Re-copy both after any rebuild of the app; they are committed
deliberately, not by accident.
