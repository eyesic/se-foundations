# Design: interactive-site

## Approach
Astro 5 static build rooted at the repo root, reading `modules/*/README.md` and
`solutions.md` as content collections; only code cells hydrate as React islands.
SQL runs on self-hosted DuckDB-WASM against the seven `datasets/*.csv` loaded
with the same `read_csv_auto` statements that produced `solutions.md`; Python
runs on self-hosted Pyodide. Fences are runnable by default only for `sql` and
`python`; opt-outs are HTML comments, invisible on GitHub. Deployed by GitHub
Actions to Pages. `modules/` stays the canonical source.

## Files
| path | action | purpose |
|---|---|---|
| `package.json`, `astro.config.mjs`, `.gitignore` | create / modify | Astro project at repo root; `site: https://eyesic.github.io`, `base: /se-foundations`, `srcDir: ./site/src`, `publicDir: ./site/public`, `outDir: ./dist`. Gitignore `node_modules/`, `dist/`, `site/public/datasets/`, `.astro/`, `test-results/` |
| `site/src/content.config.ts` | create | Collections `modules` and `solutions` via `glob` over `./modules` |
| `site/src/plugins/cells.mjs` | create | Rehype plugin: classify every fence, emit cell placeholders and exercise cells (rules in Interface) |
| `site/src/pages/index.astro`, `site/src/pages/[module]/index.astro`, `site/src/pages/[module]/solutions.astro` | create | Home (module table), module page, solutions page |
| `site/src/layouts/Page.astro`, `site/src/components/Nav.astro` | create | Shell; nav listing all 12 modules in folder order, `aria-current` on the active one |
| `site/src/components/CodeCell.tsx` | create | The one cell component: editor, controls, output/error regions, reveal panel, persistence |
| `site/src/lib/duckdb.ts`, `site/src/lib/pyodide.ts`, `site/src/lib/storage.ts` | create | Lazy runtime singletons; localStorage read/write |
| `site/src/components/Mermaid.tsx`, `site/src/styles/site.css` | create | Client-side render of `mermaid` fences; all styling in one stylesheet |
| `scripts/copy-datasets.mjs` | create | `prebuild`: copy `datasets/*.csv` to `site/public/datasets/` |
| `scripts/verify-sql.mjs`, `scripts/verify-content.mjs` | create | Test harnesses (see Test plan) |
| `tests/site.spec.ts`, `playwright.config.ts` | create | Browser tests for cell behavior |
| `.github/workflows/pages.yml` | create | Build and deploy to Pages on push to `main` and `workflow_dispatch` |
| `modules/*/README.md`, root `README.md` | modify | T4 only: instruction rewrite plus opt-out comments. No other file under `modules/` changes |

## Decisions
| # | Decision | Why | Depends on |
|---|---|---|---|
| 1 | Astro static at the repo root, React islands for cells only | Markdown-native, ships zero JS on prose; rooted at the repo root so the `modules/` collection needs no path escape from `srcDir` | — |
| 2 | DuckDB-WASM, non-threaded (`mvp`/`eh`) bundle, served from the site's own origin | GitHub Pages cannot set the COOP/COEP headers the threaded bundle needs; self-hosting also removes a third-party CDN from the runtime path | 1 |
| 3 | Tables created with the seven `CREATE TABLE ... read_csv_auto(...)` statements copied verbatim from `datasets/README.md:223-229` | Same engine and same type inference that produced the outputs in `solutions.md`, so AC2.2 is a property of the loader rather than luck | 2 |
| 4 | Ship the seven CSVs unchanged (2.1 MB total); no Parquet, no prebuilt `.duckdb` | Well under any Pages limit even before gzip, and the browser data stays byte-identical to the repo's source of truth | 3 |
| 5 | Pyodide self-hosted, no micropip; the seven CSVs preloaded into its virtual FS at both `/` and `/datasets/` | Makes the CSV-reading exercises run as written; `requests`/`duckdb`/file-write fences are marked local instead | 1 |
| 6 | Fence opt-outs are HTML comments, not info-string suffixes | Comments render as nothing on GitHub, so module source keeps its current GitHub rendering exactly (AC1.2) | — |
| 7 | `<textarea>` editor, no CodeMirror | Nothing in the PRD requires highlighted editing; one less dependency and one less mobile failure mode (AC1.5) | — |

## Interface

### Markdown conventions (T4 applies these; the plugin reads them)
- Default: a `sql` or `python` fence under `## Concepts` or `## Walkthrough` becomes a runnable cell seeded with the fence text verbatim. Every other language stays static.
- `<!-- static -->` on the line before a fence: render static, no Run control. For fragments that cannot execute standalone (`for row in reader:`, `plans[0] # "Free"`).
- `<!-- local: needs a live API and writes a file -->` before a fence: static, plus a "Run this locally" badge showing the reason text. Required for every fence that imports `requests` or `duckdb`, or opens a file for writing.
- `<!-- cells -->` anywhere in an `## Exercises` section: that module's numbered exercises get empty cells. Modules without it get none, which keeps module 11's interview-answer SQL out of scope.
- `<!-- local-exercises: 2,3,8 -->` in the same section: those numbers get the local badge and no cell.

### Cell derivation
- Exercise N's language is the language of the first fence in the matching `solutions.md` section, where matching means the first heading at any level whose text matches `^(Exercise\s+)?N[.:]`, searched from an `## Exercises` heading if the file has one, otherwise from the top. Anything other than `sql` or `python` gives no cell.
- Reveal-solution content is that section's body, rendered into the page at build time.
- Cell id is `<sectionSlug>-<ordinal within section>`; exercise cells are `exercise-<N>`.

### CodeCell contract
- Idle: editor (seeded or empty), `Run`, `Reset`, and for exercises `Show solution`. Ctrl+Enter runs.
- Running: controls disabled, status line; on first use of a runtime, "Loading the SQL engine…" or "Loading Python…".
- SQL success: an HTML table of the result, first 100 rows, footer "showing 100 of N rows" when truncated; zero rows renders "0 rows".
- Python success: stdout region only; empty stdout renders "No output. Use print() to show a value."
- Error: a separate, visibly distinct region holding the DuckDB error message or the Python traceback, never mixed with stdout (AC2.4).
- `Reset` restores the seeded text and clears output; on an exercise cell it clears to empty.
- All output is written as text, never as HTML.

### Storage
- Key `se-foundations:v1:<moduleSlug>`, value `{"cells":{"<cellId>":{"code":"…","revealed":true}},"updatedAt":"<ISO>"}`.
- Written on edit (debounced 500 ms) and on reveal; read on mount. Absent or unparseable value falls back to the seeded default with no error shown. Stale ids from an edited module are ignored.
- Every module page footer states that this is browser-only convenience, is lost when storage is cleared or the browser changes, and does not replace ticking and committing `progress.md` (AC3.4, AC3.5).

### Deploy
- `pages.yml`: `on: push: branches: [main]` plus `workflow_dispatch`; `permissions: contents: read, pages: write, id-token: write`; `concurrency: group: pages`; steps checkout, setup-node 20 with npm cache, `npm ci`, `npm run build`, `upload-pages-artifact` with `dist`, `deploy-pages`. The maintainer sets the Pages source to "GitHub Actions" once, by hand.

## Reuse
- `datasets/README.md:223-229` — the seven load statements the browser loader copies verbatim.
- `datasets/*.csv` — the only data source; `generate.py` and the CSVs stay untouched.
- `modules/*/solutions.md` — the reveal-solution source; the "solutions in a separate file" rule from `.agent-workflow/design/se-foundations-curriculum.md` still holds.
- `.agent-workflow/lessons/se-foundations-review.md` — the SQL-output comparison method (67/67) that `verify-sql.mjs` reimplements, and the vendor-key-prefix grep before publishing.

## Test plan
| AC | Test | File |
|---|---|---|
| AC1.1, AC1.2 | Parse every fence from source markdown and every `<pre>`/cell editor from the built HTML; assert the text sets are identical per page | `scripts/verify-content.mjs` |
| AC1.3 | Built HTML of every module page has 12 nav links in folder order with exactly one `aria-current` | `tests/site.spec.ts` |
| AC1.5 | At 375px width no element exceeds the viewport and the Run control is reachable | `tests/site.spec.ts` |
| AC2.1, AC2.5 | Every unmarked `sql`/`python` fence in Concepts/Walkthrough renders a Run control; every `bash`/`powershell`/`json`/`text`/`mermaid`/`markdown` fence renders none | `tests/site.spec.ts` |
| AC2.2 | For each `sql` fence in `modules/**` with an adjacent `text` output block, run it through DuckDB-WASM's Node bundle using the site's own loader and compare every numeric token against the claimed output; all must match | `scripts/verify-sql.mjs` |
| AC2.3, AC2.4 | Run a Python cell that prints, then one that raises: the print lands in the stdout region, the traceback in the error region, and they are different elements | `tests/site.spec.ts` |
| AC3.1, AC3.2 | Module 03 exercise 1 renders an empty cell; Show solution reveals the text of solutions.md section 1 | `tests/site.spec.ts` |
| AC3.3 | Type into a cell, reveal a solution, reload: both restored from localStorage | `tests/site.spec.ts` |
| AC1.4 | Manual: `npm run build && npm run preview`, then one `workflow_dispatch` run after merge to main | — |
| T4 | `git diff main -- modules/` shows only rewritten instruction prose and marker comments; `grep -rn "ghp_\|AKIA\|sk-\|xox[baprs]-\|AIza" modules README.md` returns nothing | — |

## Build tickets
- **Ticket A (T1+T2+T3)** owns `package.json`, `astro.config.mjs`, `.gitignore`, `site/**`, `scripts/**`, `tests/**`, `playwright.config.ts`, `.github/workflows/pages.yml`. Order: scaffold, collections and nav; then the rehype plugin and static rendering; then `CodeCell` plus DuckDB; then Pyodide; then exercise cells and storage; then the workflow. Every marker is optional so the site builds before Ticket B lands.
- **Ticket B (T4)** owns `modules/*/README.md` and root `README.md`, nothing else. Applies the marker conventions above and the AC4.1-AC4.4 rewrites. Runs in parallel with A; no shared file.

## Security checklist
- Data access: N/A — no server, no database, no tables; DuckDB-WASM runs in the learner's own tab over public CSVs already in the repo.
- Secrets: PASS — no keys anywhere in the site; both runtimes are served from the site's own origin rather than a third-party CDN, and the vendor-key-prefix grep is in the test plan.
- AI surfaces: PASS — no model in the product; learner-typed code reaches only the in-tab WASM sandboxes and is stored only in same-origin localStorage.
- Boundaries: PASS — no endpoints and no authorization; cell output and error text are written as text, never as HTML, so a query result cannot inject markup.
