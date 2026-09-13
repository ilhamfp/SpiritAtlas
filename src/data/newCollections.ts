import type {CategoryId, Drink, EvidenceStatus, Ingredient} from './drinks';

const checked = '2026-09-13';
const atlasMenu = 'https://www.atlasbar.sg/storage/app/uploads/public/69d/332/f55/69d332f5526c7253694601.pdf';
const atlasRecipe = 'https://atlasbar.sg/storage/app/media/ATLASMartini_Recipe.pdf';
const mogaMenu = 'https://www.moga.com.sg/wp-content/uploads/sites/57/2024/08/MOGA_BarMenu_Digital_2026.pdf';
const mogaGallery = 'https://www.moga.com.sg/gallery/';
const sommaMenu = 'https://static1.squarespace.com/static/669a6a47bf163d18d7dd87d2/t/6a069dc8579b20077ea890a9/1778818505352/BAR+COCKTAIL+MENU_MAY+2026.pdf';
const mirkoPhoto = 'https://robbreport.com.sg/somma-cocktail-pasta-bar/';
const mirkoGarnish = 'https://www.timeout.com/singapore/restaurants/somma';
const jiggerMenu = 'https://jiggerandpony.aflip.in/bloom-menu-2026';
const jiggerPhoto = 'https://www.jiggerandpony.com/';
const item = (id: string, category: CategoryId, title: string, description: string, color: string, evidence: EvidenceStatus = 'official-menu', role: Ingredient['role'] = 'representative', sources?: Ingredient['sources']): Ingredient => ({
  id, category, title, description, illustrationColor: color, evidence, role, sources,
  quantity: null, unit: null, timecode: evidence === 'inferred' ? 'Serving interpretation · Sep 2026' : evidence === 'visual-observation' ? 'Serving reference · see sources' : 'Official recipe checked · 13 Sep 2026',
});
const source = (url: string, path: string, version: string, additional: {label: string; url: string}[] = []): Drink['source'] => ({
  kind: 'menu', originalUrl: url, path, timecodes: [], verifiedAt: checked, version,
  links: [{label: 'Official menu', url}, ...additional],
});
const assets = (id: string): Drink['assets'] => ({model: `/models/${id}.glb`, poster: '', revision: 'collections-v1'});
const render = (highball: boolean, color: string, height = highball ? 2.85 : 2.4): Drink['renderProfile'] => ({
  optics: 'layered', hasIce: highball, glassHeight: height, rimRatio: highball ? .20 : .30,
  cameraDistance: highball ? 8.1 : 7.5, liquidColor: color,
  ...(highball ? {expandedTarget: 3.7, expandedDistance: 15.2} : {}),
});

export const newCollectionDrinks: Drink[] = [
  {
    id: 'atlas-martini', barId: 'atlas', family: 'martini', name: 'ATLAS Martini',
    twist: 'A lemon twist above gin, ambrato vermouth and a bright touch of champagne vinegar.',
    shortTwist: 'Lemon oils. Ambrato. Champagne vinegar.',
    introduction: 'ATLAS’s own gin meets ambrato vermouth, orange bitters and champagne vinegar. Its published recipe finishes the drink with lemon oils and a twist.',
    color: '#d6c579', ratios: null,
    source: source(atlasMenu, 'references/espresso-martini/atlas-drinking-menu-2026.pdf', 'Current menu, with glassware, garnish and brand details from the undated official ATLAS Martini recipe card. Glass dimensions and tint are illustrative.', [{label: 'ATLAS Martini · official recipe card', url: atlasRecipe}]),
    assets: assets('atlas-martini'), renderProfile: render(false, '#e6d9a8'), cameraPreset: 'martini-stemmed', lightingPreset: 'warm-studio',
    appearance: ['Waterford Martini glass specified by the bar; V-shaped stemmed illustration', 'Light straw tint is illustrative', 'Lemon twist and expressed lemon oils specified in the recipe card'],
    unknowns: ['Exact glass dimensions and the recipe card’s publication date', 'The recipe card publishes measures; this atlas does not encode or visualize them'], referenceIds: ['atlas-martini-recipe-card'],
    ingredients: [
      item('atlas-martini-lemon', 'garnish', 'Lemon twist', 'The bar’s recipe card specifies expressed lemon oils and a lemon twist. The modeled curl is illustrative.', '#e8c955', 'official-menu', 'physical'),
      item('atlas-martini-accents', 'modifiers', 'Champagne vinegar · orange bitters', 'Both are on the current menu. The official recipe card identifies Scrappy’s orange bitters. The separated forms explain the mixed accents without showing amounts.', '#c9994c'),
      item('atlas-martini-vermouth', 'vermouth', 'Ambrato vermouth', 'The current menu specifies ambrato vermouth; the official recipe card names Mancino Bianco Ambrato.', '#d9ba75'),
      item('atlas-martini-gin', 'spirit', 'ATLAS London Dry Gin', 'ATLAS’s own gin is named on the current menu and its Martini recipe card.', '#e0dbbf'),
      item('atlas-martini-glass', 'structure', 'Waterford-style martini glass', 'The recipe card specifies Waterford Martini glassware and straining after stirring. The V-shaped geometry is an illustration, not a reconstruction of an identified crystal pattern.', '#d9d4c2', 'official-menu', 'physical'),
    ], techniques: [{id: 'atlas-martini-stir', title: 'Stir, strain & express lemon', description: 'The official recipe calls for stirring with ice, straining into the glass, then expressing lemon oils and adding a twist. Mixing ice is not left in the serving.', timecode: 'Official recipe card', affectedIngredients: ['atlas-martini-gin', 'atlas-martini-vermouth', 'atlas-martini-lemon'], visibleFinishedComponent: false}],
  },
  {
    id: 'moga-dirty-sake-tini', barId: 'moga', family: 'martini', name: 'Dirty Sake-Tini',
    twist: 'Sake and shochu give the dirty martini a sake-and-shochu base and a savoury pickling-brine finish.',
    shortTwist: 'Sake & shochu. Pickling brine.',
    introduction: 'Dry vermouth and pickling brine bring a savoury edge to sake and Saiten shochu. A green ribbon on a pick distinguishes MOGA’s photographed serving.',
    color: '#c9c58e', ratios: null,
    source: source(mogaMenu, 'references/menus/moga-bar-menu-digital-2026.pdf', 'Current official recipe with the named serving photo from MOGA’s gallery (file uploaded October 2024). The garnish identity and exact glass geometry are illustrative.', [{label: 'MOGA · named serving gallery', url: mogaGallery}]),
    assets: assets('moga-dirty-sake-tini'), renderProfile: render(false, '#dddcb4'), cameraPreset: 'martini-coupe', lightingPreset: 'warm-studio',
    appearance: ['Shallow rounded stemmed coupe in the named official photograph', 'Pale straw, slightly cloudy drink', 'Folded green-edged ribbon over a diagonal metal pick; cucumber identity estimated'],
    unknowns: ['Unpublished recipe measures', 'Exact garnish composition and whether the photographed presentation is unchanged'], referenceIds: ['moga-dirty-sake-tini-gallery'],
    ingredients: [
      item('moga-dirty-ribbon', 'garnish', 'Cucumber ribbon', 'Closest visual match for the folded green-edged ribbon in MOGA’s named photo. Cucumber is an estimated garnish identity; the recipe lists pickling brine without naming its vegetables.', '#91a655', 'inferred', 'physical', [{label: 'MOGA · Dirty Sake-Tini photograph', url: 'https://www.moga.com.sg/wp-content/uploads/sites/57/2024/10/IMG_2520.jpg'}]),
      item('moga-dirty-brine', 'modifiers', 'Pickling brine', 'The current menu explicitly names pickling brine. Its vegetables, preparation and amount are not specified.', '#b9b283'),
      item('moga-dirty-vermouth', 'vermouth', 'Dry vermouth', 'Dry vermouth is named without a brand in the current menu.', '#d0c398'),
      item('moga-dirty-spirit', 'spirit', 'Sake · Saiten shochu', 'The menu specifies sake and Saiten shochu. The paired forms distinguish the two base components without assigning their relative amounts.', '#dad5bd'),
      item('moga-dirty-glass', 'structure', 'Shallow stemmed coupe', 'MOGA’s named serving photograph shows a rounded shallow coupe with a slender stem and no serving ice. Dimensions are illustrative.', '#d9d4c2', 'visual-observation', 'physical'),
    ], techniques: [],
  },
  {
    id: 'somma-mirkos-martini', barId: 'bar-somma', family: 'martini', name: 'Mirko’s Martini',
    twist: 'Cygnet gin and Italicus lift an olive-brine martini, finished with an olive-and-cheese pick.',
    shortTwist: 'Cygnet 22. Italicus. Olive brine.',
    introduction: 'Cygnet 22 Gin, Italicus and Dolin dry vermouth meet olive brine. Its olive-and-cheese garnish follows the documented 2025 serving.',
    color: '#b9bf81', ratios: null,
    source: source(sommaMenu, 'references/menus/somma-may2026-cocktail-menu.pdf', 'May 2026 official recipe; serving shape follows a named bar-supplied January 2025 photo. Olive and cheese are reported in June 2025, not specified by the current menu.', [{label: 'Named Somma serving photo · Jan 2025', url: mirkoPhoto}, {label: 'Olive & cheese garnish · Jun 2025', url: mirkoGarnish}]),
    assets: assets('somma-mirkos-martini'), renderProfile: render(false, '#dddcb0'), cameraPreset: 'martini-coupe', lightingPreset: 'warm-studio',
    appearance: ['Clear very pale yellow drink in a rounded shallow coupe', 'Large green olive and small browned pieces on a horizontal pick', 'The photographed splash is an action, not part of the modeled serving'],
    unknowns: ['Unpublished ingredient measures', 'Exact cheese variety and garnish construction', 'Whether the 2025 garnish is unchanged'], referenceIds: ['somma-mirkos-martini-2025'],
    ingredients: [
      item('somma-mirko-garnish', 'garnish', 'Olive · cheese', 'Olive and cheese are described in a June 2025 review; the named bar-supplied photo shows an olive and small crisp-looking pieces on a pick. Cheese variety and shape are illustrative.', '#8d9b46', 'visual-observation', 'physical'),
      item('somma-mirko-accents', 'modifiers', 'Italicus · olive brine', 'Both are named in Somma’s current recipe. Italicus adds a citrus-floral component alongside the savoury brine.', '#c8c390'),
      item('somma-mirko-vermouth', 'vermouth', 'Dolin dry vermouth', 'Dolin dry vermouth is explicitly named in the current menu.', '#d4c692'),
      item('somma-mirko-gin', 'spirit', 'Cygnet 22 Gin', 'The current recipe names Cygnet 22 Gin. No measure is published.', '#e0dbc3'),
      item('somma-mirko-glass', 'structure', 'Rounded stemmed coupe', 'The named 2025 photograph shows a shallow rounded coupe with a slender stem. The model approximates its shape and contains no serving ice.', '#d9d4c2', 'visual-observation', 'physical'),
    ], techniques: [],
  },
  {
    id: 'moga-salted-yuzu-highball', barId: 'moga', family: 'highball', name: 'Salted Yuzu Highball',
    twist: 'Genmaicha-infused whisky with buckwheat, yuzu and koji, lengthened with fizz.',
    shortTwist: 'Roasted tea. Yuzu. Savoury fizz.',
    introduction: 'MOGA layers Johnnie Walker Gold with genmaicha, buckwheat tea syrup, acid blend, shio koji, yuzu saline and Angostura bitters before adding fizz.',
    color: '#bd9f51', ratios: null,
    source: source(mogaMenu, 'references/menus/moga-bar-menu-digital-2026.pdf', 'Current official menu with the named serving photo from MOGA’s gallery (file uploaded December 2024). The photograph shows no separate garnish.', [{label: 'MOGA · named serving gallery', url: mogaGallery}]),
    assets: assets('moga-salted-yuzu-highball'), renderProfile: render(true, '#e4cd87', 2.78), cameraPreset: 'highball-tall', lightingPreset: 'warm-studio',
    appearance: ['Tall slightly tapered glass', 'Pale cloudy gold liquid around a long clear rectangular ice form', 'Fine bubbles and no separate garnish in the named photograph'],
    unknowns: ['Ingredient measures and the formulation of the acid blend', 'Whether the photographed glass and ice presentation are unchanged'], referenceIds: ['moga-salted-yuzu-highball-gallery'],
    ingredients: [
      item('moga-yuzu-accents', 'modifiers', 'Yuzu · buckwheat · koji', 'The complete seasoning group is buckwheat tea syrup, acid blend, shio koji, yuzu saline and Angostura bitters. All five are on the official menu; separated specimens explain these mixed ingredients.', '#cbb75c'),
      item('moga-yuzu-fizz', 'fizz', 'Fizz', 'The menu calls the lengthener fizz without identifying a soda brand or recipe. The bubbly form represents that published carbonated component.', '#ded6aa'),
      item('moga-yuzu-spirit', 'spirit', 'Genmaicha-infused whisky', 'Johnnie Walker Gold infused with genmaicha is specified by MOGA. The roasted tea belongs to the spirit infusion, not a separate finished tea layer.', '#b89a55'),
      item('moga-yuzu-glass', 'structure', 'Tall glass · clear ice', 'The named official photo shows a slightly tapered tall glass and a long rectangular ice form. These are observed serving details; dimensions are illustrative.', '#d9d4c2', 'visual-observation', 'physical'),
    ], techniques: [{id: 'moga-yuzu-infusion', title: 'Genmaicha infusion', description: 'The official menu specifies genmaicha-infused Johnnie Walker Gold. The atlas shows the resulting spirit as a recipe component, without asserting loose tea in the finished drink.', timecode: 'Official menu · Sep 2026', affectedIngredients: ['moga-yuzu-spirit'], visibleFinishedComponent: false}],
  },
  {
    id: 'somma-pine-highball', barId: 'bar-somma', family: 'highball', name: 'Pine Highball',
    twist: 'Lapsang souchong-infused gin, plum and orange bitters beneath a lift of pine soda.',
    shortTwist: 'Smoky tea. Plum. Pine soda.',
    introduction: 'Somma’s gin-based highball pairs lapsang souchong-infused Monkey 47 with plum, orange bitters and pine soda. The tall pale-gold serving is an illustrative interpretation of the published recipe.',
    color: '#b8a768', ratios: null,
    source: source(sommaMenu, 'references/menus/somma-may2026-cocktail-menu.pdf', 'May 2026 official recipe. No individually identified serving photo was found: glass, ice and liquid tint are illustrative choices, with no added garnish.'),
    assets: assets('somma-pine-highball'), renderProfile: render(true, '#d4c791', 2.83), cameraPreset: 'highball-tall', lightingPreset: 'warm-studio',
    appearance: ['Illustrative slim highball vessel with clear ice', 'Illustrative pale-gold liquid tint', 'No garnish identity is asserted'],
    unknowns: ['Unpublished measures, plum preparation and pine-soda formulation', 'Exact venue glass, ice and garnish presentation'], referenceIds: ['somma-pine-highball-menu'],
    ingredients: [
      item('somma-pine-accents', 'modifiers', 'Plum · orange bitters', 'Plum and orange bitters are both named. The plum specimen and amber bitters form are recipe illustrations; the menu does not specify fresh fruit pieces in the glass.', '#aa755c'),
      item('somma-pine-soda', 'fizz', 'Pine soda', 'Pine soda is explicitly named. Its formula is not published, so the greenish bubbly form is illustrative and does not assert floating pine needles.', '#b9c294'),
      item('somma-pine-spirit', 'spirit', 'Lapsang-infused gin', 'The official recipe specifies lapsang souchong-infused Monkey 47 dry gin. Tea treatment distinguishes this highball from a plain gin and soda.', '#c3b58a'),
      item('somma-pine-glass', 'structure', 'Highball glass · clear ice', 'A conventional tall highball glass with clear ice is used as an estimated serving form. The menu establishes the cocktail and ingredients, but no identified photograph establishes the exact glass or ice.', '#d9d4c2', 'inferred', 'physical', [{label: 'Somma · Pine Highball, official menu', url: sommaMenu}]),
    ], techniques: [{id: 'somma-pine-infusion', title: 'Lapsang souchong infusion', description: 'Somma names lapsang souchong-infused Monkey 47 gin. The tea is part of preparation; no loose leaves are asserted in the serving.', timecode: 'Official menu · May 2026', affectedIngredients: ['somma-pine-spirit'], visibleFinishedComponent: false}],
  },
  {
    id: 'jigger-wasabi-highball', barId: 'jigger-and-pony', family: 'highball', name: 'Wasabi Highball',
    twist: 'Toki whisky, wasabi and apricot soda in a tall, golden highball.',
    shortTwist: 'Toki whisky. Wasabi. Apricot soda.',
    introduction: 'A compact recipe with three distinct components: Toki Suntory Whisky, wasabi and apricot soda. A narrow glass and long ice form frame the golden drink.',
    color: '#bd8944', ratios: null,
    source: source(jiggerMenu, 'references/espresso-martini/jigger-bloom-menu-2026.pdf', 'Current official BLOOM recipe and named serving photo. An orange crescent is visible inside the glass, but the menu does not identify that decorative fruit piece.', [{label: 'Jigger & Pony · named Wasabi serving photo', url: jiggerPhoto}]),
    assets: assets('jigger-wasabi-highball'), renderProfile: render(true, '#d9b167', 2.80), cameraPreset: 'highball-tall', lightingPreset: 'warm-studio',
    appearance: ['Narrow near-straight glass with a thick rounded foot', 'Transparent golden-apricot drink and a clear ice column', 'Fine bubbles and an orange crescent inside the glass; its fruit identity is not asserted'],
    unknowns: ['Ingredient measures and the apricot-soda preparation', 'Identity of the orange crescent shown in the serving photo'], referenceIds: ['jigger-wasabi-highball-photo'],
    ingredients: [
      item('jigger-wasabi-accent', 'modifiers', 'Wasabi', 'Wasabi is explicitly listed. An enlarged green specimen explains the mixed flavour component; the physical orange crescent follows the photo without assigning an unverified fruit identity.', '#8baf69'),
      item('jigger-wasabi-soda', 'fizz', 'Apricot soda', 'Apricot soda is listed as a single mixed component. The illustrative apricot-colored bubbly form does not introduce a second fruit dose.', '#dcaa5c'),
      item('jigger-wasabi-whisky', 'spirit', 'Toki Suntory Whisky', 'Toki Suntory Whisky is explicitly named in the current BLOOM menu.', '#d2b073'),
      item('jigger-wasabi-glass', 'structure', 'Narrow glass · ice column', 'The current named photograph shows a narrow highball with a long clear ice form. Geometry and dimensions remain illustrative.', '#d9d4c2', 'visual-observation', 'physical'),
    ], techniques: [],
  },
];
