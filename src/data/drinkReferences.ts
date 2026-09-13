export type DrinkReference = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  sourceUrl?: string;
  sourceLabel?: string;
};

// Exact copies of inspected photographs/native video crops. Source files and
// SHA-256 copy checks are retained in references/embedded-reference-manifest.json.
const suppliedFilm = 'https://www.instagram.com/p/DdLFBKQBUkU/';
const espressoFeature = 'https://cnaluxury.channelnewsasia.com/experiences/espresso-martini-singapore-244116';

export const drinkReferences: Partial<Record<string, DrinkReference>> = {
  'bbf-negroni': {
    src: '/references/bbf-negroni.png',
    alt: 'The filmed BBF Negroni: dark red liquid in a straight rocks glass with a thick base and a rounded orange garnish.',
    caption: 'Supplied film · 00:48.60. Native crop of the serving used to author this model; filming date is not established.',
    credit: 'User-supplied Negroni crawl video',
    sourceUrl: suppliedFilm,
    sourceLabel: 'Original video post',
  },
  'ichigo-negroni': {
    src: '/references/ichigo-negroni.png',
    alt: 'The filmed Ichigo Negroni: amber liquid and large clear ice beneath a yellow flower on a red round garnish.',
    caption: 'Supplied film · 01:16.80. Native crop of the serving used to author this model; filming date is not established.',
    credit: 'User-supplied Negroni crawl video',
    sourceUrl: suppliedFilm,
    sourceLabel: 'Original video post',
  },
  'negroni-express': {
    src: '/references/negroni-express.png',
    alt: 'The filmed Negroni Express at Somma: red-orange liquid, large clear ice and a curved green shishito on a printed coaster.',
    caption: 'Supplied film · 01:54.00. Native crop of the serving used to author this model; filming date is not established.',
    credit: 'User-supplied Negroni crawl video',
    sourceUrl: suppliedFilm,
    sourceLabel: 'Original video post',
  },
  'atlas-espresso-martini': {
    src: '/references/atlas-espresso-martini.jpg',
    alt: 'ATLAS Espresso Martini with a dark coffee body, thick ivory cream float and cinnamon dust in a narrow stemmed glass.',
    caption: 'Published 4 April 2024. This dated serving guided the model; the current presentation may differ.',
    credit: 'ATLAS · bar-supplied photograph via CNA Luxury',
    sourceUrl: espressoFeature,
    sourceLabel: 'CNA Luxury · April 2024 serving photographs',
  },
  'jigger-espresso-martini': {
    src: '/references/jigger-espresso-martini.jpg',
    alt: 'Jigger & Pony Espresso Martini in a shallow coupe, with a pale crema border around a broad lacy cacao tuile.',
    caption: 'Published 4 April 2024. This dated serving guided the model; the current presentation may differ.',
    credit: 'Jigger & Pony · bar-supplied photograph via CNA Luxury',
    sourceUrl: espressoFeature,
    sourceLabel: 'CNA Luxury · April 2024 serving photographs',
  },
  'nighthawks': {
    src: '/references/nighthawks.jpg',
    alt: 'Night Hawk’s Nighthawks in a stemmed glass, with foam, a long dark feather and a round seal under red and teal lighting.',
    caption: 'Published 4 April 2024. The feather-and-seal serving guided the model. Colored lighting affects the foam and glass; the current presentation may differ.',
    credit: 'Night Hawk · bar-supplied photograph via CNA Luxury',
    sourceUrl: espressoFeature,
    sourceLabel: 'CNA Luxury · April 2024 serving photographs',
  },
  'atlas-martini': {
    src: '/references/atlas-martini.jpg',
    alt: 'ATLAS Martini with clear liquid and a broad lemon peel in a rounded, cut-crystal stemmed coupe.',
    caption: 'Official ATLAS photograph; publication date unstated. The photo shows a rounded crystal bowl. The model’s V-shaped glass is an illustrative interpretation of the recipe card.',
    credit: 'ATLAS · official website',
    sourceUrl: 'https://www.atlasbar.sg/atlaslondondrygin',
    sourceLabel: 'ATLAS · The Story of the ATLAS Martini',
  },
  'moga-dirty-sake-tini': {
    src: '/references/moga-dirty-sake-tini.jpg',
    alt: 'MOGA Dirty Sake-Tini: pale straw liquid in a rounded coupe with a folded green-edged ribbon on a diagonal metal pick.',
    caption: 'Named official gallery photo · October 2024 upload. Cucumber is an inferred identity for the green ribbon; the current presentation may differ.',
    credit: 'MOGA · official serving gallery',
    sourceUrl: 'https://www.moga.com.sg/gallery/',
    sourceLabel: 'MOGA · named serving gallery',
  },
  'somma-mirkos-martini': {
    src: '/references/somma-mirkos-martini.jpg',
    alt: 'Mirko’s Martini splashing from a shallow coupe, with a large green olive and small browned pieces on a pick.',
    caption: 'Published 10 January 2025. This named Somma photo is an action shot; the model shows resting liquid. The current garnish may differ.',
    credit: 'Somma Bar · photograph via Robb Report Singapore',
    sourceUrl: 'https://robbreport.com.sg/somma-cocktail-pasta-bar/',
    sourceLabel: 'Robb Report · named Mirko’s Martini photograph',
  },
  'moga-salted-yuzu-highball': {
    src: '/references/moga-salted-yuzu-highball.jpg',
    alt: 'MOGA Salted Yuzu Highball: pale cloudy gold liquid in a tall tapered glass, with large clear ice and no separate visible garnish.',
    caption: 'Named official gallery photo · December 2024 upload. This serving guided the illustration; the current presentation may differ.',
    credit: 'MOGA · official serving gallery',
    sourceUrl: 'https://www.moga.com.sg/gallery/',
    sourceLabel: 'MOGA · named serving gallery',
  },
  'jigger-wasabi-highball': {
    src: '/references/jigger-wasabi-highball.jpg',
    alt: 'Jigger & Pony Wasabi Highball: a narrow glass of golden liquid and clear ice, with an orange crescent inside against a teal backdrop.',
    caption: 'Named official photo in the current BLOOM menu and website, checked September 2026. The fruit identity of the orange crescent is not specified; publication date is unstated.',
    credit: 'Jigger & Pony · official website',
    sourceUrl: 'https://www.jiggerandpony.com/',
    sourceLabel: 'Jigger & Pony · official serving photograph',
  },
};

export const missingReferenceNotes: Record<string, string> = {
  'somma-pine-highball': 'No verified serving photo. Glass and ice are illustrative.',
};
