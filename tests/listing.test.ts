// Tests for tools/listing-lib.mjs — what a description in an app's repo may do to its page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyListing, exportListing, parseListing, planListing } from '../tools/listing-lib.mjs';

const body = "## What it does\n\nCounts 404 words.\n\n## Who it's for\n\nLearners.\n\n## What it is not\n\nNot an exam.\n\n## Your data\n\nNothing leaves.";
const md = `---\nslug: x\nname: X\n# a comment that must survive\ntagline: Teaches words.\naudience: For learners.\ntype: app\nrelease:\n  version: 1.0.0\n  source: o/x\n  asset: x.apk\n  signer: abc\n---\n\n${body}\n`;
const listing = (b = body, front = 'tagline: Teaches words.\naudience: For learners.') => `---\n${front}\n---\n\n${b}\n`;
const plan = (text: string, approved?: string) => planListing({ slug: 'x', md, text, approved });

test('a listing that matches the page changes nothing', () => {
  assert.equal(plan(listing()).status, 'same');
});

test('ordinary prose publishes, and only the description changes', () => {
  const p = plan(listing(body.replace('Learners.', 'People learning Korean.')));
  assert.equal(p.status, 'publish');
  assert.match(p.md, /People learning Korean\./);
  assert.match(p.md, /# a comment that must survive\n/);
  assert.match(p.md, /release:\n  version: 1\.0\.0\n/);
});

test('a changed tagline is held, and publishes once approved, quoted when YAML needs it', () => {
  const text = listing(body, 'tagline: "Teaches: words."\naudience: For learners.');
  const p = plan(text);
  assert.equal(p.status, 'held');
  assert.deepEqual(p.reasons, ['it changes the tagline']);
  assert.match(p.changes[0], /\*\*tagline\*\*[\s\S]*Teaches: words\./);
  const ok = plan(text, p.id);
  assert.equal(ok.status, 'publish');
  assert.match(ok.md, /^tagline: "Teaches: words\."$/m);
});

test('the S9 tagline that contradicts LOGGER waits for approval', () => {
  const p = plan(listing(body, 'tagline: Labour-law advice for foreign workers, from your phone.\naudience: For learners.'));
  assert.equal(p.status, 'held');
});

test('a changed audience still publishes by itself', () => {
  assert.equal(plan(listing(body, 'tagline: Teaches words.\naudience: For people learning.')).status, 'publish');
});

test('a protected section is held, and shows the change', () => {
  const p = plan(listing(body.replace('Not an exam.', 'Nearly an exam.')));
  assert.equal(p.status, 'held');
  assert.match(p.reasons[0], /What it is not/);
  assert.match(p.changes.join(), /Nearly an exam\./);
  assert.equal(plan(listing(body.replace('Nothing leaves.', 'Little leaves.'))).status, 'held');
});

test('a changed number is held, as HANGIL\'s 197 against 404 would have been', () => {
  const p = plan(listing(body.replace('404', '197')));
  assert.equal(p.status, 'held');
  assert.match(p.reasons[0], /new: 197.*gone: 404/);
});

test('a number that moves between sections is a different claim, and is held', () => {
  const moved = body.replace('Counts 404 words.', 'Counts words.').replace('Learners.', 'Learners of 404 words.');
  const p = plan(listing(moved));
  assert.equal(p.status, 'held');
  assert.match(p.reasons[0], /change places/);
});

test('numbers in other forms are held too', () => {
  for (const text of ['Used by ten thousand workers.', 'Used by １００００ workers.', '만 명이 사용합니다.']) {
    assert.equal(plan(listing(body.replace('Learners.', text))).status, 'held', text);
  }
});

test('a new link is held, so nothing can point readers at another APK unread', () => {
  for (const text of ['[Get it](https://evil.example/x.apk)', 'See https://evil.example/', 'www.evil.example/x.apk', '*www.evil.example/x.apk*', '//evil.example/x.apk', 'me@evil.example']) {
    const p = plan(listing(body.replace('Learners.', `Learners. ${text}`)));
    assert.equal(p.status, 'held', text);
    assert.match(p.reasons.join(), /links change/);
  }
});

test('anything that could make readers see other than the gate saw is refused', () => {
  const hideAll = body.replace('Learners.', 'Learners.\n\n<!--') + '\n\n## Getting it\n\n--> Done.';
  const cases: [string, RegExp][] = [
    [hideAll, /raw HTML/],
    [body.replace('Learners.', '<style>a{display:none}</style>'), /raw HTML/],
    [body.replace('## Your data', '##\tYour data'), /not plain text/],
    [body.replace('Learners.', 'Learners.\n\n ## Your data\n\nWe keep it.'), /not plain text/],
    [body.replace('Learners.', 'Your data\n--\n\nWe keep it.'), /not plain text/],
    [body.replace('Learners.', '### Your data\n\nWe keep it.'), /not plain text/],
    [body.replace('Learners.', '```\nx\n```'), /not plain text/],
    // Line endings the checks do not split on and the renderer honours.
    [body.replace('Learners.', 'x\r```\r'), /line ending/],
    [body.replace('## What it is not', '\u2028## What it is not'), /not plain text|line ending/],
    [body.replace('Learners.', 'x\r## Your data, updated\r'), /line ending/],
    [body.replace('Learners.', 'x\u0085```'), /line ending/],
    // Headings and link definitions inside a container.
    [body.replace('Learners.', '> ## Your data, updated'), /not plain text/],
    [body.replace('Learners.', '- ## Your data, updated'), /not plain text/],
    [body.replace('Learners.', '1. ## Your data, updated'), /not plain text/],
    [body.replace('Learners.', '> Your data\n> ---'), /not plain text/],
    [body.replace('Learners.', '[Get it][x]\n\n> [x]: //evil.example/a.apk'), /link definition/],
    [body.replace('Learners.', '- [x]: //evil.example/a.apk'), /link definition/],
    [body.replace('Learners.', '[x]: https://evil.example'), /link definition/],
    [body.replace('Learners.', '    indented code'), /not plain text/],
    [body.replace('Learners.', '| a | b |'), /not plain text/],
    [body.replace('Learners.', 'a|b\n:-|:-'), /not plain text/],
    [body.replace('Learners.', '***'), /not plain text/],
    // Links disguised from the check, resolved by the renderer.
    [body.replace('Learners.', '_www.evil.example/a.apk_'), /not plain text/],
    [body.replace('Learners.', 'www\\.evil.example/a.apk'), /backslash/],
    [body.replace('Learners.', 'https:\\/\\/evil.example/a.apk'), /backslash/],
    [body.replace('Learners.', 'www&period;evil.example/a.apk'), /entity/],
    [body.replace('Learners.', 'https&colon;&sol;&sol;evil.example/a.apk'), /entity/],
    [body.replace('Learners.', 'owner&commat;evil.example'), /entity/],
    [`Used by people.\n\n${body}`, /before its first heading/],
    [`${body}\n\n---\n`, /not plain text/],
  ];
  for (const [text, why] of cases) {
    const p = plan(listing(text));
    assert.equal(p.status, 'refused', text);
    assert.match(p.reasons.join(), why);
    assert.equal(plan(listing(text), p.id).status, 'refused');
  }
});

test('ordinary writing still publishes: bold openers, italics, Korean, brackets, a phone number kept', () => {
  const prose = '**The exam side** is *practice*. 한글 (근무기록) "quoted" — ☎ stays.\nSee [not a link] and 5 > 3.\n**Bold** again.';
  assert.equal(plan(listing(body.replace('Learners.', prose))).status, 'held'); // 5 and 3 are new numbers
  assert.equal(plan(listing(body.replace('Learners.', prose.replace(' and 5 > 3', '')))).status, 'publish');
});

test('whatever verify would refuse is refused here, not left to hold back other apps', () => {
  assert.match(plan(listing(body.replace('Learners.', 'TODO later.'))).reasons.join(), /TODO/);
  assert.match(plan(listing(body, 'tagline: "a\\rprice: 0"')).reasons.join(), /control character/);
});

test('a tagline YAML would misread is quoted', () => {
  const approved = (t: string) => plan(t, plan(t).id).md;
  assert.match(approved(listing(body, 'tagline: Notes:')), /^tagline: "Notes:"$/m);
  assert.match(approved(listing(body, 'tagline: "null"')), /^tagline: "null"$/m);
});

test('text in an Issue cannot close the fence or carry a raw field name', () => {
  const p = plan(listing(body.replace('Not an exam.', 'Not ```` an exam. @octocat')));
  assert.equal(p.status, 'held');
  assert.ok(p.changes.join().includes('`````\nNot ````'));
  const bad = plan(listing(body, 'tagline: T\n@octocat <!-- x --> hello'));
  assert.ok(!bad.reasons.join().includes('octocat'));
  const heading = plan(listing(`${body}\n\n## @octocat <!-- hi`));
  assert.equal(heading.status, 'refused');
  assert.ok(!heading.reasons.join().includes('octocat'));
});

test('approval publishes exactly the text approved, and no other', () => {
  const text = listing(body.replace('404', '405'));
  const { id } = plan(text);
  assert.equal(plan(text, id).status, 'publish');
  const edited = listing(body.replace('404', '406'));
  assert.equal(plan(edited, id).status, 'held');
});

test('format breaks and banned phrases are refused, and approval cannot override them', () => {
  const missing = listing(body.replace('## Your data\n\nNothing leaves.', ''));
  assert.equal(plan(missing).status, 'refused');
  assert.equal(plan(missing, plan(missing).id).status, 'refused');
  assert.match(plan(listing(body.replace('Learners.', 'It stays free.'))).reasons[0], /banned/);
  assert.match(plan(listing(body, `tagline: ${'x'.repeat(91)}`)).reasons[0], /over 90/);
  assert.match(plan(listing(body, 'tagline: T\nrelease: evil')).reasons[0], /field "release"/);
  assert.match(plan(listing(body, 'audience: A')).reasons[0], /no tagline/);
});

test('leaving audience out keeps the page\'s, and does not read as a change', () => {
  assert.equal(plan(listing(body, 'tagline: Teaches words.')).status, 'same');
});

test('Windows line endings in a listing do not read as a change', () => {
  assert.equal(parseListing(listing().replace(/\n/g, '\r\n')).body, body);
});

test('an audience can be added to a page without one', () => {
  const noAudience = md.replace('audience: For learners.\n', '');
  assert.match(applyListing(noAudience, parseListing(listing())), /^tagline: Teaches words\.\naudience: For learners\.$/m);
});

test('both real pages round-trip through an exported listing unchanged', () => {
  for (const slug of ['logger', 'hangil']) {
    const page = readFileSync(`apps/${slug}.md`, 'utf8');
    assert.equal(planListing({ slug, md: page, text: exportListing(page) }).status, 'same', slug);
  }
});
