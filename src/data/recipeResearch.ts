type AtlasDrinkId = 'bbf-negroni' | 'ichigo-negroni' | 'negroni-express';

export interface RecipeResearchSource {
  readonly label: string;
  readonly url: string;
}

export interface RecipeResearchNote {
  readonly reviewedAt: string;
  readonly findings: readonly {
    readonly text: string;
    readonly sources: readonly RecipeResearchSource[];
  }[];
}

// Menu-version context and explicitly attributed atlas-editor corrections.
export const recipeResearch: Readonly<Partial<Record<AtlasDrinkId, RecipeResearchNote>>> = {
  'bbf-negroni': {
    reviewedAt: '2026-09-13',
    findings: [
      {
        text: 'Bon Funk’s sample menu (file dated August 2024) names West Winds Cutlass Gin, Bon Funk Amaro and Bon Funk Vermouth in its Negroni. The film does not establish the same gin brand or the contents of the house blends. The atlas editor separately confirms Campari in this serving; its measure and relationship to the house blend are unspecified.',
        sources: [{ label: 'Bon Funk sample menu (PDF, p. 4)', url: 'https://www.bonfunk.com/s/BBF_SAMPLE-MENU.pdf' }],
      },
      {
        text: 'The March 2026 events-linked sample menu retains gin, BBF Amaro and BBF Vermouth, without naming the gin brand. This suggests menu continuity, not a verified specification for the filmed serving.',
        sources: [{ label: 'March 2026 sample menu (PDF, p. 4)', url: 'https://drive.google.com/file/d/1qN_jg8xzekfjOzJiI8ToJf-6jvKnKqOz/view?usp=sharing' }],
      },
      {
        text: 'Opening coverage describes the amaro and vermouth being ultrasonically aged with charred American oak. The film also shows oak treatment, freezing and orange preparation, but does not disclose proportions or the blends’ constituent ingredients.',
        sources: [{ label: 'CNA’s August 2024 opening report', url: 'https://cnalifestyle.channelnewsasia.com/dining/bar-bon-funk-keirin-buck-new-bahru-394906' }],
      },
    ],
  },
  'ichigo-negroni': {
    reviewedAt: '2026-09-13',
    findings: [
      {
        text: 'MOGA’s 2026 menu lists Tanqueray gin, Campari and sweet vermouth for its classic Negroni. It does not list Ichigo Negroni, so it does not independently establish the same gin or vermouth for the filmed strawberry-and-milk-clarified version. The atlas editor separately confirms Campari in Ichigo. The atlas now uses Tanqueray gin and sweet vermouth as explicitly estimated matches from that same-bar classic. Exact quantities remain unpublished.',
        sources: [{ label: 'MOGA 2026 menu (PDF, p. 19)', url: 'https://www.moga.com.sg/wp-content/uploads/sites/57/2024/08/MOGA_BarMenu_Digital_2026.pdf' }],
      },
    ],
  },
  'negroni-express': {
    reviewedAt: '2026-09-13',
    findings: [
      {
        text: 'Somma’s May 2026 menu does not list Negroni Express. The atlas completes its spirit and vermouth rows using explicitly estimated matches from the earlier same-named recipe and Somma’s published classic. Campari is confirmed separately by the atlas editor.',
        sources: [{ label: 'Somma May 2026 menu (PDF)', url: 'https://static1.squarespace.com/static/669a6a47bf163d18d7dd87d2/t/6a069dc8579b20077ea890a9/1778818505352/BAR+COCKTAIL+MENU_MAY+2026.pdf' }],
      },
      {
        text: 'Mel John Chavez’s 2022 Negroni Express at Smoke & Mirrors used gin, vermouth, Campari, Ancho Reyes Verde, walnut bitters and rice syrup. The atlas editor separately confirms Campari in the filmed Somma serving. Gin is now the estimated base-spirit match. Sweet red vermouth is estimated from that historical vermouth plus Somma’s published vermouth-rosso classic; walnut bitters are not added to the filmed recipe.',
        sources: [{ label: 'Uncover Asia’s 2022 recipe coverage', url: 'https://uncoverasia.com/negroni-week-singapore/' }],
      },
      {
        text: 'The earlier serving had a pickle-and-olive garnish, unlike the filmed shishito. Gin and vermouth brands and all measured quantities remain unverified for this film.',
        sources: [{ label: 'City Nomads’ 2022 tasting', url: 'https://citynomads.com/drinking-for-a-good-cause-negroni-week-celebrates-10th-anniversary-this-year-with-60-bars-in-singapore/' }],
      },
    ],
  },
};

export function getRecipeResearch(drinkId: string): RecipeResearchNote | undefined {
  return Object.hasOwn(recipeResearch, drinkId) ? recipeResearch[drinkId as AtlasDrinkId] : undefined;
}
