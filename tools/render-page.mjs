/* Renders a local HTML file to a full-page PNG, at an 820px viewport and 2x.
 *
 *   node tools/render-page.mjs <absolute path to .html> <out.png>
 *
 * Meant for the sample work record (tools/sample-output/record.html, made by
 * make-sample-record.mjs). Note the committed public/assets/logger/guide/12-record.png is
 * 1720px wide, not the 1640 this produces, so it was rendered at a wider viewport than
 * this script uses today (checked 2026-09-24). Compare before replacing it.
 */
import { chromium } from 'playwright';
const src = process.argv[2], out = process.argv[3];
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 820, height: 1200 }, deviceScaleFactor: 2 });
await page.goto('file://' + src, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('document height:', h);
await page.screenshot({ path: out, fullPage: true });
await b.close();
