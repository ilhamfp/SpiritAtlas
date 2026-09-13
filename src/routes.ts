import {barById, cocktailFamilies, drinkById, drinks, drinksForFamily, type CocktailFamilyId} from './data/drinks';

export type Route = { page: 'atlas' | 'drink' | 'compare'; collection: CocktailFamilyId; barId: string; drinkId: string; compareIds: string[]; expansion: number; sync: boolean };
export const validIds = (values: string[], family?: CocktailFamilyId) => [...new Set(values.filter((id) => Boolean(drinkById[id]) && (!family || drinkById[id].family === family)))].slice(0, 3);
export function parseRoute(search: string): Route {
  const params = new URLSearchParams(search);
  const requestedCompare = (params.get('compare') ?? '').split(',');
  const requestedDrink = drinkById[params.get('drink') ?? ''];
  const requestedBar = barById[params.get('bar') ?? ''];
  const firstCompared = requestedCompare.map(id => drinkById[id]).find(Boolean);
  const requestedFamily = cocktailFamilies.find(family => family.id === params.get('collection'))?.id;
  const collection = firstCompared?.family ?? requestedDrink?.family ?? requestedFamily ?? drinkById[requestedBar?.drinkIds[0]]?.family ?? 'negroni';
  const familyDrinks = drinksForFamily(collection);
  const compareIds = validIds(requestedCompare, collection);
  const rawExpansion = Number(params.get('expand') ?? (compareIds.length >= 2 ? 1 : 0));
  const expansion = Number.isFinite(rawExpansion) ? Math.max(0, Math.min(1, rawExpansion)) : 0;
  const requestedBarDrink = familyDrinks.find(drink => drink.barId === requestedBar?.id);
  const drinkId = requestedDrink?.family === collection ? requestedDrink.id : requestedBarDrink?.id ?? familyDrinks[0]?.id ?? drinks[0].id;
  const barId = requestedBarDrink ? requestedBarDrink.barId : drinkById[drinkId].barId;
  return { page: compareIds.length >= 2 ? 'compare' : requestedDrink?.family === collection ? 'drink' : 'atlas', collection, barId, drinkId, compareIds, expansion, sync: params.get('sync') !== '0' };
}
export function routeUrl(route: Route): string {
  const params = new URLSearchParams();
  if (route.collection !== 'negroni') params.set('collection', route.collection);
  if (route.page === 'atlas') params.set('bar', route.barId);
  if (route.page === 'drink') params.set('drink', route.drinkId);
  if (route.page === 'compare') { params.set('compare', route.compareIds.join(',')); if (!route.sync) params.set('sync', '0'); }
  if (route.page === 'compare' || (route.page === 'drink' && route.expansion > 0)) params.set('expand', String(Math.round(route.expansion * 100) / 100));
  return `?${params}`;
}
