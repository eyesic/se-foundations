# 02. Solutions

Command output below is real, captured on Windows with Git 2.50. Your hashes
and paths will differ.

## 1. Navigate and read a file

Git Bash or Mac:

```bash
cd ~/se-foundations/datasets
ls
head -5 plans.csv
```

PowerShell:

```powershell
cd ~\se-foundations\datasets
ls
Get-Content -Head 5 plans.csv
```

```text
plan_id,name,monthly_price,seat_limit
1,Free,0,3
2,Starter,15,25
3,Pro,40,100
4,Enterprise,90,1000
```

`head` does not exist in PowerShell, which is the main reason this repo shows
both. If you find yourself translating constantly, switch to Git Bash and stop.

## 2. Commit a practice folder

```bash
mkdir sql-practice
echo "-- practice queries for module 03" > sql-practice/notes.sql
git add sql-practice
git commit -m "Add SQL practice notes"
```

A good message here is "Add SQL practice notes." A bad one is "update," "wip,"
or "asdf." You will read this list back in week 8 when you write your résumé,
and vague messages give you nothing to write from.

## 3. add versus commit

`git add` stages: it selects which changes go into the next snapshot. `git
commit` writes the snapshot and attaches a message.

They are separate because a working session usually produces more than one
logical change. If you fixed a query and also rewrote a README, you can stage
and commit them separately so the history says two clear things instead of one
vague thing. The separation is what makes a commit history readable later.

## 4. status before and after staging

Before:

```text
 M README.md
```

After `git add README.md`:

```text
M  README.md
```

The difference is the column. The first column is the **staged** state, the
second is the **working directory** state. ` M` means modified but not staged.
`M ` means modified and staged. `??` means untracked entirely. Reading those two
columns is a skill that pays off the first time a commit goes in half-finished.

## 5. Ignoring secrets.json

Add to `.gitignore`:

```text
secrets.json
```

A bare filename with no slash matches that name in any folder. Test it:

```bash
echo '{"api_key": "not-a-real-key"}' > secrets.json
git status --short
```

`secrets.json` does not appear at all. If it does appear, either the pattern is
wrong or the file was already tracked before you ignored it; `.gitignore` only
applies to untracked files. In that case, `git rm --cached secrets.json`
removes it from tracking while leaving it on disk.

## 6. Branching

```bash
git switch -c experiment
git add . && git commit -m "Add scratch note"
git switch main
ls
```

```text
Switched to a new branch 'experiment'
Switched to branch 'main'
README.md
entries
```

`scratch.md` is gone from the listing, because it only exists on the
`experiment` branch. It is not deleted; switching branches swaps the working
directory to match that branch's snapshot. Running `git switch experiment`
brings it back.

`git checkout -b experiment` does the same thing as `git switch -c` and is what
most older documentation shows. `switch` is the newer, clearer command.

## 7. Capstone README draft

```markdown
# NYC 311 service requests: an analytics pipeline

## What it is
A Python script pulls service request data from the NYC Open Data API, loads it
into DuckDB, and answers 12 analytical questions with SQL. Results are charted
and published here.

## Who it is for
Anyone evaluating my technical work: this is a complete small data pipeline,
from API call to visualization, built as part of a self-directed curriculum.

## How to run it
    pip install -r requirements.txt
    python pull_data.py
    duckdb nyc311.duckdb < queries/all.sql

## What I learned
Pagination and rate limits on a public API, the difference between what the API
returns and what a table needs, and why a 60,000-row aggregation belongs in SQL
rather than in a Python loop.
```

Four sections, no fluff. You will rewrite this in module 09 against the
template in `templates/project-readme-template.md`, but having a draft now
means the capstone has a shape before you start.

## 8. git diff

`git diff` shows the exact lines changed in tracked files that you have not yet
staged.

```text
diff --git a/README.md b/README.md
index fc2c8be..c0b1f81 100644
--- a/README.md
+++ b/README.md
@@ -1,3 +1,5 @@
 # Learning log

 My daily notes.
+
+Second line.
```

Lines starting with `+` were added, `-` were removed, and unmarked lines are
context. Use it right before `git add` to check that you are committing what you
think you are committing, and nothing else. That habit is what stops a stray
debug line or a pasted password from getting into a public repo.
