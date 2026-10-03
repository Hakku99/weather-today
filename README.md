# Today's Weather

A React frontend assessment for current-weather search and local search history.

**Current status: M1 complete, including live API verification.** Search, explicit location selection, current weather, loading/errors, timeout, and Clear cancellation are implemented and verified. History and the detailed Figma UI remain M2-M3 work. See [the plan](docs/PLAN.md) for evidence and milestone status.

## Local setup

Use Node.js 24 LTS (24.15.0 or newer within major 24) and npm 10 or newer. Development was checked with Node 24.16.0 and npm 10.9.2. The minimum patch follows the installed DOM test environment's engine requirement. `.nvmrc` selects the Node 24 major; exact dependencies are committed in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite (normally `http://127.0.0.1:5173`). The server binds to loopback. No automatic location or weather request occurs on startup.

Before searching, copy `.env.example` to `.env.local`, set your own `VITE_OPENWEATHER_API_KEY`, and restart the development server. Use an OpenWeather key with access to [Direct Geocoding](https://openweathermap.org/api/geocoding-api) and [Current Weather](https://openweathermap.org/api/current). Rebuild after changing the key for production preview. Missing configuration shows setup guidance; rejected keys show a provider-access error. `.env.local` is ignored by Git. This client-only assessment exposes that key in the browser; the environment file does not make it confidential. No backend, public deployment, or shared credential is included.

## City and country input

Enter `Johor`, `Johor, Malaysia`, or `Johor, MY`, then select Search or press Enter. Country is optional. Whitespace is normalized for parsing; multiword cities, punctuation, and non-ASCII names are preserved. English country names and dataset aliases resolve case-insensitively to two-letter codes. Ambiguous aliases require a code instead of silently choosing a country.

The first comma separates city from country; remaining commas may belong to a supported country name, such as `Seoul, Korea, Republic of`. State syntax (`Austin, TX, US`), empty parts, and unknown countries show an inline error before any request. A bare `Singapore` remains a city query. Country data comes from `i18n-iso-countries`, with only its English locale registered for the browser.

Search first resolves up to five locations. If multiple valid locations match, choose one using its name, country, optional region, and coordinates; no first-match selection is automatic. Any supplied country qualifier is enforced. Editing while waiting removes the old choices without making another request. Once selected, current weather is fetched by that location's coordinates in metric units. The validated selected identity stays attached to the result rather than being replaced by a nearby weather-station name.

## Weather and cancellation

Current temperature, observed high/low, category, description, humidity, and observation time are shown with the unchanged supplied `sun.png` decorative artwork. Temperatures retain raw Celsius values internally and are rounded only for display. High/low describe the current response's observed range, not a daily forecast. The artwork is decorative and does not claim to encode the current weather condition.

Observation times use day/month/year and 12-hour time at the location's UTC offset, labeled explicitly. OpenWeather defines `dt` as a UTC Unix timestamp and `timezone` as a shift in seconds. Missing/invalid offsets fall back to labeled UTC. Missing timestamps show "Observation time unavailable"; the current time is never substituted. Current temperature, condition category, and validated location/coordinates are required for success. Missing auxiliary fields show their individual fallback and one "Some weather details are unavailable." notice.

During networking and response processing, the input is read-only but can be focused, selected, and copied. Search is disabled with a single indicator; the shared status identifies the current phase. Clear remains available, aborts/invalidates the query, removes input/result/error/choices, and returns focus to the input. Old completions cannot overwrite newer results or controls. Requests time out after 15 seconds each, including waiting for the response body; location-choice waiting has no timer. Editing the input after success keeps the current result and its feedback, including any partial-data notice, until another search or Clear removes that result. Editing after an error clears the old error. Failed requests preserve input and permit a fresh search. There are no automatic retries. Reduced-motion preference uses a static indicator.

History, replay/deletion, and themes are not yet implemented. The current page uses basic semantic controls and interaction styling; its layout is not the completed Figma design.

## Checks

```sh
npm run lint
npm run typecheck
npm run test -- --run
npm run build
```

`npm run check` runs those four checks. `npm run test` starts watch mode. A successful build includes type checking; bundling alone is not considered a type check.

Install browser binaries once (and after Playwright version changes), then run the browser tests:

```sh
npm run test:e2e:install
npm run test:e2e
```

Both browser scripts use ignored `.cache/playwright/` in this project through Playwright's supported `PLAYWRIGHT_BROWSERS_PATH` setting. This avoids a Windows Firefox launch failure observed with the system cache and keeps installation and execution on the same binaries. No additional wrapper dependency is required. On Linux, install operating-system prerequisites with `npm run test:e2e:install -- --with-deps` if needed.

Playwright starts and stops its own local server on port 4173. Keep that port free. Projects cover desktop Chromium, Firefox, WebKit, and mobile Chromium/WebKit emulation. The server receives a dummy fixture credential and tests intercept OpenWeather requests; these tests never prove live provider access and do not use your local key. Tests verify complete/degraded data, all three query forms, country enforcement, candidate selection/invalidation, request failures, timeout/retry, cancellation/ownership, keyboard/focus, and reduced motion. Reports go to ignored `playwright-report/`; failure evidence goes to ignored `test-results/`.

Separate live verification passed on 2026-10-03 with the user's locally configured key: all three Johor examples, explicit first/non-first location selection, weather fields against real responses, country enforcement, and Clear. Desktop Chromium/Firefox/WebKit and mobile Chromium/WebKit emulation were checked without mocked provider responses. The ordinary production preview also passed a real search and no-match handling. Credentials were not recorded in verification logs or screenshots. Provider failures and cancellation races remain covered by controlled fixtures rather than deliberately exhausting or invalidating the real key. Final design fidelity is pending M3/M5.

To inspect the built application:

```sh
npm run build
npm run preview
```

## Project reference

- [Specification](docs/SPEC.md): authoritative-source links, accepted behavior, Figma measurements, assets, and acceptance criteria.
- [Execution plan](docs/PLAN.md): approval record, architecture, milestones, and validation evidence.
- `src/`: React entry and colocated DOM tests; `tests/e2e/`: browser checks.
- `assets/`: unchanged user-supplied design images. Detailed asset attribution and implemented behavior will be completed with the UI/documentation milestones.
- `docs/requirements/`: unchanged authoritative assessment PDFs. These include personal/contact details and are not intended for public deployment.

The final application will add browser-local history and both Figma themes. Their detailed assumptions live in SPEC; this increment does not claim those features are complete.
