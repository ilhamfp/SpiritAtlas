import type {Drink} from './drinks';

// Recipe meshes are reusable illustrative forms. Current ingredient knowledge
// supplies their labels/evidence; frozen geometry exports retain source history.
export function recipePresentation(drink: Drink, category: string) {
  const ingredient = drink.ingredients.find(item => item.category === category);
  if (!ingredient) return undefined;
  return {
    label: ingredient.title,
    evidence: ingredient.evidence,
    representation: ingredient.role === 'unverified' ? 'unknown-placeholder' : 'representative-ingredient',
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    illustrationColor: ingredient.illustrationColor,
  };
}
