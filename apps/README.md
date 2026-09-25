# apps/ — the content source of truth

One markdown file per app. The homepage grid and every detail page are generated from
these files. **Adding an app is adding a file here** — never hand-write a page in `src/`,
and never hardcode an app name in a component.

## Frontmatter schema

Every field below is required unless marked optional. The Astro content collection
validates this, so a typo fails the build rather than shipping a broken page.

```yaml
slug:        logger              # url segment; must match the filename
name:        LOGGER              # display name, as the app calls itself
nativeName:  근무기록             # optional — the name in its own language
tagline:     Records your shifts and works out what you're owed.
                                 # one sentence, verb first, max ~90 chars
audience:    For foreign workers in Korea, and above all for people on an E-9 visa.
                                 # optional, max ~120 chars. Who this is FOR, rendered in
                                 # the hero right under the tagline — a stranger asks "is
                                 # this for me?" before "what does it do?". Name the real
                                 # audience even when it is narrow; a narrow one stated
                                 # plainly is worth more than a wide one implied. Leave it
                                 # out when the honest answer is "anyone", and never widen
                                 # it to make the work look bigger.
                                 # The hyphen in E‑9 is a NON-BREAKING one (U+2011). A
                                 # plain hyphen is a line-break opportunity, and the hero
                                 # duly wrapped it as "E-" / "9 visa." Use U+2011 in any
                                 # short token that must not split — a visa class, a model
                                 # number, a version.
type:        app                 # app | tool | writing | novel | bot | other
                                 # what KIND of thing this is — the homepage groups by it.
                                 # A section appears only when something is in it, so an
                                 # empty category never advertises work that is not there.
category:    Work                # subject matter: Work, Study, Health, Productivity, Tools
status:      live                # live | beta   — never "coming soon"
platforms:   [android, web]      # android | ios | web | macos | windows
price:       free                # the only value the schema accepts today — see the note
                                 # below before adding a second one
privacy:     on-device           # on-device | account-required
                                 # "on-device" is a factual claim — check it on the
                                 # running app before writing it (rule 3 in README.md).
languages:   [ko, en, vi, zh, th, id, ne, km]   # optional, ISO 639-1
icon:        /assets/logger/icon.png   # square PNG, at least 192px — the build checks.
                                 # Shown before the name on the app page and wherever
                                 # there is no card; drawn by src/components/AppIcon.astro,
                                 # which rounds the corners, so full-bleed or pre-rounded
                                 # artwork both work. Never add a second icon field.
                                 # With release.web set, it must be byte-identical to
                                 # the 512x512 icon that build's manifest.webmanifest
                                 # names — copy it from there. The page then draws the
                                 # manifest's 192x192 icon, so keep both in the build.
screenshots:                     # optional but strongly preferred
  - src: /assets/logger/guide/08-pay.png     # must exist in public/ — the build checks
    alt: What the screen shows, for someone who cannot see it
order:       1                   # sort position on the homepage; lower comes first
sourceUrl:   ""                  # optional; omit rather than linking a dead repo
downloads:                       # at least one
  - label: Download for Android
    href:  /downloads/logger.apk
    note:  Version {version} · APK, {apkSize} — install directly   # optional; never type
                                 # the size or hash — use the tokens (see release:)
  - label: Open in browser
    href:  https://…
    note:  Works offline after first load
release:                         # optional; required once the page offers an APK
  version: '1.0'                 # quote it — YAML reads a bare 1.0 as the number 1
  apk:     /downloads/logger.apk # must be one of the downloads above
  sha256:  c180…                 # the build fails if it is not the file's hash
  web:     /logger/              # optional; enables {webSize}
notice:                          # optional — see README.md § Update notices
  badge:   Had 1.0? Read first
  heading: …
  body:    |
    …
```

## Body

The markdown body becomes the detail page. Use these headings, in this order, and omit
any that would be padding:

- `## What it does` — three or four sentences. Concrete.
- `## Who it's for` — name the actual person. Vague audiences produce vague pages.
  The `audience` frontmatter line is the one-sentence version of this section, and the
  two must agree: if the hero says E-9 and the section says "anyone who works shifts",
  the page contradicts itself in the space of one scroll.
- `## What it is not` — the honest limits. This section is not optional for anything
  that touches money, law, health or safety, and it is the most-read part of the page
  for a cautious visitor.
- `## Your data` — what leaves the device. If the answer is "nothing", say so plainly
  and say how it is enforced.
- `## Getting it` — anything install-specific worth knowing. **Check `platformNotes`
  first:** if what you are about to write is "on Android it does X, in a browser it does
  Y", it belongs in that frontmatter field, which renders as its own *Where it runs*
  section. LOGGER has no `## Getting it` for exactly this reason — the section said the
  same things twice, and the structured version says them better.

### Four things the body must not contain

Every one of these was found in a shipped description and removed on 2026-09-20. They
are easy to write without noticing, because each of them *feels* like it is helping.

1. **The same sentence twice.** LOGGER said "every Korean payslip term stays on screen
   beside the translation, so the words you read match the words on the company's
   paperwork" in *What it does* and again, almost verbatim, in *Who it's for*. HANGIL
   explained its empty HRD Korea shelves in two sections and argued that its questions
   were original in three places. Say it once, in the section that owns it.

2. **Claims about how people use it.** LOGGER's *Your data* justified its design with
   "workers pass this app between themselves" — presented as a fact, observed by nobody,
   and impossible for a reader to check. The design reason was available and true
   without it: a pay record is sensitive, so the app does not keep a copy. **If you
   cannot point at where a statement came from, it breaks rule 1 (README.md § The rules)
   whether or not it has a number in it.**

3. **The builder.** Not just the developer's name and email, which stay off app pages
   unless the owner asks for them — the biography too. "It was built with and for one E-9 factory worker in Korea"
   and "it is one person's study app" both went. The origin story belongs on the about
   page, once; on an app page it reads as an appeal to authenticity in place of a fact
   about the software. First person is still fine where the author is genuinely the
   subject — *"the file I built"* in a `verify` entry is a provenance claim and stays.

4. **Softeners that are really claims.** "You do not need to be good with phones" is a
   usability promise with nothing behind it. What replaced it is checkable: every screen
   is available in all eight languages.

**Numbers in the body get the same treatment as numbers anywhere else.** HANGIL prints
`197 words` and `twenty-four grammar units`; both were counted out of
`public/hangil/data/*.json` before being left in, and both were exact. If you cannot
count it from what ships, do not print it.

### `wrong` — the closing "tell me" aside

```yaml
wrong:
  heading: If a number here looks wrong
  body: Tell me. You do not need to be sure it is a bug — …
```

Optional. Without it the page falls back to copy that is true of anything.

**It exists because of a bug worth not repeating.** That aside was hardcoded in
`src/pages/apps/[slug].astro` in LOGGER's words — *"this does not match my payslip"*,
*"a wage figure that is quietly wrong"* — and rendered on every app page. So HANGIL, a
Korean study app with no payslip and no wage figures anywhere in it, spent its closing
paragraph asking readers to report a mismatched payslip. It shipped, and it was only
caught by reading the page on a phone.

README.md § Adding a piece of work already says nothing in `src/` names an app. **Copy
that is only true of one app is naming it**, even when the app's name does not appear.
If you find yourself writing a sentence in a shared template that you could not say
about the next piece of work, it belongs in `/apps`.

Write the body for what THIS app gets wrong, and make the heading name an error a reader
would actually notice.

## Optional frontmatter that grows the detail page

Each of these renders a section only when it has something in it, the same rule the
homepage uses for kinds. Leave them out and the page is simply shorter.

- `screenshots` — real captures with `alt`, an optional `caption`, and `shape`
  (`phone`, the default, or `page` for a sheet of paper, which spans the full width and is
  cropped to its head). If a capture shows amounts, **say in the caption that the figures
  are invented** — a stranger cannot tell sample data from a real payslip.
- `platformNotes` — `platform` + `note`, for what is different on each one.
- `release` and `notice` — documented in the repo's README.md (§ Shipping an app update,
  § Update notices), because they are about the release process as much as the page.
  Prose in downloads, platform notes, verify and the notice writes `{version}`,
  `{apkSize}`, `{sha256}` and `{webSize}` rather than the values.
- `verify` — `claim` + `how`. This is the site's replacement for install counters and star
  ratings: a number a visitor has to believe, swapped for something they can check.
  **Never add an entry you have not confirmed on the shipping build yourself.**

## About `price`

`price` accepts exactly one value, `free`, because `src/content.config.ts` declares it
`z.literal('free')`. That is a fact about the schema today, not a promise about every
app that will ever be listed — the site stopped making that promise on 2026-09-20, and
rule 2 in README.md § The rules says why.

If you ever add something that is not free, widening the literal is the small half of
the job. The word "Free" is also hardcoded in four places that never read this field:
the metadata line in `AppCard.astro`, the pill and the Price fact in `apps/[slug].astro`,
and the meta description of `apps/index.astro`. (The guide page reads the field.) Widen
the schema without threading the value through those, and the site will confidently
print "Free" over a price that is not.
