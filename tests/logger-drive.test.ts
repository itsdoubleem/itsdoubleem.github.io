import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markTarget } from '../tools/logger-drive.mjs';

/* A page small enough to reason about: each element has text, a box and a parent, and
 * `onTop` says which element a finger would hit at a given box. CI installs no browser,
 * so markTarget runs against this instead of Chromium. */
type Box = { left: number; top: number; width: number; height: number };
type El = {
  innerText: string; box: Box; parent?: El; hidden?: boolean; attrs: Record<string, string>;
  getBoundingClientRect(): Box; scrollIntoView(): void; contains(o: El): boolean;
  setAttribute(k: string, v: string): void; removeAttribute(k: string): void;
};

function el(innerText: string, box: Box, parent?: El, hidden = false): El {
  const e: El = {
    innerText, box, parent, hidden, attrs: {},
    getBoundingClientRect: () => box,
    scrollIntoView: () => {},
    contains(o) { for (let n: El | undefined = o; n; n = n.parent) if (n === e) return true; return false; },
    setAttribute(k, v) { e.attrs[k] = v; },
    removeAttribute(k) { delete e.attrs[k]; },
  };
  return e;
}

function page(els: El[], onTop: (x: number, y: number) => El | null) {
  const g = globalThis as Record<string, unknown>;
  g.document = {
    querySelectorAll: (sel: string) =>
      sel === '[data-pwtap]' ? els.filter((e) => e.attrs['data-pwtap']) : els,
    elementFromPoint: onTop,
  };
  g.getComputedStyle = (e: El) => ({ visibility: e.hidden ? 'hidden' : 'visible' });
}

const at = (left: number, top: number): Box => ({ left, top, width: 100, height: 40 });

test('a label covered by an overlay is passed over for the one on top', () => {
  // LOGGER 1.4: the welcome overlay sits over the punch screen, whose pad says "START".
  const pad = el('START', at(0, 500));
  const welcome = el('시작하기 START', at(0, 900));
  page([pad, welcome], (_x, y) => (y > 800 ? welcome : el('overlay', at(0, 0))));
  assert.equal(markTarget('START'), '시작하기 START');
  assert.equal(welcome.attrs['data-pwtap'], '1');
  assert.equal(pad.attrs['data-pwtap'], undefined);
});

test('the tightest reachable match wins, and a hit on its child still counts', () => {
  const card = el('Past shift 근무 extra words here', at(0, 100));
  const tile = el('Past shift 근무', at(0, 100), card);
  const label = el('Past shift', at(0, 100), tile);
  page([card, tile, label], () => el('icon', at(0, 100), label));
  assert.equal(markTarget('Past shift'), 'Past shift');
});

test('hidden, zero-size and unreachable matches give null, and old marks are cleared', () => {
  const stale = el('elsewhere', at(0, 0));
  stale.attrs['data-pwtap'] = '1';
  const hidden = el('CONFIRM', at(0, 0), undefined, true);
  const flat = el('CONFIRM', { left: 0, top: 0, width: 0, height: 0 });
  const covered = el('CONFIRM', at(0, 300));
  page([stale, hidden, flat, covered], () => el('sheet', at(0, 0)));
  assert.equal(markTarget('CONFIRM'), null);
  assert.equal(stale.attrs['data-pwtap'], undefined);
});
