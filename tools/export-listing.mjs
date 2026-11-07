/* Prints the LISTING.md that matches an app's page as it stands, to start its repo off with.
 *
 *   node tools/export-listing.mjs logger > ~/Logger_app/LISTING.md
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportListing } from './listing-lib.mjs';

const root = join(fileURLToPath(import.meta.url), '../..');
process.stdout.write(exportListing(readFileSync(join(root, 'apps', `${process.argv[2]}.md`), 'utf8')));
