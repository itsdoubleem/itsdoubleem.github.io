---
# Written by tools/sync-apps.mjs from the GitHub Release. Edit it if you like; it is
# written again when the release's notes change, or when the next release arrives.
version: '1.6.0'
date: 2026-11-09
url: https://github.com/itsdoubleem/Logger_app/releases/tag/v1.6.0
source: f80287e27106
---

**Dark mode.** SETUP has a new Display setting: Auto, Light or Dark. Dark is a graphite theme: a warm dark grey rather than black, so the cards keep their shape and every screen reads the way it does in light. Auto is the default and follows the phone's own dark-mode setting, switching the moment the phone does. A phone in light mode looks exactly as before until Dark is picked. In all 8 languages, on Android and iPhone.

**The status bar follows the screen.** The clock and battery icons at the top are now dark on the light screen and light on the dark one. Before, they were white on the light header and hard to see.

**Printed records always stay black on white.** A 근무내역서 you print or save is never darkened, by the app or by the phone's browser. It is evidence, and it must read the same on paper whatever the screen looks like.

**The punch clock is centred in Korean and Chinese.** The status line above the clock is short in those languages, and the clock looked pushed to the right under it. Both are now centred, and the START button still does not move when tapped.

Wage calculation is unchanged. Records are kept: install over the existing app with `adb install -r`. The full reasoning is in the CHANGELOG, ninety-third and ninety-fourth entries.
