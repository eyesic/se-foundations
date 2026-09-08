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
