# guides/ — how to use each app

One markdown file per app guide, named for the app's slug. A guide is optional: an app
without one just has no guide link, and nothing else on the site changes.

Everything lives in frontmatter rather than in the markdown body, because every step has
the same shape and the build should reject a half-written one rather than render it.

```yaml
app:   logger            # must match an app slug in apps/
title: How to use LOGGER
lead:  One sentence setting expectations — what happens after. Never a time: nobody has
       measured how long it takes, and inventing it is hard rule 1.
outcome: What the reader has at the end, in this app's terms — say whether it needs a
       connection or an account. Shown in the "What you end up with" card; the template
       adds Cost (from the app's price) and Account (from its privacy) itself.
before:                  # what to have ready before starting
  heading: Before you start
  body: …
  items: [ … ]           # at least one
steps:                   # the first-run setup, in order
  - image:  02-shift     # filename (no extension) in public/assets/<app>/guide/
    alt:    …            # describes what is ON the screen, for someone who cannot see it
    kicker: Step 2       # the small label above the title
    title:  …            # what the person does here, as an instruction
    body:   …            # what the screen asks and why
    note:   …            # optional — the catch, the thing that costs them if unknown
after: [ … ]             # same shape: daily use, and anything beyond setup
```

## Writing the copy

The reader may be reading their third language on a cheap phone. So:

- **Instructions, not descriptions.** "Copy your 기본급 from your payslip", not "The basic
  salary screen allows entry of the base wage."
- **Short sentences.** One idea each.
- **Keep the Korean terms.** 기본급, 잔업, 근로계약서 — these are the words printed on the
  paperwork the reader is holding. Translating them away makes the app harder to match to
  a payslip, not easier.
- **`note` is for what costs them if they don't know it.** The unpaid-break trap is the
  model: put a paid coffee break in that list and you lose that time every single day.
  If a step has no such catch, leave `note` out rather than padding it.

## Screenshots

**Never draw a screenshot by hand, and never show a screen that does not exist.** Capture
them from the shipping app:

```bash
npm run dev                      # serves the app at /logger/
node tools/capture-guide.mjs     # writes public/assets/<app>/guide/*.png
```

Re-run it whenever the app changes. A guide showing a screen the app no longer has is
worse than no guide, because the reader assumes they are the one who is lost.
