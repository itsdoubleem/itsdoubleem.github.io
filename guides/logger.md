---
app: logger
title: How to use LOGGER
lead: Set it up once. After that it is one tap when you arrive and one when you leave.
outcome: LOGGER set up on your own phone. It is free, it works with no connection, and there is no account at any point.
before:
  heading: Before you start
  body: You do not need anything to begin — the app works straight away and asks for each figure at the moment it matters. But two papers make it exact, so have them nearby if you can.
  items:
    - Your 급여명세서 payslip, for the 기본급 basic salary figure.
    - Your 근로계약서 contract, which says which days go on one payslip.
    - Nothing else. No account, no email, no signal.
steps:
  - image: 01-language
    alt: The welcome screen, with eight languages laid out as large buttons.
    kicker: Step 1
    title: Choose your language
    body: Eight languages — 한국어, English, Tiếng Việt, 中文, ไทย, Bahasa Indonesia, नेपाली and ភាសាខ្មែរ. Tap yours and the whole app changes.
    note: The Korean payslip words stay on screen next to your language. That is on purpose — the words you see here are the words printed on your company's paperwork, so you can match them.
  - image: 02-shift
    alt: A screen asking which shift you work, with Day only, Night only and Rotating, and a time wheel set to 09:00.
    kicker: Step 2
    title: Say which shift you work, and when it starts
    body: Day only, night only, or rotating — then the time your shift begins. This is the one thing the app cannot work out by itself. Everything else is set by law or calculated.
    note: You never set a finishing time. The moment you clock out is your 퇴근. The app shows where eight hours are reached; anything past that pays 잔업 overtime ×1.5.
  - image: 03-breaks
    alt: A screen for unpaid meal breaks, showing one break from 11:30 to 12:30 lasting 60 minutes.
    kicker: Step 3
    title: Enter your unpaid breaks
    body: Lunch, dinner, or any break you are not paid for. Add one for each — the app takes them off your hours every shift. There are quick buttons for "It is 30 minutes" and "There is no meal break".
    note: Only put a break here if it is genuinely unpaid. If the company pays your ten-minute coffee break, leaving it out is correct — put it in and you lose that time every single day. 근로기준법 §54 says only a real break, where you are free to leave your post, is unpaid.
  - image: 04-wage
    alt: A screen asking for your basic salary, pre-filled with 2,156,880 won.
    kicker: Step 4
    title: Copy your 기본급 from your payslip
    body: One number — the figure your payslip calls 기본급. Your hourly rate, overtime, night premium, tax and insurance are all worked out from it.
    note: The app starts with the 2026 legal minimum (최저임금 ₩10,320 × 209 hours = ₩2,156,880). That is a placeholder, not your salary. You can tap "Not now" and come back — until you replace it, the amounts are only an example.
  - image: 05-payperiod
    alt: A screen for choosing which days fall on one payslip, and which day is payday.
    kicker: Step 5
    title: Set your pay period and payday
    body: Which days go on one 급여명세서, and the day you are paid. Pick one of the common patterns — day 1 to month end, 11th to the 10th, 21st to the 20th — or type your own.
    note: The law does not set this; every company differs. Your 근로계약서 says it, and so does the top of your payslip.
  - image: 06-summary
    alt: A summary screen confirming shifts, pay setup, and pay period are all set.
    kicker: Done
    title: That is the whole setup
    body: Three things set, and the app is ready. From here it records shifts and works out what you are owed.
after:
  - image: 07-punch
    alt: The daily punch screen, showing the date, an assumed day shift, and a fingerprint pad reading "verify to clock in".
    kicker: Every day
    title: One tap when you arrive, one when you leave
    body: Press the pad with your fingerprint. The app decides on its own whether it was a day or a night shift and takes your breaks off. Nothing to fill in.
    note: Forgot to punch at the start? Tap "I clocked in earlier today" and type the real time. There is also a calendar for adding a whole shift you already worked — pick the date, set the hours, confirm.
  - image: 08-pay
    alt: The pay screen showing an estimated take-home figure with a breakdown of earnings below it.
    kicker: Any time
    title: See what you are owed, before payday
    body: An estimated take-home for the period so far, with the arithmetic underneath — basic pay, overtime, night premium, tax and insurance. Check it against the payslip the company hands you.
    note: These are estimates for your own reference. The binding figures are the ones on your company's 급여명세서.
  - image: 10-document
    alt: The pay tab's document section, showing a name prompt, a "create a work record" button, and confirmation that 근무내역서-09010930.html was created, with a CSV export below it.
    kicker: The document
    title: Make a record you can hand to someone
    body: At the foot of the 급여 PAY tab, "CREATE A WORK RECORD" makes a one-page Korean document covering every day of that pay period — your punches, hours, rate, the arithmetic, and any 52-hour breach or unpaid holiday premium. There is a CSV export beside it for a spreadsheet.
    note: It is written in Korean whatever language you read the app in, so your company, a 노무사 or a 근로감독관 can read it. Your name is the one thing only you can add — it is the only place the document prints it, and without it the page says «성명 미기재». Each pay period keeps the rates that were in force while you worked it, so a raise today does not rewrite an old document.
  - image: 12-record
    alt: The work record document — worker name, company, the rate basis, a table of every day worked, totals, and a notice stating it is a record the worker wrote themselves.
    kicker: What comes out
    title: The 근무내역서 itself
    body: One page, in Korean, listing every day of the period with its punches, hours and money, then the totals. If you worked past the 주 52시간 limit in any week, it says so in a red box with the weeks named. Open it in your phone's browser and print it, or send the file.
    note: It opens by stating that it is a record the worker wrote themselves — not a certificate from a company or an agency. That line is deliberate. It also carries the 고용노동부 helpline, ☎ 1350, so whoever reads it knows where to go next. This example is invented data.
  - image: 13-csv
    alt: The CSV file's contents — a header row of Korean column names, then one line per day with the worker name, date, shift type, punches and hours.
    kicker: What comes out
    title: Or a CSV, for someone who wants the numbers
    body: Every day the app has, with Korean column headings, as a plain spreadsheet file. It opens in Excel or Google Sheets — the file to hand a 노무사 or a 상담소 who wants to add it up themselves.
    note: This example is invented data too. Nothing on this site is made from a real worker's records — a shift pattern and a 52-hour breach identify a real employer even after the name is changed.
  - image: 11-setup
    alt: The settings screen, with a required section and an optional "make it more exact" section.
    kicker: Optional
    title: Make it more exact
    body: Settings has a second section — allowances and deductions, 4대보험 insurance and tax, company rules, and your own name. The app works without any of it.
    note: Open one of these when your payslip and the app disagree. That disagreement is usually the interesting part, and this is where you close the gap.
---
