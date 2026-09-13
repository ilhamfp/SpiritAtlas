export interface ClassicVariant {
  id: string;
  name: string;
  accent: string;
  mixtureColor: string;
  liquidColors: [string, string, string];
  appearanceUnmix: [number, number];
  liquidLabels: [string, string, string];
  garnishLabel: string;
  garnishKind: 'orange' | 'flower' | 'pepper';
  ingredientNotes: string;
  cinematicManifestUrl?: string;
}
export const CLASSIC_VARIANTS: Record<string, ClassicVariant>;
export function classicVariant(id: string): ClassicVariant | null;
