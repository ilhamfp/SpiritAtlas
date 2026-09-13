import type {Drink, EvidenceStatus, Ingredient} from './drinks';

const evidenceLabels: Record<EvidenceStatus, string> = {
  'video-confirmed': 'Confirmed in the film',
  'official-same-version': 'Confirmed for this recipe version',
  'official-menu': 'Listed in the official menu',
  'visual-observation': 'Observed in the finished serving',
  'user-confirmed': 'Confirmed by atlas editor',
  inferred: 'Closest recipe match',
  unverified: 'Unspecified in the source',
};

export function ingredientDisplayName(ingredient: Pick<Ingredient, 'title' | 'evidence'>): string {
  return ingredient.evidence === 'inferred' ? `${ingredient.title} · estimated` : ingredient.title;
}

export function ingredientEvidenceLabel(ingredient: Pick<Ingredient, 'evidence'>, sourceKind?: Drink['source']['kind']): string {
  if (ingredient.evidence === 'unverified') return sourceKind === 'menu' ? 'Unspecified in the menu' : 'Unspecified in the filmed recipe';
  return evidenceLabels[ingredient.evidence];
}
