# PRD: interactive-site

## Problem
The curriculum is Markdown-only: SQL and Python exercises require a local
terminal before a learner can see a result, which is friction for a
non-programmer learning solo. She needs to run code and see output in the
browser while the local-workflow modules (terminal/Git, file-writing Python)
stay intact.

## Out of scope
- Choosing DuckDB-WASM, Pyodide, or any other library — architect's call.
- Any change to module markdown content beyond the rewrite scope in T4.
- A backend, database, accounts, or any paid service.
- Deleting or shortening module 02 (terminal/Git) or module 07's local
  file-writing/API exercises.
- Editing datasets/ or generate.py.

## Tickets

### T1: Site scaffold, navigation, and deploy
Static site generated from the existing Markdown, published free with no
backend; module content stays byte-identical outside runnable cells so
GitHub rendering is unaffected.

| AC | Criterion (given/when/then) | Tested |
|---|---|---|
| AC1.1 | Given the 12 module READMEs and solutions.md, when the site builds, then every page renders from that Markdown without altering its source content. | yes |
| AC1.2 | Given a site page, when its prose, headings, tables, and non-runnable code fences are diffed against the raw Markdown, then they are textually identical. | yes |
| AC1.3 | Given any site page, when a learner opens it, then a nav lists all 12 modules in curriculum order with the current module highlighted. | yes |
| AC1.4 | Given a commit to the site's publishing branch, when the build runs, then it publishes to GitHub Pages with no paid service and no backend server. | no |
| AC1.5 | Given a viewport under 768px wide, when a learner opens any module page, then code cells and controls remain usable with no horizontal clipping. | no |

### T2: Runnable SQL and Python cells
`sql` and `python` fences in Concepts/Walkthrough sections become runnable
against the same seven CSVs in `datasets/`; every other fenced language
stays static, per the handoff's code-fence census.

| AC | Criterion (given/when/then) | Tested |
|---|---|---|
| AC2.1 | Given a ```sql fence in Concepts or Walkthrough, when the page renders, then it shows as a runnable cell seeded with that exact query and a Run control. | yes |
| AC2.2 | Given a runnable SQL cell is run, when it completes, then it shows a result table whose rows match the output already shown in the Markdown, because it queries the same `datasets/` CSVs. | yes |
| AC2.3 | Given a ```python fence in Concepts or Walkthrough, when the page renders, then it shows as a runnable cell with a Run control. | yes |
| AC2.4 | Given a Python cell is run, when it produces output or an error, then stdout and any traceback are shown in visibly separate regions. | yes |
| AC2.5 | Given a ```bash, ```powershell, ```json, ```text, ```mermaid, or ```markdown fence, when the page renders, then it stays static with no Run control. | yes |

### T3: Exercise cells and progress persistence
Exercises get an empty editable cell instead of a worked example, a
reveal-solution toggle, and in-browser-only state.

| AC | Criterion (given/when/then) | Tested |
|---|---|---|
| AC3.1 | Given a module's Exercises section for an SQL/Python-numbered exercise, when it renders, then the learner gets an empty editable cell, not pre-filled code. | yes |
| AC3.2 | Given an exercise cell, when the learner clicks reveal solution, then the matching answer from that module's `solutions.md` displays. | yes |
| AC3.3 | Given a learner has typed code or revealed a solution, when they return to the same page in the same browser, then that state persists via browser storage with no account and no server. | yes |
| AC3.4 | Given `progress.md` is the git-committed tracker, when the site describes in-browser progress, then it states plainly that browser state is session convenience only and does not replace ticking and committing `progress.md`. | no |
| AC3.5 | Given a learner clears browser storage or switches browsers, when they return, then prior in-browser state is gone and no page claims otherwise. | no |

### T4: Instruction rewrite scope
Rewrite phrasing in the modules that currently assume a terminal, so both
the browser path and the local path stay valid and module 07's file/API
exercises are correctly scoped to local-only.

| AC | Criterion (given/when/then) | Tested |
|---|---|---|
| AC4.1 | Given module 00's tool-setup walkthrough, when rewritten, then it states the browser-run path for SQL/Python modules and that module 02 (terminal/Git) and module 07's file-writing exercises still require local install. | no |
| AC4.2 | Given modules 03-09's SQL instructions, when rewritten, then phrasing assuming a terminal ("open DuckDB in your terminal and run") is replaced with wording covering both the in-browser cell and the local CLI/Python path. | no |
| AC4.3 | Given module 07's `weather_to_csv.py` walkthrough, when rewritten, then it states that exercise runs locally only, because browser Python cells cannot call external APIs or write local files, and scopes module 07's runnable browser cells to the file-free exercises. | no |
| AC4.4 | Given the root README and module 00, when rewritten, then both state the site is an additional surface and `modules/` Markdown remains the canonical source read on GitHub. | no |

## Prior knowledge
- Knowledge store search for interactive-code-site precedent returned no
  direct hit; nearest results were this repo's own review lessons.
- `.agent-workflow/design/se-foundations-curriculum.md` — fixed module
  template, code-fence conventions, and the "solutions in a separate file"
  rule that T3's reveal-solution behavior must preserve.
- `.agent-workflow/lessons/se-foundations-review.md` — cross-file numeric
  contradiction and tracker-drift findings, informing T3's `progress.md`
  relationship requirement (AC3.4).

## Open questions
None blocking. GitHub Pages and "static, no backend" are carried forward
from the handoff as the orchestrator's stated assumption, not re-opened
here.
