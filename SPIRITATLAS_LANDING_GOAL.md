# SpiritAtlas — Landing Page Goal

Run Codex from your repository root, where `SpiritAtlas-Brand-Kit/` and `.env` are located. Paste the entire block below as one message. It explicitly authorizes implementing the site, generating assets, and deploying this SpiritAtlas project to Vercel.

Structured using [Using Goals in Codex](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex): outcome, evidence, constraints, boundaries, iteration policy, and a blocked stop condition.

```text
/goal Build, visually refine, and deploy SpiritAtlas as an exceptional, publicly accessible landing page on Vercel, using the brand kit at ./SpiritAtlas-Brand-Kit/. The finished page must express “Singapore’s cocktails. Inside out.” through confident editorial design, marbled orange-and-peach artwork with partial dither and square-dot dissolve edges, and a crisp interactive cocktail showcase. Preserve and connect the existing experience for Bar Bon Funk, MOGA, and Bar Somma. Completion requires evidence from the actual deployed website, including desktop and mobile screenshots and successful user journeys; a local build or a deployment URL alone is insufficient.

CONTEXT AND INPUTS
Work in this repository. Read its existing instructions, inspect the app, available scripts, current cocktail scenes, routes, assets, and deployment configuration before choosing an implementation. Reuse its framework, styling conventions, and functioning 3D work. Make targeted changes without discarding unrelated work.

Read these files inside ./SpiritAtlas-Brand-Kit/:
- BRAND_GUIDELINES.md
- VISUAL_REFERENCE.md
- TEXTURE_PROMPTS.md
- START_HERE.md
- spiritatlas-tokens.css

Visually inspect docs/references/spiritatlas-style-reference.png and public/textures/spiritatlas-marble-dissolve-study-v1.png within that folder. Text descriptions alone are insufficient. Use the reference’s visual relationships to create original SpiritAtlas artwork; keep the exact brand specifications in the Markdown and CSS authoritative. Locate the existing drink reference video and photographs where needed to evaluate the cocktail assets.

DESIGN OUTCOME
Make the first viewport feel like a considered cocktail publication brought to life. Use Instrument Sans for display, copy, and UI, with restrained IBM Plex Mono for indices and coordinates. Load the real font files rather than leaving fallback fonts in the final result. Use charcoal #2C2A2D, orange #FF682F, peach #FFBBB0, and cream #FFFFE3, with the kit’s functional extensions.

Create a quiet wordmark/navigation, a large headline reading “Singapore’s cocktails. Inside out.”, concise supporting copy, a prominent “Explore the atlas” action, and one beautifully presented real cocktail asset. On desktop, balance headline and scene with generous negative space and deliberate asymmetry. Frame the drink with flowing marbled artwork and selected dot-dissolve contours. Keep glass, ice, garnish, liquid, text, and controls sharp. Orange buttons use dark text.

The decorative effect must visibly combine smooth marbled interiors, directional orange ribbons, peach pools, dark channels, and small square dots whose density decreases along selected edges. A blurred orange glow, uniform noise overlay, or full-image pixelation does not satisfy this requirement. Keep the cocktail as the most detailed focal object. Use motion to reveal and explain, with a stable dot grid and no distracting shimmer.

Continue the page with a concise introduction to the three bars, an explanation or live preview of ingredient exploration, and a clear invitation to compare their Negronis. Use real assets and verified information already present in the project. Keep the narrative focused on bars and cocktails. Do not add invented reviews, awards, visit counts, recipes, or unsupported product claims.

The primary CTA must enter the working atlas. Each featured bar must open its corresponding cocktail experience. Ingredient exploration must have a visible button in addition to any double-click shortcut. Comparison must reach the working three-drink comparison and preserve its rotation behavior. If a required connection or control is missing, implement the smallest complete interaction that fulfills it using the existing assets and data. Every visible control must have a useful outcome.

IMAGE GENERATION AND ASSETS
Use GPT-Image-2.5 to generate or refine original decorative textures where it improves the result. Verify its exact API identifier and availability using current official documentation or organizer-provided access information; do not guess an identifier or silently substitute another model. Use the available image-generation workflow, supplying the reference image and the kit’s prompts. Record the actual model identifier if exposed.

The root .env contains OPENAI_API_KEY. Load it only into the local generation process or a server-side process that needs it. Never print its value, commit .env, place the key in a public environment variable, or include it in a browser bundle. Confirm that secrets are excluded from version control. Generate assets during development and serve reviewed static outputs; normal page visits must not require image-generation calls.

For adjustable or animated dissolution, generate a smooth marbled base and implement a separate stable square-grid coverage mask as described in VISUAL_REFERENCE.md. The included study has baked dots and grain and can serve as a static candidate or reference. Avoid double-dithering it. Save approved assets in the app’s appropriate public asset directory with descriptive filenames, and retain their prompts and provenance. Prepare intentional desktop and mobile compositions. Do not assume a generated texture is seamless or contains valid transparency or PBR maps.

Keep the existing real-time cocktail rendering and ingredient interactions. Reference the actual drinks when improving materials, lighting, or framing. A decorative background or prerecorded animation must not replace a working interactive 3D scene. Prioritize the landing page and fix existing scene defects that materially undermine its presentation; this goal does not require unrelated product expansion.

IMPLEMENT, INSPECT, REFINE
Make reasonable design and engineering decisions autonomously. Establish the composition with real typography and assets early, then run the app and inspect actual browser screenshots. Use browser interaction to assess camera framing, scrolling, navigation, and motion. Work from visible evidence rather than assuming the code produces the intended design.

After each substantive visual pass, record the most important remaining mismatches, choose the change most likely to improve the result, implement it, and inspect again. Refine typography, spacing, marbling, dissolve density, cocktail lighting, layering, responsive crops, and transitions until the brand acceptance criteria are satisfied and no identified material visual defect remains unresolved. Do not stop at scaffolding, the first plausible layout, or a claim that it “looks premium.” Avoid arbitrary self-assigned beauty scores; tie judgments to screenshots and concrete criteria.

Maintain a concise progress/evidence file at docs/brand-implementation.md so work can continue across turns. Include decisions, remaining issues, verification results, and relevant artifact paths. Do not copy secrets into logs or evidence. Keep user-facing progress updates brief and continue working after them.

VERIFICATION AND COMPLETION CRITERIA
All of the following must be true before marking the goal complete:
1. The intended production build succeeds, and relevant existing lint, type, and test gates pass. Add focused checks only for meaningful behavioral risks introduced by this work. No first-party runtime errors or broken required asset requests remain.
2. Inspect the actual page at 1440×1000, 768×1024, and 390×844. Typography is loaded, line breaks and image crops are intentional, the hero drink is framed clearly, controls are reachable, and there is no unintended horizontal overflow or overlapping content. The result meets the acceptance checklist in VISUAL_REFERENCE.md.
3. Verify the primary CTA, all three bar entries, ingredient expansion and collapse, orbit controls, comparison, and the return path. Preserve existing working behavior. Verify touch-compatible and keyboard-accessible controls, visible focus, appropriate text contrast, and reduced-motion behavior.
4. The headline and primary action appear promptly without waiting for the complete 3D scene. Show a faithful poster/loading state while it loads, lazy-load secondary assets, and avoid downloading all heavy scenes before the first interaction. Provide an informative fallback if WebGL is unavailable. Inspect loading and interaction behavior in the browser.
5. Deploy this SpiritAtlas project to Vercel and verify the returned production URL in an unauthenticated browser session. The homepage must load publicly, its required assets must resolve, and the main user journeys must work there. Check direct navigation and refresh on relevant routes. Reinspect after any deployment-only fix.
6. Save final desktop and mobile screenshots and concise verification evidence under docs/brand-evidence/. Update docs/brand-implementation.md with the deployed URL, tested journeys, build/check results, asset provenance, and any remaining limitations. Report limitations accurately; an unmet requirement means partial completion.

DEPLOYMENT AUTHORIZATION AND BLOCKERS
I authorize edits to this repository, asset generation using the configured key, and production deployment of this SpiritAtlas application to Vercel. Use the repository’s existing Vercel project link when it points to this application. If none exists, create a suitably named SpiritAtlas project under the authenticated account and deploy it. Choose an available project slug yourself. Do not replace an unrelated project, purchase a domain, change billing, or publish secrets.

Do not ask for approval for routine implementation, design refinement, checks, or the authorized deployment. Respect actual tool permissions and authentication requirements. If Vercel login, project ownership, model access, or another external dependency genuinely blocks progress, finish all independent work first, then report exactly what is blocked, the evidence, and the smallest action needed from me. If the requested image model is unavailable, use the supplied texture to continue the rest of the site while clearly recording the unfulfilled generation step; never claim it ran. Do not mark the goal complete while required verification or deployment is blocked.

Finish with the verified public Vercel URL, representative screenshot paths, a concise account of what changed and what passed, and any material remaining limitations. Continue until this completion contract is fulfilled or an evidenced external blocker requires my action.
```

Vercel authentication may be the only additional setup needed; the OpenAI key does not provide Vercel access. The prompt authorizes deployment and tells Codex to request authentication only if necessary after completing all independent work.
