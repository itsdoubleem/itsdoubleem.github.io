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
      'Venus spins once every 243 Earth days and completes its orbit in 225. It finishes the lap before it finishes the spin. Worth one honest caveat: if you define a day as sunrise to sunrise, it is about 117 Earth days, because the planet turns backwards and the two motions partly cancel.',
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
    source: 'Subtraction — check it yourself.',
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
    source: 'The Salmon of Doubt, 2002',
  },
  {
    kind: 'Somebody actually said this',
    lead: 'The fundamental cause of the trouble is that in the modern world the stupid are cocksure while the intelligent are full of doubt.',
    attribution: 'Bertrand Russell',
    reveal:
      'You will usually meet this as “the trouble with the world is that the stupid are cocksure and the intelligent are full of doubt”. That version is shorter, better balanced, and not what he wrote. The tidier a famous quote sounds, the more likely somebody tidied it.',
    source: '“The Triumph of Stupidity”, New York American, 10 May 1933',
  },
  {
    kind: 'Science',
    lead: 'Helium was found on the Sun before anybody found it on Earth.',
    reveal:
      'During the 1868 eclipse, astronomers split the Sun’s light and found a yellow line belonging to no known element. It was named after helios, the Sun, on the assumption it might not exist down here at all. It took until 1895 to isolate it on Earth — an element discovered 150 million kilometres before it was discovered underfoot.',
    source: 'Named by Norman Lockyer, 1868; isolated by William Ramsay, 1895',
  },
  {
    kind: 'Science',
    lead: 'There are more trees on Earth than there are stars in our galaxy.',
    reveal:
      'A 2015 count in Nature put the world at roughly three trillion trees. The Milky Way holds somewhere between 100 and 400 billion stars. Trees win by a factor of about ten — and the same study found we have removed nearly half of them since farming began.',
    source: 'Crowther et al., “Mapping tree density at a global scale”, Nature, 2015',
  },
  {
    kind: 'Science',
    lead: 'An octopus has three hearts, and its blood is blue.',
    reveal:
      'Two hearts push blood through the gills, one sends it round the body. The blue is haemocyanin, which carries oxygen with copper where ours uses iron. It works better than haemoglobin in cold, low-oxygen water — and the body heart stops when the animal swims, which is part of why octopuses would rather walk.',
    source: 'Cephalopod circulatory anatomy; haemocyanin is copper-based',
  },
  {
    kind: 'Science',
    lead: 'Some animals have been put in open space, unprotected, and lived.',
    reveal:
      'Tardigrades — half-millimetre animals found in moss almost everywhere — were carried into low Earth orbit in 2007 and exposed to vacuum and solar radiation. Many survived, and some went on to produce viable offspring. They are probably in your gutter.',
    source: 'Jönsson et al., Current Biology, 2008 (FOTON-M3 mission)',
  },
  {
    kind: 'History',
    lead: 'Napoleon was not short.',
    reveal:
      'He was recorded at five feet two — in French units, whose inches were longer than English ones. In modern terms that is about 1.69 m, average or slightly above for a Frenchman of his day. The short Napoleon is a British cartoon that outlived the war it was drawn for.',
    source: 'French pied du roi vs the English foot; British caricature, 1800s',
  },
  {
    kind: 'History',
    lead: 'Vikings did not wear horned helmets. A costume designer gave them those.',
    reveal:
      'No horned helmet has ever been dug from a Viking Age warrior grave. The look comes from Carl Emil Doepler, who designed the costumes for Wagner’s Ring cycle at Bayreuth in 1876 and needed his warriors legible from the cheap seats. Within thirty years it was what everyone pictured.',
    source: 'Roberta Frank, “The Invention of the Viking Horned Helmet”',
  },
  {
    kind: 'History',
    lead: 'The Ottoman Empire was still running when the Wright brothers flew.',
    reveal:
      'The first powered flight was December 1903. The Ottoman Empire, founded around 1299, was not formally dissolved until 1922. An empire that began before the Black Death was still on the map after the aeroplane.',
    source: 'First flight 17 December 1903; the sultanate abolished 1 November 1922',
  },
  {
    kind: 'Somebody actually said this',
    lead: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.',
    attribution: 'Richard Feynman',
    source: '“Cargo Cult Science”, Caltech commencement address, 1974',
  },
  {
    kind: 'Somebody actually said this',
    lead: 'Please accept my resignation. I don’t want to belong to any club that will accept people like me as a member.',
    attribution: 'Groucho Marx, on resigning from the Friars Club',
    reveal:
      'That is the wording in his own memoir, Groucho and Me, in 1959. You will more often see the smoother “I refuse to join any club that would have me as a member” — a version that is funnier, shorter, and not the telegram.',
    source: 'Groucho and Me, 1959, p. 321',
  },
  {
    kind: 'Somebody actually said this',
    lead: 'It always takes longer than you expect, even when you take into account Hofstadter’s Law.',
    attribution: 'Douglas Hofstadter — Hofstadter’s Law',
    source: 'Gödel, Escher, Bach: An Eternal Golden Braid, 1979',
  },
  {
    kind: 'Somebody actually said this',
    lead: 'If you wish to make an apple pie from scratch, you must first invent the universe.',
    attribution: 'Carl Sagan',
    source: 'Cosmos, 1980',
  },
  {
    kind: 'Somebody actually said this',
    lead: 'The trouble with having an open mind, of course, is that people will insist on coming along and trying to put things in it.',
    attribution: 'Terry Pratchett',
    source: 'Diggers, 1990',
  },
];
