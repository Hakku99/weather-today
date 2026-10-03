# Today's Weather

A React frontend assessment for current-weather search and local search history.

**Current status: M0-M3 complete.** Search, location selection, weather/loading/errors, Reset cancellation, durable history and responsive Figma-based light/dark themes are implemented. M1-M2 include live search/replay verification; M3 visuals use controlled responses. Native Chromium 200% zoom passed down to 280 effective CSS pixels; the intermittent history test now separates normal queue ordering from lock-timeout recovery. M4 documentation reproduction and M5 final acceptance remain outstanding. See [the plan](docs/PLAN.md) for evidence.

## Local setup

Use Node.js 24 LTS (24.15.0 or newer within major 24) and npm 10 or newer. Development was checked with Node 24.16.0 and npm 10.9.2. The minimum patch follows the installed DOM test environment's engine requirement. `.nvmrc` selects the Node 24 major; exact dependencies are committed in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite (normally `http://127.0.0.1:5173`). The server binds to loopback. No automatic location or weather request occurs on startup.

Before searching, copy `.env.example` to `.env.local`, set your own `VITE_OPENWEATHER_API_KEY`, and restart the development server. Use an OpenWeather key with access to [Direct Geocoding](https://openweathermap.org/api/geocoding-api) and [Current Weather](https://openweathermap.org/api/current). Rebuild after changing the key for production preview. Missing configuration shows setup guidance; rejected keys show a provider-access error. `.env.local` is ignored by Git. This client-only assessment exposes that key in the browser; the environment file does not make it confidential. No backend, public deployment, or shared credential is included.

## City and country input

Enter `Johor`, `Johor, Malaysia`, or `Johor, MY`, then select Search or press Enter. The empty field shows `Enter a city, e.g. Johor, MY` in a softer theme-specific color, using an ellipsis when space is insufficient. The complete placeholder attribute and visible City, Country label remain; the former duplicate instruction paragraph is removed. Actual input keeps native cursor, selection and horizontal editing behavior. Validation feedback and active-search cancellation guidance remain associated with the field. Country is optional. Whitespace is normalized for parsing; multiword cities, punctuation, and non-ASCII names are preserved. English country names and dataset aliases resolve case-insensitively to two-letter codes. Ambiguous aliases require a code instead of silently choosing a country.

The first comma separates city from country; remaining commas may belong to a supported country name, such as `Seoul, Korea, Republic of`. State syntax (`Austin, TX, US`), empty parts, and unknown countries show an inline error before any request. A bare `Singapore` remains a city query. Country data comes from `i18n-iso-countries`, with only its English locale registered for the browser.

Search first resolves up to five locations. If multiple valid locations match, choose one using its name, country, optional region, and coordinates; no first-match selection is automatic. Any supplied country qualifier is enforced. Editing while waiting removes the old choices without making another request. Once selected, current weather is fetched by that location's coordinates in metric units. The validated selected identity stays attached to the result rather than being replaced by a nearby weather-station name.

## Weather and cancellation

Current temperature, observed high/low, location (city/country), category, humidity, and observation time are shown with the unchanged supplied `sun.png` decorative artwork. Temperatures retain raw Celsius values internally and are rounded only for display. High/low describe the current response's observed range, not a daily forecast. The artwork is decorative and does not claim to encode the current weather condition.

Without active weather, the same summary displays "--°", "H: --°  L: --°", "Search a city", observation "--", "Humidity: --%", and category "--". This applies initially, after Reset/reload, and during loading, candidate selection or failure. Placeholders are not stored as weather/history and never substitute browser-current observation time. Candidate choices appear below the summary and above history.

Loading phase and "Use Reset to cancel." share the feedback region with errors, candidate instructions and history/theme storage warnings. Complete success has no visible success message; the shared status retains a visually hidden success announcement. Partial success shows only "Some weather details are unavailable." as visible search feedback. Empty feedback reserves no height; artwork clearance is calculated separately.

Weather observations use DD-MM-YYYY and 12-hour time at the location's UTC offset. Normal cards omit the visible timezone suffix; an accessible description and tooltip retain the full context. OpenWeather defines `dt` as a UTC Unix timestamp and `timezone` as a shift in seconds. Missing/invalid offsets fall back to labeled UTC. Missing timestamps show "Observation time unavailable"; the current time is never substituted. Current temperature, condition category, and validated location/coordinates are required for success. Missing displayed auxiliary fields show their individual fallback and one "Some weather details are unavailable." notice. Description is retained as optional parsed metadata but is not displayed and does not affect partial status. Separate region and high/low explanatory text are also omitted from the card; region remains available in location choices and history.

During networking and response processing, the input is read-only but can be focused, selected, and copied. Search is disabled with a single indicator; the shared status identifies the current phase. Reset remains available, aborts/invalidates the query, removes input/result/error/choices, and returns focus to the input. Old completions cannot overwrite newer results or controls. Requests time out after 15 seconds each, including waiting for the response body; location-choice waiting has no timer. Editing the input after success keeps the current result and its feedback, including any partial-data notice, until another search or Reset removes that result. Editing after an error clears the old error. Failed requests preserve input and permit a fresh search. There are no automatic retries. Reduced-motion preference uses a static indicator.

## Search history

Every successful weather retrieval adds a new history event, newest first. Complete and partial-data successes each add exactly one event; validation failures, provider errors, timeout, cancellation, and superseded responses add none. Repeated locations are separate events with unique IDs. There is no arbitrary record limit. The saved array retains event insertion order, including equal timestamps and system clock rollback; refresh does not sort records by their display timestamps.

Search again requests fresh current weather directly using the saved coordinates, regardless of the current input. It does not restore cached weather or repeat geocoding. Success adds a new event. During replay, the input is read-only and all search initiation is disabled. Only the initiating history row shows the indicator; the shared status describes the location being fetched. Reset and Delete remain available.

Delete removes only the chosen event and leaves the current weather/input intact. Deleting an actively replayed row does not cancel its request: success adds a new ID and completion time, while failure or Reset adds nothing. The deleted ID is never restored. Reset resets current search/weather without deleting committed history. When the last event is deleted, the history shows "No Record". Deleting a focused action moves focus to the next row's equivalent action, then the previous row, or the input when no rows remain.

History is stored under `weather-today.history` in a versioned localStorage envelope containing only event IDs, validated city/country, optional region, coordinates, and UTC completion timestamps. Times are displayed in browser-local time with a timezone label and day/month/year, 12-hour formatting. They are independent of the provider's weather observation times. Refresh restores history, not a weather card, and makes no automatic request. Records and deletions persist for the same browser/origin; changing protocol, hostname, or port uses different storage. This is not cross-device history or account synchronization.

Same-origin tabs apply additions and deletions by event ID to the latest saved history under an exclusive [Web Lock](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API). Each action queues independently; a stale tab cannot overwrite other tabs' searches or revive an unrelated deleted ID. Storage notifications update other tabs' history without changing their input, weather, or active query. The version-1 envelope and existing IDs/timestamps remain compatible.

Stored data is untrusted: malformed data, unsupported versions, invalid locations/timestamps, and duplicate IDs are rejected, preserving valid entries where practical. Mounting and storage notifications never write an empty list over existing history. A saving notice appears while changes wait to be persisted; wait until it disappears before refreshing/closing to retain those changes. Storage access/quota failures or unavailable safe locking show a separate warning while search, replay, and deletion remain usable in the current session. Lock waits end after two seconds. Pending ID changes are retried against the latest stored records on the next history mutation, without an automatic retry loop. If the initial read fails, the session does not write over unseen saved records; reload after restoring storage access. Unsaved session changes can be lost on refresh. Browser/private-mode policies or clearing site data can also remove history. No credentials or full weather responses are stored in history.

## Themes and presentation

Reset is the original requirements' Clear action, relabeled with the same behavior. Its supplied assets/controls/rotate.png icon is an 18px white decorative mask beside Reset text with an 8px gap. The solid button is 44px high, has natural content width and a 20px corner radius, and uses the same --button background and hover brightness as Search/theme-toggle in both themes. The icon is static; native keyboard activation and focus styling remain available, including during requests.

A single theme button displays the current mode: sun in light mode and moon in dark mode. Clicking switches to the opposite theme without changing the query, result, history or active request. The supplied assets/controls/sun.png and moon.png are white alpha masks in both themes. The visible button and target are 44 x 44px with a 20px corner radius and an 18px icon; background and hover brightness match Search. There is no selection border. The stable accessible name is Toggle dark mode; aria-pressed is true in dark mode and false in light mode. Hover titles describe the next action: Switch to dark theme or Switch to light theme. Keyboard focus, Enter and Space remain available. First visit defaults to light. The preference is saved under `weather-today.theme.v1`; refresh restores it independently of history. Invalid preferences fall back to light. Unavailable storage keeps session switching usable with a separate warning; an unsaved choice can be lost on refresh.

The shared translucent weather/history panel follows the four [authorized Figma frames](https://www.figma.com/design/41O4ufmRZJ7KUZ5Xl79ko6/Weather-App--Copy-?node-id=0-1). Required Reset/theme controls, input/cancellation guidance, required displayed fields, readable controls, 44px targets and long-history scrolling are explicit adaptations that move content down. Mobile artwork preserves the supplied bitmap's subject/proportions, with documented glow/crop differences from Figma effects. This is not an unmodified pixel-identical mockup.

Weather metadata follows the user-confirmed screenshots: desktop (>660px) shows location/time/humidity/category on one row; 375-660px uses equal columns; <=374px uses left-aligned single-column metadata. Mobile search controls and history styles also apply through 660px. Mobile H/L and ordinary metadata are 14px; the main temperature is 81px desktop and 50px mobile, including long values, with natural line height and no internal scrolling. Long mobile temperatures reflow to a single column and clear the artwork's bottom edge. The hero is capped at 300px; desktop width scales from 169.5px to 300px with available container space and shares its sizing variable with text clearance. Mobile width stays 169.5px at 351-660px and 140px at <=350px. Summary spacing is 4px; the former 601-700px 180px gap is removed. Light weather metadata uses the requested #666666; dark metadata retains its independent theme color. PLAN records contrast limitations and distinguishes earlier test results from the latest browser preview.

The minimum supported effective layout viewport is **280 CSS pixels**, including after zoom. Below that width, overflow-free layout is not guaranteed. Temperature sizes remain 50px mobile / 81px desktop; the app does not disable zoom or clip long values. Native Chromium 200% page zoom was separately verified at 280/320/720 effective pixels with both themes. Automated CSS zoom checks use 560px at 200% to cover 280px of layout space across the browser projects; these supplement native zoom evidence. The previous 320px-at-200% stress case leaves only 160px and falls outside this user-approved boundary.

The four original root PNGs are unchanged. Original themed Search/Delete glyphs and main-search masks are bundled in `assets/controls/`; no expiring design URL is used at runtime. Noto Sans 400/700 is self-hosted through pinned `@fontsource/noto-sans` 5.3.0, not fetched from Google Fonts. Copyright/OFL-1.1 is retained in [the font notice](public/fonts/noto-sans-OFL.txt), also included in production output.

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

Playwright starts and stops its own local server on port 4173. Keep that port free. Projects cover desktop Chromium, Firefox, WebKit, and mobile Chromium/WebKit emulation. The server receives a dummy fixture credential and tests intercept OpenWeather requests; these tests never prove live provider access and do not use your local key. Tests verify complete/degraded data, all three query forms, country enforcement, candidate selection/invalidation, request failures, timeout/retry, cancellation/ownership, keyboard/focus, reduced motion, history refresh/deletion, fresh replay with changed responses, deletion during replay, repeated records, long history, and corrupt/denied/quota storage. Native browser storage/locks also verify stale-tab writes, concurrent additions/deletion, interleaved action order, and refresh after clock rollback/equal timestamps. Reports go to ignored `playwright-report/`; failure evidence goes to ignored `test-results/`.

Separate live verification passed on 2026-10-03 with the user's locally configured key: all three Johor examples, explicit first/non-first location selection, weather fields against real responses, country enforcement, and Clear. Desktop Chromium/Firefox/WebKit and mobile Chromium/WebKit emulation were checked without mocked provider responses. The ordinary production preview also passed a real search and no-match handling. Credentials were not recorded in verification logs or screenshots. Provider failures and cancellation races remain covered by controlled fixtures rather than deliberately exhausting or invalidating the real key. M3 visual comparison and adaptations are recorded in PLAN; final combined acceptance remains M5.

M2 live verification also passed on 2026-10-03 in those five browser combinations: qualified Johor search, refresh preserving the event ID/time, coordinate-based replay issuing a new real weather request without geocoding, exact deletion of the original event while retaining the new one, Clear retaining history, and deletion surviving reload. The replayed card's temperature matched its real response. These are browser/emulation checks, not physical-device certification.

To inspect the built application:

```sh
npm run build
npm run preview
```

Presentation tests also verify weather-card omission/optional-description behavior, timezone accessibility and visible UTC fallback, exact breakpoint boundaries, equal columns, fixed mobile typography, artwork widths and text overlap, in addition to theme reload/corruption/denial, four Figma reference views and intermediate/landscape widths, long/degraded data, 200% CSS zoom, scrolling, proportional artwork, 44px targets, readable input selection, stable loading controls and reduced motion. Local screenshots are ignored under `tmp/m3-review/` and `tmp/weather-card-review/`; PLAN distinguishes visual comparison and sampled contrast from live-provider evidence.

## Project reference

- [Specification](docs/SPEC.md): authoritative-source links, accepted behavior, Figma measurements, assets, and acceptance criteria.
- [Execution plan](docs/PLAN.md): approval record, architecture, milestones, and validation evidence.
- `src/`: React entry and colocated DOM tests; `tests/e2e/`: browser checks.
- `assets/`: unchanged user-supplied images plus original Figma control glyphs. `public/fonts/`: bundled Noto Sans license notice.
- `docs/requirements/`: unchanged authoritative assessment PDFs. These include personal/contact details and are not intended for public deployment.

Both Figma themes and the responsive composition are implemented. Detailed assumptions/adaptations live in SPEC/PLAN; M4-M5 remain outstanding. No deployment or submission is authorized by this local assessment work.
