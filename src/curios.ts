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
 * The homepage counts the entries itself, so adding chapter 43 is appending to this array.
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
      'At its birth 13.8 billion years ago, the universe was an unimaginably hot, dense ball of pure energy. Too hot for solid matter, it existed as a searing soup made entirely of free-floating quarks, gluons, and photons.',
    source: 'RocketSTEM, Unravelling the mystery behind the Big Bang birth of the universe',
    sourceUrl:
      'https://www.rocketstem.org/2025/06/23/quest-to-unravel-the-mystery-behind-the-big-bang-birth-of-the-universe/',
  },
  {
    kind: 'Science',
    lead: 'The First Building Blocks',
    reveal:
      'Within microseconds, the expanding cosmic fluid cooled down to about a trillion degrees. This rapid cooling allowed the floating quarks to bind together, creating the universe’s very first protons and neutrons.',
    source: 'RocketSTEM, Unravelling the mystery behind the Big Bang birth of the universe',
    sourceUrl:
      'https://www.rocketstem.org/2025/06/23/quest-to-unravel-the-mystery-behind-the-big-bang-birth-of-the-universe/',
  },
  {
    kind: 'Science',
    lead: 'The First Atoms and Light',
    reveal:
      'About 380,000 years later, the universe cooled enough for protons to trap electrons, forming the first hydrogen and helium atoms. This allowed light to travel freely through space for the first time, lighting up the dark cosmos.',
    source: 'NASA Science, WMAP Overview',
    sourceUrl: 'https://science.nasa.gov/mission/wmap/wmap-overview/',
  },
  {
    kind: 'Science',
    lead: 'The Simplest Elements',
    reveal:
      'Hydrogen, helium, and trace amounts of lithium were the only elements formed because their simple atomic structures needed just a few protons to bond. These abundant early elements, primarily hydrogen and helium, provided all the essential fuel needed for gravity to ignite the very first stars.',
    source: 'Wikipedia, Nucleosynthesis',
    sourceUrl: 'https://en.wikipedia.org/wiki/Nucleosynthesis',
  },
  {
    kind: 'Science',
    lead: 'The Forge of Complex Elements',
    reveal:
      'While early stars ran on simple hydrogen and helium, they could only create lighter elements inside their cores before running out of fuel. When these massive stars died in violent supernova explosions, the extreme heat and pressure forged all the heavier elements — like iron, gold, and iodine — scattering them across the cosmos.',
    source: 'Columbia News, A Cosmic Explosion Forged Heavy Elements Like Gold and Platinum',
    sourceUrl:
      'https://news.columbia.edu/news/cosmic-explosion-forged-heavy-elements-gold-and-platinum',
  },
  {
    kind: 'Science',
    lead: 'The Gravity Engine',
    reveal:
      'Although hydrogen and helium are lightweight gases, their vast clouds spanned light-years, containing immense total mass. Over millions of years, gravity relentlessly pulled these massive clouds inward, compressing them until the central pressure became so intense that nuclear fusion ignited the first stars.',
    source: 'Britannica, Nucleosynthesis',
    sourceUrl: 'https://www.britannica.com/science/nucleosynthesis',
  },
  {
    kind: 'Science',
    lead: 'The Birth of Galaxies',
    reveal:
      'Over hundreds of millions of years, giant clouds of hydrogen gas collapsed under gravity, pulling early stars together. These massive stellar clusters merged and rotated, forming the universe’s first generation of galaxies.',
    source: 'NASA Science, Hubble Approaches the Final Frontier: The Dawn of Galaxies',
    sourceUrl:
      'https://science.nasa.gov/missions/hubble/hubble-approaches-the-final-frontier-the-dawn-of-galaxies/',
  },
  {
    kind: 'Science',
    lead: 'The Milky Way Takes Shape',
    reveal:
      'About 13 billion years ago, smaller protogalaxies collided and fused together to build our home galaxy, the Milky Way. Over billions of years, it drew in more cosmic dust and stars, sculpting its iconic swirling spiral arms.',
    source: 'UC Davis Letters & Science Magazine, How Did the Milky Way Galaxy Form?',
    sourceUrl:
      'https://lettersandsciencemag.ucdavis.edu/science-technology/how-did-milky-way-galaxy-form',
  },
  {
    kind: 'Science',
    lead: 'The Birth of Our Solar System',
    reveal:
      'Around 4.6 billion years ago, a dense cloud of interstellar gas and star-remnant dust collapsed, forming a rotating protoplanetary disk. Most of this collapsing material gathered at the center to ignite our Sun, while remaining debris orbited around it.',
    source: 'NASA Science, How did our Solar System form?',
    sourceUrl:
      'https://science.nasa.gov/astrobiology/learning-resources/alp/how-did-our-solar-system-form/',
  },
  {
    kind: 'Science',
    lead: 'The Formation of Earth',
    reveal:
      'Inside the spinning disk, rocky remnants repeatedly smashed together and fused over tens of millions of years to build planet Earth. Initially a molten ball of magma, Earth eventually cooled, forming a solid crust that set the stage for liquid oceans and life.',
    source: 'Introduction to Historical Geology (Maricopa), The Hadean Eon (4600–4000 Ma)',
    sourceUrl: 'https://open.maricopa.edu/fallglg102/chapter/the-hadean-4600-4000-ma/',
  },
  {
    kind: 'Science',
    lead: 'The Origin of Earth’s Water',
    reveal:
      'During its fiery youth, molten Earth was relentlessly bombarded by icy comets and water-rich asteroids from the outer solar system. As these icy bodies vaporized upon impact, they trapped steam in the young atmosphere that eventually cooled, condensed, and rained down to fill our oceans.',
    source: 'Earth How, Did Earth’s First Water Come from Comets, Volcanoes or Asteroids?',
    sourceUrl: 'https://earthhow.com/origin-of-water-comets-volcanoes-outgassing/',
  },
  {
    kind: 'Science',
    lead: 'The Seeds of Life',
    reveal:
      'Though Earth’s early atmosphere was toxic and inhospitable, cooling temperatures allowed liquid water oceans to stabilize and dissolve key organic chemicals. In deep-sea hydrothermal vents powered by geothermal energy, these chemical building blocks combined into self-replicating molecules, sparking the very first microbial life around 3.8 billion years ago.',
    source: 'Smithsonian Magazine, LUCA, the Ancestor of All Life on Earth',
    sourceUrl:
      'https://www.smithsonianmag.com/air-space-magazine/luca-ancestor-all-life-earth-180959980/',
  },
  {
    kind: 'Science',
    lead: 'The Evolution of Early Life',
    reveal:
      'From those simple microbial origins, early single-celled organisms evolved over billions of years, eventually developing photosynthesis to pump oxygen into the atmosphere. This oxygen-rich environment paved the way for complex multicellular organisms to emerge, triggering an explosion of diverse life across the planet.',
    source: 'Smithsonian Magazine, LUCA, the Ancestor of All Life on Earth',
    sourceUrl:
      'https://www.smithsonianmag.com/air-space-magazine/luca-ancestor-all-life-earth-180959980/',
  },
  {
    kind: 'Science',
    lead: 'LUCA, the Universal Ancestor',
    reveal:
      'All life on Earth today traces its lineage back to LUCA — the Last Universal Common Ancestor — a microscopic organism that lived over 3.5 billion years ago. Scientists believe LUCA originated deep underwater near deep-sea hydrothermal vents, where rich minerals and thermal energy fueled the very first metabolic reactions.',
    source: 'Earth How, LUCA: Last Universal Common Ancestor',
    sourceUrl: 'https://earthhow.com/luca-last-universal-common-ancestor/',
  },
  {
    kind: 'Science',
    lead: 'The Rise of Complex Life',
    reveal:
      'For billions of years, life remained single-celled until primitive cells merged to form complex eukaryotic cells with nucleus structures. This evolutionary leap allowed cells to specialize, leading to soft-bodied multicellular marine animals and the sudden explosion of diverse sea life during the Cambrian Explosion.',
    source: 'Exploring Our Fluid Earth (University of Hawaiʻi), Change Over Time',
    sourceUrl:
      'https://manoa.hawaii.edu/exploringourfluidearth/physical/ocean-floor/change-over-time',
  },
  {
    kind: 'Science',
    lead: 'The Step onto Land',
    reveal:
      'Around 375 million years ago, ancient lobe-finned fish developed sturdy fins and primitive lungs to navigate shallow waters. Over millions of years, these land-exploring creatures evolved into the first tetrapods, giving rise to amphibians, reptiles, and early mammal ancestors.',
    source: 'National Geographic, Walking Towards Land',
    sourceUrl: 'https://www.nationalgeographic.com/science/article/walking-towards-land',
  },
  {
    kind: 'Science',
    lead: 'The Age of Mammals',
    reveal:
      'When a massive asteroid wiped out the non-avian dinosaurs 66 million years ago, it cleared ecological space for small, nocturnal mammals to thrive. These surviving mammals rapidly adapted and diversified, evolving into tree-dwelling primates with keen vision and grasping hands.',
    source:
      'Popular Science, The ancestor of all placental mammals survived the dino-killing asteroid',
    sourceUrl: 'https://www.popsci.com/science/dinosaur-asteroid-mammal-evolution/',
  },
  {
    kind: 'Science',
    lead: 'Walking Upright',
    reveal:
      'Around 6 million years ago in Africa, climate shifts shrank dense rainforests into open grasslands, favoring primates that could walk on two legs. This bipedal stance freed their hands to carry food and manipulate tools, sparking the lineage of early human relatives called hominins.',
    source: 'Smithsonian’s Human Origins Program, Walking Upright',
    sourceUrl: 'https://humanorigins.si.edu/human-characteristics/walking-upright',
  },
  {
    kind: 'Science',
    lead: 'The First Toolmakers',
    reveal:
      'Around 2.6 million years ago, early Homo species (like Homo habilis, literally “handy man”) began deliberately chipping stones into sharp-edged flakes and choppers, known as Oldowan tools. These simple tools let early humans butcher carcasses and crack bones for marrow, opening up a richer, more reliable source of protein and fat than they could get with hands and teeth alone.',
    source: 'Smithsonian’s Human Origins Program, Homo habilis',
    sourceUrl: 'https://humanorigins.si.edu/evidence/human-fossils/species/homo-habilis',
  },
  {
    kind: 'Science',
    lead: 'Homo Erectus Masters Fire',
    reveal:
      'Roughly a million years ago, Homo erectus became the first hominin species to control fire and use it to cook food. Cooking softened tough meat and plant fibers, making meals far easier to chew and digest than anything eaten raw.',
    source:
      'Harvard Gazette, Invention of cooking drove evolution of the human species, new book argues',
    sourceUrl:
      'https://news.harvard.edu/gazette/story/2009/06/invention-of-cooking-drove-evolution-of-the-human-species-new-book-argues/',
  },
  {
    kind: 'Science',
    lead: 'Cooking and the Growing Brain',
    reveal:
      'Cooked food yields more usable protein and calories for less digestive effort, freeing up energy that the body once spent on chewing and digestion. Because brain tissue is metabolically expensive to run, this extra energy budget is thought to have helped fuel the growth of larger, more complex hominin brains.',
    source: 'Scientific American, Cooking Up Bigger Brains',
    sourceUrl: 'https://www.scientificamerican.com/article/cooking-up-bigger-brains/',
  },
  {
    kind: 'Science',
    lead: 'Softer Food, Bigger Skulls',
    reveal:
      'One scientific hypothesis points to the temporalis, a powerful jaw muscle that wraps over the skull and constrains its growth during childhood. As cooked, softer food reduced the need for heavy chewing, this muscle grew smaller over generations (via a mutation in the MYH16 gene around 2.4 million years ago), possibly loosening its grip on the skull and leaving more room for the brain to expand.',
    source: 'National Geographic, Chew On This',
    sourceUrl: 'https://www.nationalgeographic.com/science/article/chew-on-this',
  },
  {
    kind: 'Science',
    lead: 'The Useless Wisdom Teeth',
    reveal:
      'As jaws kept shrinking alongside softer, cooked diets, human mouths gradually lost the room they once had for a full set of molars. The third molars, or “wisdom teeth,” are a leftover from our big-jawed ancestors, and today they often grow in crooked, impacted, or unnecessary, making removal a common modern procedure.',
    source:
      'Pitt Med Magazine (University of Pittsburgh), Tween science: Why do we have wisdom teeth?',
    sourceUrl:
      'https://www.pittmed.pitt.edu/news/for-real-wisdom-teeth-evolution-tough-foods-jaw-size-the-conversation',
  },
  {
    kind: 'Science',
    lead: 'The Emergence of Homo Sapiens',
    reveal:
      'Around 300,000 years ago in Africa, Homo sapiens evolved with larger brains, complex language, and advanced toolmaking abilities. With unmatched adaptability and abstract thinking, our species migrated across the globe, becoming the sole surviving human species on Earth.',
    source: 'Smithsonian’s Human Origins Program, Our species arose at least 300,000 years ago',
    sourceUrl:
      'https://humanorigins.si.edu/research/whats-hot-human-origins/our-species-arose-least-300000-years-ago',
  },
  {
    kind: 'Science',
    lead: 'Out of Africa',
    reveal:
      'Starting around 70,000 years ago, groups of Homo sapiens began migrating out of Africa in waves, spreading across Asia, Europe, and eventually every other continent. This “Out of Africa” expansion is the leading theory explaining how one African-born species came to populate the entire globe.',
    source: 'Smithsonian Magazine, The Great Human Migration',
    sourceUrl: 'https://www.smithsonianmag.com/history/the-great-human-migration-13561/',
  },
  {
    kind: 'Science',
    lead: 'Meeting Our Ancient Cousins',
    reveal:
      'As Homo sapiens spread into Europe and Asia, they encountered and interbred with Neanderthals and, farther east, with the more mysterious Denisovans. Today, people of European and Asian descent carry small traces of Neanderthal DNA, Melanesian and Aboriginal Australian populations carry the most Denisovan DNA (4–6%), and populations that stayed in Africa carry little to none of either.',
    source: 'Smithsonian’s Human Origins Program, Ancient DNA and Neanderthals',
    sourceUrl: 'https://humanorigins.si.edu/evidence/genetics/ancient-dna-and-neanderthals',
  },
  {
    kind: 'Science',
    lead: 'The Rise of Civilization',
    reveal:
      'Around 10,000 BCE, the last Ice Age ended and a warming climate allowed some human groups to abandon nomadic hunting and gathering in favor of farming wheat, barley, and domesticated animals. This Agricultural Revolution let people settle permanently in one place, and these growing farming settlements eventually swelled into the first cities, laying the groundwork for organized civilization.',
    source: 'Britannica, Neolithic Revolution',
    sourceUrl: 'https://www.britannica.com/event/Neolithic-Revolution',
  },
  {
    kind: 'Science',
    lead: 'The Dawn of History',
    reveal:
      'Around 3,200 BCE, the Sumerians of Mesopotamia developed cuneiform, wedge-shaped marks pressed into clay tablets, widely regarded as the world’s oldest known writing system. Because writing let people record laws, trade, and events instead of relying on memory alone, this moment is conventionally treated as the dividing line between “prehistory” and recorded history.',
    source: 'Britannica, Cuneiform',
    sourceUrl: 'https://www.britannica.com/topic/cuneiform',
  },
  {
    kind: 'Science',
    lead: 'Gods and the Rise of Religion',
    reveal:
      'As early civilizations grew, people across Mesopotamia, Egypt, and beyond developed polytheistic religions, worshipping many gods tied to natural forces like the sun, rivers, and harvests. Over the following millennia, some societies gradually shifted toward monotheism, the belief in a single god, a transition seen in movements like Akhenaten’s short-lived worship of Aten in ancient Egypt and, more lastingly, in the emergence of Judaism.',
    source: 'World History Encyclopedia, Monotheism in the Ancient World',
    sourceUrl: 'https://www.worldhistory.org/article/1454/monotheism-in-the-ancient-world/',
  },
  {
    kind: 'Science',
    lead: 'The First Empires',
    reveal:
      'Around 2,334 BCE, Sargon of Akkad united the city-states of Mesopotamia into what’s considered history’s first empire, the Akkadian Empire. This model of one ruler controlling many conquered peoples and cities became the blueprint for empires that followed for thousands of years.',
    source: 'Britannica, Sargon',
    sourceUrl: 'https://www.britannica.com/biography/Sargon',
  },
  {
    kind: 'Science',
    lead: 'Law Written in Stone',
    reveal:
      'Around 1,754 BCE, the Babylonian king Hammurabi had one of the earliest and most complete legal codes carved into a massive stone stele, listing 282 laws covering everything from theft to family disputes. Its famous “an eye for an eye” principle set a public, consistent standard of justice that everyone, in theory, could see and know.',
    source:
      'World History Encyclopedia, Code of Hammurabi: The Most Influential Law Code of the Ancient World',
    sourceUrl: 'https://www.worldhistory.org/Code_of_Hammurabi/',
  },
  {
    kind: 'Science',
    lead: 'The Invention of Currency',
    reveal:
      'Around 600 BCE, the kingdom of Lydia (in modern-day Turkey) minted the first standardized metal coins, made from electrum, a natural gold-silver alloy. Standardized coinage replaced clunky barter and unweighed precious metals, making trade faster and more trustworthy across long distances.',
    source: 'World History Encyclopedia, The Invention of the First Coinage in Ancient Lydia',
    sourceUrl:
      'https://www.worldhistory.org/article/1793/the-invention-of-the-first-coinage-in-ancient-lydi/',
  },
  {
    kind: 'Science',
    lead: 'The Birth of Philosophy',
    reveal:
      'Starting around the 6th century BCE, thinkers in Greece like Thales and later Socrates, Plato, and Aristotle began asking systematic questions about reality, ethics, and knowledge, apart from religious explanations. This launched Western philosophy and laid intellectual groundwork for later scientific reasoning.',
    source: 'Britannica, Greek Philosophy',
    sourceUrl: 'https://www.britannica.com/topic/Greek-philosophy',
  },
  {
    kind: 'Science',
    lead: 'Empires of Antiquity',
    reveal:
      'Between the 6th century BCE and the 5th century CE, a succession of vast empires — the Persian, Alexander the Great’s Macedonian, and eventually Rome — connected huge swaths of Europe, Asia, and Africa under shared trade networks and laws. Rome alone endured for centuries, spreading its language, roads, and institutions across three continents.',
    source: 'Britannica, Roman Empire',
    sourceUrl: 'https://www.britannica.com/place/Roman-Empire',
  },
  {
    kind: 'Science',
    lead: 'The Fall of Rome',
    reveal:
      'In 476 CE, the last Western Roman emperor, Romulus Augustulus, was deposed by the Germanic chieftain Odoacer, traditionally marking the fall of the Western Roman Empire after centuries of internal decline and outside invasions. Europe then entered the Middle Ages, a long period marked by fragmented, smaller kingdoms in place of centralized imperial rule.',
    source: 'Britannica, Roman Empire: Height and decline of imperial Rome',
    sourceUrl: 'https://www.britannica.com/place/Roman-Empire/Height-and-decline-of-imperial-Rome',
  },
  {
    kind: 'Science',
    lead: 'The Printing Press',
    reveal:
      'In 1440, Johannes Gutenberg introduced the movable-type printing press in Germany, allowing books to be mass-produced instead of copied by hand. This dramatically increased literacy and the speed at which ideas, including scientific and religious ones, could spread across Europe.',
    source: 'Britannica, Johannes Gutenberg',
    sourceUrl: 'https://www.britannica.com/biography/Johannes-Gutenberg',
  },
  {
    kind: 'Science',
    lead: 'The Scientific Revolution',
    reveal:
      'From the 16th to 17th centuries, figures like Copernicus, Galileo, and Newton overturned ancient assumptions about the universe, showing the Earth orbits the Sun and describing nature through mathematical laws. This shift toward observation and experimentation became the foundation of modern science.',
    source: 'Britannica, Scientific Revolution',
    sourceUrl: 'https://www.britannica.com/science/Scientific-Revolution',
  },
  {
    kind: 'Science',
    lead: 'The Industrial Revolution',
    reveal:
      'Starting around 1760 in Britain, the invention of steam engines and mechanized manufacturing transformed economies from agricultural and hand-crafted to industrial and factory-based. This rapid technological shift reshaped where and how people worked, lived, and traveled within a few generations.',
    source: 'Britannica, Industrial Revolution',
    sourceUrl: 'https://www.britannica.com/event/Industrial-Revolution',
  },
  {
    kind: 'Science',
    lead: 'Electricity and the Modern World',
    reveal:
      'In the late 19th century, inventors like Thomas Edison and Nikola Tesla harnessed electricity for practical use, powering lights, motors, and eventually entire cities. Electrification became the backbone of nearly every technology that followed, from communication to computing.',
    source: 'HISTORY, How Edison, Tesla and Westinghouse Battled to Electrify America',
    sourceUrl: 'https://www.history.com/articles/what-was-the-war-of-the-currents',
  },
  {
    kind: 'Science',
    lead: 'The Computer Age Begins',
    reveal:
      'In the 1940s, machines like the ENIAC became some of the first general-purpose electronic computers, initially built for military calculations during World War II. Over the following decades, computers shrank from room-sized machines to desktop devices, transforming how humans processed information.',
    source: 'Britannica, ENIAC',
    sourceUrl: 'https://www.britannica.com/technology/ENIAC',
  },
  {
    kind: 'Science',
    lead: 'The Internet Connects the World',
    reveal:
      'In 1969, the U.S. military-funded ARPANET sent its first message between two computers, planting the seed of what would become the internet. By the 1990s, the World Wide Web made this network accessible to ordinary people, connecting the globe in a way no previous technology had.',
    source: 'Britannica, ARPANET',
    sourceUrl: 'https://www.britannica.com/topic/ARPANET',
  },
  {
    kind: 'Science',
    lead: 'The Rise of Artificial Intelligence',
    reveal:
      'Though the term “artificial intelligence” was coined in 1956 at the Dartmouth Conference, AI remained limited for decades until breakthroughs in machine learning and neural networks in the 2010s allowed computers to recognize images, understand language, and generate original content. By the 2020s, AI systems became woven into daily life, marking a new chapter in the same story that began with the Big Bang — matter, memory, and mind converging into machines that can now, in their own way, think.',
    source: 'IBM, The History of Artificial Intelligence',
    sourceUrl: 'https://www.ibm.com/think/topics/history-of-artificial-intelligence',
  },
];
