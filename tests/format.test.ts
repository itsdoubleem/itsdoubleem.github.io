// Tests for tools/format-lib.mjs — the one format every app page shares.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bodyProblems, blockedPhrases, newAppPage, pageProblems, sections } from '../tools/format-lib.mjs';

const good = "## What it does\n\nA.\n\n## Who it's for\n\nB.\n\n## What it is not\n\nC.\n\n## Your data\n\nD.\n";

test('both real pages already meet the format', () => {
  for (const slug of ["logger", "hangil"]) assert.deepEqual(pageProblems(readFileSync(`apps/${slug}.md`, 'utf8')), []);
});

test('sections are read in order, and ### does not start one', () => {
  assert.deepEqual(sections('intro\n## A\nx\n### sub\ny\n## B\nz\n'), [['A', 'x\n### sub\ny'], ['B', 'z']]);
});

test('a missing, unknown, misplaced or repeated section is named', () => {
  assert.deepEqual(bodyProblems(good), []);
  assert.match(bodyProblems(good.replace('## Your data\n\nD.\n', ''))[0], /no "Your data"/);
  assert.match(bodyProblems(`${good}\n## Pricing\n\nE.\n`)[0], /"Pricing"/);
  assert.match(bodyProblems("## Who it's for\n\nB.\n\n## What it does\n\nA.\n\n## What it is not\n\nC.\n\n## Your data\n\nD.\n")[0], /out of order/);
  assert.ok(bodyProblems(`${good}\n## Your data\n\nE.\n`).some((p) => /repeats/.test(p)));
});

test('a novel is not held to an app format', () => {
  assert.deepEqual(bodyProblems('## Chapter one\n\nIt was dark.\n', 'novel'), []);
});

test('promises and marketing words are refused; present-tense "free" is not', () => {
  assert.deepEqual(blockedPhrases('It is free. The apps here are free. Price: Free.'), []);
  assert.equal(blockedPhrases('HANGIL is free and stays free.').length, 1);
  assert.equal(blockedPhrases('Free forever!').length, 1);
  assert.equal(blockedPhrases('A seamless, revolutionary app').length, 2);
});

test('a release must follow GitHub the same way as every other', () => {
  const md = `---\nname: X\nrelease:\n  version: 1.0.0\n  source: o/x\n---\n${good}`;
  const problems = pageProblems(md);
  assert.ok(problems.some((p) => /no asset:/.test(p)));
  assert.ok(problems.some((p) => /no signer:/.test(p)));
});

test('the new-app skeleton has the right sections and cannot deploy until filled in', () => {
  const problems = pageProblems(newAppPage({ slug: 'x', name: 'X', source: 'o/x' }));
  assert.deepEqual(problems, ['still has a TODO in it']);
});
