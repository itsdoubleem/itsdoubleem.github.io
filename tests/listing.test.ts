// Tests for tools/listing-lib.mjs — what a description in an app's repo may do to its page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyListing, exportListing, parseListing, planListing } from '../tools/listing-lib.mjs';

const body = "## What it does\n\nCounts 404 words.\n\n## Who it's for\n\nLearners.\n\n## What it is not\n\nNot an exam.\n\n## Your data\n\nNothing leaves.";
const md = `---\nslug: x\nname: X\n# a comment that must survive\ntagline: Teaches words.\naudience: For learners.\ntype: app\nrelease:\n  version: 1.0.0\n---\n\n${body}\n`;
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

test('a changed tagline publishes, quoted when YAML needs it', () => {
  const p = plan(listing(body, 'tagline: "Teaches: words."\naudience: For learners.'));
  assert.equal(p.status, 'publish');
  assert.match(p.md, /^tagline: "Teaches: words\."$/m);
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

test('a number that moves between sections is not a change of number', () => {
  const moved = body.replace('Counts 404 words.', 'Counts words.').replace('Learners.', 'Learners of 404 words.');
  assert.equal(plan(listing(moved)).status, 'publish');
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
  assert.match(plan(listing(`${body}\n\n---\n`)).reasons[0], /--- line/);
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
