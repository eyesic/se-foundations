# Lessons: interactive-site review

Reviewer pass over `feat/interactive-site` (39f3277, fcd9d12), 2026-09-08.
Verdict: **CHANGES REQUESTED**. All four test commands pass; the suite does not
cover the thing that is broken.

Tests re-run by the reviewer after a clean `npm ci`:

```
npm run build        -> 25 page(s) built
npm run test:content -> verify-content: 24 pages, 355 source fences, 85 cell seeds checked
npm run test:sql     -> verify-sql: 74/74 SQL blocks match their stated output
npm run test:e2e     -> 9 passed
```

---

## 1. Pyodide's cwd is not the filesystem root (blocking)

- **What broke.** `site/src/lib/pyodide.ts:48-49` writes the seven CSVs to the
  absolute paths `/datasets/x.csv` and `/x.csv`. Pyodide's working directory is
  `/home/pyodide`, so `open("customers.csv")` and `open("datasets/x.csv")` —
  the exact forms the curriculum uses — both raise
  `FileNotFoundError: [Errno 44]`. Only absolute paths resolve.
- **Blast radius.** `modules/07-python-for-ses/README.md:195-196` promises the
  fence at :199-204 "works there as written"; it does not.
  README.md:495-497 promises exercises 1, 4, 5, 7 run in the browser; 4, 5 and
  7 all read CSVs by relative path. The revealed solutions for those exercises
  (`solutions.md:94`, `:267`) use `Path(__file__).parents[2]`, and `__file__`
  is undefined under `pyodide.runPython`, so the answer the cell reveals cannot
  run in the cell that revealed it.
- **How detected.** Not from the diff. A scratch harness booted the repo's own
  pinned Pyodide and printed `os.getcwd()` (`/home/pyodide`), then a Playwright
  script drove the real `astro preview` build, clicked Run on the actual cell,
  and read the error region. The Node harness and the browser agreed.
- **Required fix.** `pyodide.FS.chdir('/')` after the writes, or write into
  `/home/pyodide/` and `/home/pyodide/datasets/`, plus a Playwright test that
  runs a CSV-reading cell and asserts rows with an empty error region.
  Alternative: move exercises 4, 5, 7 to `local-exercises` and delete the
  browser-CSV promises.
- **Criterion.** PRD AC4.3 ("scopes module 07's runnable browser cells to the
  file-free exercises") and AC2.3.
- **Carry forward.** A WASM runtime's cwd is not its FS root. Any design that
  says "preload files at path X" must name absolute-vs-relative and be proven
  by executing the literal snippet from the docs, not by asserting the file was
  written.

## 2. The comment that hid the bug

- **What broke.** `site/src/lib/pyodide.ts:37-38` reads "The seven CSVs land at
  both `datasets/x.csv` and `x.csv`". They land at `/datasets/x.csv` and
  `/x.csv`. The leading slash is the whole defect, and the comment asserts the
  relative form the code does not produce.
- **How detected.** Reading the comment against the runtime probe, not against
  the line below it.
- **Required fix.** State absolute paths, or make the code match the comment.
- **Criterion.** Design decision 5.
- **Carry forward.** When a comment restates a path, diff the comment against
  observed runtime behaviour. A comment that matches the author's intent and
  not the machine is worse than no comment: Builder B explicitly deferred to it
  ("left runnable on the strength of design decision 5") instead of testing.

## 3. stderr merged into stdout, and leaking across cell runs

- **What broke.** `site/src/lib/pyodide.ts:74-75` pushes both stdout and stderr
  into one array, so `warnings.warn(...)` and `sys.stderr.write(...)` render in
  the stdout region. Line 81-84 then resets both handlers to no-ops **without
  flushing**, so a partial line with no trailing newline stays in Pyodide's
  batch buffer and is emitted into the *next* cell's output.
- **How detected.** Two probe cells run in sequence in the real browser:
  `sys.stderr.write("STDERR_MARKER")` produced no visible output in its own
  cell, then `STDERR_MARKER` appeared at the top of the next cell's stdout.
- **Required fix.** Route stderr to the error region, flush on teardown, and
  test both the routing and the no-leak-across-runs property.
- **Criterion.** PRD AC2.4 ("stdout and any traceback are shown in visibly
  separate regions"); the file's own doc comment at :68-70 claims this already.
- **Carry forward.** Batched-output APIs buffer until a newline. Swapping the
  handler is not the same as flushing it; output misattributed to the wrong
  cell is worse than output that is merely in the wrong pane.

## 4. Nine green tests and the defect still shipped

- **What broke.** The suite maps a test to every AC the PRD marked `yes`, and
  every one passes — yet the headline user journey (open a Python cell, read a
  CSV) was never exercised. `tests/site.spec.ts:111-136` runs `print()` and
  `raise`, nothing that touches the filesystem.
- **Second gap.** `tests/site.spec.ts:63-85` asserts only that every cell is
  `sql` or `python`. Nothing asserts that a `<!-- static -->` or `<!-- local: -->`
  fence *stayed* static. A marker-parsing regression turning module 07's nine
  static fences into runnable cells passes the suite untouched.
- **Third gap.** PRD AC1.2 claims prose, headings and tables are textually
  identical; `scripts/verify-content.mjs:149-165` compares fenced code only.
  The design's test plan narrowed the AC without amending the AC.
- **How detected.** Mapping each AC to the assertion that covers it and asking
  what a hostile change could do while staying green.
- **Required fix.** Test the journey the module prose sells, not just the
  clause the AC is written in. Add per-module expected cell and badge counts.
- **Criterion.** PRD AC2.3, AC2.5, AC1.2.
- **Carry forward.** "Every AC has a test" is not coverage. Ask instead: what
  is the first thing a learner does, and does anything execute it end to end?

## 5. A stale dev server invalidated the builder's own test run

- **What broke.** Builder A left `astro preview` running (PID 9312, port 4321).
  It held `astro.win32-x64-msvc.node` open and made `npm ci` fail with EPERM,
  and `playwright.config.ts:20` sets `reuseExistingServer: !process.env.CI`, so
  a local `npm run test:e2e` binds to whatever is already on 4321 — possibly a
  build from before the commit under test.
- **How detected.** `npm ci` EPERM on a `.node` binary; `netstat` and `wmic`
  identified the holder as the project's own preview server.
- **Required fix.** Kill the server before verifying. Longer term, have the
  e2e script fail fast if 4321 is already bound, rather than silently reusing.
- **Criterion.** The handoff's "all tests green" claim itself.
- **Carry forward.** A builder reporting green from a machine with a stale
  server is reporting on an unknown artifact. Reviewers must re-run after a
  clean install, and treat an EPERM on a native module as evidence a process is
  still holding the tree, not as a flake to retry past.

## 6. Registry claims must be checked against the registry

- **What broke.** Builder A's handoff states `@duckdb/duckdb-wasm` "publishes
  only `-devN.0` builds". `npm view @duckdb/duckdb-wasm versions` lists stable
  1.10.0 through 1.15.0 and beyond.
- **Why it still passes.** `npm view @duckdb/duckdb-wasm dist-tags` returns
  `latest: 1.33.1-dev57.0`, which is what was pinned. The pin is defensible;
  the reason given for it is false.
- **How detected.** Ran the registry query instead of accepting the sentence.
- **Required fix.** None to the code. The reasoning must not be carried into a
  committed design doc. (It was not — builder handoffs are gitignored.)
- **Criterion.** Orchestrator's explicit instruction to confirm the version
  claim on the registry.
- **Carry forward.** "The package only publishes X" is a checkable claim and
  costs one command. Check it.

## 7. Minor findings

- `.github/workflows/pages.yml:8-11` grants `pages: write` and
  `id-token: write` at workflow level, so the build job that runs `npm ci` over
  the whole dependency tree also holds deploy-scoped credentials. Move both to
  the `deploy` job; leave `contents: read` at the top.
- `site/src/lib/duckdb.ts:125-172` and `scripts/verify-sql.mjs:86-133` carry
  duplicate `splitStatements` and `formatterFor`. The duplication is deliberate
  and commented (a `.mjs` script cannot import the `.ts` module), but nothing
  asserts the copies agree, and drift breaks AC2.2 parity silently.
- `modules/05-data-modeling/README.md:286-289` correctly tells the learner to
  run the walkthrough boxes in order, but pressing Run twice on the DDL cell
  raises `Table with name "tags" already exists` with no explanation. One
  sentence covers it.

## What was verified correct and needs no further work

- Pyodide keeps one namespace per tab: a variable set in one cell printed from
  another. Module 07's "each box remembers what the box above it defined"
  (README.md:39, :84, :146) is accurate. Builder B flagged this as unverified;
  it is now verified.
- `modules/05-data-modeling/README.md:286-289` already states the ordering
  requirement Builder A flagged as an open gap. No change needed.
- Zero fence-body changes across all eight modified Markdown files (181
  fences compared against `main`), independently reproduced.
- No CDN in the built JS; both runtimes self-hosted from `dist/`. 96 MB total,
  inside Pages limits.
- `dist/`, `node_modules/`, and `site/public/{datasets,duckdb,pyodide}/` are
  gitignored and uncommitted; `solutions.md`, `datasets/`, `*.py`, `*.sql`
  untouched.

---

# Round two, 2026-09-08. Verdict: APPROVE

Re-run from a clean install (`rm -rf node_modules && npm ci`, nothing listening
on 4321), on the committed tree at `b348f23`:

```
npm run build        -> 25 page(s) built in 1.79s
npm run test:content -> 24 pages, 355 source fences, 365 headings, 330 table rows, 85 cell seeds checked
npm run test:sql     -> 74/74 SQL blocks match their stated output
npm run test:e2e     -> 14 passed (21.2s)
```

No listener on 4321 afterwards; working tree clean. There is no lint or
typecheck command in this project (see finding 13).

## 8. Green tests are worth what their negative controls prove

- **What broke.** Nothing, this round - but a builder claiming "I verified the
  test fails without the fix" is the same class of claim as "all tests green",
  which round one showed can be made against an unknown artifact.
- **How verified.** Mutation testing against `dist/` (gitignored build output,
  regenerable, so no tracked file was touched). Four mutations, one at a time,
  each reverted:
  - deleted `n.FS.chdir("/")` from the built bundle ->
    `tests/site.spec.ts:229` and `:247` both fail.
  - deleted the `runPython(FLUSH)` call from the `finally` block ->
    `tests/site.spec.ts:269` fails at the stderr assertion.
  - renamed one `data-cell` attribute in `dist/05-data-modeling/index.html` ->
    `tests/site.spec.ts:211` fails on the count.
  - altered one `<h2>` and one `<td>` in `dist/03-sql-foundations/index.html`
    -> `scripts/verify-content.mjs` exits 1 naming both.
- **Carry forward.** Mutating build output is the cheapest way for a reviewer
  to confirm a test is load-bearing without editing the branch. Anything the
  test suite claims to protect should die when you break it on purpose.

## 9. An AC amended to match the code needs its reason checked too

- **What broke.** The builder amended PRD AC1.2 honestly on the typography
  point (the renderer really does emit a curly apostrophe for `'`), but
  justified dropping "prose" with "the check would have to reimplement the
  renderer to tell a rewrap from a rewrite". That reason is false.
- **How detected.** Wrote the check the PRD called impossible, in about 30
  lines: strip inline tags from the page, normalise whitespace and typography,
  then assert every source sentence over 45 characters appears in the page
  text. 24 pages, 1554 sentences, 0 missing. Rewraps pass, a rewrite would not.
- **Required fix.** None to the shipped site: prose *is* intact. The PRD's
  reason is corrected in place at `.agent-workflow/prd/interactive-site.md`,
  and the missing check is named as regression cover the build does not have.
- **Criterion.** PRD AC1.1, AC1.2.
- **Carry forward.** When an AC is narrowed, audit the *reason*, not just the
  new wording. "This cannot be tested" is a claim; try it before accepting it.
  Two false steps hid behind three true ones.

## 10. A criterion nobody amended still contradicted the build

- **What broke.** PRD AC4.3 said the site "scopes module 07's runnable browser
  cells to the file-free exercises". The shipped site runs exercises 4, 5 and
  7, all of which read CSVs, in the browser - deliberately, per design decision
  5, which preloads them. The word "file-free" was wrong from the start and
  survived two rounds because everyone read it as "the API/file-write ones are
  local", which is what the code does.
- **How detected.** Mapping every AC to the shipped behaviour rather than to
  the test that claims it, after the CSV fix changed what "runnable" means.
- **Required fix.** Corrected in place: the criterion now says "neither network
  access nor a local file write", and names the six exercises held back
  (2, 3, 6, 8, 9, 10 via `modules/07-python-for-ses/README.md:493`).
- **Criterion.** PRD AC4.3.
- **Carry forward.** A fix that changes what the product can do can invalidate
  an AC that nobody touched. After any capability change, re-read every AC that
  described the old limit.

## 11. Design doc drift from changes the review itself demanded

- **What broke.** Two shipped behaviours contradicted the design, both of them
  changes round one asked for, neither recorded in the design's deviation list
  (which does record deviations 8-10):
  - the design's `pages.yml` spec still said `permissions: contents: read,
    pages: write, id-token: write` at workflow level; the workflow now scopes
    the two write permissions to the `deploy` job.
  - the design's exercise-matching rule still said "the first heading at any
    level"; `site/src/plugins/cells.mjs:87` now skips depth-1 headings.
- **Required fix.** Both corrected in `.agent-workflow/design/interactive-site.md`
  by the reviewer.
- **Carry forward.** A change a reviewer demands is still a deviation from the
  design and still has to be written down. The reviewer is the one most likely
  to forget, because they already know why it changed.

## 12. Nothing runs the tests on the way to production

- **What broke.** `.github/workflows/pages.yml` runs `npm ci`, `npm run build`,
  and deploys. It never runs `test:content`, `test:sql` or `test:e2e`. Every
  test added over two review rounds protects the branch only while a human
  remembers to run it; a push to `main` deploys whatever builds.
- **Why not blocking.** The design's test plan never called for CI tests, so
  adding them here would be scope creep on a branch that is otherwise done.
- **Required fix (follow-up).** Add a `test` job to the workflow gating
  `deploy` - `test:content` and `test:sql` are cheap and need no browser;
  `test:e2e` needs `npx playwright install --with-deps chromium`.
- **Criterion.** PRD AC1.4.
- **Carry forward.** "All tests pass" is a statement about a laptop until the
  pipeline runs them. Check what the deploy workflow actually executes, not
  what the repo contains.

## 13. No lint, no typecheck, and TypeScript is not a dependency

- **What broke.** `package.json` has no `lint` and no `check` script, and
  `typescript` is in neither `dependencies` nor `devDependencies`, despite
  `tsconfig.json` extending `astro/tsconfigs/strict` and eight `.ts`/`.tsx`
  files in `site/src`. Astro's build strips types with esbuild without checking
  them, so a type error ships silently.
- **How detected.** Tried to run the project's lint step, found none; `npx tsc`
  resolved to the unrelated `tsc@2.0.4` package on npm, which is itself the
  evidence that TypeScript is absent.
- **Why not blocking.** No AC or design line asks for a linter, and the three
  test commands cover behaviour rather than types.
- **Required fix (follow-up).** `npm i -D typescript @astrojs/check` and a
  `"check": "astro check"` script, wired into the CI job from finding 12.
- **Carry forward.** Before writing "lint passes" or "no lint configured",
  confirm which one it is by reading `package.json`. A strict `tsconfig.json`
  with no compiler is decoration.

## 14. Smaller findings, none blocking

- `site/src/lib/pyodide.ts` routes stderr into the region
  `site/src/components/CodeCell.tsx:198` renders with `role="alert"` and the
  error styling. A successful cell that calls `warnings.warn` now shows a red
  alert box. Correct per AC2.4 and design deviation 10, but a warning is not a
  failure; a third region, or a non-alert style for a run that did not raise,
  would read better.
- `tests/preview-server.ts:14` calls `execFileSync('npx', ['astro','preview'])`
  and relies on Astro 7 daemonising. On a version that blocks, global setup
  hangs with no timeout on the call itself; only the 60s poll after it is
  bounded. Pin the assumption in a comment or add a timeout.
- `site/src/lib/duckdb.ts` and `scripts/verify-sql.mjs` still carry duplicate
  `splitStatements`/`formatterFor`. The builder left this for the reviewer to
  rule on: **accepted**. It is deliberate, commented, named in the design, and
  both copies are exercised on every run (74/74 in Node, cell tests in the
  browser), so drift shows up as a failure rather than silently. Extracting a
  shared module is not worth a new build step on this branch.
- `modules/07-python-for-ses/README.md:493` marks exercises 6, 9 and 10 local.
  6 is SQL and 9 is a pure-Python traceback exercise; both would run in the
  browser. Conservative, not wrong - but the site under-delivers slightly on
  what it can do.
- Fence comparison in `verify-content.mjs` is line-ending sensitive. It is
  consistent today because source and build agree; worth knowing when it fires
  on a checkout configured differently.

## What round two verified fixed

All round-one blocking and medium findings, each re-checked against the shipped
build rather than the diff: CSV reads by relative path (findings 1, 2),
`__file__` for the revealed solutions (1b), stderr routing and the cross-run
leak (3), the untested journey and the marker counts (4, 4b), AC1.2 headings
and table rows (4c), the stale preview server (5), workflow permissions (7a),
and module 05's re-run note (7c). Plus two defects the review missed and the
builder found: the whole-solutions-file reveal
(`site/src/plugins/cells.mjs:87`) and Astro's Markdown cache masking
plugin-only changes (`astro build --force`).
