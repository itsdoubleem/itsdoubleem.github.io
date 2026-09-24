/* Where people can reach DOUBLEEM.
 *
 * A link renders ONLY when it has a URL here. That rule exists because the about page
 * shipped live reading "Contact details go here." for a day — a placeholder is worse than
 * an absence, because it tells a visitor you meant to be reachable and then were not.
 * Leave a field empty and its link simply does not appear; the surrounding copy adapts.
 */
export const contact = {
  /* A form anyone can fill in without an account — the route for the people who actually
   * use the apps. A worker on a cheap phone will not open a GitHub account to tell you a
   * number is wrong. Create one (Tally, Google Forms, anything that gives a public URL)
   * and paste it here.
   *
   * Keep it a LINK, never an embedded widget: the about page claims these pages load no
   * third-party scripts, and embedding a form would make that false. */
  formUrl: 'https://tally.so/r/VLK97j',

  /* Public, structured, and already spam-controlled by GitHub. Requires an account to
   * post, which is why it is the second route and not the first. */
  issuesUrl: 'https://github.com/itsdoubleem/itsdoubleem.github.io/issues',

  /* Optional. Outlives any service, but anything public gets scraped — use an address you
   * are willing to hand to spammers, not your main one. */
  email: '',
};

/* The one claim about the SITE rather than about an app, printed at the end of every app
 * page's "Don't take my word for it" list. It used to be an entry in apps/logger.md, so
 * HANGIL's page never carried it, and deleting or rewording LOGGER would have taken the
 * site's only checkable privacy claim with it.
 *
 * It names every script by path. Add, remove or resize one and this changes in the same
 * commit, together with the about page and README.md. */
export const siteClaim = {
  claim: 'This page is not watching you either.',
  how: 'It loads two scripts from this domain — /motion.js, which tilts the phone on the front page, and /globe.js, which checks whether your screen can draw 3D. If your screen is wide enough to be a laptop or a tablet, /globe.js fetches /three.min.js and /globe-scene.js — a globe on the front page, a drift of lit specks behind every other one. On a phone it fetches /sky-mobile.js instead, about 20 KB, which draws the same specks in a plain 2D canvas, so a handset never downloads the 589 KB library. Nothing is fetched from another domain — three.js is vendored here under its MIT licence. No cookies, no analytics. Open your browser\'s network panel and count the requests, then read the files — that is the whole of what runs here.',
};
