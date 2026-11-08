---
# Written by tools/sync-apps.mjs from the GitHub Release. Edit it if you like; the next
# release replaces it.
version: '1.5.0'
date: 2026-11-09
url: https://github.com/itsdoubleem/Logger_app/releases/tag/v1.5.0
---

**A new punch card, drawn by the worker.** The punch card on the PUNCH tab now follows the worker's own design: a round START button on the left, green before a shift and salmon during one (STOP), beside the clock-in pill and a large clock. The button, the pill and the clock are centred in the card, and the button stays exactly where it is when you tap START. The card is shorter than before, so more of the screen is free below it.

**OFF SHIFT, the opposite of ON SHIFT.** Before a shift, a still grey ring with "OFF SHIFT" now sits beside the clock-in pill. After START it switches to the breathing green ON SHIFT lamp in the same spot. In all 8 languages.

**"I clocked in earlier today" is a slimmer pill.** It is now the same size as the red pay-period band on LOGS and PAY, still easy to tap, and its text stays on one line in Korean, Vietnamese and Indonesian.

**The app icon is no longer cut off.** On a Galaxy with a home-screen theme, the folder at the icon's lower right was clipped by the launcher. The icon is now nudged up and left and drawn slightly smaller, so the whole folder shows; launchers that crop icons to a circle no longer clip it either.

**The README is in English.**

Wage calculation is unchanged. Records are kept: install over the existing app with `adb install -r`. The full reasoning is in the CHANGELOG, ninety-second and ninety-third entries.
