# Today's Weather - Architecture and Execution Plan

Date: 2026-10-03 (Asia/Kuala_Lumpur).
Status: Planning baseline reviewed; search, themes/tests, local frontend credential boundary, and detailed field/error/loading/selection contracts confirmed. **Overall Pre-Implementation Approval Gate pending; implementation has not started.**

## Goal

Deliver the React weather assessment specified in [SPEC.md](SPEC.md), fully integrating both original PDFs, including responsive references, durable history, README/setup, and final submission verification. Follow [AAPDS.md](../AAPDS.md) through execution and final review only after its mandatory approval gate.

## Proposed Architecture - Not Yet Approved

Decisions confirmed on 2026-10-03: use one combined city/country search input, deliver automated tests and both themes with a switcher, and run locally with a reviewer-configured browser-visible OpenWeather key and no backend. The user also authorized the illustration documentation correction. SPEC defines the accepted city-only and comma-separated city/country forms. The subsequent review confirmed Clear scope, weather-field degradation, candidate transitions, request ownership, and accessible loading/control feedback for documentation updates. These planning decisions do not unlock M0; the overall implementation gate remains pending.

Use one client-rendered React single-page application built with Vite and TypeScript. The application has one page, no routing requirement, no accounts, and no shared database. React state owns the current search and weather; localStorage persists search history and theme. Native `fetch` provides asynchronous OpenWeather access.

Keep boundaries small and concrete:

- `SearchForm`: one input labeled "City, Country", associated syntax guidance, Search, Clear, validation, and loading presentation.
- `WeatherCard`: complete weather information and the supplied decorative hero artwork.
- `SearchHistory` / `HistoryItem`: location/time plus replay and deletion, visually nested below the weather summary within the shared translucent main panel.
- `ThemeToggle` and a compact candidate selector when geocoding is ambiguous.
- A weather hook/controller owns the request lifecycle and state transitions; a service module owns URLs, response checks, errors, and cancellation.
- A history hook/storage helper owns versioned persistence and corrupt/unavailable-storage handling. Pure helpers handle combined-query parsing, country normalization, and date/unit formatting.
- CSS variables and ordinary responsive CSS reproduce the user-provided Figma duplicate's four frames, using the measured baseline and explicit adaptations in SPEC plus the supplied root `assets/` images. No component framework, global state library, or general repository layer is justified.

Data flow: combined query -> parse city and optional country using SPEC's input contract -> validation/country resolution -> OpenWeather geocoding -> zero/one/multiple match handling -> current weather by coordinates -> checked weather model -> render and persist successful search event. Invalid syntax never issues a request. History replay -> current weather by saved coordinates -> render and append successful event, independent of current form text. History deletion -> state and persistent storage. Clear -> abort/invalidate request, reset the combined input/result, and focus the input while retaining history/theme.

Lifecycle states are idle, loading (geocoding or weather, through response processing), choosing a location, success (complete or degraded), and error. SPEC's Weather Field Contract and Query Interaction and Loading Contract own the detailed behavior and product copy.

- Validate core fields before success; represent auxiliary-field availability explicitly. Complete fixtures must prove every required field renders; degraded success is a separate exception path. Preserve validated query/replay identity, raw numeric values, and independent observation/history timestamps.
- One query identity owns the full geocoding/candidate/weather flow. Invalidate it synchronously on Clear, replacement query, or input edits while choosing; abort active work where applicable. Guard every asynchronous state/history update and cleanup after response processing, so an old completion cannot clear a new loading state. Lock candidate submission immediately, before rerender, to prevent duplicate requests and events.
- Input is read-only and Search/replay/candidate submission is disabled only during active network/response processing. Candidate waiting is editable and allows a replacement query/replay; input edits remove stale candidates without fetching. Clear, Delete, and theme remain usable throughout. Use a finite timeout (initial target: 15 seconds per network request); waiting for user selection has no request timeout. No automatic retries are needed.
- Keep the initiating action and selected location in request state, independent of a history row's lifetime. Delete does not cancel replay; its later success appends a new event, never restores the old ID. Clear prevents an uncommitted result but preserves already committed history.
- Render one initiating-action indicator, one shared accessible status region, readable read-only/disabled treatments, associated cancellation guidance, stable responsive loading space, and reduced-motion feedback. Preserve progress when a replay row is deleted. Follow SPEC's candidate/Clear/deletion focus rules without stealing focus on asynchronous completion.

### Figma Implementation Baseline

Working reference: [Weather App (Copy)](https://www.figma.com/design/6Tpic5YuQTvZNG8qF9medS/Weather-App--Copy-?node-id=0-1), supplied by the user on 2026-10-02 as a duplicate of the design linked in MQ_Frontend. Preserve the original URL in SPEC and the unchanged PDF as provenance. The duplicate is the project's accessible design reference; this documentation update does not authorize editing either Figma file or starting application implementation.

Read-only layer inspection and separate frame renders succeeded for `Desktop - Light` (`1:2`) and `Desktop - Dark` (`2:125`) at 1440 x 900, and `Mobile - Light` (`1:3`) and `Mobile - Dark` (`2:380`) at 393 x 852. The earlier file-access blocker is **resolved**. Use these concrete frame IDs when fetching implementation context, rather than treating page `0:1` as a selected screen. SPEC's UX section is the durable source for node links, dimensions, typography, fills, asset mapping, and acceptance; do not maintain a competing set of measurements here.

After approval, implement the UI with these constraints:

1. Keep the centered 700-wide desktop composition and the mobile composition around a 360-wide panel, with fluid gutters below the reference width. Use a shared panel containing the weather summary and nested history, with panel radii 40 desktop / 20 mobile, history radius 24, and row radius 16. Translate the source's manually positioned groups into normal flow/grid/flex layouts; reserve positioned overlap for decorative artwork.
2. Start from the observed Noto Sans 400/700 typography and theme surface values in SPEC. The temperature and mobile weather metadata are outlined vectors, so choose live text sizing by rendered comparison rather than treating vector height as font size. Provide the font reproducibly and verify its license/source at implementation; no font dependency or downloaded font has been added during planning.
3. Use `bg-light.png` / `bg-dark.png` for their corresponding backgrounds and `sun.png` for the common hero. Treat 300 x 300 desktop / 157 x 157 mobile as layout anchors, not containers that constrain the complete PNG. Apply SPEC's separate subject/effect measurements and proportional image offsets; allow the glow beyond the anchor. Calibrate mobile subject geometry independently and document any remaining bitmap-versus-Figma glow difference. Preserve the PNG's 648:655 ratio. Confirm responsive background cropping separately for each theme and viewport. Keep `cloud.png` unchanged and unassigned unless a later requirement establishes a use; the four frames show no condition-to-artwork mapping.
4. Retrieve the Figma search/delete glyph assets when implementing controls; they are image/mask layers absent from the four root PNGs. Use the actual reference assets and themed treatments, not substitute icons. Keep visible 34px history circles inside at least 44px non-overlapping interaction targets; adapt the 40px mobile Search target similarly.
5. Apply SPEC's explicit adaptations: one combined input labeled "City, Country" with syntax guidance and Search in the reference strip, visible Clear and theme controls in the form's utility area, wrapped description and timezone context, readable mobile text, and content-driven panel/history heights. Reserve space between the form and hero when controls or helper text wrap. The source's clipped 1145px panel height and five sample rows must not become a clipping rule or record limit.
6. Style initial/loading/error/selection/empty states consistently with the four successful-result references. Record the form, text, contrast, and hit-area adaptations with M3 evidence. These states and adjustments are engineering decisions required by the PDFs/accessibility, not additional mockups claimed to have been supplied.

Visual validation must compare the four actual source viewports first, then intermediate widths, long values, and 200% zoom. Design retrieval is complete; browser-rendered fidelity remains an M3/M5 verification task after implementation.

### Material Decision: API Credential Boundary

**Confirmed by the user on 2026-10-03 for this local frontend assessment:** browser-to-OpenWeather requests with a reviewer-provided key in `.env.local`, exposed through `VITE_OPENWEATHER_API_KEY`, with no backend. The key is visible to anyone using that built application. `.env.local` keeps it out of source control, not out of the browser. No key has been requested, read, stored, or used during planning.

This keeps reviewer startup simple and matches a frontend-only assessment. The user has accepted this assessment-local trade-off; overall implementation approval remains pending. Do not publish a build containing a private/shared credential or claim the key is confidential.

**Unselected alternative:** React SPA plus a small server-side weather proxy with a server-only key, bounded provider endpoints, input validation, and abuse controls. This protects the key from the browser but adds server startup, configuration, deployment, and testing. Revisit only if credential confidentiality or public hosting becomes a requirement, with renewed architectural alignment. No hosting platform is proposed or authorized now.

**Other meaningful alternatives:** a React full-stack framework can host that proxy but brings conventions and server machinery that this one-page assessment does not otherwise need; IndexedDB adds complexity without a demonstrated benefit over small local history records. Plain JavaScript without React and a different weather provider are not compliant alternatives.

## Technology Stack and Grounding

Research performed 2026-10-02. Only public documentation and package metadata were read; nothing was installed. These are compatibility-based recommendations, not executable installation guarantees. M0 will confirm exact compatible versions and record them in the manifest/lockfile.

| Technology | Proposed major | Grounding and reason |
| --- | --- | --- |
| React / React DOM | 19 | Explicit requirement. Context7 `/reactjs/react.dev` confirms Vite/TypeScript client-only setup; [official versions](https://react.dev/versions) confirms stable 19. |
| Node.js | 24 LTS | [Official release schedule](https://nodejs.org/en/about/previous-releases) lists 24 as LTS. It satisfies the checked Vite/Vitest/ESLint engine ranges. Use bundled npm and a package lock. |
| Vite / React plugin | 8 / 6 | Context7 `/vitejs/vite`, [Vite 8 announcement](https://vite.dev/blog/announcing-vite8), and registry engine/peer metadata confirm the proposed pairing and Node compatibility. |
| TypeScript | 6 | Stable 6 release exists; [release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html). Registry `latest` currently points to 7, but [typescript-eslint support](https://typescript-eslint.io/users/dependency-versions/) remains below 6.1. Deliberately select 6; do not blindly install latest or override peer checks. |
| ESLint / typescript-eslint / React hooks plugin | 10 / 8 / 7 | Published peer metadata supports ESLint 10, TypeScript 6, React hooks lint, and Node 24. Keep lint and type-check separate from bundling. |
| Vitest | 5 | Context7 `/vitest-dev/vitest` returned current 5 documentation despite the initial version-4 query. [Current migration guide](https://vitest.dev/guide/migration/) and registry confirm 5 is stable and compatible with Vite 8 and Node 24. |
| React Testing Library | 16 | Published peer metadata supports React 19. Use behavior-oriented component tests with a compatible DOM environment and user-event helpers; resolve exact supporting versions at M0. |
| Playwright Test | 1 | [Official setup](https://playwright.dev/docs/intro) documents real-browser testing and desktop/mobile emulation; published package supports Node 24. |
| Country normalization | i18n-iso-countries 7, English data only | Published package metadata checked; use a maintained ISO dataset for names/codes rather than a hand-written few-country map. Verify its documented name/alias behavior and bundle import at M1. |
| Browser APIs / CSS | Native fetch, AbortController, localStorage, responsive CSS | No HTTP client or styling framework needed. [MDN storage documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) confirms origin-local persistence and possible access failures. |

The release checks used the public npm registry's package manifests, including engines and peerDependencies, for React, Vite, the React plugin, TypeScript, ESLint, typescript-eslint, React hooks, Vitest, Playwright, Testing Library, and the country dataset. Exact patch versions belong in a lockfile after approval, not in a second inventory here.

### OpenWeather Contract Grounding

[Geocoding documentation](https://openweathermap.org/api/geocoding-api) specifies ISO country codes and up to five location matches. Normalize an English country name/code before the query, request candidates, enforce the requested country, and preserve selected coordinates for replay.

[Current weather documentation](https://openweathermap.org/api/current) supports coordinate requests with metric units and documents the deprecated built-in geocoder. The API provides condition, humidity, timestamps/UTC offset, and current temperature; min/max are optional observed values, not day forecasts. This drives the field semantics in SPEC. Read both endpoint contracts again if implementation behavior depends on changed documentation.

[Vite environment documentation](https://vite.dev/guide/env-and-mode) and Context7 confirm that prefixed environment values are client-exposed. This is the basis of the explicit credential trade-off above.

A live key, provider account access, CORS behavior from the actual running app, and quota entitlement have **not** been verified. They belong to the integration milestone and final smoke check. Do not claim that documentation inspection proves live integration.

## Repository Structure

Existing/present planning control surface:

```text
/
  AAPDS.md                    # unchanged protocol
  assets/                    # user-supplied bg-light, bg-dark, sun, cloud PNGs
  AGENTS.md                   # concise shared agent instructions
  CLAUDE.md                   # imports shared instructions
  docs/
    requirements/
      MQ_Frontend.pdf          # authoritative source; original content preserved
      MQ_Checklist.pdf         # authoritative source; original content preserved
    SPEC.md                   # scope, assumptions, acceptance, coverage
    PLAN.md                   # this plan and durable status
```

Proposed additions **only after approval**:

```text
  README.md
  package.json / package-lock.json
  index.html / vite.config.ts / tsconfig files / eslint config
  .env.example                # placeholder only; .env.local ignored
  src/
    main.tsx / App.tsx
    components/               # form, card, history, theme, candidate choice
    hooks/                    # request and history state where useful
    services/                 # OpenWeather boundary
    lib/                      # query parsing, country, storage, date/temperature helpers
    types/                    # only shared domain types that are needed
    styles/                  # responsive themes; import supplied root assets
    ...test files             # colocated behavior tests
  tests/e2e/                  # critical browser flows
  playwright.config.ts
```

Do not create empty speculative directories. No additional task/status/report hierarchy is needed. Ignored `tmp/pdfs/` contains visual reading aids and is not application code or a submission artifact.

## Milestones

All M0-M5 are **NOT STARTED** and remain gated by explicit approval.

| Milestone | Deliverables | Required validation / exit evidence |
| --- | --- | --- |
| M0 - Bootstrap | Record approval; React/TypeScript/Vite setup, stable compatible dependencies, npm lockfile, strict types, lint, test/browser configuration, placeholder env example, safe ignores, and verified scripts. | Clean install without forced peer overrides; initial lint/type-check/build pass; test/browser harness launches. Update AGENTS with real commands. |
| M1 - Search and weather | Single combined search input and syntax guidance, query parsing/country validation, maintained country mapping, geocoding and ambiguous-match choice, asynchronous weather lookup, full card data, loading/errors and accessible control states, Clear, query ownership/cancellation/timeout, and full/degraded field contracts. | Parsing/normalization and units/errors/response mapping tests; full-field and degraded/failure acceptance; candidate invalidation/double-submit and cancellation-during-processing checks; all three accepted query forms; invalid syntax issues no request; controlled UI success/failure; Clear resets/focuses the single input and prevents delayed repopulation; real OpenWeather search from browser when key available. No false success or stale overwrite. |
| M2 - Durable history | Successful search events, newest-first ordering, fresh replay by coordinates, exact deletion, hydration and persistence, empty state, corrupt/unavailable storage handling. | Search -> reload -> replay with a new API response -> delete -> reload; duplicate records; delete a replay source while pending, then verify new-event success versus no-event failure/cancellation; partial-data success and Clear before/after commit; last deletion; saved-data validation; storage write failure; unrelated state preserved. |
| M3 - Figma UI and themes | Use the verified duplicate/frame IDs and SPEC measurements; retrieve remaining glyph assets; implement the shared panel/history composition, Noto Sans typography, theme surfaces, local backgrounds/hero, and explicit form/data/accessibility adaptations. Implement light/dark switching and persistence. | Compare light/dark at 1440 x 900 and 393 x 852, then 320/375/390/768/1280 widths; verify asset aspect ratio and visible geometry, background crops, every required control/data field, long names, keyboard, non-overlapping 44px targets, contrast, zoom, page scrolling, loading without duplicate indicators/layout jumps, read-only/disabled feedback, keyboard focus, and reduced motion. Record justified deviations. Design access is resolved; actual UI validation is still required. |
| M4 - Reviewer documentation | English README with setup, commands, key configuration, assumptions, behavior, architecture, asset attribution, limitations; synchronize docs with actual behavior. | Follow README in clean checkout/equivalent clean install; confirm commands and links; ensure no secrets or undocumented prerequisite. |
| M5 - Final verification and AAPDS Phase 4 | Complete automated and manual suite; clean unused/unfinished code; re-read both PDFs/SPEC; actual-product comparison; fix gaps; update PLAN with evidence; prepare concise final handoff. | Every SPEC criterion and Checklist bullet checked, all buttons/functions exercised, final lint/type-check/tests/E2E/build pass, live provider smoke verified, production preview inspected, source hashes unchanged. Required unverified items keep milestone incomplete. |

Execute coherent increments with inspect -> implement -> verify -> repair -> inspect diff -> update PLAN -> checkpoint. Do not mark a milestone done while its required checks fail. Git checkpoints should be reviewable, without assuming one task equals one commit or introducing unrelated changes. Deployment and sending the submission remain outside this plan.

## Validation Strategy

Planned commands are contracts to implement at M0; they **do not exist yet** and have not been run:

| Purpose | Planned command |
| --- | --- |
| Reproduce dependencies | `npm ci` |
| Start development UI | `npm run dev` |
| Lint | `npm run lint` |
| Type-check | `npm run typecheck` |
| Unit/component tests, one run | `npm run test -- --run` |
| Browser setup | `npx playwright install` after local dependency installation |
| Browser/E2E tests | `npm run test:e2e` |
| Production build | `npm run build` |
| Inspect built app | `npm run preview` |

Use deterministic network fixtures for repeatable edge cases, supplemented by an authorized live-key smoke test. Never replace production weather with fixtures or imply fixture success proves the provider works.

| Area | Required scenarios |
| --- | --- |
| Input/location | One labeled input; `Johor`, `Johor, Malaysia`, `Johor, MY`; whitespace/country-case variants; multiword and non-ASCII cities; bare `Singapore` remains a city query. Reject empty input, `, MY`, `Johor,`, unknown countries, malformed suffixes, and unsupported state syntax without requests or silent country removal. Check supported country names containing commas using first-comma parsing. Enforce country qualification; verify no results and ambiguous-city selection. |
| Provider | Complete valid payload renders every required field. Independently exercise each unavailable auxiliary field and its exact fallback/partial notice; core identity/coordinates/temperature/category failure; validated geocoding/replay identity when the weather name is absent; no borrowing from an older card. Test zero values, wrong types/non-finite numbers, humidity outside 0-100, independent min/max absence, reversed raw range, and validation before rounding. Check location time, explicit UTC fallback, unformattable timestamps/conversions, and history time independence. Missing/unfamiliar icons preserve readable conditions and decorative art. Separately cover no results/404, 401/403, 429, 5xx, network/offline, timeout, and malformed JSON. |
| Candidate selection | Multiple matches issue no weather request/history until selection; selecting a non-first candidate uses its coordinates. Clear removes candidates; input edits invalidate them without fetching; a replacement query or replay rejects stale candidates. Same/different-candidate rapid clicks start only one weather request/event. Waiting for selection does not time out. Failed selection request preserves input and allows a new Search. |
| Async lifecycle | Immediate loading on form/replay requests; read-only input and disabled search initiation while network/response processing is active. Clear during geocoding, weather, and after response arrival but before processing/commit; replacement query after cancellation; stale candidate click/response rejected. Old success/error/cleanup cannot alter newer weather, errors, history, or loading. Current timeout/error releases controls; cancellation shows no error. Clear before commit adds no event; Clear after commit retains it. |
| Loading feedback | One indicator on the initiating Search or replay action while that action exists; main Search has no second indicator during replay. Deleting the source row removes its indicator, but shared phase/location text remains and needs no replacement spinner. Verify visible cancellation guidance, selectable/copyable read-only input, legible disabled controls with no hover/pressed response or pointer/keyboard activation, immediate feedback without layout jumps, and termination on success/error/timeout/Clear. |
| History | Complete/degraded successes each add one event; failures/cancellation add none. Duplicates have unique identity, descending order, refresh retains records/times, replay makes an API call, delete affects only selected ID and persists after reload, final row -> empty state. Delete an actively replayed source row: request/progress continues; success adds a new ID/time while the old ID remains deleted; failure/cancellation leaves it deleted without a new row. Clear preserves already committed records. |
| Storage | Existing records not erased during hydration; invalid JSON, wrong schema/version, invalid entries, denied storage, quota failure, preference corruption. Warn honestly and keep current-session behavior usable. |
| Presentation | Compare all four linked Figma frames at 1440 x 900 / 393 x 852, then widths 320, 375, 390, 768, 1280. Verify the shared translucent panel, typography hierarchy, hero layout anchors separately from subject/effect bounds, proportional assets, themed background crops, mobile row reflow, and documented control/data/accessibility adaptations. Exercise initial/loading/selection/error/empty/success states, long values, and history exceeding five rows with page scrolling. Check local nonempty asset files, callsites, visible geometry, and no overlap/overflow. |
| Accessibility/browser | Form labels and associated read-only guidance, keyboard Enter/Tab/Space, named actions, keyboard-complete candidate selection, focus to Clear when the submitted candidate disappears, input focus after Clear, and next/previous equivalent action or input after deletion. Async candidates/completion do not steal focus. One live status region announces progress/completion/errors without duplicate indicator announcements. Reduced-motion mode retains static feedback/text. Check readable contrast, zoom, and Chromium/Firefox/WebKit critical flows. |
| Reviewer delivery | README clean-start reproduction, source/code cleanup, environment example, ignored secrets, no unfinished functions, production preview works, preserved originals. |

Final manual button matrix: Search by click and Enter; Clear with text/error/result/in-flight request; Search again for first and non-first history records; Delete first/non-first/last and repeated-location rows; theme switch in both directions; candidate selection if multiple matches, including keyboard and rapid repeated clicks. Include Clear from candidate selection, read-only/disabled feedback during delayed requests, and deletion of an actively replayed row. Exercise those actions at desktop and mobile widths, then verify persistence with reload.

Store concise executed command results, browser coverage, visual evidence references, live API status, and any limitations in this PLAN at milestone boundaries. Do not fabricate command outputs or add ceremonial verification files. Mocked acceptance, manual observation, and live integration evidence must remain distinguishable.

## Important Decisions and Risks

| Decision / risk | Proposed disposition |
| --- | --- |
| Figma omits required controls/data and interaction states | Preserve city/country search via the confirmed combined input plus Search/Clear, detailed description, and timezone context using SPEC's adaptations; put Clear and theme controls near the form. Style missing states within the same composition. Record actual layout shifts instead of claiming the enhanced UI is an unmodified pixel-identical mockup. |
| Search input and country-only semantics | Confirmed on 2026-10-03: one input supports city-only and `City, Country` queries with English country names or ISO alpha-2 codes. SPEC owns parsing, validation, labeling, and examples. No country-only mode or arbitrary capital result; do not reject a valid city solely because its name also identifies a country. |
| Clear source requirement versus reset semantics | Checklist explicitly requires working Clear and the Frontend p.1 wireframe includes it. Full reset/cancellation while retaining history/theme is the user-confirmed project interpretation, not behavior inferred from Figma. No bulk-history-clear feature. |
| Missing data and loading/selection contracts | Confirmed on 2026-10-03. SPEC defines complete/degraded success, field validity and time fallback, candidate invalidation, read-only input, disabled feedback, single progress indication, and request ownership. Complete-response acceptance remains mandatory. Implement and validate in M1-M3/M5; document in M4. |
| Both themes/tests optional in sources | User confirmed both as required delivery scope on 2026-10-03; do not silently drop them. |
| Browser-visible key | User confirmed local execution, reviewer-configured key, accepted browser visibility, and no backend on 2026-10-03. Confidential keys/public deployment would require renewed alignment. |
| Provider credentials/access | No key used during planning. Ask for local environment configuration only when needed after approval; do not solicit posting a secret in chat. Missing valid key blocks live verification, not independent fixture-backed work. |
| Country ambiguities / deprecated lookup | Maintained country dataset, explicit candidates, non-deprecated geocoding, coordinate weather/replay. No silent wrong-country fallback. |
| Figma design access | Resolved on 2026-10-02 through the user-provided duplicate `6Tpic5YuQTvZNG8qF9medS`. Actual layers and four frame renders were read successfully. The original `4QjlaIXuvEEMUdvvBKjDZH` remains provenance with earlier missing editor access; original/duplicate layer identity has not been independently audited. |
| Source drawing artifacts and accessibility | Source uses outlined sample text, small mobile labels/timestamps, 34px history circles, 40px mobile Search, and clipped fixed-height rectangles. Use live text, legible sizes/contrast, larger non-overlapping hit areas, and natural content height; verify and document adaptations at M3. |
| User-supplied assets | Verified backgrounds and the common `sun.png` hero against all four renders; preserve the 648:655 hero ratio and inspect visible glow/cropping. `cloud.png` has no confirmed slot in these frames. Root PNGs stay unchanged. Search/delete glyph retrieval and font sourcing remain ordinary M3 implementation tasks; they were not added during planning. |
| History not globally durable | localStorage persists same-origin refresh; browser deletion/private mode/storage policy can limit it. Handle failures, document scope; no backend synchronization. |
| Runtime/tool execution | Initial restricted shell and Node-reader startup failed before reading files. Read-only shell/PDF tooling subsequently succeeded via the permitted execution path. This does not verify future app installs or browser execution; reassess at M0. |
| Toolchain compatibility drift | TypeScript 6 selected because the current typed linter excludes 7. Recheck exact peer versions during bootstrap; no force-installing incompatible dependencies. |
| Original documents contain personal/contact details | Preserve them as requested; do not publish the repository/PDFs or message listed contacts as part of this task. |

## Current Status and Pre-Implementation Audit

- Complete AAPDS v1.2.2 read: all sections 1-69.
- MQ_Frontend read: all four pages, both text and rendered visuals.
- MQ_Checklist read: entire scanned page by rendered visual inspection, including all checklist bullets and final submission instructions.
- Existing repository inspected: Greenfield; no application source/manifests/dependencies. Git working tree was clean at baseline; existing ignored inspection files were left intact. The user subsequently added the root assets directory; those files are user input and were not modified.
- Phase 1: English SPEC includes both sources, complete coverage mapping, behavior assumptions, measurable acceptance, responsive reference interpretation, README contract, and Definition of Done.
- Phase 2: architecture, compatibility research, alternatives, milestones, validation, blockers, and this review prepared.
- Figma reconciliation on 2026-10-02: inspected page `Prototype` (`0:1`) and all four concrete frame node trees/renders in the user-supplied duplicate. Confirmed frame sizes, panel/history geometry, Noto Sans text, outlined temperature/metadata, theme fills/effects, and supplied PNG roles. Replaced the obsolete design-access blocker and PDF-only UI interpretation in SPEC/PLAN with measured evidence and explicit adaptations. The current request covers these two planning documents only.
- Visual evidence: four separate frame PNGs were opened at their natural 1440 x 900 / 393 x 852 sizes and compared with Frontend pp.3-4; all PDF pages and all four supplied images were re-inspected. Local inspection copies are under ignored `tmp/pdfs/figma-desktop-light.png`, `figma-desktop-dark.png`, `figma-mobile-light.png`, and `figma-mobile-dark.png`; durable frame links and measurements are in SPEC. These are design references, not screenshots of a running application.
- Documentation validation for this reconciliation: compared both documents with their pre-edit snapshots; confirmed SPEC's functional requirements, behavior assumptions, data/security, submission documentation, and out-of-scope sections plus PLAN's technology/structure sections are unchanged. Checked English text, whitespace, frame IDs, and pending approval. Both PDF/protocol baseline hashes and all four PNG pre-edit hashes match. No application tests were run for this documentation-only update.
- Agent control: concise AGENTS and minimal CLAUDE created; no duplicate status system.
- Source preservation at initial planning: the recorded five SHA-256 checks covered the protocol, two root originals, and two byte-identical copies under `docs/requirements/`.
- Current source locations verified on 2026-10-02: the root PDF files are no longer present; the authoritative PDFs reside in `docs/requirements/`. Both PDFs and `AAPDS.md` were rechecked against the SPEC baselines, and all three hashes match. This documentation update reflects the current paths without changing source contents or implementation approval status.
- Product implementation: **NOT STARTED**. No framework generation, package installation, manifest/lockfile, product modules, or feature code.
- Application tests/build/lint/type-check: **NOT RUN**, correctly deferred until approval and implementation.
- Review follow-up on 2026-10-03: corrected hero layout-versus-render bounds and proportional bitmap alignment in SPEC and this PLAN, including separate mobile subject/glow verification. Recorded confirmed dual themes, automated tests, and local frontend credential boundary without a backend. The subsequent user confirmation resolved search presentation: updated both documents to one combined input, including syntax, label/helper, Clear/focus, responsive layout, README examples, and validation coverage. No supplied images, source PDFs, or application files were changed.
- Follow-up validation: re-read the edited geometry and decision sections; PDF/protocol hashes still match SPEC and all four PNG hashes match the review baseline. No application tests were run for these documentation-only changes.
- Behavior-contract update on 2026-10-03: the user authorized applying the reviewed Clear, field-degradation, candidate-selection, cancellation/commit, and loading/accessibility proposals to SPEC/PLAN. Added explicit normal versus degraded acceptance, time fallbacks, read-only/disabled states, single-action progress with shared status, replay deletion semantics, focus behavior, and corresponding M1-M5 verification. This review excludes design reinspection; existing Figma measurements, assets, architecture, and technology choices remain unchanged.
- Behavior-update validation: compared both documents with their pre-edit snapshots and reviewed the changed contracts and verification matrix. Confirmed existing design measurements, combined-input syntax, out-of-scope boundary, credential architecture, technology grounding, and repository structure are preserved. English prose, table/fence structure, whitespace, contract references, and the pending implementation gate passed documentation checks. Both PDFs and AAPDS match SPEC baselines; all four PNG hashes match the pre-edit snapshot. No application tests, installs, builds, or live API checks were run for this documentation-only change.
- Implementation approval: **PENDING**. Scope/credential and behavior-contract decisions above are confirmed, but no overall implementation approval or completed milestone is asserted.

## Pre-Implementation Review

1. **Project understanding:** Greenfield React assessment for a current-weather page, with desktop/mobile Figma-based design, supplied local images, and persistent search history.
2. **Major requirements:** city/country OpenWeather search; full weather details; Search, Clear, Search again, Delete; clear validation/API errors and loading; refresh persistence; responsive light/dark UI; reusable code; README; comprehensive final checks.
3. **Important assumptions and confirmed decisions:** one combined input supports a city alone or `City, Country`, with English country names/ISO alpha-2 codes; successful searches are separate history events; Clear resets the current query/result and preserves history; no automatic initial weather. Confirmed contracts distinguish complete/degraded success, network processing from candidate waiting, and deletion of an old event from cancellation of the active query. The combined input, dual themes, and automated tests are confirmed delivery scope. Local execution with a reviewer-configured browser-visible key and no backend is confirmed; deployment is out of scope.
4. **Recommended technology stack:** React 19, TypeScript 6, Vite 8 with React plugin 6, Node 24 LTS/npm, ESLint 10/typescript-eslint 8, Vitest 5/Testing Library, Playwright 1, native browser APIs and CSS.
5. **Architecture:** one SPA; focused React components, request service/hooks, localStorage, OpenWeather geocoding then coordinate-based current weather. The reviewer-configured browser-visible key and absence of a backend are confirmed; the overall implementation gate remains pending.
6. **Repository structure:** shared controls and user-supplied assets at root; SPEC/PLAN under docs and authoritative PDFs under docs/requirements; after approval add src components/hooks/services/helpers/styles, colocated tests, E2E tests, configuration, and README.
7. **Milestones:** M0 bootstrap; M1 weather/search; M2 persistent history; M3 responsive themes/accessibility; M4 reviewer documentation; M5 verification and AAPDS Final Review.
8. **Verification strategy:** unit/component checks for logic and failures; real-browser searches, all buttons, reload persistence and responsive states; both themes against Figma at 1440 x 900 / 393 x 852 plus intermediate widths; explicit adaptation review; complete-field/degraded acceptance, candidate/cancellation/commit races, loading/control feedback, keyboard focus, and reduced motion; lint/type-check/tests/build; real API smoke; clean README startup; original-requirement-vs-product review and hash checks.
9. **Documentation grounding:** Earlier planning used Context7 for React, Vite, and Vitest plus official sources/registry for compatibility and provider/browser contracts. The subsequent design and behavior-contract documentation revisions did not repeat or change those technology recommendations. All PDF pages, supplied PNGs, and the duplicate's four Figma frame renders/layers were inspected. UI geometry, fonts, and theme surfaces are now grounded in direct design evidence; live API behavior and actual application rendering remain unverified until implementation.
10. **Material alternatives:** add a server-side proxy if the key must be confidential or public hosting is required; a full-stack React framework adds machinery without other required server features. IndexedDB is unnecessary for the current small history scope.

**Implementation has not started. Please approve this plan or specify changes.**
