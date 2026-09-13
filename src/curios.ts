/* The deck of small true things at the foot of the homepage.
 *
 * THE RULE FOR THIS FILE, WHICH IS THE WHOLE POINT OF IT:
 * every entry must be true, and `source` must say where a reader could check it. This
 * block sits on a site whose first rule is that nothing gets invented — a made-up fact or
 * a misattributed quote here would cost more credibility than the block could ever buy.
 *
 * Quotes are the dangerous part. The internet hands almost every witty line to Twain,
 * Einstein or Churchill, and most of those are wrong. Quote only from a work you can name,
 * and if the famous version of a line is a paraphrase, say so in `reveal` — the correction
 * is more interesting than the quote, and it is the site's argument in miniature.
 *
 * Adding one is appending to this array. The homepage counts the entries itself.
 */
export type Curio = {
  kind: 'Science' | 'History' | 'Somebody actually said this';
  /* The hook: a question worth pausing on, or the quote itself. */
  lead: string;
  /* Attribution, shown under a quote. Omit for questions. */
  attribution?: string;
  /* Hidden behind a "Show me" toggle. The answer, or the wry footnote. */
  reveal?: string;
  /* Where to check it. Required — an unsourced fact does not go in. */
  source: string;
  sourceUrl?: string;
};

export const curios: Curio[] = [
  {
    kind: 'Science',
    lead: 'On Venus, one turn of the planet takes longer than one trip around the Sun.',
    reveal:
      'Venus spins once every 243 Earth days and completes its orbit in 225. It finishes the lap before it finishes the spin. Worth one honest caveat: if you define a day as sunrise to sunrise, it is about 117 Earth days, because the planet turns backwards and the two motions partly cancel. The spin really is slower than the year; the sunrises are not.',
    source: 'NASA, Venus Fact Sheet',
    sourceUrl: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html',
  },
  {
    kind: 'Science',
    lead: 'Sharks are older than trees.',
    reveal:
      'Shark scales show up in rocks about 450 million years old. The first thing you could fairly call a tree appears around 385 million years ago. Sharks had been swimming for 65 million years before anything on land worked out how to grow tall — roughly the same gap that separates us from the last dinosaur.',
    source: 'Late Ordovician denticle fossils; earliest trees, Middle Devonian',
  },
  {
    kind: 'Science',
    lead: 'Take a breath. Most of that oxygen came from the sea, not from forests.',
    reveal:
      'At least half of the oxygen produced on Earth comes from the ocean, and most of that from plankton too small to see. The rainforest gets the posters; the plankton does the work.',
    source: 'NOAA, National Ocean Service',
    sourceUrl: 'https://oceanservice.noaa.gov/facts/ocean-oxygen.html',
  },
  {
    kind: 'History',
    lead: 'Cleopatra lived closer to the Moon landing than to the building of the Great Pyramid.',
    reveal:
      'The Great Pyramid was finished around 2560 BC, about 2,530 years before Cleopatra died in 30 BC. The Moon landing came 1,998 years after her. The pyramids were already ancient history to the woman we file under ancient history.',
    source: 'Subtraction. Check it yourself — that is the point of this one.',
  },
  {
    kind: 'History',
    lead: 'Which is older: the University of Oxford, or the Aztec Empire?',
    reveal:
      'Oxford, and not narrowly. Teaching was happening there by 1096. Tenochtitlán was founded in 1325, and the empire proper in 1428 — by which time Oxford had been running for over three centuries.',
    source: 'University of Oxford, on its own founding',
    sourceUrl: 'https://www.ox.ac.uk/about/organisation/history',
  },
  {
    kind: 'History',
    lead: 'Nintendo is as old as the Eiffel Tower.',
    reveal:
      'The tower was finished on 31 March 1889. Nintendo was founded in Kyoto that September, making handmade playing cards. One of them spent the next century as a landmark; the other got into video games eighty years later.',
    source: 'Nintendo, founded 23 September 1889; Eiffel Tower completed 31 March 1889',
  },
  {
    kind: 'Somebody actually said this',
    lead: 'I can resist everything except temptation.',
    attribution: 'Oscar Wilde — Lord Darlington, in Lady Windermere’s Fan, 1892',
    source: 'The play, Act I. He gave the line to a character, not to himself.',
  },
  {
    kind: 'Somebody actually said this',
    lead: 'I love deadlines. I love the whooshing noise they make as they go by.',
    attribution: 'Douglas Adams',
    source: 'The Salmon of Doubt, published 2002',
  },
  {
    kind: 'Somebody actually said this',
    lead: 'The fundamental cause of the trouble is that in the modern world the stupid are cocksure while the intelligent are full of doubt.',
    attribution: 'Bertrand Russell',
    reveal:
      'You will usually meet this as “the trouble with the world is that the stupid are cocksure and the intelligent are full of doubt”. That version is shorter, better balanced, and not what he wrote. The tidier a famous quote sounds, the more likely somebody tidied it.',
    source: '“The Triumph of Stupidity”, New York American, 10 May 1933',
  },
];
