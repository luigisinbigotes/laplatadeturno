# Testing Strategy

## Role
Primary agent owns:
- test planning
- test generation
- test maintenance
- flake reduction
- regression scope decisions

Sub-agents, if used later, should split across:
- planner: suite architecture and priority
- generator: case implementation
- reviewer: flake and selector hardening

## Objectives
- protect core user flows on mobile first
- prioritize deterministic geolocation behavior
- keep PWA/install surface covered
- separate stable regression checks from exploratory UX checks

## Test Layers
1. API contract and hardening
- validate success shape for in-scope requests
- validate rejection for out-of-scope coordinates
- validate manifest and icon endpoints

2. Deterministic UI
- home smoke
- geolocation flow with mocked La Plata coordinates
- list/map toggle
- selected pharmacy behavior
- reset-to-nearest behavior
- dark mode render integrity

3. PWA surface
- manifest contract
- icon availability
- install prompt visibility where deterministic

4. Exploratory
- real-device Safari permission behavior
- install flow on iPhone home screen
- visual polish and spacing
- stale cache behavior

## Priority
### P0
- top banner must match the first list item after a successful location refresh
- list ordering must be monotonic by distance for the first visible items
- selecting another pharmacy must update the banner
- resetting must restore the nearest one
- out-of-scope API calls must reject
- dark mode must preserve key content and controls

### P1
- map view renders
- install prompt/guidance appears when expected
- manifest and icon endpoints stay valid

### P2
- splash timing
- copy refinements
- visual regression

## Canonical Data
Use this stable La Plata mock location:
- `-34.9214, -57.9545`

Use this out-of-scope location:
- `-34.6037, -58.3816`

## Selector Policy
Prefer:
- role + accessible name
- stable headings and buttons
- card extraction helpers anchored to `article[role='button']`

Avoid:
- CSS module hash selectors
- nth-child without semantic purpose
- relying on transient loading copy

## Flake Policy
- always wait for hydration
- wait for location label before asserting ordered geo UI
- do not assert exact external provider strings
- do not assert exact route geometry
- do not couple deterministic tests to splash disappearance timing

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

## Near-Term Expansion
- map marker interaction should update selected pharmacy if that feature is added
- add offline/service-worker sanity checks
- add visual regression snapshots only after behavioral tests stabilize
