---
slug: logger
name: LOGGER
nativeName: 근무기록
tagline: Records your shifts and works out what you're actually owed.
type: app
category: Work
status: live
platforms: [android, web]
price: free
privacy: on-device
languages: [ko, en, vi, zh, th, id, ne, km]
icon: /assets/logger/icon.png
card: /assets/logger/card.png
screenshots: []
order: 1
sourceUrl: ""
downloads:
  - label: Download for Android
    href: /downloads/logger.apk
    note: APK, 3.8 MB — install directly, no store account
  - label: Open in browser
    href: /logger/
    note: Works offline after the first load
---

## What it does

LOGGER records when you clock in and when you clock out. It works out on its own whether
a shift was a day shift or a night shift, applies Korean overtime and night-premium rules
from the 근로기준법, and shows you what your month should come to — before the company
hands you a 급여명세서, so you have something to hold it up against.

It shows you the arithmetic, not just a total — basic pay, 잔업 overtime, 야간 night
premium, tax and insurance, line by line, so you can check it against the payslip rather
than take its word for it.

From the 급여 PAY tab it also makes a **근무내역서**: a one-page Korean document covering
every day of the pay period — your punches, hours, rate, the arithmetic, and any 52-hour
breach or unpaid holiday premium. It is written in Korean whatever language you read the
app in, so you can hand it straight to your company, a 노무사 or 고용노동부. Each pay period
keeps the 기본금 and rates that were in force while you worked it, so a raise today does
not rewrite an old document.

There is a **CSV** export beside it for a spreadsheet, and a backup file you can save at
any time from 설정 › Backup.

It runs entirely on the phone. No account, no sign-up, no internet connection needed after
you install it.

It is available in eight languages — 한국어, English, Tiếng Việt, 中文, ไทย, Bahasa
Indonesia, नेपाली and ភាសាខ្មែរ — with the Korean payslip terms kept visible next to every
translation, so the words on your screen match the words on the company's paperwork.

## Who it's for

It was built with and for a factory worker in Korea on an EPS E-9 visa, then generalised
so it works for any visa and any company. If you work shifts in Korea, are paid by the
hour, and want to check the number on your payslip yourself, this is for you.

You do not need to read Korean to use it. You do not need to be good with phones.

## What it is not

**It is a calculator, not a lawyer and not a 공인노무사.**

It applies the law to a record you keep yourself and shows you the arithmetic. It does not
tell you what to do about the result, it does not draft or file a 진정 for you, it gives no
legal advice, and it is free — and it stays free, which is part of what keeps it a
calculator rather than labour consulting.

The binding numbers are the ones on your company's 급여명세서. Whether wages are actually
owed to you is for 고용노동부 and a 노무사 or a lawyer to decide, not for an app.

The 근무내역서 says all of this on its own face. It opens by stating that it is a record
written by the worker themselves — not a certificate issued by a company or an agency.

**If you need real help, it is free:** 고용노동부 고객상담센터 ☎ **1350**, weekdays
09:00–18:00, with interpreters. Also the 노동포털 at labor.moel.go.kr, and any
외국인노동자지원센터.

## Your data

**Nothing leaves your phone.** There is no server, no account, no telemetry and no
analytics — the app's entire database is your phone's own local storage. This is not a
setting you have to find and switch on; the app has no code that sends anything anywhere.

That is deliberate, and it is the reason the app is built the way it is: workers pass this
app between themselves, and their pay data is nobody else's business.

The trade-off is real and you should know it: if you lose the phone or clear the app's
data, the records are gone. Use the backup export in 설정 › 백업과 내보내기, and keep the
file somewhere you control.

## Getting it

The Android build installs directly from the file — you do not need a store account. Your
phone will warn you about installing an app from outside the store; that warning is normal
for any app distributed this way.

The browser version is the same app. Open it once with a connection and it keeps working
offline after that, including with the phone in airplane mode.

If your phone has a fingerprint sensor, the punch pad can use it, so clocking in is one
touch. The fingerprint never leaves the phone either — the app only ever learns that the
check passed.
