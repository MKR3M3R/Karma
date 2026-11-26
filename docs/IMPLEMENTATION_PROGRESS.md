# Karma — Implementation Progress

Last updated: 2026-11-26 (America/Sao_Paulo)

## Repository baseline

- Repository: `MKR3M3R/Karma`
- Base branch: `main`
- Baseline commit inspected: `dbb2abd764e9333a8e6f952549e0cbf38380539c` (merge PR #10, "Programme export (JSON, CSV) and CSV column matching")
- Working branch: `codex/karma-audit-visual-validation`
- Initial workspace had no checkout or attached worktree. Created a shallow, sparse local checkout under `work/karma-checkout` from GitHub. Working tree clean at branch creation.
- Remote branch `codex/environment-check-2026-11-26` points to the same baseline commit as `main`.
- GitHub audit found PRs #1–#10, all merged to main. The observed remote branches include `feat/dashboard`, `feat/goals`, `feat/mobility`, `feat/nutrition`, `feat/onboarding`, `feat/program-io`, `feat/programme-file-import`, `fix/wrapped-copy-karma`, `rename-karma`, and the environment-check branch.

## Evidence and corrections to prior status

- PR descriptions #1–#10 are the available work history and indicate the ongoing modules (nutrition, mobility, goals, onboarding, dashboard, programme import/export) were merged.
- PR #10 says a full frontend run had one failure, fixed and followed by a targeted rerun (70 tests), but the full suite was not rerun afterward. It also says no browser validation was performed.
- PR #8 records 1,084 API tests with 0 failures, but 3 were “not counted as pass” and unexplained. Other PR descriptions reference historical pass counts, not current verification.
- Thus, the user-supplied earlier summary of all checks green is not independently supported by the current PR records; current tests will be run as the work reaches each relevant stage.

## Stage log

| Stage | Status | Evidence / next action |
|---|---|---|
| Audit checkout, branch, history, PRs | Inspected | Baseline SHA and PR status recorded above. |
| Resume real-browser validation | Blocked | API and Vite were started; the browser-control gate denied access to `http://localhost:8080` after the user declined the origin request. No browser workaround was used. A user-authorized browser session/origin grant is needed. |
| UI fixes, purple theme, pt-BR default | Implemented in source; partly verified | New profiles now start with violet and pt-BR; saved accents/languages remain. Deterministic PWA/alternate icons were regenerated and `app-icons.mjs --check` passed. Main native launcher assets still need the Capacitor generator. |
| External nutrition search | Implemented; provider verification partial | Added USDA and Open Food Facts search, barcode lookup, meal-direct selection, library prefill, provenance, cache, rate limits, and manual/offline fallback. Unit/API tests pass. A live Open Food Facts request returned HTTP 503; no USDA key is configured. |
| Regression/platform compatibility | In progress | Focused API tests: 9/9 pass. Focused frontend domain/UI tests: 71/71 pass. Full frontend run: 1,269 passed, 10 failed, 860 suites could not start because Vitest hit `ENOSPC` while writing transform cache. Full API suite had existing Windows permission-mode failures; rerun is pending when resources allow. |
| Builds, signing, distribution | Inspected; not built here | Existing Android variants, Wear OS, iOS/Watch targets, CI workflows and release scripts are present. No current-branch Android/iOS signed distribution build or install was executed. The Windows host has no Xcode environment. |
| Final report and PR | Not started | Current changes are uncommitted on the feature branch. Complete native icon generation, remaining checks, review and PR after resolving blockers. |

## Work log

### 2026-11-26 — Initial repository audit

- Inspected GitHub repository metadata, `main`, remote branches, recent commits and PRs #1–#10.
- Confirmed `main` is unprotected in the repository metadata; nevertheless no work will be made directly on it.
- Created local branch `codex/karma-audit-visual-validation` at the latest main commit.
- No application files changed yet. No tests run yet.
- Blocker cleared: the initial task checkout was empty; official Codex-bundled Git/Node/pnpm were located and used to create the local checkout. No external tool installation required.
- Next action: inspect package scripts/runtime, install dependencies as needed, start the real app, and validate the current UI in Edge.

### 2026-11-26 — Validation attempt and visual gate

- Started the API and Vite app from this checkout. Microsoft Edge automation was not approved, and the in-app browser origin request for `http://localhost:8080` was declined. The browser activity was closed without using alternate browser/CDP paths. No real-browser flow has been observed, so visual validation remains blocked.
- Frontend focused suites (nutrition math, UI, color migration and language/state): 71 passed, 0 failed.
- Full frontend run, one worker: 1,269 passed; 10 failed; 860 of 911 test files failed to load/transform. The captured errors report `ENOSPC: no space left on device, write` while Vitest transformed modules. The failed tests also report ENOSPC, so this is not classified as a code regression.
- Latest frontend production build completed after the final nutrition UI edits (689 modules transformed). It emitted existing chunk-size and ineffective-dynamic-import warnings. The app compiles; warnings remain as observations.
- Frontend `pnpm test` cannot run its full script because it calls `npm run check:native-localizations`, and npm is not installed. The localization checker was invoked directly and passed.
- Native localization checker passed: `Native localization resources cover English fallback and Italian.`
- API syntax checks passed. Focused API tests passed 9/9, including food-data normalization, missing nutrient rejection, provider fallback, barcode routing and `/api/config` pt-BR default. The full API suite was attempted earlier and exited nonzero on Windows permission-mode assertions; the precise run was not cleanly summarized, so no full-suite pass is claimed.
- A single live Open Food Facts search returned HTTP 503 (service response was its temporary-unavailable page). The UI/API partial-results path reports source unavailability. USDA remains unverified because no `USDA_API_KEY` was supplied.

### 2026-11-26 — API packaging and contract follow-up

- Added `food-search.js` to `api/Dockerfile`'s root-module copy list so the new route can boot in the production image.
- Documented `GET /api/nutrition/foods/search` in `api/openapi.yaml`, including provider availability, partial results, barcode/name query and per-100 g macros. Updated the config docs to reflect the pt-BR default when `DEFAULT_LANG` is unset.
- Focused API run: 12 passed, 4 failed across the selected files. Food lookup (4/4), config (5/5), route/OpenAPI parity and the root Dockerfile module list passed. Remaining failures are checkout/platform or baseline checks: sparse checkout omissions (`website/`), API Docker test's assertion that traversal reaches `oidc/config.js` and `coach/jobs.js` despite both being present, and the existing OpenAPI password error-code assertion. Full suite had earlier Windows filesystem/permission and sparse-checkout failures; no full API pass is claimed.
- `git diff --check` completed without whitespace errors. Frontend focused 71/71 and production build passed as recorded above; full frontend suite remains unverified due ENOSPC.
- Follow-up regression found and fixed during final review: cached Open Food Facts data no longer displaces a concurrent USDA response. New regression test covers the cache hit; all 5 food-search API tests pass. The combined focused API selection now reports 15 passed / 2 failed; the two failures are the Docker traversal assertion despite present modules and the preexisting password signup error-code spec assertion.
- Browser visual validation remains blocked because the requested local origin/browser automation was denied. No workaround was used. Native default Android/iOS launcher icon generation remains blocked by insufficient C: space, so generated PWA/default web icon and alternate variant assets do not establish native launcher completion.
- No native app build, signing, installation, runtime validation, or publication was performed. Existing IDs and signing settings remain intact. No commit or PR yet.

### 2026-11-26 — Defaults, nutrition lookup and icon source

- Changed new profile accent to violet while retaining legacy green defaults and saved choices. Changed first-install language to pt-BR in boot UI, fresh profile state, auto-language logic and public API config; `DEFAULT_LANG` can still override an instance default. Updated focused regression tests.
- Changed the base icon glyph to purple and default variant palette; regenerated the deterministic PWA and alternate Android/iOS icon resources with `node scripts/app-icons.mjs`. `node scripts/app-icons.mjs --check` reports `app icons up to date`.
- Added `GET /api/nutrition/foods/search`, with server-only USDA key usage, public OFF text/barcode lookup, 8/minute per-client limit, OFF global spacing/cache, and a 900/hour in-process USDA budget. Added normalization and API tests. The UI searches on submit (not every keystroke), adds results to a meal directly, or prefills the editable personal-food form. Provenance/barcodes are persisted with food and meal records; absent fiber is explicitly shown as unavailable. Local food search/manual entry remains available offline.
- Added `docs/NUTRITION-FOOD-SEARCH.md` with setup, provider attribution/licensing, rate-limit and fallback notes; added optional `USDA_API_KEY` to `.env.example` without a value.
- Official `@capacitor/assets@3.0.5` generation was attempted twice. First attempt skipped Sharp install scripts; second allowed them, but Sharp could not copy libvips due to `ENOSPC`, and fallback native compilation had no Python. This left the official Android/iOS default launcher assets unchanged. The full frontend suite later also hit ENOSPC, so further builds/tests need additional C: free space; Python may be needed only if Sharp's prebuilt install cannot complete after space is available.
- No identifiers, signing keys, package IDs, certificates, or release settings were changed.

## Current working tree

- Branch: `codex/karma-audit-visual-validation` (base `dbb2abd764e9333a8e6f952549e0cbf38380539c`).
- Modified: `.env.example`, `api/server.js`, `api/test/server-config-session.test.js`, frontend default language/accent code and tests, nutrition UI/data/tests, icon source/generator and generated PWA/alternate assets.
- Added: `api/food-search.js`, `api/test/food-search.test.js`, `docs/NUTRITION-FOOD-SEARCH.md`, this progress file.
- Commit: `Add nutrition search and violet pt-BR defaults`. The matching remote branch commit was created through the authenticated GitHub API because native HTTPS push did not complete in this environment; its tree was verified identical to the local commit tree after using Git-normalized blobs.
- Draft PR: [#11](https://github.com/MKR3M3R/Karma/pull/11), targeting `main`, not merged. The remote compare reports one commit, 29 files, 489 additions and 103 deletions.
- GitHub Actions on the checked PR head: `gate` and `changes` succeeded; simulator, device archive and UI test jobs were skipped by workflow conditions. CLA check failed because the contributor must sign, and the workflow reports that its configured `cla-signatures` branch is missing. This needs a human CLA signature and repository maintainer setup; no signature was made on the contributor's behalf.
- Immediate next action: continue the visual/native/platform validation when the browser gate and disk-space constraints permit; keep PR #11 draft until those gates are resolved or accurately waived by project maintainers.
