# Today's Weather - Specification

Status: Planning baseline reviewed; search, themes/tests, local frontend credential boundary, and detailed field/error/loading/selection contracts confirmed. The Pre-Implementation Approval Gate is pending.
Date: 2026-10-03 (Asia/Kuala_Lumpur).

## Authoritative Sources

| Source | Authority and coverage |
| --- | --- |
| [MQ_Frontend.pdf](requirements/MQ_Frontend.pdf) | All four pages: React requirement and evaluation criteria; functional wireframes; six numbered requirements; desktop and mobile light/dark visual references; reference and asset links. |
| [MQ_Checklist.pdf](requirements/MQ_Checklist.pdf) | Entire single scanned page, visually read: submission requirements, persistent history, all buttons, errors, loading, responsive design, quality checks, README, and recommended enhancements. |
| [AAPDS.md](../AAPDS.md) | Complete v1.2.2 execution protocol; phase ordering, approval, engineering, verification, and final review rules. |
| User instruction dated 2026-10-02 | Complete SPECIFY and ALIGN & PLAN only; preserve original sources; no bootstrap, dependency installation, or implementation before explicit approval; English artifacts and Chinese conversation. |
| User follow-up dated 2026-10-02 | UI must reference the Figma design linked in the brief and use the supplied images in the root `assets/` directory. |
| User-provided Figma duplicate dated 2026-10-02 | The user duplicated the brief's design because the original file lacks editor access. Use file `6Tpic5YuQTvZNG8qF9medS` as the working UI reference for this project; retain the original link as provenance. Read-only layer inspection and all four frame renders were verified on this date. This authorizes documentation correction, not application implementation. |
| User decisions dated 2026-10-03 | Correct illustration geometry; include automated tests and a light/dark switcher in delivery; use local execution with a reviewer-configured browser-visible key and no backend. The user subsequently confirmed one combined city/country search input, including the proposed city-only and city-plus-country examples. Overall implementation approval remains pending. |
| User behavior-contract confirmation dated 2026-10-03 | Following requirements review and proposal revisions, the user authorized updating SPEC/PLAN with Clear semantics, weather-field degradation, candidate selection, request ownership/cancellation, loading and disabled/read-only feedback, focus behavior, and corresponding acceptance scenarios. These are confirmed project interpretations where the PDFs are silent; no implementation approval is implied. |

The authoritative PDFs are preserved in `docs/requirements/`; their contents match the original SHA-256 baselines below. The root-level PDF files are no longer present. Both PDFs govern the product together. This specification interprets them and never silently reduces their requirements.

Source SHA-256 baselines:

- MQ_Frontend.pdf: `04B05BB77A33D5CE46E31F3DE916FE0EF75FF1DC2D78DC11FD6FD3C2512659DE`
- MQ_Checklist.pdf: `F556D59D0A56089FD0012450CD02EF7B4AAC291E2DD989D133128BCEFAAAB5F7`
- AAPDS.md: `1742C3884F3BBDB470C968B9EB1B9CDC5197A30B78657CC5675DFEB41F5ED933`

## Product Goal and Scope

Build a complete, easy-to-run React application named "Today's Weather". Users search for current weather using city and country, inspect weather details, and manage persistent search history on desktop and mobile.

Initial repository inspection found only the protocol, two PDFs, `.gitignore`, Git metadata, and ignored PDF inspection images. The user subsequently supplied four UI images in `assets/`. There is no existing application, package manifest, or application architecture. This remains a **Greenfield** project.

Required scope: React UI, asynchronous OpenWeather integration, search/clear/search-again/delete, informative validation and API errors, loading and empty states, history surviving refresh, responsive reference-based design, maintainable components, clean quality checks, and complete setup/assumption documentation.

Optional in the sources but **explicitly confirmed by the user on 2026-10-03**: automated tests and both light/dark themes with a switcher. They are required delivery scope. This scope confirmation is not authorization to start implementation.

## Functional Requirements and Acceptance

Search-form decision confirmed (2026-10-03): use one combined input for city and optional country. This user-approved interpretation retains Figma's single-field composition and the PDFs' city/country search capability. The PDF wireframe shows two fields and Figma labels its one field Country; the combined syntax and revised label below are explicit project decisions, not behaviors inferred from those drawings.

| ID | Requirement and observable acceptance | Verification |
| --- | --- | --- |
| FR-01 Search | One input labeled "City, Country", a Search button, and Enter submission. Accept `Johor`, `Johor, Malaysia`, and `Johor, MY`; city is required and country is optional. Parse and validate the syntax below, normalize whitespace and country case, and enforce any supplied country qualifier. Invalid syntax, blank city, and unknown country produce useful inline validation without issuing a request. A valid submission asynchronously obtains OpenWeather data without a page reload. | Query parsing/country normalization tests, API contract tests, browser searches for all three accepted forms and invalid input. |
| FR-02 Weather details | Show title, resolved city/country, current temperature in Celsius, high/low temperature range, weather category, description, humidity percentage, observation date/time, and weather illustration. Use real response values; sample cities, dates, and temperatures are not hardcoded results. Complete valid responses must display every required field. Apply the Weather Field Contract only when response data is actually unavailable or invalid; degraded rendering must not weaken normal-path acceptance. | Complete-response fixtures assert every field; separate degraded-response/core-failure tests; real API smoke check; desktop/mobile visual inspection. |
| FR-03 Clear | A visible Clear button resets the combined query input, errors, pending selection, and current weather to the initial state; it cancels/invalidates any request, returns focus to the combined input, and leaves history and theme intact. Delayed responses must not repopulate weather, add history, or alter a newer query's loading/errors. Clear does not undo a success already committed to history. | Interaction tests and browser checks before, during, and after search, including cancellation during response processing. |
| FR-04 History | Each successful weather retrieval adds a newest-first record showing location, search date/time, Search again, and Delete. Failures and canceled requests add nothing. Search again performs a fresh weather API request for that record's coordinates and updates the current weather; it is not a cached-card replay. Delete removes precisely the chosen record without changing the current weather or canceling its active replay. If that replay subsequently succeeds, append a new event with a new ID; do not restore the deleted event. The final deletion shows "No Record" unless a later successful query adds a new record. | History tests; browser request assertions and changed response on replay; exact-row and final-row deletion. |
| FR-05 Persistence | Saved records, order, identity, and timestamps survive page refresh in the same browser/origin. Deletion also survives refresh. Initial loading must not overwrite existing records with an empty list. Invalid stored data or unavailable storage does not crash weather search; tell the user when history cannot be retained. | Reload after search and deletion; malformed JSON/schema and blocked/quota-exceeded storage tests. |
| FR-06 Failure and loading states | Visible loading feedback during both geocoding and weather requests. Invalid city, country mismatch, no match, API credential failure, quota/rate limit, service failure, network failure, timeout, and malformed response receive understandable messages. Old results must not look like success for a failed new query. Apply the Query Interaction and Loading Contract for read-only input, disabled actions, candidate invalidation, progress feedback, and focus. Clear remains available. No endless loading, uncaught rejection, or false success. | Parameterized service/UI tests, request races, candidate interactions, and browser positive/negative and accessible-loading flows. |
| FR-07 Themes | Both source light and dark visual treatments are implemented. Accessible switcher changes all surfaces and controls without losing weather/history. First visit defaults to light; selected preference survives refresh. Broken preference storage falls back safely. | Both themes at desktop/mobile widths; switch and reload test; contrast/focus inspection. |

### Combined Search Input Contract

- Visible label: "City, Country". Placeholder example: "Johor, MY". Associated helper text: "Enter a city, optionally followed by a comma and country name or code." The label and helper remain accessible independently of the placeholder.
- Without a comma, treat the trimmed query as a city name. With a comma, split at the first comma: the left portion is the city and the entire remaining portion is the country name/code. Both portions must be nonempty when a comma is supplied. Normalize surrounding/repeated whitespace and resolve the country case-insensitively; preserve city punctuation and non-ASCII characters.
- Do not split on spaces: `Kuala Lumpur` is one city. Support `Kuala Lumpur, Malaysia` and whitespace/case variants such as `  Johor , my  `. Any comma within a supported country name belongs to the country portion; do not interpret additional components as a state field.
- Reject blank input, `, MY`, `Johor,`, unknown country qualifiers, and malformed suffixes such as `Johor,,MY` with actionable guidance. Do not silently discard an invalid suffix or fall back to an unconstrained city search. `City, State, Country` syntax is outside this input contract; available state information is used in candidate selection instead.
- There is no country-only weather mode or automatic capital substitution. A bare query is interpreted as a city query, not rejected merely because its name also matches a country: `Singapore` must remain a valid city lookup. Failed city resolution receives a useful no-match message. Country qualification and candidate selection must preserve the requested location.
- Search again continues to use stored coordinates for a fresh request; it does not reparse a displayed history label or depend on the current form text.

### Weather Field Contract

All required weather information must appear for a complete, valid response. The following rules handle genuinely absent or invalid data; they do not permit omitting available fields or replacing complete-response acceptance with degraded fixtures.

| Field | Validity and unavailable-data behavior |
| --- | --- |
| Resolved location identity and coordinates | Require a nonempty resolved city/country and finite latitude/longitude within geographic bounds. Use the current selected geocoding result or the validated saved location for replay when the weather payload omits identity fields. Never borrow identity from a previous weather card or silently substitute a different location. If no valid identity/coordinates are available, fail the query. State/region is optional. |
| Current temperature | Require a finite numeric Celsius value; otherwise fail the query. Do not invent arbitrary bounds that reject valid extreme temperatures. |
| Weather category | Require a nonempty category string; otherwise fail the query. An unfamiliar condition code alone is not a failure when readable category text is valid. |
| Detailed description | Display the valid nonempty description; otherwise show "Description unavailable" while retaining the valid category. |
| Humidity | Require a finite numeric value from 0 through 100; otherwise show "N/A". |
| High / low temperature | Validate each as a finite numeric value independently; show "N/A" for each unavailable value. If both are numeric but high is below low, show "N/A" for both. Do not substitute current temperature. Validate raw values before display rounding. These are the current response's observed range, not a daily forecast. |
| Observation timestamp | Require a valid provider timestamp that can be safely converted and formatted; otherwise show "Observation time unavailable". Never substitute the current time or history event time. |
| Location UTC offset | Validate the numeric offset against the documented provider contract at implementation. If the timestamp and offset are valid and local-time conversion succeeds, display location time with the offset label. If the offset or local conversion is unavailable but the timestamp can be formatted in UTC, display UTC with an explicit "UTC" label. If the timestamp itself cannot be safely formatted, use the unavailable-time message. Never silently use browser-local time for the weather observation. |
| Icon code | Missing or unfamiliar icon codes do not fail the query. Keep the supplied decorative illustration; weather text conveys the actual condition. |

- Do not coerce absent values, empty strings, or invalid types into numbers. Valid zero values, including 0 degrees Celsius, 0% humidity, and a zero UTC offset, are not missing values.
- A missing/invalid core field (location identity/coordinates, current temperature, or category) produces an understandable invalid-response error, no weather card, and no new history event. Clear previous weather when starting the query so it cannot masquerade as this result.
- With all core fields valid, unavailable description, humidity, range, or observation context permits a degraded success. Show the field-level fallback and one notice, "Some weather details are unavailable." A UTC fallback for a missing location offset also carries this notice. Missing decorative icon data alone needs no missing-details notice.
- Complete and degraded successes each append exactly one successful-search event if the query is still current. Failed or invalidated queries append none. Storage failure remains a separate honest warning and must not be hidden by the partial-data notice.
- History timestamps record successful completion in UTC, displayed in browser-local time with a timezone label. They are independent of the provider's observation timestamp. Retain valid raw values internally and round temperatures consistently for display only.

### Query Interaction and Loading Contract

The PDFs require a working Clear button (Frontend p.1 wireframe and Checklist p.1). They do not define its full reset scope. Clearing the current query/result while retaining history/theme, plus the interaction rules below, are user-confirmed project decisions rather than behaviors claimed to appear in Figma. No bulk-history-clear feature is introduced.

| Phase | Combined input | Search / Search again / candidates | Clear / Delete / theme | Feedback |
| --- | --- | --- | --- | --- |
| Idle, success, or error | Editable | Available when applicable; normal validation still applies | Available when applicable | Initial guidance, current result, partial-data notice, or error |
| Geocoding or weather request, including response processing | Read-only; still focusable, selectable, and copyable | Search/replay and candidate submission disabled | Remain usable | Immediate progress indication for the initiating action and one shared status region |
| Waiting for a location choice | Editable | Search/replay and current candidates available | Remain usable | "Choose a location" and the current candidate list; no loading animation |

- Multiple valid candidates show city/country and available state/region; do not automatically pick the first. Waiting for a choice makes no weather request or history entry and has no network timeout. Changing the input immediately invalidates and removes old candidates, without an automatic request. Submitting another query or starting a history replay also discards the previous choice flow.
- Selecting a candidate immediately locks submission before UI rerender, captures that candidate's coordinates, and starts exactly one weather request. Repeated clicks on the same or another candidate cannot create duplicate requests/events. A failed request preserves the input and allows a fresh Search; no stale candidate remains actionable.
- A query identity covers geocoding, its candidate list, weather retrieval, and response processing. Clear or a replacement query invalidates that identity immediately and attempts network cancellation. Check ownership before changing weather, candidates, errors, loading/control state, or history, including after parsing and in completion/cleanup paths. An obsolete request cannot stop a newer query's loading state. Clear does not roll back already committed successful history.
- While networking/processing is active, users can change the query by using Clear first. Apply a finite timeout to each network request; do not time out the user's candidate-selection time. Cancellation produces no error; timeout produces an understandable error and releases the controls for the current query. No automatic retry loop is introduced.
- Form-initiated queries show one progress indicator in Search with "Searching...". History replay shows the indicator only in the initiating row's Search again button; the main Search button is disabled without a second indicator. The shared status region identifies the phase: "Finding locations..." or "Fetching weather for {city}, {country}...". Show feedback immediately and reserve responsive space to avoid button-width/layout jumps; do not squeeze text into the reference icon bounds.
- If the replay's source row is deleted, the query continues using its captured validated location, and the shared progress status remains visible. The row indicator disappears with the row; the shared status text is sufficient feedback and does not require a replacement spinner. Success creates a new history event; failure/cancellation creates none. Delete removes an old event; Clear cancels the current query.
- During networking/processing, associate "Search in progress. Use Clear to cancel." with the read-only input. Keep input text readable and use a subtle surface/border change. Truly disabled buttons have reduced visual emphasis with readable labels/icons, no hover/pressed treatment, and native disabled behavior for pointer/keyboard activation. Explain unavailability through visible status text, not color or hover-only hints.
- Use one shared accessible live status region for progress and completion/error announcements; decorative indicators and per-button progress changes must not cause duplicate live announcements. Under reduced-motion preferences, replace rotation with a static indicator and retain all status text. Success, failure, timeout, and Clear end the current loading presentation immediately.
- Provide keyboard access and an announced instruction when candidates appear; do not move focus unexpectedly on an asynchronous response. If submitting a candidate removes/disables the focused candidate, move focus to the stable Clear button. Clear always returns focus to the input. Do not steal focus on success/error. Deleting a focused history action moves focus to the next row's equivalent action, then the previous row, or the input when no rows remain.

## UX / UI Requirements

Read the sources as a combined contract: MQ_Frontend pp.1-2 and MQ_Checklist define required information and actions; the user-provided Figma duplicate supplies the measurable visual reference, consistent with the embedded desktop/mobile examples on pp.3-4. The user confirmed combining city and country in one field; retain both search capabilities plus Search, Clear, and the detailed weather description. Sample locations, temperatures, dates, five history rows, and the typed text "Singa" are presentation examples, not initial data or a history limit.

### Design Provenance and Verified Access

- [Working Figma duplicate: Weather App (Copy)](https://www.figma.com/design/6Tpic5YuQTvZNG8qF9medS/Weather-App--Copy-?node-id=0-1). The user identifies this as a duplicate of the original design and authorizes its use in this project.
- [Original Figma link from MQ_Frontend](https://www.figma.com/file/4QjlaIXuvEEMUdvvBKjDZH/Weather-App?node-id=0%3A1&t=uTr6LSt1NTovAcSc-0). Preserve as source provenance; its earlier editor-access failure does not block use of the duplicate.
- [Original asset folder](https://drive.google.com/drive/folders/1lE9E0PQkjg9ynU7t7muJaa7lKztT9mQb). Use the already supplied local PNGs below.

On 2026-10-02, read-only Figma inspection successfully retrieved the `Prototype` page (`0:1`), actual child layers, bounds, fonts, fills, strokes, effects, and individual renders of all four frames. The design-access dependency is resolved. The earlier page-level design-context request reported no selected layer; use the concrete frame IDs below for subsequent context requests. This evidence establishes the duplicate's contents, not an independent layer-by-layer comparison against the inaccessible original file. Neither Figma file was edited.

| Verified frame | Node link | Reference viewport |
| --- | --- | --- |
| Desktop - Light | [1:2](https://www.figma.com/design/6Tpic5YuQTvZNG8qF9medS/Weather-App--Copy-?node-id=1-2) | 1440 x 900 |
| Desktop - Dark | [2:125](https://www.figma.com/design/6Tpic5YuQTvZNG8qF9medS/Weather-App--Copy-?node-id=2-125) | 1440 x 900 |
| Mobile - Light | [1:3](https://www.figma.com/design/6Tpic5YuQTvZNG8qF9medS/Weather-App--Copy-?node-id=1-3) | 393 x 852 |
| Mobile - Dark | [2:380](https://www.figma.com/design/6Tpic5YuQTvZNG8qF9medS/Weather-App--Copy-?node-id=2-380) | 393 x 852 |

### Measured Layout Baseline

The following values are Figma pixels, with positions relative to each frame's top-left, before the required adaptations below. They describe the reference, not a requirement to hardcode absolute page coordinates in CSS.

| Element | Desktop frames | Mobile frames |
| --- | --- | --- |
| Search strip | Starts at (370, 26); overall width 700. Input 620 x 60, radius 20; gap 20; Search 60 x 60, radius 20. | Starts at (18, 19); overall width 360. Input 310 x 40, radius 8; gap 10; Search 40 x 40, radius 8. |
| Main translucent panel | (370, 198), width 700, radius 40. Weather text starts at x=420; history inset is 40 per side. | (18, 198), width 360, radius 20; 18 left / 15 right frame gutters. Weather title at (44, 218); history inset is 20 per side. |
| Hero layout bounds (not PNG display bounds) | (730, 103), 300 x 300; begins 95 above the panel and ends 40 before its right edge. | (198, 130), 157 x 157; begins 68 above the panel and ends 23 before its right edge. |
| Hero render bounds including effects | Approximately (730, 94.33), 323.67 x 327.11. | Approximately (177.31, 110.21), 205.33 x 207.41. |
| Weather hierarchy | Title at y=244, temperature vector at (420, 280), high/low at y=371. Location, observation time, humidity, and condition share the y=399 row. | Temperature vector at (44, 245), high/low near y=307, location near y=328. Right-aligned condition, humidity, and observation time are stacked near y=280, 303, and 330. |
| History surface and title | Surface (410, 443), width 620, radius 24; title at (436, 466). | Surface (38, 361), width 320, radius 24; title at (58, 383). |
| History rows | First at (430, 510), 580 x 60, radius 16; subsequent starts are 78 apart (18 gap). Location left, timestamp and two actions right. | First at (55, 427), 290 x 60, radius 16; same 18 gap. Location and timestamp form two lines on the left; two actions stay on the right. |
| History actions | Visible circles 34 x 34 with 16 x 16 search/delete artwork, about 10 between circles. | Same visible circle/icon sizes. Light and dark frames have small horizontal placement differences; preserve a consistent usable action group in the responsive implementation. |

All four main panel rectangles are 1145 high and all four history rectangles are 548 high in the source; all four top-level frames clip overflow. These are drawing bounds, not a product scrolling contract. Use content-driven panel/history height and ordinary page scrolling so long history, errors, descriptions, and zoom never become inaccessible. Preserve the single nested panel composition; do not split it into unrelated dashboard tiles. Match the reference hierarchy and illustration overlap while allowing added controls and text to move later sections down.

### Measured Typography and Theme Surfaces

Live text layers use **Noto Sans Regular (400)** and **Bold (700)**. Desktop headings, values, and location labels are 16; weather location is bold; history timestamps are 14; the input label is 10. Mobile live headings and history locations are 14, history timestamps 10, input label 8, and typed input text 12. These small mobile sizes are source observations; readability adaptations below take precedence where needed.

The large `26°` is a VECTOR in all four frames: visible bounds 164 x 81 on desktop and 101 x 50 on mobile. Mobile weather metadata is also outlined. No exact source font size can be read from those vector nodes. Render live temperatures/metadata as real text, derive their scale visually alongside Noto Sans, and verify variable-length values; do not use outlined sample numerals or fabricated font-size claims.

| Surface / role | Light reference | Dark reference |
| --- | --- | --- |
| Main panel / history surface | White at 20% opacity | `#1A1A1A` at 30% opacity |
| Main panel edge / effect | 1px white at 50%; background blur radius 20 | No visible outline; background blur radius 20 |
| Input | White at 20% | `#1A1A1A` at 50% desktop, 40% mobile |
| Main Search button | `#6C40B5`, white magnifier | `#28124D`, white magnifier |
| Temperature / main text | Temperature `#6C40B5`; primary text black; weather metadata `#666666` | White temperature and primary/weather text |
| History row | White at 40% | `#1A1A1A` at 50% |
| History timestamp | Black | White at 50% |
| History action circles | White fill; shadow (0, 4), blur 12, black at 10%; muted icons | Transparent fill; 2px white outline at 40%; muted light icons |

These fills composite over the supplied theme background; they are not opaque sampled lavender colors. Verify actual text/icon contrast over the rendered composite, and raise contrast where necessary while preserving the theme hierarchy. Do not duplicate the cloud-background tint by applying the original raw-image opacity again to the already composed local background PNGs.

### Supplied Asset Mapping

The four local files were reopened and visually compared with the four Figma frame renders:

| Supplied file | Dimensions | Verified role / limit |
| --- | --- | --- |
| `assets/bg-light.png` | 2880 x 1800 | Light-theme purple cloud background. |
| `assets/bg-dark.png` | 2880 x 1800 | Dark-theme purple cloud background. |
| `assets/sun.png` | 648 x 655 | Combined sun/cloud/rain hero, matching the `Group 1` composition present in all four frames, including the sample condition "Clouds". Includes effects beyond the group's layout bounds; 300 / 157 are layout anchors, not limits on the complete PNG. |
| `assets/cloud.png` | 600 x 600 | Supplied alternative cloud/rain artwork; no separate use or condition mapping is shown in the four inspected frames. Preserve it; do not add a second illustration or invent a weather-to-image rule merely to use it. |

Preserve each image's natural aspect ratio and transparency. Position the hero using its layout anchor, but size and offset the PNG by its visible artwork and effect bounds. Do not contain the entire PNG within a 300 x 300 or 157 x 157 box: doing so reduces the desktop subject by approximately 8.4%. For the desktop reference, a proportional PNG display near 324 x 327.5 at (730, 94.33) is an initial calibration, consistent with the group's 2x PNG export setting and rounded export dimensions. These are reference coordinates, not fixed page positions after form adaptations.

For mobile, calibrate the subject independently: the cloud Union measures approximately 141.84 x 90.39 at (203.23, 150.55), versus 271.04 x 172.72 at (740, 142.28) on desktop. The mobile effect bounds are not a uniform 157/300 reduction of the desktop effect bounds. Scaling the supplied bitmap may therefore leave a glow difference; prioritize subject size/position, preserve the supplied asset, and record any residual difference with M3 visual evidence rather than stretching the image or claiming exact effect parity. Allow decorative effects beyond the layout anchor without clipping the artwork, obscuring controls, or causing horizontal page overflow.

Treat the reference hero as decorative artwork; actual condition and description text remain authoritative for every response. Use each local theme background with responsive crop/position settings verified against its desktop and mobile render; do not distort the 2880:1800 ratio. Figma uses different background crops between themes and viewports, so one unverified center crop is not sufficient evidence of fidelity. Do not redraw/recolor these files or substitute generic icons, emoji, or design screenshots. No remote download is needed for these four PNGs.

Search/delete glyphs are separate image/mask layers in Figma and are not included among the four supplied PNGs. Before their implementation, obtain the actual glyph assets from the duplicate (for example light history Search `2:51` and Delete `2:50`), preserve their intended geometry, and check the themed appearances. This is an implementation asset step, not an unresolved file-permission blocker.

### Required Adaptations and Display Acceptance

These adaptations are explicit engineering interpretations, not controls or states claimed to exist in the Figma file:

- Keep one combined "City, Country" input and the Search action in Figma's search strip, using its measured input/button treatment. Add associated syntax guidance and a visible Clear action; put Clear and the theme switch in a compact utility area associated with the form. Reflow the strip and utility area on mobile as needed, retaining usable targets and allowing form/panel spacing to grow without colliding with the hero. The label replaces the source's ambiguous "Country" label as an explicit adaptation.
- Keep the detailed weather description visible near the condition/metadata, allowing wrapping and extra height. Include Celsius and the observation/history timezone context without squeezing or removing data to reproduce sample bounds.
- Supply initial, loading, candidate-selection, validation/API-error, and "No Record" states using the same panel hierarchy and themed surfaces. The Figma frames show successful weather with five example rows; they do not define those interaction states. Preserve FR-01 through FR-07, cancellation, and persistence semantics.
- Render all values as accessible text. Use legible mobile labels, values, and timestamps instead of blindly retaining 8-10px sample text. Document any typography/contrast adjustment in PLAN with its visual verification.

- Semantic form, headings, list, labels, native buttons, meaningful accessible names for icon actions, visible keyboard focus, keyboard-complete operation, and status/error announcements.
- Decorative artwork does not obscure controls and is hidden from assistive technology when equivalent condition text exists.
- Aim for WCAG AA text contrast and usable touch targets of at least 44 CSS pixels. Source history circles are 34 and mobile Search is 40; retain their visual treatment inside larger non-overlapping hit areas, growing row/control spacing as needed.
- Compare both themes at the exact source viewports **1440 x 900 and 393 x 852**, then verify widths 320, 375, 390, 768, and 1280 CSS pixels and portrait/landscape where relevant. No horizontal overflow, truncated essential information, or inaccessible controls; support 200% zoom and ordinary page scrolling. No tablet frame or breakpoint is supplied: choose content-driven reflow and validate intermediate widths.
- Check Chromium, Firefox, and WebKit; mobile emulation supplements desktop checks. Report unexecuted environments rather than claiming coverage.

## UI Behavior Assumptions

These explicit assumptions satisfy the brief's request for a separate assumptions document: this specification is separate from both source PDFs. The final README must summarize these decisions and link here.

1. User-confirmed search decision: one combined input accepts a city alone or a city followed by a comma and an English country name/ISO alpha-2 code, as defined in the Combined Search Input Contract. City is required; country is an optional qualifier. This reconciles Figma's composition with city/country search functionality; it does not rely on the p.2 invalid-search image as proof of city-only success. No nationwide-average or country-capital lookup is introduced.
2. If geocoding yields multiple valid matches, present a compact location choice with available state/country; do not silently pick a different place. No weather/history record is committed until a candidate succeeds. A country mismatch is never treated as a valid fallback.
3. Start with a helpful empty weather panel and restored history, without automatically requesting geolocation or a default city. Reload restores history/theme, not a falsely fresh weather snapshot; a user can search again.
4. Each completed successful search, including replay, is a separate history event. Duplicates are allowed and distinguished by stable record IDs; no silent deduplication or arbitrary history cap. Same-time records retain deterministic insertion order.
5. Clear resets the current query/result while retaining history/theme, as confirmed in the Query Interaction and Loading Contract. Only active network/response processing locks input and search initiation; waiting for candidate selection does not. Delete affects history without canceling an active replay; a later replay success is a new event. Clear invalidates uncommitted work and never removes already committed history.
6. A new search clears stale weather and prior errors, then shows loading, selection, success, or failure. Canceling does not display an error. Use a finite request timeout; allow retry through Search or Search again, without automatic retry storms.
7. Weather observation and history timestamps have different meanings. Apply the Weather Field Contract for location-time display, explicit UTC fallback, unavailable observation time, and successful-history timestamps. Use consistent day-month-year and 12-hour time formatting inspired by the colored mockups.
8. Apply the Weather Field Contract for core-field failures, per-field degradation, observed high/low semantics, numeric validation, and complete versus degraded success. Degradation is an exception path, not permission to omit valid required information.
9. Both themes and automated tests were explicitly confirmed as delivery requirements on 2026-10-03. Deployment, public hosting, and submission to a recruiter are not implied by completing the assessment.

Items 1 and 9, the local browser-visible API-key boundary without a backend, and the detailed weather-field and query-interaction contracts were confirmed on 2026-10-03. Other assumptions remain documented implementation defaults. Approval to update these contracts does not unlock implementation; the overall gate remains pending.

## Data, Integration, Security, and Privacy

- Use asynchronous HTTPS requests to **OpenWeather**, as required; no alternative weather provider or static data in the normal product flow.
- Proposed integration: parse the combined query into city and optional country, normalize the country, perform direct geocoding, select an explicit match if needed, then request current weather by coordinates. Replay uses saved coordinates to retrieve fresh data for the same place.
- In-memory weather model includes validated resolved name/country/coordinates, current temperature/category, and explicit availability for min/max, description, humidity, observation timestamp, UTC offset, and icon data. Preserve valid raw values and degradation reasons under the Weather Field Contract; do not encode unavailable data as zero. Validate external responses and replay locations at the boundary.
- Versioned local history records contain a unique event ID, resolved city/country, optional state, coordinates, and successful-search timestamp. Do not persist API keys or full API payloads in history. Treat stored data as untrusted input and recover valid entries where practical.
- History is device/browser/origin-local. It is not account data or cross-device synchronization. Requests send the search location and API credential to OpenWeather; no analytics or additional third-party data service is required.
- User-confirmed boundary (2026-10-03): the local assessment SPA uses a reviewer-provided local environment key and no backend. Such a key is visible in browser code/network traffic; environment files do not make a frontend key secret. Do not commit credentials or include them in screenshots/logs. Confidential keys or public deployment would require renewed architectural alignment; a proxy is not included in this delivery.
- Use text rendering for provider/user strings, encoded query parameters, finite request timeouts, and cancellation/stale-result protection. Do not render provider error HTML.

## Quality and Submission Documentation

The evaluation criteria on MQ_Frontend p.1 are mandatory quality goals: complete features, readable naming and useful comments, web-standard HTML/CSS/browser APIs, reusable and extensible React components, compatibility across display resolutions, and appropriate UI/UX. Keep state and service logic understandable; avoid unnecessary frameworks, dead code, speculative layers, and unfinished functions.

The final English `README.md` must contain:

1. Project purpose, implemented features, and assessment/source references.
2. Runtime/package-manager prerequisites, clean-checkout installation, environment-file example, OpenWeather key setup, development startup, production build, and local production preview.
3. Exact lint, type-check, unit/component test, and browser-test commands, including browser setup and which tests use fixtures versus a real API key.
4. Clear usage instructions and examples for the single combined search input (`Johor`, `Johor, Malaysia`, `Johor, MY`), syntax/validation, Clear, replay, deletion, persistent history, and themes.
5. Assumptions above, units/timezones and UTC fallback, partial-data behavior, duplicate-history policy, the difference between Clear and Delete (including deletion during replay), read-only/loading interactions, storage limitations, and the client-visible credential trade-off.
6. Concise structure/architecture explanation, significant technology choices, asset provenance/attribution, and any genuine limitations or external blockers.

Verify the README by following it in a clean checkout or equivalent isolated clean installation after approval. It must be easy for a reviewer to run without guessing hidden prerequisites. Do not create a README now that falsely claims an application already exists.

## Source Coverage

| Source requirement | Specification coverage | Planned work |
| --- | --- | --- |
| Frontend p.1 React and all six evaluation criteria | Goal, Quality, UX, FR-01 through FR-07 | M0-M5 |
| Frontend p.1 assumptions separately documented | UI Behavior Assumptions; README summary | M4 |
| Frontend pp.1-2 city/country information, Search/Clear, errors, empty history | FR-01/02/03/04/06; user-confirmed combined input contract and UX | M1-M3 |
| Frontend p.2 requirements 1-4: information, AJAX/provider, history/replay/delete, invalid inputs | FR-01 through FR-06; Integration | M1-M2 |
| Frontend p.2 requirements 5-6: theme choice and optional switcher | FR-07, selected dual-theme enhancement | M3 |
| Frontend pp.3-4 desktop/mobile references and links | UX / UI Requirements | M3 |
| User follow-ups: original Figma reference, accessible duplicate, and local assets | Verified four-frame baseline, provenance, asset mapping, explicit adaptations, visual acceptance | M3 |
| Checklist p.1 complete assessment in React, not plain JS/another framework | Goal, Quality, Definition of Done | M0-M5 |
| Checklist p.1 city/country and clear invalid/API messages | FR-01/06 | M1 |
| Checklist p.1 four working buttons and every function tested | FR-01/03/04; final manual/button pass | M1-M2, M5 |
| Checklist p.1 history survives refresh | FR-05 | M2 |
| Checklist p.1 desktop/mobile, clean/readable/reusable components | UX, Quality | M0-M3, M5 |
| Checklist p.1 loading and edge cases | FR-06; Weather Field Contract; Query Interaction and Loading Contract; data validation | M1-M3, M5 |
| User-confirmed behavior refinements dated 2026-10-03 | Clear scope, full/degraded response acceptance, candidate invalidation, request ownership, loading/read-only/disabled feedback, replay deletion, and focus | M1-M5 |
| Checklist p.1 lint/type-check/build without errors; remove unused/unfinished code | Quality; Definition of Done | M0, M5 |
| Checklist p.1 README setup and assumptions; easy reviewer startup | Submission Documentation | M4-M5 |
| Checklist p.1 automated tests and light/dark if possible | Selected enhancements FR-07; acceptance verification | M1-M3, M5 |

## Out of Scope

Accounts, backend database, cross-device history, geolocation, maps, forecasts, favorites, analytics, paid weather products, public deployment, and sending the submission. A confidential-key proxy is an approval alternative, not silently included infrastructure.

## Definition of Done

This is the future product completion standard, not a statement of current completion:

- Explicit implementation approval has been recorded before M0.
- All approved requirements and selected enhancements work, including every button and refresh persistence. Complete-response field coverage, degraded-response behavior, candidate transitions, cancellation/commit races, and accessible loading/control feedback pass distinct checks.
- Lint, type-check, automated tests, browser acceptance tests, and production build pass with no known blocking defects. No meaningful check is suppressed to obtain green output.
- Actual running UI is inspected against the duplicate's four linked Figma frames at 1440 x 900 and 393 x 852 and the intermediate/edge widths above, plus both desktop/mobile PDF references. Verify asset slots, geometry, aspect ratios, and theme surfaces; record the required form/data/accessibility adaptations rather than claiming an unmodified pixel-identical mockup. All required data remains visible and accessible.
- A real OpenWeather success path and replay have been verified with an authorized key. Mocked tests alone do not prove the external integration.
- Unused code, dead imports, placeholder handlers, debug output, fake production data, and unfinished functions are removed.
- README setup is reproduced; both authoritative PDFs in `docs/requirements/` and `AAPDS.md` retain their SHA-256 baseline values; no credentials are committed.
- AAPDS Phase 4 rereads both full original PDFs and this SPEC, compares them to the actual product, reruns final checks, and resolves every blocking gap. PLAN records evidence and honest remaining limitations.
- If a required check cannot run (for example, no active API key), retain the affected milestone as incomplete and report the precise blocker. Do not declare DONE or submission-ready.
