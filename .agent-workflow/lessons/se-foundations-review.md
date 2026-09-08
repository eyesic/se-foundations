# Lessons: se-foundations review

Reviewer pass over the 12-module Markdown learning repo, 2026-09-08.
Verdict: APPROVED with three fixes applied in place.

## What broke, how it was detected, the fix, the criterion

### 1. Token-shaped string in teaching prose (highest value finding)

- **What.** `modules/06-apis-and-http/README.md:188` carried
  `Authorization: Bearer ghp_16C7e42F292c6912E7710c838347Ae178B4a` as the
  bearer-token illustration. It is GitHub's own documentation placeholder, not
  a live credential, so no secret leaked.
- **Why it still mattered.** The repo's stated destination is a *public GitHub
  repo*. `ghp_` + 36 chars is the exact shape GitHub secret scanning and push
  protection match on. A push-protection block or a secret-scanning alert on
  day one is a bad first impression for a portfolio repo, and the failure mode
  is invisible until the push is attempted.
- **How detected.** Regex sweep for vendor key shapes, not just for
  `key\s*=\s*...` assignments. The generic `(api_key|secret|token)\s*[:=]\s*\S{16,}`
  pattern returned **zero** hits; only the vendor-prefix pattern
  (`ghp_|AKIA|sk-|xox[baprs]-|AIza|eyJ`) caught it. Run both.
- **Fix applied.** Replaced with `EXAMPLE_TOKEN_abc123_not_a_real_credential`,
  which preserves the teaching point (a bearer token is an opaque string) and
  matches no scanner.
- **Criterion.** Handoff security gate: "no real API keys."
- **Carry forward.** Any repo that will be public: grep for vendor key
  *prefixes* before publishing, separately from the generic secret regex.
  Documentation placeholder credentials still trip scanners.

### 2. Cross-file numeric contradiction

- **What.** `modules/00-start-here/README.md:47` promised week 2 produces
  "12 SQL queries"; root `README.md:21` promised "10 queries"; module 03
  actually ships 10 exercises.
- **How detected.** Grepping a claim across every file that repeats it, rather
  than reading each file in isolation. Two builders wrote the two files;
  neither was wrong on its own, only against the other.
- **Fix applied.** Module 00 changed to 10, matching the artifact.
- **Criterion.** "README.md at root accurately describes what exists."
- **Carry forward.** With parallel builders, every number stated in more than
  one file is a merge hazard. Enumerate duplicated claims and diff them.

### 3. Tracker left generic where counts were unknowable at write time

- **What.** `progress.md` gave modules 00-05 exercise ranges ("exercises 1-10")
  but modules 06-11 only "exercises", because builder A wrote the tracker
  before builder B's exercise counts existed. Module 09's exercises had no
  tracker line at all.
- **How detected.** Builder A flagged it in their own handoff under "Things a
  reviewer should decide." Reading both builder handoffs before the diff is
  what surfaced it; a pure content read would have skimmed past it.
- **Fix applied.** Filled ranges from the verified counts (06 and 07 have 10,
  08 through 11 have 8) and added the missing module 09 line.
- **Criterion.** Design: "`progress.md`: checkboxes for every module, every
  exercise set, every artifact."
- **Carry forward.** When builder A depends on builder B's output, the
  dependent placeholder is the reviewer's job to close. Builders correctly
  refuse to guess; someone has to reconcile.

## Non-blocking observations, recorded so they are not rediscovered

- **35 untagged code fences** in modules 06, 07, and 09 (builder B) against
  the design rule "code in fenced blocks with language tags." Modules 00-05
  have zero. Cosmetic (no highlighting), consistent within its author, not
  worth a rewrite pass.
- **Mixed fictional-email convention.** The dataset uses real-TLD fake domains
  (`@redwood.com`, `@westgate.com`), while module 05's sample export uses the
  reserved `.example` TLD. `.example`/`.invalid` is the safer convention for
  published fixtures. Not a leak — all names are generated.
- **`modules/03-sql-foundations/README.md` step 5** models saying "Fifteen of
  them were heavy users" on a customer call. "Heavy user" is undefined and no
  threshold yields 15 (>100 events gives 31, >=150 gives 21). It is illustrative
  dialogue, but it sits ~200 lines after the module teaches "say the
  denominator out loud," so it slightly undercuts its own lesson.

## Method notes that saved time

- **Verifying stated output, not just execution.** Executing SQL only proves it
  parses. The check that carried weight extracted every ```` ```sql ```` block
  with an adjacent output block, ran it, and compared the numeric tokens in the
  claimed output against the real result set: **67/67 matched**. Cheap to build,
  and it is the only thing that substantiates "the outputs shown are the real
  outputs" in the root README.
- **Determinism proved by relocation, not repetition.** Copying `generate.py`
  alone into a temp dir and running it there proved both seeded determinism
  (7/7 byte-identical by md5) and that it writes relative to its own file
  rather than the cwd. Running it twice in place would have proved neither.
- **Scratch-harness name collision.** A helper named `struct.py` in the
  scratch dir shadowed the stdlib `struct` module and broke `import duckdb`
  with `module 'struct' has no attribute 'calcsize'`. Never name a scratch
  script after a stdlib module.
- **Pre-loading tables masks a file's own bootstrap.** Running
  `example_queries.sql` against a connection that already had the tables
  produced 7 spurious "already exists" errors. On a clean connection: 22/22
  statements, 0 issues. Test self-contained SQL files on a clean connection.

## Process deviation

The standing reviewer rule is to commit the lessons file alone. Not done: the
dispatching handoff said "Do NOT commit, push, or create a remote," and this
repo has **zero commits**, so committing would have authored its initial
commit. The orchestrator publishes. Flagging rather than silently doing either.
