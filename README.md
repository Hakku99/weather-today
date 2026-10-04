# Today's Weather

A React application for current-weather search, persistent local search history, and responsive light/dark themes. It uses OpenWeather for real weather and the supplied Figma design and images for presentation.

**Status:** M0-M5 and the user-approved homepage SEO extension are complete as of 2026-10-04. Latest verification passed 173 unit/component tests, 150 browser tests and local production metadata/asset checks. Earlier M5 evidence includes native Chromium zoom and live OpenWeather search/replay. Dated evidence and coverage limits are in [PLAN](docs/PLAN.md). The user operates Vercel hosting; the SEO source changes await publication. Sending the submission remains outside scope.

## Quick start

Install **Node.js 24.15.0 or newer within major 24** and **npm 10 or newer**. Check with `node --version` and `npm --version`. The project was originally verified with Node 24.16.0/npm 10.9.2; `.nvmrc` selects major 24 and `package-lock.json` pins dependencies.

1. Clone the supplied repository or extract its source archive. Open a terminal in the project directory containing `package.json`.
2. Install the locked dependencies:

   ```sh
   npm ci
   ```

3. Copy `.env.example` to `.env.local` in that same directory:

   ```powershell
   # Windows PowerShell
   Copy-Item .env.example .env.local
   ```

   ```sh
   # macOS / Linux
   cp .env.example .env.local
   ```

4. Edit `.env.local` and set `VITE_OPENWEATHER_API_KEY` to your own OpenWeather key with access to [Direct Geocoding](https://openweathermap.org/api/geocoding-api) and [Current Weather](https://openweathermap.org/api/current). Never commit a real key. The checked-in example is intentionally empty.
5. Start the application:

   ```sh
   npm run dev
   ```

Open the address printed by Vite, normally `http://127.0.0.1:5173`. The server binds to loopback. Stop it with Ctrl+C. Restart after changing `.env.local`.

On first load, the page shows a placeholder weather summary and any saved history/theme. It makes no automatic weather or geolocation request. Search for `Johor, MY` and choose a location if prompted.

The API key is **visible in browser code and network requests**. An environment file does not make a frontend key confidential. This frontend has no backend; a confidential-key proxy would require a separate architecture change.

## Build and preview

```sh
npm run build
npm run preview
```

Open the printed address, normally `http://127.0.0.1:4173`. The build includes type checking and writes to ignored `dist/`. Set the key before building; changing it requires another build. Stop preview before running browser tests, which also use port 4173. Preview serves the local production build.

## Using the application

| Action | Behavior |
| --- | --- |
| Search / Enter | Resolve the city, choose a match when ambiguous, then fetch current weather. |
| Reset | The brief's Clear action: clear input, weather, feedback and candidates; cancel pending work and focus the input. Saved history and theme remain. |
| Search again | Fetch fresh weather using that history record's coordinates. A successful replay creates a new event. |
| Delete | Remove only the selected history event; current weather and input remain. |
| Theme toggle | Switch light/dark mode without changing weather or history. Sun indicates current light mode; moon indicates current dark mode. |

### Search syntax

The **City, Country** field accepts `Johor`, `Johor, Malaysia`, and `Johor, MY`. City is required; country is optional and accepts English names or ISO alpha-2 codes. Whitespace and country case are normalized; multiword and non-ASCII city names are supported.

The first comma separates city from country. Remaining commas may be part of a supported country name, as in `Seoul, Korea, Republic of`. Blank input, empty parts, unknown/ambiguous country qualifiers and state syntax such as `Austin, TX, US` produce validation guidance without a request. Use a country code for an ambiguous country alias. A bare `Singapore` is treated as a city, not as a country-only lookup.

Geocoding returns up to five locations. Multiple valid matches require an explicit selection using city, country, optional region and coordinates. A supplied country qualifier is enforced. Editing while waiting removes the candidates without requesting weather. The selected location's identity stays attached to the result rather than being replaced by a nearby weather-station name.

### Weather, feedback and cancellation

The card shows current temperature, observed high/low, city/country, humidity, weather category and observation time. Temperatures are Celsius, rounded for display. High/low describe the current response's observed range, not a daily forecast. The supplied sun illustration is decorative; the category text communicates the actual condition.

Observation time uses **DD-MM-YYYY and 12-hour time at the location's UTC offset**. Its full timezone context is available through accessible text and a tooltip. Missing/invalid offsets fall back to visibly labeled UTC. Missing timestamps show "Observation time unavailable"; browser-current time is never substituted. History timestamps instead represent successful completion and use browser-local time with timezone context.

Valid location/coordinates, current temperature and category are required for success. Unavailable auxiliary values use `N/A` or the observation fallback, plus "Some weather details are unavailable." Missing optional description does not make a result partial: detailed description and separate region are not displayed on the card. Region remains available in candidates/history. The precise validation and fallback rules are in the [Weather Field Contract](docs/SPEC.md#weather-field-contract).

A new search clears the old weather and shows the placeholder summary until success. No-match, credential, rate-limit, service, network, timeout and malformed-response errors are reported in the shared feedback area. Complete success is announced to assistive technology without an extra visible message.

During requests and response processing, the input is read-only but selectable/copyable, and search initiation is disabled. Only the initiating Search or replay action shows an indicator. Reset, Delete and the theme toggle remain usable. Reset invalidates late responses so they cannot restore weather or add a canceled event. Requests time out after 15 seconds each, including response-body processing; waiting for a location choice has no timer. Failures preserve the input for retry, with no automatic retries. Editing after success keeps the current result until another search or Reset; editing after failure clears its error.

### History and storage

Each successful search or replay, including partial-data success, adds one newest-first event. Duplicate locations are separate records with unique IDs. Failures and cancellations add none. Insertion order survives refresh, equal timestamps and clock rollback; there is no arbitrary record limit.

Search again makes a new weather request by saved coordinates, without repeating geocoding or restoring cached weather. Deleting its source row while replay is in progress does not cancel the request: success adds a new ID/time, while failure or Reset adds nothing. The deleted ID stays deleted. Reset never removes an already committed event. Deleting the final row shows "No Record".

History is stored in versioned localStorage under `weather-today.history`; theme uses `weather-today.theme.v1`. Reload restores history/theme, not a weather card, and makes no automatic request. Storage is local to the browser and origin: changing protocol, hostname or port uses different storage. There are no accounts or cross-device synchronization. History contains validated location metadata, coordinates, event IDs and completion times, not keys or full weather responses.

Same-origin tabs serialize per-ID changes against fresh storage using exclusive Web Locks, preserving other tabs' additions and deletions. Storage notifications update history without changing the current search. Invalid stored entries are rejected, preserving valid entries where practical; broken theme preferences fall back to light.

Wait for the saving notice to disappear before refreshing or closing. Denied storage, quota failures or unavailable locking show a warning while current-session actions remain usable. Lock waits expire after two seconds. Unsaved changes retry against current storage on the next history mutation, not through an automatic loop. A failed initial read disables writes for that mount to avoid overwriting unseen history. Restore storage access and reload; unsaved changes can be lost. Private browsing, browser policies and clearing site data can also remove saved data.

### Presentation and accessibility

The first visit uses light mode; the toggle preference survives refresh when storage is available. Keyboard Enter/Space, visible focus, labeled controls, status announcements, candidate selection and focus recovery are supported. Reduced-motion preferences use static loading feedback and disable artwork transitions.

The minimum supported effective layout width is **280 CSS pixels**, including after zoom. Both themes follow the four [authorized Figma frames](https://www.figma.com/design/41O4ufmRZJ7KUZ5Xl79ko6/Weather-App--Copy-?node-id=0-1). Required controls, live data, readable text, 44px action targets and natural history scrolling are documented adaptations. Supplied bitmap glow/cropping can differ from Figma effects. The approved light weather metadata color has measured contrast below the WCAG AA normal-text target; full accessibility conformance is not claimed. Approved geometry, contrast measurements and design provenance are recorded in [SPEC](docs/SPEC.md#ux--ui-requirements) and [PLAN](docs/PLAN.md), rather than duplicated here.

## Checks

Run the combined lint, strict type-check, unit/component tests and production build:

```sh
npm run check
```

Individual commands are:

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint with zero warnings allowed |
| `npm run typecheck` | TypeScript project checking |
| `npm run test -- --run` | One unit/component test run |
| `npm run test` | Vitest default: watch in a normal interactive terminal, one run in CI/non-interactive/agent environments |
| `npm run test -- --watch` | Explicit watch mode; exit with `q` or Ctrl+C |
| `npm run build` | Type checking and production bundle |

Install browsers after dependency installation, then run E2E tests with port **4173 free**:

```sh
npm run test:e2e:install
npm run test:e2e
```

Repeat browser installation after Playwright version changes. Both scripts use the project's ignored `.cache/playwright/`, keeping installation and execution on the same browser binaries. On Linux, install required operating-system libraries with `npm run test:e2e:install -- --with-deps` when needed. Browser downloads require network access; system-library installation may require administrator privileges.

Playwright starts/stops its own development server and covers desktop Chromium/Firefox/WebKit plus mobile Chromium/WebKit emulation. Unit/component and E2E tests use controlled provider responses. The E2E server uses a dummy credential, so a real key is not required and passing E2E does not prove live OpenWeather access. Coverage includes success/degradation/errors, cancellation, candidates, all actions, persistence and multi-tab locking, themes, keyboard behavior and responsive layouts. Reports are in ignored `playwright-report/` and failure artifacts in `test-results/`.

M5 separately verified real provider search and fresh history replay from the production build at desktop/mobile layouts on 2026-10-04, following the earlier M1/M2 live checks. Final native Chromium 200% zoom and cross-engine CSS zoom have separate evidence; mobile emulation is not physical-device certification. The original-requirement/SPEC-to-product review and final acceptance are complete. See [PLAN](docs/PLAN.md) for executed checks, approved visual exceptions and environment limits. Clean installation was verified on Windows; macOS/Linux installation and native Firefox/WebKit zoom were not independently executed.

## Homepage metadata and icons

The canonical homepage is [weather-today-pi.vercel.app](https://weather-today-pi.vercel.app/), supplied by the user after their Vercel deployment. [config/seo.ts](config/seo.ts) owns title, description, production URL and image paths. Vite injects metadata into initial HTML for crawlers that do not execute JavaScript, including canonical, Open Graph, Twitter Summary Card and WebSite structured data. Development and builds use that same production identity. If the production domain changes, update this configuration and rebuild.

Square favicon, ICO, Apple Touch Icon and a separate 512px sharing thumbnail are derived from the unchanged `assets/sun.png` through proportional resizing and transparent padding. All derived files live in [assets/seo/](assets/seo/), and builds emit them at stable `/assets/seo/` URLs. `robots.txt` and a sitemap containing only the homepage are generated from the same configuration and also served during development. Meta keywords are omitted. There are no independently indexed city pages, and metadata does not guarantee indexing, ranking or immediate sharing-preview updates.

After publication, verify the production page's metadata/assets and indexing headers; Vercel normally adds `noindex` to preview deployments. This source extension does not publish a deployment or register Google Search Console.

## Architecture

React 19 manages one client-rendered page; TypeScript 6 provides strict model and component checks, and Vite 8 provides local development and bundling. Native `fetch`, AbortController, localStorage and Web Locks handle requests, cancellation and persistence. There is no router, backend, global-state library or UI component framework. `i18n-iso-countries` supplies country normalization with its English locale; Noto Sans is bundled locally. Exact versions are in the manifest and lockfile.

```text
src/App.tsx            Page composition and candidate selection
src/components/        SearchForm, WeatherCard, SearchHistory, ThemeToggle
src/hooks/             Search lifecycle, history persistence, theme preference
src/services/          OpenWeather requests and error handling
src/helpers/           Query parsing, weather validation/formatting, history storage
src/types/             Shared weather models
src/styles/            Responsive layout, themes and interaction styles
src/**/*.test.*        Colocated unit/component tests
src/test/              Test setup and fixtures
tests/e2e/             Browser acceptance tests
scripts/playwright.mjs Project-local browser installation/execution
assets/                Supplied artwork and control glyphs
assets/seo/            Derived site icons and sharing thumbnail
config/seo.ts          Site identity, initial metadata and crawl files
public/fonts/          Font license notice
docs/                  Specification, plan and original requirements
```

Search flows from input parsing/country validation to geocoding, explicit selection when needed, coordinate-based weather retrieval, response validation, rendering and appending a successful history event. `useWeatherSearch` owns cancellation and stale-result protection; the service owns provider requests. `useHistory` and the storage helper handle independent per-ID persistence. Replay starts directly at weather retrieval using saved coordinates. This separates request ownership from the lifetime of a history row.

## Sources, assumptions and limitations

- Original assessment: [MQ_Frontend.pdf](docs/requirements/MQ_Frontend.pdf) and [MQ_Checklist.pdf](docs/requirements/MQ_Checklist.pdf). They contain personal/contact details; publishing them or sending a submission is outside this local work.
- [SPEC](docs/SPEC.md#ui-behavior-assumptions) documents the approved assumptions separately from the PDFs: combined city/country input, explicit candidates, no default request, duplicate success events, Reset versus Delete, cancellation, distinct timestamps, field degradation, both themes and automated tests. [PLAN](docs/PLAN.md) records architecture and dated verification.
- The four original root PNGs in `assets/` are unchanged. `sun.png` is the decorative hero; `bg-light.png` and `bg-dark.png` provide themed backgrounds. `cloud.png` is preserved but has no assigned role in the approved design. Control glyphs in `assets/controls/` are bundled locally from the design or supplied assets; no expiring design URL is needed at runtime.
- Noto Sans 400/700 is self-hosted through `@fontsource/noto-sans`. Its copyright and OFL-1.1 terms are preserved in [the font notice](public/fonts/noto-sans-OFL.txt), included in production output. No Google Fonts network request is required.
- Weather availability depends on the active key, provider access/quota and network. Browser-visible credentials, local-only storage, bitmap differences and the minimum layout width are deliberate boundaries. Forecasts, geolocation, maps, accounts and a confidential-key proxy are outside scope. The user operates public hosting; the homepage metadata extension retains the existing frontend architecture.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| npm fails before any project command | Verify the Node/npm installation. On Windows, if the PowerShell `npm` launcher fails, try `npm.cmd --version` and the equivalent `npm.cmd` commands or use Command Prompt. The project does not require changing PowerShell execution policy. |
| Setup guidance or provider-access error | Set the exact variable in root `.env.local`, restart development or rebuild preview, and check that the key can access both required APIs. Never paste keys into logs or issues. |
| E2E cannot start its server | Stop any application/preview using port 4173, then retry. |
| Browser executable missing or fails to launch | Run `npm run test:e2e:install`; on Linux check system prerequisites. Use the project scripts so browser installation and execution share the local cache. |
| History seems missing | Check that protocol, hostname and port match the original session, and check storage warnings/browser settings. Unsaved or cleared site data cannot be restored by the app. |
