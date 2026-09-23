/* The deck of small true things at the foot of the homepage.
 *
 * THE RULE FOR THIS FILE, WHICH IS THE WHOLE POINT OF IT:
 * every entry must be true, and `source` must say where a reader could check it. This
 * block sits on a site whose first rule is that nothing gets invented — a made-up fact
 * here would cost more credibility than the block could ever buy.
 *
 * THE DECK IS ONE SEQUENCE, NOT A BAG OF FACTS.
 * All 42 entries run the Big Bang to the present in order, and the deck renders the array
 * in order, so card N is chapter N and the counter under it reads "N of 42". `lead` is the
 * chapter title and `reveal` is the chapter itself, shown on the card. Do not sort this file
 * and do not drop an entry out of the middle — either one breaks the chain the sequence
 * exists for, and both silently renumber every card after the gap.
 *
 * WHAT THIS FILE USED TO BE, SO YOU DO NOT REBUILD IT BY ACCIDENT.
 * The deck was once a shuffle of unrelated science facts, history corrections and sourced
 * quotes, flipped through in no particular order. It was replaced wholesale on 2026-09-21,
 * and on the same day the machinery for the other two kinds went with it: `kind` is now a
 * one-member union, `attribution` is gone, and OneTrueThing.astro no longer has a branch
 * that renders an entry as a <blockquote>.
 *
 * Putting a quote back therefore means widening the union, adding the field and restoring
 * that branch — deliberate work, which is the point. If you do it, know that quotes are the
 * dangerous part: the internet hands almost every witty line to Twain, Einstein or Churchill,
 * and most of those are wrong. Quote only from a work you can name, and if the famous version
 * of a line is a paraphrase, say so in `reveal` — the correction is more interesting than the
 * quote, and it is the site's argument in miniature.
 *
 * HOW LONG A CHAPTER GETS TO BE, WHICH IS NOT A STYLE PREFERENCE.
 * OneTrueThing.astro sets DWELL = 10 — ten seconds before the deck advances itself. That is
 * about forty words at a normal reading pace, so a card much past forty-five cannot be
 * finished by a reader who is not pressing the buttons. On 2026-09-23 the deck averaged 46.5
 * words with one card at 80, and every entry was rewritten down into a 36–51 band. Keep new
 * chapters inside it. If a chapter genuinely needs more room, raise DWELL rather than let one
 * card run long — an uneven deck is worse than a slow one, because the reader cannot tell
 * which cards they are allowed to finish.
 *
 * That same pass removed the deck's repetitions: chapters used to restate the one before
 * (four in a row re-explained that cooked food is soft) and to end by previewing the one
 * after, which left the next chapter nothing to say. A chapter should carry exactly one beat
 * and hand the next one its subject, not its content. Two pairs were also swapped into
 * chronological order — stars now ignite before they explode, and LUCA comes before the
 * oxygen it went on to breathe out.
 *
 * The homepage counts the entries itself, so adding chapter 43 is appending to this array.
 *
 * APPENDING IS FREE. INSERTING IS NOT, AND ONE THING OUTSIDE THIS FILE WILL BREAK QUIETLY.
 * Adding to the end costs nothing. Putting a chapter into the middle renumbers every
 * chapter after it, and the primer above the deck in OneTrueThing.astro opens with
 * "Chapter 24 is the example" — meaning the Homo sapiens entry, which it locates by
 * counting rather than by name. Insert anything above 24 and that sentence points at the
 * wrong card, in a paragraph whose whole subject is not overstating what the evidence
 * says. Nothing catches it: the types are fine, the build passes, the page looks right.
 * So if you insert above Homo sapiens, open OneTrueThing.astro and move that number.
 *
 * Swapping two entries is safe and needs no edit anywhere — a swap changes the order but
 * not the count, which is why the 2026-09-23 reorder of 5/6 and 13/14 left the primer
 * alone. It is insertion and deletion that shift the numbering.
 */
export type Curio = {
  /* One member on purpose — see the note above before widening it. */
  kind: 'Science';
  /* The chapter title, shown big at the top of the card. */
  lead: string;
  /* The chapter itself — two sentences, shown on the card with no toggle. */
  reveal?: string;
  /* Where to check it. Required — an unsourced fact does not go in. */
  source: string;
  sourceUrl?: string;
};

export const curios: Curio[] = [
  {
    kind: 'Science',
    lead: 'The Primordial Soup',
    reveal:
      'The universe began 13.8 billion years ago as a ball of energy too hot for anything solid to hold together. What filled it was a soup of loose quarks, gluons, and photons — the smallest pieces of matter and light, with nothing yet built from them.',
    source: 'RocketSTEM, Unravelling the mystery behind the Big Bang birth of the universe',
    sourceUrl:
      'https://www.rocketstem.org/2025/06/23/quest-to-unravel-the-mystery-behind-the-big-bang-birth-of-the-universe/',
  },
  {
    kind: 'Science',
    lead: 'The First Building Blocks',
    reveal:
      'Within microseconds the soup expanded and cooled to about a trillion degrees — hotter than any star, but cool enough for loose quarks to stick to one another. Bound together, they made the universe’s first protons and neutrons.',
    source: 'RocketSTEM, Unravelling the mystery behind the Big Bang birth of the universe',
    sourceUrl:
      'https://www.rocketstem.org/2025/06/23/quest-to-unravel-the-mystery-behind-the-big-bang-birth-of-the-universe/',
  },
  {
    kind: 'Science',
    lead: 'The First Atoms and Light',
    reveal:
      'About 380,000 years on, protons finally held on to passing electrons and the first hydrogen and helium atoms formed. Until then light had bounced off loose electrons and gone nowhere; now space turned clear and it streamed out, the oldest light we can still see.',
    source: 'NASA Science, WMAP Overview',
    sourceUrl: 'https://science.nasa.gov/mission/wmap/wmap-overview/',
  },
  {
    kind: 'Science',
    lead: 'The Simplest Elements',
    reveal:
      'Only the simplest elements came out of those first minutes: hydrogen, helium, and a trace of lithium, each needing just a handful of protons to hold together. Everything heavier — carbon, oxygen, iron — did not exist yet, and there was nowhere yet to make it.',
    source: 'Wikipedia, Nucleosynthesis',
    sourceUrl: 'https://en.wikipedia.org/wiki/Nucleosynthesis',
  },
  {
    kind: 'Science',
    lead: 'The Gravity Engine',
    reveal:
      'Hydrogen and helium are light gases, but a cloud of them light-years across adds up to an enormous weight. Gravity pulled each cloud inward until the squeeze at its center grew hot enough to start nuclear fusion, and the first stars switched on.',
    source: 'Britannica, Nucleosynthesis',
    sourceUrl: 'https://www.britannica.com/science/nucleosynthesis',
  },
  {
    kind: 'Science',
    lead: 'The Forge of Complex Elements',
    reveal:
      'A star fuses hydrogen into heavier and heavier elements until it runs out of fuel. When the biggest ones die they explode as supernovae, and the heat and pressure of that death forge heavier elements still — iron, gold, iodine — scattering them across space.',
    source: 'Columbia News, A Cosmic Explosion Forged Heavy Elements Like Gold and Platinum',
    sourceUrl:
      'https://news.columbia.edu/news/cosmic-explosion-forged-heavy-elements-gold-and-platinum',
  },
  {
    kind: 'Science',
    lead: 'The Birth of Galaxies',
    reveal:
      'Stars did not form alone. Over hundreds of millions of years they gathered into enormous groups that drew on each other, merged, and settled into a spin — the first galaxies in the universe.',
    source: 'NASA Science, Hubble Approaches the Final Frontier: The Dawn of Galaxies',
    sourceUrl:
      'https://science.nasa.gov/missions/hubble/hubble-approaches-the-final-frontier-the-dawn-of-galaxies/',
  },
  {
    kind: 'Science',
    lead: 'The Milky Way Takes Shape',
    reveal:
      'About 13 billion years ago small early galaxies ran into each other and merged into one — the Milky Way, ours. It has been swallowing gas, dust and smaller galaxies ever since, and that slow feeding drew out its spiral arms.',
    source: 'UC Davis Letters & Science Magazine, How Did the Milky Way Galaxy Form?',
    sourceUrl:
      'https://lettersandsciencemag.ucdavis.edu/science-technology/how-did-milky-way-galaxy-form',
  },
  {
    kind: 'Science',
    lead: 'The Birth of Our Solar System',
    reveal:
      'Around 4.6 billion years ago a cloud of gas and the dust of dead stars fell in on itself and flattened into a spinning disk. Almost all of it piled into the middle and lit up as our Sun; what was left kept circling.',
    source: 'NASA Science, How did our Solar System form?',
    sourceUrl:
      'https://science.nasa.gov/astrobiology/learning-resources/alp/how-did-our-solar-system-form/',
  },
  {
    kind: 'Science',
    lead: 'The Formation of Earth',
    reveal:
      'In the leftover ring, rock stuck to rock over tens of millions of years — dust, to pebbles, to boulders, to a planet — until Earth reached the size it is now. It began molten throughout, and cooled slowly until a crust hardened on top.',
    source: 'Introduction to Historical Geology (Maricopa), The Hadean Eon (4600–4000 Ma)',
    sourceUrl: 'https://open.maricopa.edu/fallglg102/chapter/the-hadean-4600-4000-ma/',
  },
  {
    kind: 'Science',
    lead: 'The Origin of Earth’s Water',
    reveal:
      'Much of Earth’s water probably arrived from outside — carried in by comets and water-rich asteroids striking the young planet. Each impact flashed its ice into steam, the steam built up in the air, and once Earth cooled it fell back as rain and filled the oceans.',
    source: 'Earth How, Did Earth’s First Water Come from Comets, Volcanoes or Asteroids?',
    sourceUrl: 'https://earthhow.com/origin-of-water-comets-volcanoes-outgassing/',
  },
  {
    kind: 'Science',
    lead: 'The Seeds of Life',
    reveal:
      'The early air would poison anything alive today, but the new oceans could dissolve carbon-based chemicals and hold them together. At hot vents on the sea floor, fed by heat from inside the Earth, some combined into molecules that could copy themselves — the first life, 3.8 billion years ago.',
    source: 'Smithsonian Magazine, LUCA, the Ancestor of All Life on Earth',
    sourceUrl:
      'https://www.smithsonianmag.com/air-space-magazine/luca-ancestor-all-life-earth-180959980/',
  },
  {
    kind: 'Science',
    lead: 'LUCA, the Universal Ancestor',
    reveal:
      'Every living thing on Earth descends from a single microbe: LUCA, the Last Universal Common Ancestor, which lived over 3.5 billion years ago — not the first life, but the last ancestor every survivor shares. We can tell because bacteria, trees and people all still run on the same genetic code.',
    source: 'Earth How, LUCA: Last Universal Common Ancestor',
    sourceUrl: 'https://earthhow.com/luca-last-universal-common-ancestor/',
  },
  {
    kind: 'Science',
    lead: 'The Air Turns Breathable',
    reveal:
      'Some of those microbes learned to live off sunlight — photosynthesis — and gave off oxygen as waste. Over hundreds of millions of years that waste filled the oceans and then the air, killing off many of the microbes already here and leaving behind an atmosphere animals could one day breathe.',
    source: 'Wikipedia, Great Oxidation Event',
    sourceUrl: 'https://en.wikipedia.org/wiki/Great_Oxidation_Event',
  },
  {
    kind: 'Science',
    lead: 'The Rise of Complex Life',
    reveal:
      'Cells got more complicated: the eukaryotic cell keeps its DNA in a nucleus and runs on structures that were once separate microbes it absorbed. Cells like that could stick together and take on different jobs, and the first animal bodies appeared in a rush — the Cambrian Explosion.',
    source: 'Exploring Our Fluid Earth (University of Hawaiʻi), Change Over Time',
    sourceUrl:
      'https://manoa.hawaii.edu/exploringourfluidearth/physical/ocean-floor/change-over-time',
  },
  {
    kind: 'Science',
    lead: 'The Step onto Land',
    reveal:
      'Around 375 million years ago some fish in shallow water had thick jointed fins that could prop up their weight, and simple lungs for gulping air. Those that coped out of the water did better, and their descendants became tetrapods — the four-limbed line leading to amphibians, reptiles, and us.',
    source: 'National Geographic, Walking Towards Land',
    sourceUrl: 'https://www.nationalgeographic.com/science/article/walking-towards-land',
  },
  {
    kind: 'Science',
    lead: 'The Age of Mammals',
    reveal:
      'An asteroid struck 66 million years ago and killed the dinosaurs, birds aside, emptying nearly every role in the food chain. Mammals had been small and mostly active at night; with the competition gone they spread out, and one branch became primates — tree-living, sharp-eyed, with hands that grip.',
    source:
      'Popular Science, The ancestor of all placental mammals survived the dino-killing asteroid',
    sourceUrl: 'https://www.popsci.com/science/dinosaur-asteroid-mammal-evolution/',
  },
  {
    kind: 'Science',
    lead: 'Walking Upright',
    reveal:
      'Around 6 million years ago in Africa the climate dried and grassland opened between the shrinking forests. Primates that crossed that open ground on two legs did better, and walking upright left their hands free to carry food and young — the start of the hominin line, which leads to us.',
    source: 'Smithsonian’s Human Origins Program, Walking Upright',
    sourceUrl: 'https://humanorigins.si.edu/human-characteristics/walking-upright',
  },
  {
    kind: 'Science',
    lead: 'The First Toolmakers',
    reveal:
      'Around 2.6 million years ago, Homo habilis — “handy man” — began knocking flakes off stones to make a cutting edge. These Oldowan tools did what teeth and nails could not: open a carcass, strip meat from bone, and crack the bone for the fatty marrow inside.',
    source: 'Smithsonian’s Human Origins Program, Homo habilis',
    sourceUrl: 'https://humanorigins.si.edu/evidence/human-fossils/species/homo-habilis',
  },
  {
    kind: 'Science',
    lead: 'Homo Erectus Keeps a Fire',
    reveal:
      'Roughly a million years ago Homo erectus was keeping fire — the earliest firm evidence of a hominin controlling it, though it may have started much earlier. Fire meant warmth, light and safety at night, and it meant cooking: heat breaks food down before it ever reaches the mouth.',
    source:
      'Harvard Gazette, Invention of cooking drove evolution of the human species, new book argues',
    sourceUrl:
      'https://news.harvard.edu/gazette/story/2009/06/invention-of-cooking-drove-evolution-of-the-human-species-new-book-argues/',
  },
  {
    kind: 'Science',
    lead: 'Cooking and the Growing Brain',
    reveal:
      'Cooking saves the body a great deal of work — less chewing, less digesting, more calories out of the same meal. The brain is the most expensive organ to run, and that spare energy is thought to be part of what paid for hominin brains getting bigger.',
    source: 'Scientific American, Cooking Up Bigger Brains',
    sourceUrl: 'https://www.scientificamerican.com/article/cooking-up-bigger-brains/',
  },
  {
    kind: 'Science',
    lead: 'Softer Food, Bigger Skulls',
    reveal:
      'One idea points at the temporalis, the jaw muscle that wraps over the skull and presses on it as a child grows. A mutation in the MYH16 gene, about 2.4 million years ago, shrank it — and a looser grip may have left the skull free to grow larger.',
    source: 'National Geographic, Chew On This',
    sourceUrl: 'https://www.nationalgeographic.com/science/article/chew-on-this',
  },
  {
    kind: 'Science',
    lead: 'The Teeth That No Longer Fit',
    reveal:
      'Human jaws kept getting shorter, but the tooth count did not follow. The third molars — wisdom teeth — are left over from ancestors with room for them; in a modern jaw they often arrive sideways or stay trapped under the gum, which is why having them pulled is so ordinary.',
    source:
      'Pitt Med Magazine (University of Pittsburgh), Tween science: Why do we have wisdom teeth?',
    sourceUrl:
      'https://www.pittmed.pitt.edu/news/for-real-wisdom-teeth-evolution-tough-foods-jaw-size-the-conversation',
  },
  {
    kind: 'Science',
    lead: 'The Emergence of Homo Sapiens',
    reveal:
      'Around 300,000 years ago in Africa, Homo sapiens appeared: a large brain, and hands and tools much like ours. What sets the species apart is language — it let what one person learned outlive them, so each generation could start where the last left off.',
    source: 'Smithsonian’s Human Origins Program, Our species arose at least 300,000 years ago',
    sourceUrl:
      'https://humanorigins.si.edu/research/whats-hot-human-origins/our-species-arose-least-300000-years-ago',
  },
  {
    kind: 'Science',
    lead: 'Out of Africa',
    reveal:
      'From around 70,000 years ago, groups of Homo sapiens walked out of Africa in waves — into Asia, then Europe, then everywhere people now live. It is called the Out of Africa account, and it means every person alive outside Africa descends from those few travelling groups.',
    source: 'Smithsonian Magazine, The Great Human Migration',
    sourceUrl: 'https://www.smithsonianmag.com/history/the-great-human-migration-13561/',
  },
  {
    kind: 'Science',
    lead: 'Meeting Our Ancient Cousins',
    reveal:
      'Sapiens were not alone out there. In Europe and Asia they met Neanderthals, and further east Denisovans, and had children with both — which is why most people outside Africa still carry a little of their DNA, and why those cousins are gone as separate peoples but not gone completely.',
    source: 'Smithsonian’s Human Origins Program, Ancient DNA and Neanderthals',
    sourceUrl: 'https://humanorigins.si.edu/evidence/genetics/ancient-dna-and-neanderthals',
  },
  {
    kind: 'Science',
    lead: 'The Rise of Civilization',
    reveal:
      'Around 10,000 BCE the last Ice Age ended, and in the warmer climate some groups stopped following their food and began growing it — wheat, barley, herded animals. A field has to be stayed with, so people stayed, and settlements that could store a surplus became the first cities.',
    source: 'Britannica, Neolithic Revolution',
    sourceUrl: 'https://www.britannica.com/event/Neolithic-Revolution',
  },
  {
    kind: 'Science',
    lead: 'The Dawn of History',
    reveal:
      'Around 3,200 BCE the Sumerians of Mesopotamia pressed wedge-shaped marks into wet clay: cuneiform, the oldest writing we know of. It started as accounting — who owed what — and ended up holding laws, letters and stories, which is why historians date recorded history from here.',
    source: 'Britannica, Cuneiform',
    sourceUrl: 'https://www.britannica.com/topic/cuneiform',
  },
  {
    kind: 'Science',
    lead: 'Gods and the Rise of Religion',
    reveal:
      'The early cities worshipped many gods, each tied to something a farming life depended on — the sun, the river, the harvest. Later some turned to a single god: Akhenaten tried it in Egypt and it died with him; in Judaism it held, and Christianity and Islam grew from there.',
    source: 'World History Encyclopedia, Monotheism in the Ancient World',
    sourceUrl: 'https://www.worldhistory.org/article/1454/monotheism-in-the-ancient-world/',
  },
  {
    kind: 'Science',
    lead: 'The First Empires',
    reveal:
      'Around 2,334 BCE Sargon of Akkad took the Mesopotamian city-states one at a time and ruled them as one state — the Akkadian Empire, usually counted as the first. The new part was not conquering but holding: one army, one law, one tax, over people who had never been one people.',
    source: 'Britannica, Sargon',
    sourceUrl: 'https://www.britannica.com/biography/Sargon',
  },
  {
    kind: 'Science',
    lead: 'Law Written in Stone',
    reveal:
      'Around 1,754 BCE the Babylonian king Hammurabi had 282 laws cut into a stone pillar and set it up in public — theft, wages, marriage, medicine, all of it. Putting the penalties where anyone could read them is the point: the rule stops being whatever a judge feels that day.',
    source:
      'World History Encyclopedia, Code of Hammurabi: The Most Influential Law Code of the Ancient World',
    sourceUrl: 'https://www.worldhistory.org/Code_of_Hammurabi/',
  },
  {
    kind: 'Science',
    lead: 'The Invention of Currency',
    reveal:
      'Around 600 BCE the kingdom of Lydia, in what is now Turkey, stamped the first coins: lumps of electrum, a natural mix of gold and silver, each made to a set weight. The stamp was the invention — take the value on trust, instead of weighing and testing every payment.',
    source: 'World History Encyclopedia, The Invention of the First Coinage in Ancient Lydia',
    sourceUrl:
      'https://www.worldhistory.org/article/1793/the-invention-of-the-first-coinage-in-ancient-lydi/',
  },
  {
    kind: 'Science',
    lead: 'The Birth of Philosophy',
    reveal:
      'From about the 6th century BCE, thinkers in Greece — Thales, then Socrates, Plato, Aristotle — asked what the world is made of, what a good life is, and how anyone knows anything, without answering “the gods did it”. Demanding a reason rather than a story is where science starts.',
    source: 'Britannica, Greek Philosophy',
    sourceUrl: 'https://www.britannica.com/topic/Greek-philosophy',
  },
  {
    kind: 'Science',
    lead: 'Empires of Antiquity',
    reveal:
      'Between the 6th century BCE and the 5th century CE, a run of empires — Persian, then Alexander’s, then Rome — put Europe, Asia and North Africa under shared roads, coinage and law. Goods and ideas moved further than a person ever had, and so did religions, languages and disease.',
    source: 'Britannica, Roman Empire',
    sourceUrl: 'https://www.britannica.com/place/Roman-Empire',
  },
  {
    kind: 'Science',
    lead: 'The Fall of Rome',
    reveal:
      'In 476 CE the Germanic leader Odoacer removed the last western Roman emperor, Romulus Augustulus. The date marks the fall more than it caused it — the west had been coming apart for a century — and after it western Europe was a patchwork of small kingdoms instead of one empire.',
    source: 'Britannica, Roman Empire: Height and decline of imperial Rome',
    sourceUrl: 'https://www.britannica.com/place/Roman-Empire/Height-and-decline-of-imperial-Rome',
  },
  {
    kind: 'Science',
    lead: 'The Printing Press',
    reveal:
      'Around 1440 in Germany, Johannes Gutenberg printed using movable metal type, so a book could be run off in numbers instead of copied out by hand. Books got cheap, reading spread, and an idea could now travel faster than the people who wanted to stop it.',
    source: 'Britannica, Johannes Gutenberg',
    sourceUrl: 'https://www.britannica.com/biography/Johannes-Gutenberg',
  },
  {
    kind: 'Science',
    lead: 'The Scientific Revolution',
    reveal:
      'In the 16th and 17th centuries Copernicus, Galileo and Newton showed that the Earth goes around the Sun, and that the same few equations govern a falling apple and an orbiting moon. The method was the real result: make a claim, then test it, and let the test decide.',
    source: 'Britannica, Scientific Revolution',
    sourceUrl: 'https://www.britannica.com/science/Scientific-Revolution',
  },
  {
    kind: 'Science',
    lead: 'The Industrial Revolution',
    reveal:
      'From about 1760 in Britain, steam engines gave machines power that needed no muscle, water or wind. Work moved out of homes and fields into factories and people moved with it into cities — within two generations most of the country lived a life its grandparents would not recognize.',
    source: 'Britannica, Industrial Revolution',
    sourceUrl: 'https://www.britannica.com/event/Industrial-Revolution',
  },
  {
    kind: 'Science',
    lead: 'Electricity and the Modern World',
    reveal:
      'In the late 19th century Edison, Tesla and Westinghouse worked out how to generate electricity and send it down wires — first to lamps and motors, then to whole cities. Electricity is not one invention but the thing almost every later invention runs on, computers included.',
    source: 'HISTORY, How Edison, Tesla and Westinghouse Battled to Electrify America',
    sourceUrl: 'https://www.history.com/articles/what-was-the-war-of-the-currents',
  },
  {
    kind: 'Science',
    lead: 'The Computer Age Begins',
    reveal:
      'In the 1940s machines like ENIAC became the first general-purpose electronic computers, built in wartime to work out artillery tables. What set them apart was that changing the program changed the job, and over the following decades they shrank from filling a room to sitting on a desk.',
    source: 'Britannica, ENIAC',
    sourceUrl: 'https://www.britannica.com/technology/ENIAC',
  },
  {
    kind: 'Science',
    lead: 'The Internet Connects the World',
    reveal:
      'In 1969 the U.S. military-funded ARPANET sent its first message between two computers; it crashed on the third letter of “LOGIN”. That network grew into the internet, and in the 1990s the World Wide Web put a readable page on top of it, which is what reached ordinary people.',
    source: 'Britannica, ARPANET',
    sourceUrl: 'https://www.britannica.com/topic/ARPANET',
  },
  {
    kind: 'Science',
    lead: 'The Rise of Artificial Intelligence',
    reveal:
      'The term was coined in 1956, and for fifty years the results stayed thin. Then in the 2010s enough data and computing made neural networks work — machines shown examples until they find the pattern, rather than told the rules. Atoms from the Big Bang, arranged into something that learns.',
    source: 'IBM, The History of Artificial Intelligence',
    sourceUrl: 'https://www.ibm.com/think/topics/history-of-artificial-intelligence',
  },
];
