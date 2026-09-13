# Espresso martini venue evidence

Verified **13 September 2026, Singapore time**. This note covers Night Hawk's current recipe and dated appearance evidence, plus all three new venue locations. It does not change the filmed Negroni evidence or claim that a 2024 presentation is unchanged today.

## Night Hawk — Nighthawks

The [official digital menu](https://www.nighthawk.sg/digitalmenu) currently lists **Nighthawks** under Night Hawk Classics. Its ingredient list is **rum, vodka, amaro, chocolate, coffee, MSG, hot coconut foam**. No brands, quantities, proportions or specific coffee brewing method are supplied. Availability means listed on the live menu at verification, not a reservation or same-day stock guarantee. Do not substitute the separate non-alcoholic drink **For Mynahs**.

The current menu does not name a feather or white-chocolate seal. Those appearance details have dated support: [CNA Luxury's 4 April 2024 report](https://cnaluxury.channelnewsasia.com/experiences/espresso-martini-singapore-244116) credits the pictured cocktail to Night Hawk and describes cold-brew concentrate, a hot coconut foam head and an edible white-chocolate logo seal. This establishes an espresso martini riff rather than merely a coffee cocktail; the cold-brew method and seal should remain attributed to the 2024 version.

I inspected the saved venue-supplied [2024 photograph](nighthawks-2024.jpg). It shows a clear stemmed glass with a rounded bowl, outward-flared lip and circular foot; a dark drink beneath a thick pale foam head; a round seal against the front of the bowl; and a long dark blue/purple feather laid across the glass. Strong red/cyan lighting colors the foam, seal and glass, so those rendered colors are not reliable neutral material colors. The current menu confirms the foam component, but does not verify the present seal/feather treatment. Feather material, attachment and edibility remain unverified.

The [official homepage](https://www.nighthawk.sg/) has an unlabeled drink photograph whose URL is `BANGKOKPOPUP_DRINK4.png`, plus an animated image. Neither supplies a reliable named/current Nighthawks appearance bridge. No newer garnish assertion is made from them. Use the dated photograph as an explicitly historical presentation reference, with independently authored geometry; the source photo is retained for local reference and is not bundled for public display.

## Verified venue locations

Addresses come from each venue's own site. Coordinates come from Singapore Land Authority OneMap address records, selected by the exact street address and matching postal code. They locate the **building**, not a surveyed door or interior bar table.

| Venue | Official address | Latitude | Longitude | Official source |
|---|---|---:|---:|---|
| ATLAS | Parkview Square, 600 North Bridge Road, Singapore 188778 | 1.300216086333226 | 103.8575950499688 | [ATLAS](https://atlasbar.sg/) |
| Jigger & Pony | Amara Singapore, 165 Tanjong Pagar Road, Singapore 088539 | 1.274927658382625 | 103.8435495305616 | [Jigger & Pony](https://www.jiggerandpony.com/) |
| Night Hawk | 43 Tanjong Pagar Road, Singapore 088464 | 1.27892261601231 | 103.8440894103962 | [Night Hawk](https://www.nighthawk.sg/) |

MapLibre arrays use **[longitude, latitude]**:

```json
{
  "atlas": [103.8575950499688, 1.300216086333226],
  "jigger-and-pony": [103.8435495305616, 1.274927658382625],
  "night-hawk": [103.8440894103962, 1.27892261601231]
}
```

OneMap source queries and saved responses:

- [600 North Bridge Road](https://www.onemap.gov.sg/api/common/elastic/search?searchVal=600%20North%20Bridge%20Road&returnGeom=Y&getAddrDetails=Y&pageNum=1) — [atlas-onemap.json](atlas-onemap.json). Six address records returned; the selected record is **PARKVIEW SQUARE**, postal **188778**, rather than an embassy office record. The response also includes an authentication-token warning despite returning the full result set; that warning is retained, and no authenticated-only data was requested.
- [165 Tanjong Pagar Road](https://www.onemap.gov.sg/api/common/elastic/search?searchVal=165%20Tanjong%20Pagar%20Road&returnGeom=Y&getAddrDetails=Y&pageNum=1) — [jigger-and-pony-onemap.json](jigger-and-pony-onemap.json). One result: **AMARA SINGAPORE**, postal **088539**.
- [43 Tanjong Pagar Road](https://www.onemap.gov.sg/api/common/elastic/search?searchVal=43%20Tanjong%20Pagar%20Road&returnGeom=Y&getAddrDetails=Y&pageNum=1) — [night-hawk-onemap.json](night-hawk-onemap.json). One result: the exact **43 TANJONG PAGAR ROAD** conservation-area property, postal **088464**. An initial request returned HTTP429; a single later retry succeeded. The successful response is retained.

These locations are distinct. None needs the shared-building grouping used for the two New Bahru Negroni venues.

## Existing evidence and remaining limits

The parent task saved the [ATLAS official menu PDF](atlas-drinking-menu-2026.pdf), its [source metadata](atlas-menu-source.json), and three [dated photo source records](appearance-reference-sources.json). This bounded note does not independently re-verify the other two cocktail recipes. Their current recipe sourcing remains in the parent task's menu verification. All new recipe quantities should remain null unless a relevant source gives them. This research does not establish photographic 3D fidelity or completion of collection navigation, comparison or map behavior.
