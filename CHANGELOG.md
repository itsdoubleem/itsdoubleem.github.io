# Changelog

All notable changes to this site are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- HANGIL has a guide at `/apps/hangil/guide/`, linked from its page. It has three setup
  steps (follow the top card, set your trade, check the voice), then daily use: a
  lesson, practice, Review, weak spots, the exam side, a timed paper and backups. All ten
  screenshots are captured from the shipping app by `tools/capture-hangil-guide.mjs`.

## [1.2.0] — 2026-09-26

### Added
- LOGGER's page shows its install steps in all eight of the app's languages. A line of
  language names under the download buttons opens that language's steps, with no
  JavaScript. The seven translations were made with AI, and each says on the page that
  no native speaker has checked it yet. Any app can have this by adding `install/<slug>.md`.

## [1.1.2] — 2026-09-26

### Added
- `npm test`: unit tests for how an app's icons are read from its web build, run by Node's
  own test runner (no new dependency). CI runs them before building.

### Fixed
- An icon the web build marks "any maskable" is never taken as the page icon.
- The 192px icon the page draws is checked to be a real 192×192 PNG.
- An unreadable web manifest is named in the error; `512X512`, multi-size entries and
  `./`, `../` or `/` icon paths are all read correctly; icon error messages print the
  manifest's real path.

## [1.1.1] — 2026-09-26

### Fixed
- The check that an app page's icon is the one the app ships now fails when the web build's
  icon cannot be found, instead of passing without comparing anything. It reads the icon
  from the build's `manifest.webmanifest` rather than assuming a file name.
- The icon beside an app's name loads the app's 192px file (25 KB for HANGIL) instead of
  the 512px one (156 KB).
- A `?` or `#` in an asset path no longer crashes the build; a file that is not a real PNG
  is reported as such; the fallback card icon loads lazily again.

## [1.1.0] — 2026-09-26

### Added
- Every app page shows the app's icon before its name — LOGGER and HANGIL today, and any
  app added later without further work. The build refuses an icon that is not a square PNG
  of at least 192px.

### Changed
- The red update-notice badge on a download button no longer has a white ring round it.

### Fixed
- HANGIL's page showed an older icon with a beige ground; it now shows the approved white
  one the app ships. The build now fails if an app's page icon differs from the icon in its
  web build.

## [1.0.1] — 2026-09-26

### Fixed
- HANGIL: the review gaps now match the app (a day, three days, about a week, about three
  weeks); the audio and data text no longer contradicts the online voice in Chrome and Edge;
  units have five or six example sentences.
- LOGGER: the overtime rules are no longer presented as universal. The page and the guide now
  name the two common exceptions, workplaces with fewer than five employees and farm and fishing
  work (근로기준법 §63), and point to ☎ 1350.
- LOGGER guide: covers getting the app, phones with no fingerprint sensor, and words the §54
  break rule as the law does. The shared guide template no longer claims every app keeps
  everything on your own phone.
- Front page and README: no longer name tools, which do not exist yet, or promise that
  everything is free.
- Science deck: seven chapters corrected (supernovae and heavy elements, Earth's water, the
  origin of life, walking upright, the first stone tools, the Cambrian, cuneiform).

### Changed
- Korean terms are glossed in English the first time each appears, and repeated text is cut.
- HANGIL's page describes its trade section: eight manufacturing job groups, each with 26
  words and 20 questions.

[Unreleased]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/itsdoubleem/itsdoubleem.github.io/releases/tag/v1.0.1
