# Changelog

All notable changes to this site are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- `tools/capture-hangil-guide.mjs` judges each word on its own: a word the app cuts off
  (card descriptions stop at two lines) or hides no longer counts as shown, and neither
  does the rest of a paragraph that runs below the screen. It reads text boxes but not
  sliders or checkboxes, and it stops the streak flame's animation, so every run takes the
  same 01-today.png.

## [1.4.9] — 2026-10-12

### Fixed
- The HANGIL guide places the Weak spot card right for a reader who has set a trade: it
  comes after the trade's card as well as the four tiles.
- `tools/capture-hangil-guide.mjs` no longer counts words behind the app's top bar or tab
  bar as shown, and it reads what a dropdown or text box shows. The trade screenshot is
  checked for the trade it names again.

## [1.4.8] — 2026-10-12

### Fixed
- The HANGIL guide says where the Weak spot card is: further down Today, below the tiles.
  It also says the card shows only when the worst topic is under 80% right.
- `tools/capture-hangil-guide.mjs` counts only the words inside the screenshot's frame when
  it checks a shot, not the whole page, and checks three shots for more of their caption.
- `install/README.md` lists every rule the build holds an install file to. A build error
  about a misnamed or second install file names the file as it is on disk.
- `npm run check` reads `release.web` as a site path, without its `?` or `#` part and
  decoded, as the build does.
- `tools/make-sample-record.mjs` removes its scratch folder when stopped with Ctrl-C.
- The Report a problem link is spaced from the sentence before it when the page is read
  without its styles, in reader mode or as copied text.

## [1.4.7] — 2026-10-12

### Added
- Each unchecked translation of the install steps ends with a Report a problem link, where
  it asks to be told what reads wrong. The only link was at the foot of the English page.

### Fixed
- The HANGIL guide says how to reach Weak spots: there is no tab, only a card on Today.
  The capture script checks every shot shows what its caption says, and that the card is there.
- The build refuses an install file with no `en`, an empty one, a translation with a step
  or section more or fewer than `en`, a file not named after its app, and a second file
  for the same app.
- An icon path with a space or non-ASCII folder name is found on disk instead of failing
  the build as missing.

## [1.4.6] — 2026-10-12

### Fixed
- `npm run check` fails when an APK has no `assets/www/` to compare with `release.web`,
  instead of comparing nothing and reporting a match. It also fails in CI when `unzip` is
  missing, runs from any folder, and reads a file name containing `[` correctly.
- `tools/make-sample-record.mjs` renders the picture in its temporary folder and copies the
  record, the CSV and the picture in together at the end, so a crash partway leaves all
  three as they were and removes the folder. It also runs from any folder.

## [1.4.5] — 2026-10-12

### Fixed
- `npm run check` compares the web app packed inside each APK with the folder the site
  serves at `release.web`, file by file, and fails on any difference. LOGGER's page says
  the two hash identically, and nothing checked it. README.md § Shipping an app update
  now says to take the web build out of the APK.
- `tools/make-sample-record.mjs` writes nothing when it refuses a record. It used to
  overwrite `record.html` and `records.csv` before refusing, and say only that the picture
  was left alone.

## [1.4.4] — 2026-10-12

### Changed
- LOGGER's download and browser version are 1.2.23, up from 1.2.8. The guide's breaks and
  document screens are recaptured from it (the breaks screen no longer has an "every day"
  chip, and the name prompt has rounded corners), and the sample record's footer says
  1.2.23.

## [1.4.3] — 2026-10-11

### Fixed
- `tools/make-sample-record.mjs` checks the record it made before rendering it. If the
  invented worker, the four shifts or the pay period is missing, because a tap or fill
  failed along the way, it lists what is missing, leaves `12-record.png` alone and exits 1.
  It used to render whatever it got and exit 0.

## [1.4.2] — 2026-10-11

### Fixed
- `tools/make-sample-record.mjs` now renders `12-record.png` from the record it has just
  saved, so the picture in LOGGER's guide and the record `npm run check` reads always come
  from the same run. It exits with an error, leaving the picture alone, if no record was
  saved. `tools/render-page.mjs`, the separate second step, is gone.
- README.md § Shipping an app update: re-running the capture scripts is now a step for
  every app. It was filed under "LOGGER only", where a HANGIL update would skip it.

## [1.4.1] — 2026-10-11

### Fixed
- `npm run check` fails when the sample work record in LOGGER's guide was made by a
  different LOGGER than the one served, and README.md § Shipping an app update now says
  to regenerate it. It said "LOGGER v2" through two releases because nothing did. (S1)
- `tools/capture-logger.mjs` pins 2026-09-14 06:45 in Korean time, as the sample-record
  generator does. Before, it pinned 06:45 in whatever zone the machine was in, so the two
  only agreed on a Mac set to Korean time. (S2)

## [1.4.0] — 2026-10-11

### Changed
- LOGGER's download and browser version are 1.2.8, up from 1.0.
- HANGIL's are 1.0.2, up from 1.0.1, with vocabulary sets v13–v24. The page now says
  404 words, and the 1.0 key-change notice is rewritten for 1.0.2.

### Fixed
- The sample 근무내역서 in LOGGER's guide said "LOGGER v2" in its footer. It is
  regenerated from 1.2.8 and now says "근무기록 LOGGER 1.2.8". `make-sample-record.mjs`
  pins the clock to the same moment as `capture-logger.mjs`, so a re-run records the
  09.01 → 09.30 period the guide shows instead of whatever days are current.

## [1.3.0] — 2026-09-26

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

[Unreleased]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.9...HEAD
[1.4.9]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.8...v1.4.9
[1.4.8]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.7...v1.4.8
[1.4.7]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.6...v1.4.7
[1.4.6]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.5...v1.4.6
[1.4.5]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.4...v1.4.5
[1.4.4]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.3...v1.4.4
[1.4.3]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/itsdoubleem/itsdoubleem.github.io/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/itsdoubleem/itsdoubleem.github.io/releases/tag/v1.0.1
