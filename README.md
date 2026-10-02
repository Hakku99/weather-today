# Today's Weather

A React frontend assessment for current-weather search and local search history.

**Current status: M0 bootstrap complete.** The React entry, development/build tooling, strict type checks, lint, and DOM/browser test harnesses are present and verified. Weather search, history, and the Figma UI are planned in M1-M3 and are not implemented yet. See [the plan](docs/PLAN.md) for executed validation and milestone status.

## Local setup

Use Node.js 24 LTS (24.15.0 or newer within major 24) and npm 10 or newer. Development was checked with Node 24.16.0 and npm 10.9.2. The minimum patch follows the installed DOM test environment's engine requirement. `.nvmrc` selects the Node 24 major; exact dependencies are committed in `package-lock.json`.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite (normally `http://127.0.0.1:5173`). The server binds to loopback. The M0 entry needs no API key and makes no weather requests.

For the later weather integration, copy `.env.example` to `.env.local`, set your own `VITE_OPENWEATHER_API_KEY`, and restart the development server. `.env.local` is ignored by Git. This client-only assessment exposes that key in the browser; the environment file does not make it confidential. No backend, public deployment, or shared credential is included.

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

Playwright starts and stops its own local server on port 4173. Keep that port free. Projects cover desktop Chromium, Firefox, WebKit, and mobile Chromium/WebKit emulation. Tests currently verify bootstrap execution, not weather functionality or final visual fidelity. Reports go to ignored `playwright-report/`; failure evidence goes to ignored `test-results/`.

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

The final application will use the approved combined city/country input, OpenWeather, browser-local history, and both Figma themes. Their detailed assumptions live in SPEC; this bootstrap does not claim those features are complete.
