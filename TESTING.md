# Testing Strategy

## Role
Primary agent owns:
- coverage planning
- test implementation
- flake reduction
- selector stability
- deciding what should be deterministic vs exploratory

Optional delegated roles:
- planner: suite map and priority changes
- generator: draft new cases and helpers
- reviewer: detect brittle assertions and stale coverage

## Product Scope
Current product behavior that tests must reflect:
- mobile-first home flow
- geolocation-driven nearest pharmacy ordering
- manual map-based location fallback when browser location is denied
- selectable pharmacy list with hero sync
- scroll-to-hero behavior when selecting another pharmacy
- floating mini map in list view after scrolling away from the hero
- map/list toggle
- dark mode
- PWA metadata and icon surface
- API hardening for in-scope vs out-of-scope coordinates

## Test Layers
1. API contract and hardening
- in-scope `/api/farmacias` returns sorted pharmacies
- out-of-scope `/api/route` rejects
- out-of-scope `/api/reverse-geocode` rejects
- manifest and icon endpoints stay valid

2. Deterministic UI
- home smoke
- successful geolocation flow with mocked La Plata coordinates
- manual location fallback after geolocation denial
- list/map toggle
- selecting another pharmacy updates hero
- reset-to-nearest restores hero/list alignment
- scroll-to-hero after selecting a different pharmacy
- floating mini map appears/disappears with list scroll
- key content remains visible across themes

3. PWA and workflow surface
- manifest contract
- icon endpoint version
- install workflow artifacts and GitHub summary behavior

4. Exploratory
- real-device Safari permission quirks
- iPhone home-screen install behavior and icon cache
- floating mini map motion feel
- visual polish and spacing on small screens
- service-worker cache behavior after updates

## Priority
### P0
- after successful location, hero pharmacy must match the first list item
- first visible distances must be monotonic for the nearest items
- selecting another pharmacy must update the hero and scroll back to it
- reset-to-nearest must restore hero/list alignment
- denied geolocation must still allow manual location and nearest ordering
- floating mini map must appear in list view after scrolling away from hero and disappear after returning
- out-of-scope API calls must reject

### P1
- map view renders
- dark mode preserves key controls and content
- manifest and icon endpoints stay valid
- install/video workflow remains usable for stakeholders

### P2
- splash timing
- copy refinements
- visual regression snapshots after behavior stabilizes

## Canonical Data
Use this stable La Plata mock location:
- `-34.9214, -57.9545`

Use this out-of-scope location:
- `-34.6037, -58.3816`

## Selector Policy
Prefer:
- `data-testid` for stateful UI regions
- role + accessible name for controls
- helpers anchored to `article[role='button'][data-testid^='pharmacy-card-']`

Avoid:
- CSS module hashes
- raw nth-child selectors without semantic anchoring
- transient loading or provider-specific copy as hard assertions

## Flake Policy
- always wait for hydration first
- after location success, wait for:
  - distance labels to appear
  - hero pharmacy to equal first list item
- do not assert exact route geometry or reverse-geocode strings
- do not depend on splash disappearance timing
- for scroll-based UI, use polling on stable DOM state instead of fixed sleeps
- treat flaky in CI as failure

## Execution Policy
Fast local validation:
- `npx playwright test --list`
- `npm run test:e2e -- --project=android-chrome`

Broader local validation:
- `npm run test:e2e`

Interactive:
- `npm run test:e2e:ui`
- `npm run test:e2e:headed`

CI:
- run against deployed prod URL via `PLAYWRIGHT_BASE_URL`
- publish GitHub summary directly on the workflow page
- optionally publish full videos via `record_videos`

## Near-Term Expansion
- map marker interaction should update selected pharmacy if that feature is added
- add assertions for floating mini map not appearing in `Mapa` mode
- add modal interaction coverage for dragging the manual-location marker
- add service-worker update sanity after icon/manifest version bumps
- add visual snapshots only after scroll and floating-map behavior prove stable
