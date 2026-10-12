# releases/ — what changed in each app's current release

One file per app, named by slug, written by `tools/sync-apps.mjs` from the app's Latest
GitHub Release. The app page shows it as **What's new in {version}**, in red under the
download button's "New" pill, for the seven days the release counts as new.

```yaml
---
version: '1.2.25'     # must equal release.version in apps/<slug>.md — the build checks
date: 2026-10-12      # the release day, in Korea
url: https://github.com/…/releases/tag/v1.2.25
---

The release notes, as written, cut down sentence by sentence: no HTML tags or images,
no PR numbers or GitHub's generated "What's Changed" lines, headings as bold lines, links
into the app's repo reduced to their words, and no sentence carrying a hash, this site's
address or CHANGELOG.md (tools/sync-lib.mjs, cleanNotes).
```

**Required while the release is new.** The build fails for an app whose release is in its
seven new days and has no file here, or an empty one — so every app's pill comes with its
description. You can edit the text; the next release replaces the file. The sync writes it when a new
release arrives, or when the file is missing.
