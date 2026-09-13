/** Specialty recipes interpreted through the original Negroni studio.
 * The classic glass, three ice cubes and cached choreography are shared.
 * Display groups are illustrative; they do not imply recipe measurements.
 */
export const CLASSIC_VARIANTS = {
  'bbf-negroni': {
    id: 'bbf-negroni', name: 'BBF Negroni', accent: '#ab422f',
    mixtureColor: '#da855c', liquidColors: ['#f7faf5', '#ae512c', '#c38958'], appearanceUnmix: [.60, .85],
    liquidLabels: ['Gin', 'Blended amaros', 'Blended vermouths'],
    garnishLabel: 'Orange', garnishKind: 'orange',
    ingredientNotes: 'Gin, blended amaros and vermouths. Oak-aged, frozen, finished with flamed orange aroma.',
  },
  'ichigo-negroni': {
    id: 'ichigo-negroni', name: 'Ichigo Negroni', accent: '#d4a955',
    mixtureColor: '#f3cf84', liquidColors: ['#f3e4c2', '#f0d59c', '#e8c583'], appearanceUnmix: [.60, .85],
    liquidLabels: ['Base spirit · unspecified', 'Bitter · unspecified', 'Vermouth · unspecified'],
    garnishLabel: 'Flower & red garnish', garnishKind: 'flower',
    ingredientNotes: 'Strawberry infusion and milk clarification produce a clear golden drink. The individual base ingredients and garnish composition are unspecified.',
  },
  'negroni-express': {
    id: 'negroni-express', name: 'Negroni Express', accent: '#e16e3c',
    mixtureColor: '#f38e54', liquidColors: ['#ead9a7', '#eaa275', '#f5d18e'], appearanceUnmix: [.60, .85],
    liquidLabels: ['Base spirit · unspecified', 'Bitter · unspecified', 'Vermouth · unspecified'],
    garnishLabel: 'Pickled shishito', garnishKind: 'pepper',
    ingredientNotes: 'Ancho Verde, rice syrup and expressed orange oil, finished with pickled shishito. The base Negroni ingredients are unspecified.',
  },
};

export function classicVariant(id) { return CLASSIC_VARIANTS[id] || null; }
