import type {Bar, Drink, Ingredient, CategoryId, EvidenceStatus} from './drinks';

const checked = '2026-09-13';
const appearanceSource = 'https://cnaluxury.channelnewsasia.com/experiences/espresso-martini-singapore-244116';
const atlasMenu = 'https://www.atlasbar.sg/storage/app/uploads/public/69d/332/f55/69d332f5526c7253694601.pdf';
const jiggerMenu = 'https://jiggerandpony.aflip.in/bloom-menu-2026';
const nightMenu = 'https://www.nighthawk.sg/digitalmenu';
const oneMap = (address:string) => `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(address)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
export const espressoBars: Bar[] = [
  {id:'atlas',name:'ATLAS',address:'Parkview Square, 600 North Bridge Road, Singapore 188778',floor:'Parkview Square',area:'Bugis',buildingId:'parkview-square',buildingName:'Parkview Square',coordinates:[103.8575950499688,1.300216086333226],url:'https://www.atlasbar.sg/',directions:'https://www.google.com/maps/search/?api=1&query=ATLAS+600+North+Bridge+Road+Singapore',description:'An Art Deco grand lobby with a cinnamon-and-cream interpretation of the espresso martini.',drinkIds:['atlas-espresso-martini'],verifiedAt:checked,verificationSources:['https://www.atlasbar.sg/drinking',oneMap('600 North Bridge Road')]},
  {id:'jigger-and-pony',name:'Jigger & Pony',address:'Amara Singapore, 165 Tanjong Pagar Road, Singapore 088539',floor:'Amara Singapore',area:'Tanjong Pagar',buildingId:'amara-singapore',buildingName:'Amara Singapore',coordinates:[103.8435495305616,1.274927658382625],url:'https://www.jiggerandpony.com/',directions:'https://www.google.com/maps/search/?api=1&query=Jigger+and+Pony+165+Tanjong+Pagar+Road+Singapore',description:'A contemporary cocktail bar pairing its espresso martini with a delicate cacao tuile.',drinkIds:['jigger-espresso-martini'],verifiedAt:checked,verificationSources:['https://www.jiggerandpony.com/',oneMap('165 Tanjong Pagar Road')]},
  {id:'night-hawk',name:'Night Hawk',address:'43 Tanjong Pagar Road, Singapore 088464',floor:'43 Tanjong Pagar Road',area:'Tanjong Pagar',buildingId:'43-tanjong-pagar',buildingName:'43 Tanjong Pagar Road',coordinates:[103.8440894103962,1.27892261601231],url:'https://www.nighthawk.sg/',directions:'https://www.google.com/maps/search/?api=1&query=Night+Hawk+43+Tanjong+Pagar+Road+Singapore',description:'A neighbourhood bar whose Nighthawks rethinks the espresso martini with hot coconut foam.',drinkIds:['nighthawks'],verifiedAt:checked,verificationSources:[nightMenu,oneMap('43 Tanjong Pagar Road')]},
];

const item = (id:string,category:CategoryId,title:string,description:string,evidence:EvidenceStatus,role:Ingredient['role']):Ingredient => ({id,category,title,description,evidence,role,timecode:evidence==='visual-observation'?'Photo · 4 Apr 2024':'Menu checked · 13 Sep 2026',quantity:null,unit:null});
const source = (url:string,path:string):Drink['source'] => ({kind:'menu',path,originalUrl:url,timecodes:[],version:'Official menu checked 13 September 2026; appearance based on bar-supplied photographs published 4 April 2024. Presentation may have changed.',verifiedAt:checked,links:[{label:'Official menu',url},{label:'Serving photographs · Apr 2024',url:appearanceSource}]});
const assets = (id:string):Drink['assets'] => ({model:`/models/${id}.glb`,poster:'',revision:'espresso-v2-visibility'});

export const espressoDrinks: Drink[] = [
  {
    id:'atlas-espresso-martini',barId:'atlas',family:'espresso-martini',name:'ATLAS Espresso Martini',
    twist:'Dark espresso beneath a pale cream float, finished with cinnamon.',shortTwist:'Cinnamon. Cream float. Dark coffee.',
    introduction:'French vodka and coffee liqueur meet espresso, cream and cinnamon. Its pale crown and narrow stemmed glass distinguish this serving.',color:'#b88958',ratios:null,
    appearance:['Narrow stemmed glass in the April 2024 photograph','Dark coffee body with an ivory cream float','Cinnamon dust across the surface'],
    unknowns:['All ingredient measures and proportions','Vodka and coffee-liqueur brands in the current menu','Exact dimensions and whether the photographed presentation is unchanged'],referenceIds:['atlas-2024'],
    source:source(atlasMenu,'references/espresso-martini/atlas-drinking-menu-2026.pdf'),assets:assets('atlas-espresso-martini'),cameraPreset:'espresso-stemmed',lightingPreset:'warm-studio',
    ingredients:[
      item('atlas-cinnamon','garnish','Cinnamon','Cinnamon is listed by ATLAS; the dated serving photograph shows a dusting over the cream. Recipe view enlarges the ground cinnamon so you can inspect it; its size does not show an amount.','official-menu','physical'),
      item('atlas-cream','modifiers','Cream float','Cream is on the current menu. Its floating presentation is based on the April 2024 photograph.','official-menu','physical'),
      item('atlas-coffee','coffee','Espresso','Espresso is explicitly listed. The separated form explains the mixed recipe; it is not a measured layer.','official-menu','representative'),
      item('atlas-liqueur','liqueur','Coffee liqueur','The current menu lists coffee liqueur without identifying a brand.','official-menu','representative'),
      item('atlas-vodka','spirit','French vodka','The current menu specifies French vodka, with no brand or measure.','official-menu','representative'),
      item('atlas-serving','structure','Narrow stemmed glass','The April 2024 reference shows a clear stemmed vessel and no serving ice. Its geometry is an approximation.','visual-observation','physical'),
    ],techniques:[],
  },
  {
    id:'jigger-espresso-martini',barId:'jigger-and-pony',family:'espresso-martini',name:'Espresso Martini',
    twist:'A broad cacao tuile caps a dark espresso martini in a coupe.',shortTwist:'Fresh espresso. Cacao tuile. Coupe.',
    introduction:'Grey Goose vodka, the bar’s espresso blend and rainforest honey, finished with a crisp cacao tuile.',color:'#9a6244',ratios:null,
    appearance:['Wide shallow coupe on a slender stem in the April 2024 photograph','Dark coffee with a thin crema edge','A broad, lacy cacao tuile across the top'],
    unknowns:['All ingredient measures and proportions','Coffee liqueur is an estimated addition from the classic recipe, not listed by Jigger & Pony','Whether the dated photographed presentation is unchanged'],referenceIds:['jigger-2024'],
    source:source(jiggerMenu,'references/espresso-martini/jigger-bloom-menu-2026.pdf'),assets:assets('jigger-espresso-martini'),cameraPreset:'espresso-coupe',lightingPreset:'warm-studio',
    ingredients:[
      item('jigger-tuile','garnish','Cacao tuile','The BLOOM menu names a cacao tuile. Its lacy shape is modeled from the dated serving photograph.','official-menu','physical'),
      item('jigger-honey','modifiers','Rainforest honey','Rainforest honey appears in the current recipe. Its separated form represents a mixed ingredient, with no implied measure.','official-menu','representative'),
      item('jigger-coffee','coffee','House espresso','The current menu names the Jigger & Pony Espresso Martini Blend and describes freshly brewed espresso from a blend developed with PPP Coffee.','official-menu','representative'),
      {...item('jigger-liqueur','liqueur','Coffee liqueur','Closest match from the classic Espresso Martini. Jigger & Pony’s BLOOM menu lists no liqueur, so this is an estimated addition for recipe exploration, not a recovered bar recipe. No brand or measure is assigned.','inferred','representative'),timecode:'Recipe research · 13 Sep 2026',illustrationColor:'#855035',sources:[{label:'Jigger & Pony · official BLOOM menu',url:jiggerMenu},{label:'IBA · classic Espresso Martini',url:'https://iba-world.com/iba-cocktail/espresso-martini/'}]},
      item('jigger-vodka','spirit','Grey Goose vodka','Grey Goose vodka is named in the current BLOOM menu. No measure is published.','official-menu','representative'),
      item('jigger-serving','structure','Wide coupe','The April 2024 reference shows a wide, shallow coupe with a slender stem and no serving ice.','visual-observation','physical'),
    ],techniques:[],
  },
  {
    id:'nighthawks',barId:'night-hawk',family:'espresso-martini',name:'Nighthawks',
    twist:'Rum and vodka, coffee and amaro, crowned with hot coconut foam.',shortTwist:'Rum & vodka. Hot coconut foam.',
    introduction:'An espresso-martini riff. Chocolate and MSG accompany a dual-spirit coffee base beneath warm coconut foam.',color:'#885553',ratios:null,
    appearance:['Rounded stemmed bowl with a thick foam head in the April 2024 photograph','Dark coffee beneath pale coconut foam','A long dark feather and a seal-like garnish in the dated photograph'],
    unknowns:['All ingredient measures and spirit/amaro brands','Current coffee preparation method','Whether the 2024 feather and chocolate-seal presentation is still used'],referenceIds:['nighthawks-2024'],
    source:source(nightMenu,'references/espresso-martini/nighthawks-current-source.json'),assets:assets('nighthawks'),cameraPreset:'espresso-stemmed',lightingPreset:'warm-studio',
    ingredients:[
      item('nighthawks-garnish','garnish','Chocolate seal · feather','The April 2024 photo shows a long feather and a seal identified in that report as edible white chocolate. Neither is specified by the current menu; this depicts the dated serving.','visual-observation','physical'),
      item('nighthawks-modifiers','modifiers','Coconut foam · chocolate · MSG','All three appear on the current menu. The foam is served hot. Recipe view shows illustrative chocolate and enlarged MSG crystals beside the foam; their shapes and sizes do not show amounts.','official-menu','physical'),
      item('nighthawks-coffee','coffee','Coffee','The current menu says coffee. A 2024 report described cold brew; the current menu does not specify the preparation.','official-menu','representative'),
      item('nighthawks-amaro','liqueur','Amaro','Amaro is listed without a brand or measure.','official-menu','representative'),
      item('nighthawks-spirit','spirit','Rum · vodka','Both rum and vodka are listed as base spirits. The two separated forms identify them without showing a ratio; brands and measures are unpublished.','official-menu','representative'),
      item('nighthawks-serving','structure','Rounded stemmed glass','The dated photograph shows a rounded bowl, flared lip and clear stem, without serving ice.','visual-observation','physical'),
    ],techniques:[{id:'nighthawks-foam',title:'Hot coconut foam',description:'The menu specifies a hot foam above the coffee mixture. Heat is a serving technique, not another ingredient.',timecode:'Official menu · checked Sep 2026',affectedIngredients:['nighthawks-modifiers'],visibleFinishedComponent:true}],
  },
];
