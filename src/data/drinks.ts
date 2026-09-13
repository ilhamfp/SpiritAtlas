import {espressoBars,espressoDrinks} from './espresso';
import {newCollectionDrinks} from './newCollections';
export type EvidenceStatus = 'video-confirmed' | 'official-same-version' | 'official-menu' | 'visual-observation' | 'user-confirmed' | 'inferred' | 'unverified';
export type CocktailFamilyId = 'negroni' | 'espresso-martini' | 'martini' | 'highball';
export const cocktailFamilies: {id: CocktailFamilyId; name: string; headline: string; description: string; sourceCaption?: string}[] = [
  {id: 'negroni', name: 'Negronis', headline: 'Three bars.\nThree takes on\nthe Negroni.', description: 'From oak-aged red to clarified amber. Explore the three filmed interpretations.'},
  {id: 'espresso-martini', name: 'Espresso Martinis', headline: 'Coffee,\nafter dark.', description: 'Cream, cacao and coconut. Three Singapore bars rethink the espresso martini.', sourceCaption: 'Current menu ingredients · Appearance reference April 2024.'},
  {id: 'martini', name: 'Martinis', headline: 'A different\nkind of dry.', description: 'Lemon, pickles and olive brine. Three interpretations from ATLAS, MOGA and Somma.', sourceCaption: 'Official recipes · Serving details are illustrative.'},
  {id: 'highball', name: 'Highballs', headline: 'Long drinks.\nLively ideas.', description: 'Yuzu and roasted tea, smoky pine, wasabi and apricot. Three ways to build a highball.', sourceCaption: 'Official recipes · Serving details are illustrative.'},
];
export type CategoryId = 'garnish' | 'modifiers' | 'vermouth' | 'bitter' | 'coffee' | 'liqueur' | 'spirit' | 'structure' | 'fizz';
export const categories: { id: CategoryId; label: string }[] = [
  { id: 'garnish', label: 'Garnish' },
  { id: 'modifiers', label: 'Distinctive modifiers' },
  { id: 'vermouth', label: 'Vermouth / wine' },
  { id: 'bitter', label: 'Bitter / amaro' },
  { id: 'spirit', label: 'Base spirit' },
  { id: 'structure', label: 'Serving structure' },
];
const espressoCategories: {id: CategoryId; label: string}[] = [
  {id: 'garnish', label: 'Garnish'},
  {id: 'modifiers', label: 'Cream & accents'},
  {id: 'coffee', label: 'Coffee'},
  {id: 'liqueur', label: 'Liqueur / amaro'},
  {id: 'spirit', label: 'Base spirit'},
  {id: 'structure', label: 'Serving structure'},
];
const martiniCategories: {id: CategoryId; label: string}[] = [
  {id: 'garnish', label: 'Garnish'}, {id: 'modifiers', label: 'Acidity & accents'},
  {id: 'vermouth', label: 'Vermouth'}, {id: 'spirit', label: 'Base spirit'}, {id: 'structure', label: 'Serving structure'},
];
const highballCategories: {id: CategoryId; label: string}[] = [
  {id: 'modifiers', label: 'Flavour & seasoning'}, {id: 'fizz', label: 'Soda / lengthener'},
  {id: 'spirit', label: 'Base spirit & infusion'}, {id: 'structure', label: 'Glass & ice'},
];
const familyCategories = {negroni: categories, 'espresso-martini': espressoCategories, martini: martiniCategories, highball: highballCategories};
export const categoriesForFamily = (family: CocktailFamilyId) => familyCategories[family];
export type Ingredient = {
  id: string; category: CategoryId; title: string; description: string;
  evidence: EvidenceStatus; timecode: string; quantity: null; unit: null;
  role: 'physical' | 'representative' | 'unverified';
  illustrationColor?: string;
  sources?: {label: string; url: string}[];
};
export type Technique = {
  id: string; title: string; description: string; timecode: string;
  affectedIngredients: string[]; visibleFinishedComponent: boolean;
};
export type Bar = {
  id: string; name: string; address: string; floor: string; area: string;
  buildingId: string; buildingName: string; coordinates: [number, number];
  url: string; directions: string; description: string; drinkIds: string[];
  verifiedAt: string; verificationSources: string[];
};
const oneMap = (address: string) => `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(address)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
export const bars: Bar[] = [
  {
    id: 'bar-bon-funk', name: 'Bar Bon Funk', address: '46 Kim Yam Road, School Block, #02-01, Singapore 239351',
    floor: 'Level 2 · #02-01', area: 'River Valley', buildingId: 'new-bahru', buildingName: 'New Bahru',
    coordinates: [103.8392883617146, 1.292187061924288], url: 'https://www.lobehold.com/concepts/bar-bon-funk/',
    directions: 'https://www.google.com/maps/search/?api=1&query=Bar+Bon+Funk+46+Kim+Yam+Road+Singapore',
    description: 'A bar in New Bahru’s former school building, with a Negroni shaped by time, cold, and orange aroma.',
    drinkIds: ['bbf-negroni'], verifiedAt: '2026-09-12',
    verificationSources: ['https://www.lobehold.com/concepts/bar-bon-funk/', oneMap('46 Kim Yam Road')],
  },
  {
    id: 'moga', name: 'MOGA', address: '1 Hill Street, Level 1, Pullman Singapore Hill Street, Singapore 179949',
    floor: 'Level 1', area: 'City Hall', buildingId: 'pullman-hill-street', buildingName: 'Pullman Hill Street',
    coordinates: [103.850660822625, 1.293706168743367], url: 'https://www.moga.com.sg/find-us/',
    directions: 'https://www.google.com/maps/search/?api=1&query=MOGA+1+Hill+Street+Singapore',
    description: 'A Japanese-inspired bar on Hill Street. Its filmed Ichigo Negroni brings strawberry and milk clarification to the classic.',
    drinkIds: ['ichigo-negroni'], verifiedAt: '2026-09-12',
    verificationSources: ['https://www.moga.com.sg/find-us/', oneMap('1 Hill Street')],
  },
  {
    id: 'bar-somma', name: 'Bar Somma', address: '46 Kim Yam Road, School Block, #04-02A, Singapore 239351',
    floor: 'Level 4 · #04-02A', area: 'River Valley', buildingId: 'new-bahru', buildingName: 'New Bahru',
    coordinates: [103.8392883617146, 1.292187061924288], url: 'https://www.lobehold.com/concepts/somma/',
    directions: 'https://www.google.com/maps/search/?api=1&query=Bar+Somma+46+Kim+Yam+Road+Singapore',
    description: 'On New Bahru’s fourth floor, Negroni Express pairs red-orange liquid with a distinctive pickled shishito garnish.',
    drinkIds: ['negroni-express'], verifiedAt: '2026-09-12',
    verificationSources: ['https://www.lobehold.com/concepts/somma/', 'https://www.somma.world/bar-reservation', oneMap('46 Kim Yam Road')],
  },
  ...espressoBars,
];
export type Drink = {
  id: string; barId: string; family: CocktailFamilyId; name: string; twist: string; shortTwist: string;
  introduction: string; appearance: string[]; unknowns: string[]; referenceIds: string[];
  source: { path: string; originalUrl: string; timecodes: string[]; version: string; kind?: 'film' | 'menu'; verifiedAt?: string; links?: {label: string; url: string}[] };
  assets: { model: string; poster: string; revision?: string }; cameraPreset: string; lightingPreset: string;
  ingredients: Ingredient[]; techniques: Technique[]; ratios: null; color: string;
  renderProfile?: {optics: 'layered' | 'glass'; hasIce: boolean; glassHeight: number; rimRatio: number; cameraDistance: number; liquidColor: string; expandedTarget?: number; expandedDistance?: number};
};
const source = (timecodes: string[]) => ({
  path: 'negroni-bar-crawl.mp4', originalUrl: 'https://www.instagram.com/p/DdLFBKQBUkU/',
  timecodes, version: 'User-supplied filmed serving; not a current menu listing',
});
const ingredient = (id: string, category: CategoryId, title: string, description: string, evidence: EvidenceStatus, timecode: string, role: Ingredient['role']): Ingredient => ({id, category, title, description, evidence, timecode, role, quantity: null, unit: null});
const mogaMenu = {label: 'MOGA official menu · classic Negroni, p. 19', url: 'https://www.moga.com.sg/wp-content/uploads/sites/57/2024/08/MOGA_BarMenu_Digital_2026.pdf'};
const expressRecipe = {label: 'Negroni Express by Mel John Chavez · 2022', url: 'https://uncoverasia.com/negroni-week-singapore/'};
const sommaClassicMenu = {label: 'Somma official menu · March 2025', url: 'https://static1.squarespace.com/static/669a6a47bf163d18d7dd87d2/t/67dd50b88077496c164fae4d/1742557388683/Bar+Somma+Cocktails+menu+.pdf'};
const inferredIngredient = (id: string, category: CategoryId, title: string, description: string, illustrationColor: string, sources: NonNullable<Ingredient['sources']>): Ingredient => ({
  ...ingredient(id, category, title, description, 'inferred', 'Recipe research · 13 Sep 2026', 'representative'), illustrationColor, sources,
});
// The atlas editor confirmed Campari in all three on 13 September 2026.
// Keep that provenance distinct from independently checked menu/video evidence.
const campariIngredient = (id: string, title: string, description: string): Ingredient => ({
  ...ingredient(id, 'bitter', title, description, 'user-confirmed', 'Atlas editor confirmation · 13 Sep 2026', 'representative'),
  illustrationColor: '#bd3524',
});
export const drinks: Drink[] = [
  {
    id: 'bbf-negroni', barId: 'bar-bon-funk', family: 'negroni', name: 'BBF Negroni',
    twist: 'American-oak aging, freezing, and flamed orange bring a different texture to a deep-red Negroni.',
    shortTwist: 'Oak-aged. Deep red. Orange aroma.',
    introduction: 'Gin meets a blend of amaros and vermouths. Time in light American oak and a turn in the freezer shape the filmed drink.',
    color: '#ab422f', ratios: null, source: source(['00:35–00:53', '02:20']),
    appearance: ['Deep red to brown-red liquid', 'Straight rocks glass with substantial clear base', 'Large clear ice and rounded orange garnish'],
    unknowns: ['Ingredient quantities and blend proportions', 'Gin and vermouth brands, and other components of the amaro blend', 'Unseen surfaces and exact dimensions'],
    referenceIds: ['bbf-hero', 'bbf-close', 'bbf-ice-prep', 'bbf-orange-prep'],
    assets: {model: '/models/bbf-negroni.glb', poster: '/posters/bbf-negroni.jpg'}, cameraPreset: 'bbf-product', lightingPreset: 'warm-studio',
    ingredients: [
      ingredient('bbf-orange', 'garnish', 'Orange garnish', 'The rounded orange garnish is visible near the surface. Flamed orange aroma is described separately as a technique.', 'visual-observation', '00:48.60', 'physical'),
      inferredIngredient('bbf-modifiers', 'modifiers', 'Orange zest oils', 'Closest match for the aromatic finish: the film describes flamed orange and caramelised zest. This form illustrates oils from that same orange, not a separate syrup or an extra measured ingredient.', '#e5a24e', [{label: 'Filmed flamed-orange finish · 00:48–00:52', url: 'https://www.instagram.com/p/DdLFBKQBUkU/'}]),
      ingredient('bbf-vermouth', 'vermouth', 'Blended vermouths', 'A vermouth blend is named in the film. Its constituent bottles and proportions are not established.', 'video-confirmed', '00:35–00:53', 'representative'),
      campariIngredient('bbf-amaro', 'Campari · amaro blend', 'Campari provides the bitter component. The film also describes an amaro blend; its other components, proportions and Campari’s relationship to the blend remain unspecified. Campari’s inclusion was confirmed by the atlas editor.'),
      ingredient('bbf-gin', 'spirit', 'Gin', 'Gin is confirmed as the base spirit. The filmed version does not establish a brand or measure.', 'video-confirmed', '00:35–00:53', 'representative'),
      ingredient('bbf-serving', 'structure', 'Clear ice · heavy-base glass', 'Large clear ice sits in a cylindrical rocks glass with a substantial clear base.', 'visual-observation', '00:48.60', 'physical'),
    ],
    techniques: [
      {id: 'bbf-oak', title: 'American-oak aging', description: 'Light American-oak aging is part of preparation; no wood is left as a finished-drink component.', timecode: '00:35–00:53', affectedIngredients: ['bbf-gin','bbf-amaro','bbf-vermouth'], visibleFinishedComponent: false},
      {id: 'bbf-freeze', title: 'Freezing for texture', description: 'Freezing is described as producing a slushy-like texture. The finished reference remains the guide to visible ice.', timecode: '00:35–00:53', affectedIngredients: ['bbf-gin','bbf-amaro','bbf-vermouth'], visibleFinishedComponent: false},
      {id: 'bbf-flame', title: 'Flamed orange aroma', description: 'Orange aroma is flamed during preparation. The flame is not a permanent ingredient.', timecode: '00:35–00:53', affectedIngredients: ['bbf-orange'], visibleFinishedComponent: false},
    ],
  },
  {
    id: 'ichigo-negroni', barId: 'moga', family: 'negroni', name: 'Ichigo Negroni',
    twist: 'Strawberry and milk clarification transform the classic into a transparent golden-amber drink.',
    shortTwist: 'Strawberry. Clarified. Golden amber.',
    introduction: 'A clear amber interpretation with strawberry in the drink, a densely petalled yellow flower, and a glossy round red garnish.',
    color: '#c49346', ratios: null, source: source(['01:08–01:17', '02:14–02:18']),
    appearance: ['Transparent golden-amber liquid', 'Cylindrical rocks glass and large clear ice', 'Densely petalled yellow flower over a round red garnish'],
    unknowns: ['Whether the filmed Ichigo uses the Tanqueray gin and sweet vermouth in MOGA’s classic recipe', 'Flower species and red garnish composition', 'All ingredient quantities'],
    referenceIds: ['ichigo-hero', 'ichigo-flower', 'ichigo-red-garnish', 'ichigo-close'],
    assets: {model: '/models/ichigo-negroni.glb', poster: '/posters/ichigo-negroni.jpg'}, cameraPreset: 'ichigo-product', lightingPreset: 'warm-studio',
    ingredients: [
      ingredient('ichigo-garnish', 'garnish', 'Yellow flower · red garnish', 'A densely petalled yellow flower rests above a round red garnish. The flower species and red garnish composition are unverified.', 'visual-observation', '01:14.2', 'physical'),
      ingredient('ichigo-strawberry', 'modifiers', 'Strawberry', 'Strawberry is confirmed in the drink. This does not establish what the separate red garnish is made from.', 'video-confirmed', '01:08–01:17', 'representative'),
      inferredIngredient('ichigo-vermouth', 'vermouth', 'Sweet vermouth', 'Closest match from MOGA’s own classic Negroni, which lists sweet vermouth. This choice completes the filmed Ichigo illustration; the exact vermouth in that strawberry version is not published.', '#ad563a', [mogaMenu]),
      campariIngredient('ichigo-bitter', 'Campari', 'Campari is the bitter component in this clarified Negroni. Its inclusion was confirmed by the atlas editor; the quantity remains unknown.'),
      inferredIngredient('ichigo-spirit', 'spirit', 'Tanqueray gin', 'Closest match from MOGA’s own classic Negroni, which specifies Tanqueray gin. Its use in the filmed Ichigo is an estimate, not a confirmed brand identification.', '#d8cfb3', [mogaMenu]),
      ingredient('ichigo-serving', 'structure', 'Clear ice · rocks glass', 'Large clear ice sits in a cylindrical rocks glass. Clarification leaves the finished drink transparent.', 'visual-observation', '01:16.80', 'physical'),
    ],
    techniques: [{id: 'ichigo-clarification', title: 'Milk clarification', description: 'Milk is used in the clarification process. It is not shown as an opaque layer or a separate component of the finished drink.', timecode: '01:08–01:17', affectedIngredients: ['ichigo-strawberry'], visibleFinishedComponent: false}],
  },
  {
    id: 'negroni-express', barId: 'bar-somma', family: 'negroni', name: 'Negroni Express',
    twist: 'Ancho Verde and rice syrup meet a curved pickled shishito and a finish of expressed orange oil.',
    shortTwist: 'Ancho Verde. Rice syrup. Shishito.',
    introduction: 'A red-orange drink with a prominent ice block and a long green shishito laid across its softly curved tumbler.',
    color: '#c9552f', ratios: null, source: source(['01:27–01:54']),
    appearance: ['Red-orange liquid in a low tumbler with curved lower profile', 'Prominent clear ice block', 'Curved wrinkled green shishito with its stem'],
    unknowns: ['Whether the historical gin and inferred sweet red vermouth match the filmed serving; their brands are not specified', 'Ingredient quantities and rice-syrup preparation', 'Unseen surfaces and exact dimensions'],
    referenceIds: ['somma-hero', 'somma-side', 'somma-ice', 'somma-photo'],
    assets: {model: '/models/negroni-express.glb', poster: '/posters/negroni-express.jpg'}, cameraPreset: 'somma-product', lightingPreset: 'warm-studio',
    ingredients: [
      ingredient('somma-shishito', 'garnish', 'Pickled shishito', 'A curved green shishito with wrinkled skin and a visible stem lies across the drink.', 'video-confirmed', '01:27–01:54', 'physical'),
      ingredient('somma-modifiers', 'modifiers', 'Ancho Verde · rice syrup', 'Ancho Verde and rice syrup are named in the filmed explanation. Their measures are not established.', 'video-confirmed', '01:27–01:54', 'representative'),
      inferredIngredient('somma-vermouth', 'vermouth', 'Sweet red vermouth', 'Closest match: the creator’s 2022 Negroni Express contains vermouth, and Somma’s 2025 classic Negroni specifies vermouth rosso. The sweet-red style is an estimate for the filmed Express; no brand or measure is assigned.', '#a94e32', [expressRecipe, sommaClassicMenu]),
      campariIngredient('somma-bitter', 'Campari', 'Campari is the bitter component, alongside the Ancho Verde listed under modifiers. Its inclusion was confirmed by the atlas editor; the quantity remains unknown.'),
      inferredIngredient('somma-spirit', 'spirit', 'Gin', 'Closest match from Mel John Chavez’s published 2022 Negroni Express recipe, which contains gin alongside vermouth, Campari, Ancho Reyes Verde and rice syrup. Continuity with the filmed Somma serving is inferred; the gin brand is not specified.', '#d8cfb3', [expressRecipe]),
      ingredient('somma-serving', 'structure', 'Large ice · low tumbler', 'A prominent clear ice block sits in a low tumbler with a softly curved lower profile.', 'visual-observation', '01:54.00', 'physical'),
    ],
    techniques: [{id: 'somma-orange-oil', title: 'Expressed orange oil', description: 'Orange oil is expressed over the drink for aroma. The finished filmed serving has no permanent orange wedge.', timecode: '01:27–01:54', affectedIngredients: ['somma-modifiers'], visibleFinishedComponent: false}],
  },
];
drinks.push(...espressoDrinks, ...newCollectionDrinks);
// Venue identity is shared across collections; derive every menu entry from the catalog.
for (const bar of bars) bar.drinkIds = drinks.filter(drink => drink.barId === bar.id).map(drink => drink.id);
export const drinkById = Object.fromEntries(drinks.map((drink) => [drink.id, drink])) as Record<string, Drink>;
export const barById = Object.fromEntries(bars.map((bar) => [bar.id, bar])) as Record<string, Bar>;
export const drinksForFamily = (family: CocktailFamilyId) => drinks.filter(drink => drink.family === family);
export const barsForFamily = (family: CocktailFamilyId) => bars.filter(bar => bar.drinkIds.some(id => drinkById[id]?.family === family));
