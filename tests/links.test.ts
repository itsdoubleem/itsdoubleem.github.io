import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { externalLinks, issueText, pagePath, readList, verdict } from '../tools/links-lib.mjs';

test('outside links are collected once each, with every page they are on; own site, mail and fragments are not', () => {
  const pages: [string, string][] = [
    ['/', '<a href="https://www.britannica.com/topic/cuneiform#x">c</a> <a href="/apps/">in</a> <a class=x href=\'https://tally.so/r/abc?a=1&amp;b=2\'>t</a>'],
    ['/about/', '<a href="https://www.britannica.com/topic/cuneiform">c</a><a href="mailto:a@b.c">m</a><a href="https://itsdoubleem.github.io/apps/">own</a><a href="javascript:alert(1)">j</a>'],
  ];
  assert.deepEqual(externalLinks(pages), [
    { url: 'https://tally.so/r/abc?a=1&b=2', pages: ['/'] },
    { url: 'https://www.britannica.com/topic/cuneiform', pages: ['/', '/about/'] },
  ]);
});

test('a page file is named by its address', () => {
  assert.equal(pagePath('index.html'), '/');
  assert.equal(pagePath('apps/logger/index.html'), '/apps/logger/');
  assert.equal(pagePath('404.html'), '/404.html');
});

test('only a definite "gone" is broken; a robot refusal, a rate limit or a timeout is not', () => {
  assert.equal(verdict({ status: 200 }), 'ok');
  assert.equal(verdict({ status: 404 }), 'broken');
  assert.equal(verdict({ status: 410 }), 'broken');
  assert.equal(verdict({ error: 'ENOTFOUND' }), 'broken');
  assert.equal(verdict({ status: 403 }), 'unsure'); // UC Davis, for a page that was there
  assert.equal(verdict({ status: 429 }), 'unsure');
  assert.equal(verdict({ status: 503 }), 'unsure');
  assert.equal(verdict({ error: 'TimeoutError' }), 'unsure');
  assert.equal(verdict({ error: 'ECONNRESET' }), 'unsure');
});

test('the list from the building job is read as a stranger\'s data', () => {
  const list = readList(JSON.stringify([
    { url: 'https://example.org/a', pages: ['/', '/about/', '](https://evil)', 7] },
    { url: 'javascript:alert(1)', pages: ['/'] },
    { url: 'https://itsdoubleem.github.io/x', pages: ['/'] },
    { url: `https://example.org/${'a'.repeat(3000)}`, pages: ['/'] },
    'nonsense',
  ]));
  assert.deepEqual(list, [{ url: 'https://example.org/a', pages: ['/', '/about/'] }]);
  assert.throws(() => readList('{"url":"x"}'), /not a list/);
});

test('the Issue lists broken links and where they are, and a link cannot break out of its code span', () => {
  const { title, body } = issueText(
    [{ url: 'https://gone.example/`x`](https://evil)', pages: ['/'], why: 'HTTP 404' }],
    [{ url: 'https://www.britannica.com/x', pages: ['/'], why: 'HTTP 403' }],
  );
  assert.equal(title, 'An outside link is broken');
  assert.match(body, /`https:\/\/gone\.example\/%60x%60\]\(https:\/\/evil\)` \(HTTP 404\) on `\/`/);
  assert.match(body, /Could not check 1 more/);
  assert.equal(issueText([{ url: 'a', pages: [], why: '' }, { url: 'b', pages: [], why: '' }], []).title, '2 outside links are broken');
});

test('links.yml: npm only where nothing can be written; the list reaches the checker through the environment', () => {
  const yml = readFileSync('.github/workflows/links.yml', 'utf8');
  const list = yml.slice(yml.indexOf('\n  list:'), yml.indexOf('\n  check:'));
  const check = yml.slice(yml.indexOf('\n  check:'));
  assert.match(list, /npm ci --ignore-scripts/);
  assert.doesNotMatch(list, /^(?!\s*#).*write/m);
  assert.doesNotMatch(check, /^(?!\s*#).*\bnpm (ci|install|run)/m);
  assert.doesNotMatch(check, /run: [^\n]*\$\{\{/);
  for (const uses of yml.match(/uses: \S+/g)!) assert.match(uses, /@[0-9a-f]{40}$/);
  // Each scheduled workflow is kept from pausing.
  const watch = readFileSync('.github/workflows/watch.yml', 'utf8');
  for (const w of ['deploy', 'watch', 'deps', 'links']) assert.match(watch, new RegExp(`workflows/${w}\\.yml/enable`));
});
