# Espresso collection — recipe completion research

Checked **13 September 2026**. This bounded review covers ATLAS Espresso Martini, Jigger & Pony Espresso Martini and Night Hawk's Nighthawks. It implements no content or model changes. The user has authorized closest-match substitutions, but inferred ingredients must remain distinguishable from venue-confirmed recipes; quantities and units remain null.

## Recommendation

| Drink | Current evidence | Recommended completion |
|---|---|---|
| ATLAS Espresso Martini | Current official menu confirms French vodka, coffee liqueur, espresso, cinnamon and cream. | Retain these named components. There is no unnamed ingredient row to replace. Do not require a guessed vodka/liqueur brand. |
| Jigger & Pony Espresso Martini | Current BLOOM menu confirms Grey Goose vodka, house espresso, rainforest honey and cacao tuile. No liqueur is listed. Historical evidence examined does not establish a liqueur either. | To fill the requested comparison category, use **Coffee liqueur · estimated**, sourced to the classic recipe as an inference. State visibly that it is a closest-match addition, not a confirmed part of Jigger's recipe. Retain Grey Goose, house espresso, rainforest honey and cacao tuile as confirmed menu facts. |
| Night Hawk — Nighthawks | Current official menu confirms rum, vodka, amaro, chocolate, coffee, MSG and hot coconut foam. | Retain these components. Do not replace its amaro with a guessed coffee liqueur. The white-chocolate seal is supported for the April 2024 presentation; the current menu does not confirm the seal or feather. |

Suggested Jigger description: **“Coffee liqueur is a closest-match estimate from the classic Espresso Martini. Jigger & Pony's current menu lists no liqueur, so this addition is not venue-confirmed.”** Use an inference/estimate evidence status, not `official-menu` or `user-confirmed`: the user authorized a choice, but did not establish the bar's actual recipe. This remains a weak inference about the actual drink; its justification is the requested category completion.

## Current primary sources

**Jigger & Pony — BLOOM, current 2026 menu.** The [official venue homepage](https://www.jiggerandpony.com/) links [BLOOM](https://jiggerandpony.aflip.in/bloom-menu-2026). The live flipbook currently points to [this PDF](https://cdnm.heyzine.com/files/uploaded/v3/790674ab95e832b771ee97c18f9cd833bc92bd3b.pdf). Page 10's complete ingredient line is:

> Grey Goose Vodka, Jigger & Pony Espresso Martini Blend, rainforest honey, cacao tuile

The accompanying text identifies freshly brewed espresso from its PPP Coffee house blend. The cacao tuile is thus a current confirmed garnish, though the menu does not establish exact current dimensions or perforation pattern. No liqueur, dose or ratio is provided. The PDF was freshly fetched and text-extracted: **6,682,304 bytes**, SHA-256 **`1af939c936dbd031a60b19f7e07516b1b3bfbbbc0652673f8d316170f9b1f7cb`**, identical to the [previously saved source](../espresso-martini/jigger-menu-source.json). The web reader could not parse this PDF; direct retrieval and `pdftotext` succeeded.

**ATLAS — current linked drinking menu.** The [official Drinking page](https://www.atlasbar.sg/drinking) still links [the same official PDF](https://www.atlasbar.sg/storage/app/uploads/public/69d/332/f55/69d332f5526c7253694601.pdf). The ATLAS Espresso Martini entry on PDF page 15 reads:

> french vodka, coffee liqueur, espresso, cinnamon, cream

These are ingredient categories, not brand specifications. Retain cream and cinnamon; current ingredient evidence supports both, while the precise floating arrangement uses the dated appearance reference. No newly verified current garnish detail requires a geometry change.

**Night Hawk — live digital menu, publication date unstated.** [Night Hawk Classics](https://www.nighthawk.sg/digitalmenu) includes Nighthawks with:

> Rum, vodka, amaro, chocolate, coffee, MSG, hot coconut foam

The menu supplies neither spirit/amaro brands nor quantities. It does not specify a coffee method, feather or seal. The separately listed alcohol-free **For Mynahs** contains non-alcoholic coffee liqueur; this is another drink and cannot establish coffee liqueur in Nighthawks. Current availability here means listed on the live menu, not a same-day stock guarantee.

## Historical evidence and category inference

- **CNA Luxury, 4 April 2024:** [mixologist interviews and bar-supplied photographs](https://cnaluxury.channelnewsasia.com/experiences/espresso-martini-singapore-244116). Jigger's Uno Jang emphasizes freshly pulled coffee, and the drink recommendation identifies Grey Goose, the PPP collaboration and cacao tuile. This does not identify a liqueur. The ATLAS account names Mr Black, Angostura, full cream and grated cinnamon; those are **historical reported details**, not confirmed current brands/additions. The Night Hawk account identifies cold-brew concentrate, hot coconut cream foam and an edible white-chocolate logo seal. Its bar-supplied image is the dated feather/seal appearance reference. Neither current menu continuity nor the feather's material/edibility follows from that photograph. Preserve the April 2024 qualifier.
- **Four Seasons, 19 June 2025 announcement for 20 July 2025:** [official Jigger & Pony guest-shift menu](https://press.fourseasons.com/houston/hotel-news/2025/jigger-and-pony-plus-cosmo-pony-pop-up-at-bandista/). This event's Espresso Martini uses Jack Daniel's Bonded whiskey, house espresso, rainforest honey and cacao tuile, without a listed liqueur. It supports neither a liqueur claim nor replacing Singapore's current Grey Goose: this was a distinct guest version.
- **Shangri-La official guest-shift PDF, document undated:** [Lobster Bar × Jigger & Pony](https://www.shangri-la.com/-/media/Shangri-La/Corporate/dlp/isl-tatler-best-takeover-series-hong-kong/Menu/ISL_Tatler_LBxJP_Menu.pdf). It lists Absolut Elyx, espresso, rainforest honey and cacao tuile. Cacao liqueur appears under **Peanut Alexander**, not Espresso Martini. Search snippets combining adjacent entries must not be treated as recipe evidence.
- **Historical IDENTITY menuzine, date not established in this check:** an [indexed PDF](https://cdnc.heyzine.com/files/uploaded/v2/5300dd44e9636190cb7975d2079b46882ac65ad9.pdf) lists Grey Goose, the house espresso blend, coffee-flower honey and cacao tuile; its narrative also mentions Okinawa sugar. Direct retrieval returned HTTP 403, so this is supplementary indexed evidence rather than a freshly verified full document. Do not change current rainforest honey to an older formulation.
- **International Bartenders Association, current reference checked 13 September 2026:** the [official Espresso Martini recipe](https://iba-world.com/iba-cocktail/espresso-martini/) includes vodka, Kahlúa, sugar syrup and espresso. This supports **coffee liqueur as a conventional category**, not its presence or brand in Jigger's drink. Use the generic category for the authorized estimate. Do not copy the IBA quantities, ratio, sugar addition or coffee-bean garnish into the venue's recipe.

No inspected source establishes Jigger's current liqueur. Absence from these menus does not prove that no unlisted preparation exists; it does mean that a completed liqueur row is an inference, not a recovered venue fact. Existing confirmed ATLAS and Night Hawk ingredient labels can remain unchanged.
