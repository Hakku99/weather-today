# Repository Instructions

- Follow `AAPDS.md`. Product authority: `docs/requirements/MQ_Frontend.pdf` and `docs/requirements/MQ_Checklist.pdf`, preserving the original content and SHA-256 baselines recorded in SPEC.
- Read `docs/SPEC.md` for behavior and acceptance, and `docs/PLAN.md` for architecture, milestones, decisions, and current status. Inspect Git state before changing files.
- This is Greenfield. **Pre-Implementation Approval Gate was approved on 2026-10-03**, recorded in PLAN. Proceed with the approved milestones; seek renewed alignment only for material scope/architecture changes or genuine external blockers.
- All repository artifacts, product copy, and documentation are English; communicate with the user in Chinese.
- Approved architecture is React + TypeScript + Vite, local browser history, and OpenWeather. Do not silently replace React/provider, drop required controls, or add a backend/deployment.
- UI must follow the Figma link in MQ_Frontend and use existing root `assets/` PNGs. Do not redraw/substitute those images. Read SPEC's asset inventory and PLAN's Figma access dependency before detailed UI work; verify actual design context and rendered asset geometry.
- Preserve all original requirements and protocol content. Do not overwrite user changes. Keep planning/status in SPEC and PLAN rather than extra process files.
- Use Node 24.15+ within major 24 and npm 10+. Commands: `npm ci`, `npm run dev`, `npm run check` (lint, type-check, DOM tests, build), `npm run test:e2e:install`, `npm run test:e2e`, and `npm run preview`. Browser scripts share ignored project-local `.cache/playwright/`; do not bypass them with a different browser cache. Keep E2E port 4173 free. PLAN records executed evidence and remaining milestones.
- Use Context7 for current/version-sensitive external APIs; confirm release/security/compatibility facts against official documentation or package metadata. Avoid preview releases and unjustified dependencies.
- Verify important behavior with meaningful tests and the real browser, including history refresh/deletion, request failures/cancellation, every button, desktop/mobile, and themes. Do not treat mocked tests as live API proof.
- Keep credentials out of Git, logs, and screenshots. A frontend environment key is browser-visible; change to a confidential-key proxy only with architectural alignment.
- After approval, proceed milestone by milestone, validate, repair failures, and update PLAN at meaningful boundaries. Re-read both PDFs and compare the finished product before declaring DONE. Record blockers rather than weakening checks.
