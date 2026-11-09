# releases/ — what changed in each app's current release

One file per app, named by slug, written by `tools/sync-apps.mjs` from the app's Latest
GitHub Release. The app page shows it as **What's new in {version}**, in red under the
download button's "New" pill, for the seven days the release counts as new.

```yaml
---
version: '1.2.25'     # must equal release.version in apps/<slug>.md — the build checks
date: 2026-10-12      # the release day, in Korea
url: https://github.com/…/releases/tag/v1.2.25
source: 52047d8904a3  # which GitHub notes this came from — written by the sync
---

The release notes, as written, cut down sentence by sentence: no HTML tags or images,
no PR numbers or GitHub's generated "What's Changed" lines, headings as bold lines, links
into the app's repo reduced to their words, and no sentence carrying a hash, this site's
address or CHANGELOG.md (tools/sync-lib.mjs, cleanNotes).
```

**Required while the release is new.** The build fails for an app whose release is in its
seven new days and has no file here, or an empty one — so every app's pill comes with its
description. The sync writes it when a new release arrives, when the file is missing, and when
the release's notes are edited on GitHub (within the hour). You can edit the text here too: a
`source:` line records which GitHub notes the file came from, so a hand edit lasts until the
release's own notes change or the next release arrives.
(Keep that line when you edit: a file without one is compared by its text and rewritten.)
Edited notes that would leave nothing to show, or that use a phrase `npm run check` refuses,
are not taken: the page keeps what it has, and the reason is only in the deploy run's log.
