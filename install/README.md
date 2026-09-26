# install/ — how to install each app, in the app's own languages

One markdown file per app, named for the app's slug. Optional: an app without one shows
no language links, and nothing else on its page changes.

**Why it exists.** An app page is in English, and it is the page a person reads *before*
they have the app. LOGGER speaks eight languages, but the page you must get through to
install it spoke one. The step people get stuck on is Android's warning about installing a
file from outside the store. This translates that one block, not the site. BRIEF.md
put a translated site off until four apps. The owner approved this narrower piece on
2026-09-26.

**What it renders.** A line of language names under the download buttons ("How to install
it: 한국어 · English · Tiếng Việt …"), each in its own script. Then a section on the page
with one row per language, closed until the address points at it (`#install-vi`). It
uses CSS `:target` and no script, so it works with JavaScript off. The code is in
`src/install.ts` and `src/pages/apps/[slug].astro`.

```yaml
app: logger                 # must match an app slug in apps/
languages:
  en:                       # the source. Always checked: true. Write and change it first.
    checked: true
    title: How to install LOGGER
    sections:               # one per way of getting it — at least one
      - heading: On Android
        steps: [ … ]        # numbered on the page; at least one
  vi:                       # must be in the app's own `languages:` list
    checked: false          # has a native speaker checked it? Be honest.
    unchecked: …            # REQUIRED while checked is false, forbidden once it is true —
                            # one line, in that language, saying it is unchecked and
                            # asking to be told what reads wrong
    title: …
    sections: [ … ]
```

Languages appear in the order the app's `languages:` lists them, whatever the order here.
Tokens (`{apkSize}`, `{version}` …) work as they do in `apps/` prose.

## The build refuses

- a language the app does not list in `languages:`;
- `en` that is not `checked: true`;
- `checked: false` with no `unchecked:` line, or `checked: true` with one still there;
- a token this app cannot fill;
- an `app:` with no `apps/<app>.md`.

Tests for these are in `tests/install.test.ts`.

## How to write it

- **English first, then the rest.** Every translation says what `en` says, no more. When
  `en` changes, change every language and set each one back to `checked: false`.
- **Words the reader must match on a screen stay as that screen shows them.** The site's
  buttons are English on every page, so quote them in English ("Download for Android").
  Name the app's own menus as the app shows them *in that language*. Take the words
  from the app's language files, and look at the running app to see how they are laid
  out (hard rule 3). For LOGGER that is `tab_set`, `grp_backup` and `export_a_file` in
  `Logger_app/lang/*.json`. On screen the reader's word is the large one, with the Korean
  small beneath it.
- **Name Android's own switches only where you have seen the wording.** LOGGER's file
  names "Allow from this source" in English and 이 출처 허용 in Korean, and *describes*
  the switch in the other languages, because nobody checked those on a phone.
- **Say how it was translated.** The `unchecked:` line names the method truthfully, for
  example "translated with AI". A reader deciding how far to trust an install warning
  deserves to know.
- **A translation is not finished when it is written.** It is finished when a native
  speaker has read it, and only then does `checked` become true.

## Status

| App | Languages | Checked by a native speaker |
|---|---|---|
| LOGGER | en ko vi zh th id ne km | en only (the source). The other seven were translated with AI on 2026-09-26, and each says so on the page. |
