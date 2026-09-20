---
slug: hangil
name: HANGIL
nativeName: 한길
tagline: Teaches you the Korean the EPS‑TOPIK asks for, and keeps going after you pass.
audience: For people sitting the EPS‑TOPIK, and for anyone in Korea tired of getting by on survival Korean.
type: app
category: Study
status: live
platforms: [android, web]
price: free
privacy: on-device
languages: [en, ko]
icon: /assets/hangil/icon.png
card: /assets/hangil/card.png
screenshots:
  # The Today screen is the card image and the hero, so the strip starts after it:
  # what a lesson actually looks like, what the exam side offers, and the shape of a
  # question you will meet on the paper.
  - src: /assets/hangil/shots/03-lesson.png
    alt: A lesson titled Turning a whole sentence into an adjective, with the forms (으)ㄴ, 는 and (으)ㄹ in orange beneath it, above several paragraphs explaining how Korean puts a whole clause in front of the noun
    caption: A unit from the last level. The explanation comes first and is written out in full — the app is not a flashcard deck with a grammar note attached.
  - src: /assets/hangil/shots/05-exam.png
    alt: The exam menu, offering Practice paper 1 at 40 questions and 50 minutes, above a list of question types including Signs and notices and The right word, each labelled 읽기 reading with a question count
    caption: The exam side. The question types are the ones the paper uses, so nothing on the day is a surprise format. The day-streak and review counts visible in these captures come from a sample of progress made while taking them, not from anyone's study record.
  - src: /assets/hangil/shots/06-sign.png
    alt: A practice question showing the Korean sign 출입 금지 in a bordered box, with the Korean instruction to choose the correct meaning and four Korean answer options below it
    caption: A sign question. Where the paper photographs a sign, this prints the sign's own words — the words are the thing being tested. Questions built on a drawing have a drawing.
  - src: /assets/hangil/shots/08-picture.png
    alt: A listening question headed in Korean, asking the reader to listen and choose the correct picture, above a two-by-two grid of four line drawings labelled A to D — a safety helmet, a glove, safety goggles and a face mask
    caption: A picture question. You hear one Korean sentence and pick the drawing it describes, with nothing written down to fall back on. The drawings are original line art made for this app.
  - src: /assets/hangil/shots/07-vocab.png
    alt: The Safety vocabulary set, listing 안전, 위험 and 조심 with romanisation, English meaning and a Korean example sentence under each, with a round play button beside every word
    caption: Vocabulary, grouped by where you will hear it. Every word and sentence has a play button.
platformNotes:
  - platform: android
    note: Installs from the file itself, with no store account. Your phone will warn you about installing from outside the store — that warning is normal for anything distributed this way. The Android app speaks Korean through the phone's own speech engine, so it can use a better voice than a browser can, and Settings lets you pick which engine and which of the installed Korean voices reads to you. Your progress lives in the app's own storage, so it survives an update.
  - platform: web
    note: It opens in any browser and there is nothing to install, but it is meant to be added to your home screen — on Android, Chrome's menu › Add to Home screen; on iPhone, Safari's share button › Add to Home Screen. After that it opens full screen like any other app and works with no connection. Your progress lives in that browser's storage for this address, so it does not follow you to another phone or another browser — take a backup from Settings before you switch.
verify:
  - claim: It works with no connection.
    how: Open it once with a connection, then turn airplane mode on and open it again. The course, the vocabulary, the exam papers and the review deck all still work. The whole app is 857 KB and your browser keeps a copy after the first visit.
  - claim: It cannot send your progress anywhere.
    how: Open your browser's network panel and use the app. Every request it makes is for its own files, and once it has loaded it makes none at all — answering a question sends nothing. There is no account to sign into, no analytics, and no third-party script on the page.
  - claim: The Android app cannot reach the internet at all.
    how: It asks for no internet permission. Unzip the APK and read its manifest — with that permission absent, Android will not let the app use the network, whatever anybody claims about it. The trade-off is real and worth knowing — it also rules out the speech engines' online voices, which are better than the offline ones, so the app is limited to the Korean voices already on your phone.
  - claim: The APK you download is the file I built.
    how: Hash it before you install it — shasum -a 256 hangil.apk on macOS or Linux, certutil -hashfile hangil.apk SHA256 on Windows. It must print ce5c778114ce1c92cf19fab02e11494dc841921b76ca758f000f5ca0a1d31f6e. One character out and it is not my build, so delete it.
  - claim: The Korean audio is your own phone speaking, not a download.
    how: Turn airplane mode on and press any play button. It still speaks, because the app hands the sentence to the phone's own text-to-speech engine. That is why there is no audio to wait for — and why, if your phone has no Korean voice installed, the app says so on the first screen instead of playing you something wrong.
order: 2
sourceUrl: ""
downloads:
  - label: Download for Android
    href: /downloads/hangil.apk
    note: APK, 1.9 MB — install directly, no store account
  - label: Open in browser
    href: /hangil/
    note: Works offline after the first load — add it to your home screen
---

## What it does

HANGIL teaches Korean in two directions at once, because the people who need the
first one usually want the second.

**The exam side** covers the EPS-TOPIK. It drills the question types the paper
actually uses — including the **picture questions the paper opens with**, both
directions: see a drawing and choose the Korean word, or hear a sentence and
choose which of four drawings it describes. Alongside those it drills what a sign
means, which word fills the gap, which sentence says the same thing, and what the
two people in the conversation just agreed. Then there is a full forty-question
paper with a fifty-minute clock that does not stop. You find out what you got
wrong at the end, with the reason, one question at a time.

**The course side** is twenty-four grammar units that start at *this is a
passport* and end at reading the sentence in your contract that says wages shall
be paid on a fixed date at least once a month. Each unit is a written
explanation, a table, five real sentences with audio, the mistakes people
actually make, and a mixed exercise set — multiple choice, word order, listening,
matching.

Underneath both sits **one review deck**. Everything you answer goes into it, and
comes back at a widening gap — a day, three days, a week, a fortnight. Get
something wrong and it starts again from today. A word you fumbled in unit three
will find you again while you are in unit eleven, which is the whole point.

Every Korean sentence in the app has a play button, and the voice is your own
phone's. Nothing is downloaded and nothing is streamed, so the audio works in
airplane mode on a factory floor with no signal. On Android you choose which
speech engine and which of its Korean voices reads to you — most phones have
four or five installed and they do not sound alike, so it is worth a minute in
Settings to find the one you can listen to for an hour.

There is also a **한글 trainer** for anyone who cannot read the letters yet, and
**197 words** grouped by where you will hear them — the shop floor, the safety
notice, the payslip, the clinic, the farm.

Two shelves sit empty on purpose, for material published free by HRD Korea that
you download yourself. One takes the official **listening files**; the other takes
the official **pictures**, and a picture named after one of the app's own drawings
quietly takes its place in every question that used it.

## Who it's for

**Anyone preparing for the EPS-TOPIK**, and anyone already working in Korea whose
Korean has stopped improving because survival Korean is enough to get through the
day.

It assumes nothing. If you cannot read 한글, unit zero is the alphabet. If you
can already hold a conversation, the last six units are the ones that sound like
an adult — modifying clauses, reported speech, the endings that carry attitude,
and the plain written style that contracts and government notices are written in.

It is built for a phone, used standing up, in the twenty minutes you have. Every
screen works one-handed, nothing needs a connection, and losing your place costs
nothing.

## What it is not

**It is not the exam, and it cannot tell you whether you will pass.**

The practice questions were written for this app in the shapes the real paper
uses, and the drawings are original line art made for it — nothing is traced,
scanned or lifted, and none of it is a past paper. The cut score is set by HRD
Korea for each round and is not a fixed number, so the app scores you out of 200
and stops there: a number claiming to predict a pass would be a number invented
to sound useful.

**It is not affiliated with HRD Korea, the EPS programme, or any exam body.** It
is an independent study app. It charges nothing, carries no endorsement, and
nothing you do in it is registered anywhere.

**It is not a translator or a legal reader.** The last unit teaches you to read
the grammar of a contract, which is worth a great deal and is not the same as
advice. If a document affects your pay or your visa, 고용노동부 고객상담센터 ☎
**1350** is free, has interpreters, and is open on weekdays 09:00–18:00. Any
외국인노동자지원센터 will read a contract with you.

**It bundles no HRD Korea material.** Their listening files and pictures are
published free; the app leaves a shelf for each and ships them empty.

## Your data

**Nothing leaves the device.** There is no server, no account, no sign-up, no
analytics and no telemetry. The Android app goes further and ships with no
internet permission at all, so the guarantee is enforced by Android rather than
merely stated here. Your progress, your review schedule and your exam
scores are in your browser's own storage and nowhere else — not because a setting
is switched on, but because the app has no code that sends anything anywhere.
Once it has loaded, it makes no network requests at all.

The trade-off is real: clear the browser's data and your progress goes with it.
Settings has a backup you can save to a file and restore later, and it is worth
doing before you change phones.
