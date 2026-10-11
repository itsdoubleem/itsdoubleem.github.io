/* Renders a local HTML file to a full-page PNG, at an 820px viewport and 2x.
 *
 *   node tools/render-page.mjs <absolute path to .html> <out.png>
 *
 * Meant for the sample work record (tools/sample-output/record.html, made by
 * make-sample-record.mjs). The 860px viewport matches the committed
 * public/assets/logger/guide/12-record.png (1720×2400); it used to be 820, which did not.
 */
import { chromium } from 'playwright';
const src = process.argv[2], out = process.argv[3];
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 860, height: 1200 }, deviceScaleFactor: 2 });
await page.goto('file://' + src, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const h = await page.evaluate(() => document.documentElement.scrollHeight);
console.log('document height:', h);
await page.screenshot({ path: out, fullPage: true });
await b.close();
