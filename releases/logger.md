---
# Written by tools/sync-apps.mjs from the GitHub Release. Edit it if you like; it is
# written again when the release's notes change, or when the next release arrives.
version: '1.8.0'
date: 2026-11-14
url: https://github.com/itsdoubleem/Logger_app/releases/tag/v1.8.0
source: db9520569cfe
---

**Undo a mistaken clock-out.** For 9 seconds after STOP, a pink strip under the punch card lets you undo the clock-out with one tap. It removes the record and puts you back on shift from your original clock-in time. When the STOP counts as a short day, the early-out sheet carries the same undo as a button, shown 1.5 seconds after the tap so a second press of STOP cannot land on it.

**No early-out question after a full day.** A night of 21:00 to 07:39 was asking why the day ended early, because the line followed a usual 11-hour day. The line now never rises above a day without overtime: 9 clock hours from the shift start less the breaks set there, at most 8 worked hours. A 21:00 start is full at 06:00, 08:00 at 17:00, 20:00 at 05:00. A day with less overtime than usual is not an early out.

**Article 46 rows follow the same line.** A day with a company-fault reason that still ran its full hours shows no partial-shutdown shortfall row, and the reason sheet says so in all eight languages.

Predicted pay is unchanged. Records are kept: install over the existing app with `adb install -r`.
