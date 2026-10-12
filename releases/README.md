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

The release notes, as written, minus PR numbers, the download link and hash, and
pointers to CHANGELOG.md (tools/sync-lib.mjs, cleanNotes).
```

You can edit the text; the next release replaces the file. The sync writes it when a new
release arrives, or when the file is missing.
