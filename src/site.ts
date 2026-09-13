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
