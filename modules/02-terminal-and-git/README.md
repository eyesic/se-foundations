# 02. Terminal and Git

## Why an SE needs this

Day three of a proof of concept, the customer's engineer shares his screen and
says "just run it from the terminal." If that sentence makes your stomach drop,
you lose the room. SEs work in a terminal during POCs, run scripts in front of
customers, and keep every demo asset, script, and config file in Git the same
way engineering does. There is nothing hard here: about ten commands do 95
percent of the work, and after this module you will have used all of them. You
will also finish with a public GitHub repository containing your learning log,
which is the first piece of evidence a hiring manager can click.

## What you will be able to do

- Navigate folders, list files, and read files from a terminal on Windows or
  Mac.
- Run Python scripts and DuckDB from the command line.
- Explain what Git is and why every software team uses it.
- Initialize a repository, stage, commit, and push to GitHub.
- Clone someone else's repository and create a branch.
- Use `.gitignore` to keep secrets and junk out of a repo.
- Write a README that makes a stranger understand your project in 30 seconds.

## Concepts

### The terminal

A **terminal** is a window where you type commands instead of clicking. The
program reading what you type is a **shell**. On Windows you have two useful
ones:

- **PowerShell**, built into Windows. Open the Start menu and type PowerShell.
- **Git Bash**, installed with Git. It uses the same commands as Mac and Linux,
  which is why the rest of the world's documentation matches it.

Both are fine. Git Bash is the better habit because tutorials, Stack Overflow
answers, and your future coworkers all assume it. This repo shows both wherever
they differ.

Your **working directory** is the folder the terminal is currently "in." Every
command runs relative to it. The prompt usually shows it.

### The ten commands

| what you want | PowerShell | Git Bash / Mac |
|---|---|---|
| where am I | `pwd` | `pwd` |
| list files | `ls` | `ls` |
| list files with detail | `ls` | `ls -la` |
| change folder | `cd datasets` | `cd datasets` |
| go up one folder | `cd ..` | `cd ..` |
| go to your home folder | `cd ~` | `cd ~` |
| make a folder | `mkdir notes` | `mkdir notes` |
| print a file | `cat README.md` | `cat README.md` |
| first 10 lines of a file | `Get-Content -Head 10 file.csv` | `head file.csv` |
| find text in files | `Select-String "churn" *.sql` | `grep "churn" *.sql` |
| delete a file | `rm file.txt` | `rm file.txt` |
| clear the screen | `cls` | `clear` |

Three habits that save time immediately:

- **Tab completes.** Type `cd data` and press Tab; the shell finishes the name.
  This also confirms the path exists before you press Enter.
- **Up arrow repeats.** The previous commands are in history. You will retype
  the same `python` command forty times this month; do not actually retype it.
- **Paths with spaces need quotes.** `cd "My Documents"`, not `cd My
  Documents`.

Relative paths (`datasets/customers.csv`) are read from the working directory.
Absolute paths (`C:/Users/you/se-foundations/datasets/customers.csv`) work from
anywhere. Windows accepts forward slashes in almost every context, so use them
and stop thinking about it.

### Running things

The commands you will use most in this repo:

```bash
python datasets/generate.py
python -c "import duckdb; print(duckdb.sql('SELECT 42'))"
duckdb northwind.duckdb
```

`python file.py` runs a script. `python -c "..."` runs one line without a file.
`duckdb name.duckdb` opens an interactive database session; you leave it with
`.quit`.

If a command "is not recognized," the program is either not installed or not on
your **PATH**, which is the list of folders the shell searches. That is the
single most common setup problem and it is not a sign of anything.

### Git

**Git** records the history of a folder. It answers: what changed, when, by
whom, and can I go back. Software teams use it for everything, including
documentation and demo scripts.

The vocabulary, in the order you meet it:

| term | meaning |
|---|---|
| **repository** (repo) | a folder Git is tracking, plus its full history |
| **commit** | a saved snapshot with a message explaining the change |
| **staging area** | the set of changes you have selected for the next commit |
| **branch** | a parallel line of work; `main` is the default |
| **remote** | a copy of the repo somewhere else, usually on GitHub, named `origin` |
| **push** | send your commits to the remote |
| **pull** | bring the remote's commits down to your copy |
| **clone** | download a full copy of a remote repo you do not have yet |

The everyday loop is three commands, and you will run it hundreds of times:

```bash
git add .
git commit -m "Add monthly ticket volume query"
git push
```

`add` stages, `commit` snapshots with a message, `push` publishes. The two-step
add-then-commit exists so you can commit some changes and not others, which
matters more later than it does now.

**GitHub** is a website that hosts Git repositories, plus issues, pull
requests, and rendering for Markdown and Mermaid. Git works without GitHub;
GitHub is how other people see your work, which for a job search is the whole
point.

### Commit messages

Write them as an instruction: "Add churn rate query," not "changes" or "stuff."
Present tense, under about 70 characters, one logical change per commit. When a
recruiter or hiring manager scrolls your commit list, that list is a paragraph
about how you work.

### .gitignore

A **.gitignore** file lists things Git should not track: generated files,
local databases, and above all **secrets**. API keys, passwords, and tokens
must never be committed. GitHub scans public repos for keys, and a leaked key
in a public repo is the kind of mistake that shows up in interviews.

This repo's `.gitignore` is worth reading:

```text
.agent-workflow/handoffs/
.agent-workflow/codex/
*.duckdb
*.duckdb.wal
__pycache__/
.venv/
.env
```

`*.duckdb` keeps the generated database out, because the CSVs are the real
source. `.env` is the conventional file for secrets, and it is ignored
everywhere, always.

If you have already committed a secret, changing the file is not enough: it
stays in history. Rotate the key immediately, then worry about the history.

### README

A **README.md** is the file GitHub shows on a repo's front page. **Markdown**
is its formatting: `#` for headings, `-` for bullets, backticks for code, and
`[text](url)` for links. A README should answer, in this order: what is this,
who is it for, how do I run it, and what did I learn or build. Thirty seconds of
a stranger's attention is what you are designing for.

## Walkthrough

Build your learning-log repository and push it to GitHub. At the end you will
have a public URL you can put on a résumé.

Step 1. Go to your home folder and create the project.

```bash
cd ~
mkdir se-learning-log
cd se-learning-log
```

Step 2. Turn it into a Git repository.

```bash
git init
```

```text
Initialized empty Git repository in C:/Users/you/se-learning-log/.git/
```

The `.git` folder is the history. Deleting it deletes the history and leaves
the files.

Step 3. Create the files. Use VS Code, or the terminal:

```bash
mkdir entries
```

Create `README.md` with this content:

```markdown
# SE learning log

Daily notes from an eight-week self-directed curriculum on SQL, APIs, Python,
data modeling, and SaaS architecture, working toward an associate solutions
engineer role.

Each entry in `entries/` records what I built, what broke, and what I
understood that day.
```

And `entries/2026-09-08.md`:

```markdown
2026-09-08
Built: local environment. Python 3.12, DuckDB, Git, VS Code, GitHub account.
Broke: `python --version` opened the Microsoft Store. Python was installed
       without being added to PATH.
Understood: PATH is the list of folders the shell searches for a command.
```

Step 4. See what Git noticed.

```bash
git status --short
```

```text
?? README.md
?? entries/
```

`??` means untracked: Git can see the files but is not following them yet.

Step 5. Stage and commit.

```bash
git add .
git commit -m "Add learning log README and first entry"
```

```text
[main (root-commit) 73e6b27] Add learning log README and first entry
 2 files changed, 5 insertions(+)
 create mode 100644 README.md
 create mode 100644 entries/2026-09-08.md
```

If Git complains that it does not know who you are, set your identity once:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

On Windows you may also see `warning: LF will be replaced by CRLF`. That is
Git handling the difference between Windows and Unix line endings. It is not an
error and you can ignore it.

Step 6. Check the history.

```bash
git log --oneline
```

```text
73e6b27 Add learning log README and first entry
```

Your commit hash will differ; it is a unique id for the snapshot.

Step 7. Add a `.gitignore` before you have anything to hide.

```text
.env
__pycache__/
*.duckdb
.DS_Store
```

```bash
git add .gitignore
git commit -m "Add gitignore"
```

Step 8. Create the repo on GitHub. On <https://github.com>, click New
repository, name it `se-learning-log`, make it **public**, and do **not** add a
README (you already have one). GitHub then shows you the push commands:

```bash
git remote add origin https://github.com/YOUR-USERNAME/se-learning-log.git
git branch -M main
git push -u origin main
```

`remote add origin` records where the remote copy lives. `-u origin main` sets
the default so that later you can type only `git push`.

Step 9. Reload the GitHub page. Your README renders as the front page. That URL
goes on your résumé and your LinkedIn.

Step 10. Practice the daily loop once, so it is automatic tomorrow:

```bash
git add .
git commit -m "Add entry for 2026-09-09"
git push
```

Step 11. Practice cloning, since you will do this to work on a machine that
does not have your repo yet:

```bash
cd ~
git clone https://github.com/YOUR-USERNAME/se-learning-log.git log-copy
cd log-copy
git log --oneline
```

The same history is there, which is the point of a remote.

## Exercises

Answers in `solutions.md`.

1. From your home folder, navigate to the `se-foundations/datasets` folder,
   list its files, and print the first five lines of `plans.csv`. Write down the
   exact commands you used in your shell.
2. Create a folder called `sql-practice` inside your learning log, add a file
   `notes.sql` containing one comment line, and commit it with a message that
   follows the convention in this module.
3. Explain in your own words what the difference is between `git add` and
   `git commit`, and why they are two commands instead of one.
4. Make a change to your README, run `git status` before staging and after
   staging, and write down how the output differs.
5. Add a line to your `.gitignore` that would exclude any file named
   `secrets.json` anywhere in the repo. Prove it works by creating the file and
   running `git status`.
6. Create a branch called `experiment`, make a commit on it, switch back to
   `main`, and confirm the change is not there. Write down the four commands.
7. Write a README for a repo that does not exist yet: your module 09 capstone.
   Four sections: what it is, who it is for, how to run it, what you learned.
   You will rewrite this later; the point is having a draft.
8. Look up what `git diff` shows and run it after editing a file but before
   staging. Write one sentence on when you would use it.

## Checkpoint

<details>
<summary>1. What does <code>git add</code> do that <code>git commit</code> does not?</summary>

`git add` stages changes: it selects which of your edits will be included in
the next snapshot. `git commit` creates the snapshot from whatever is staged,
with a message. Splitting them lets you commit part of your work and leave the
rest for a separate commit.
</details>

<details>
<summary>2. You accidentally committed a file with an API key. What is the first thing you do?</summary>

Rotate the key: revoke it and issue a new one. The old value stays in Git
history even after you delete the file, so the only reliable fix is to make the
leaked value worthless. Then remove the file, add it to `.gitignore`, and
commit that.
</details>

<details>
<summary>3. What is the difference between a repository and a remote?</summary>

The repository is the tracked folder and its history on your machine. A remote
is another copy of that repository somewhere else, usually GitHub, referred to
by a name such as `origin`. `push` and `pull` move commits between them.
</details>

<details>
<summary>4. A command returns "is not recognized as the name of a cmdlet." What are the two likely causes?</summary>

Either the program is not installed, or it is installed but its folder is not
on your PATH so the shell cannot find it. Reinstalling with the "add to PATH"
option, or opening a new terminal after installing, fixes most cases.
</details>

<details>
<summary>5. Why does an SE need Git at all, if they are not writing product code?</summary>

Demo environments, scripts, SQL, integration configs, and customer-facing
documentation all live in repositories. Being able to clone a repo, read the
history, make a branch, and open a pull request is how an SE participates in an
engineering team's workflow instead of emailing files around.
</details>

You can now say:

- "I work comfortably in a terminal on Windows and Mac: navigating, running
  scripts, and inspecting files."
- "I use Git daily: staging, committing with clear messages, branching, and
  pushing to GitHub, and I keep secrets out of repositories with .gitignore."
- "I maintain a public GitHub repository documenting my technical work."

## Put it on your résumé

- Maintain a public GitHub repository of daily technical learning notes, with
  60-plus commits over eight weeks, using Git branching, staged commits, and
  .gitignore hygiene.

## Go deeper

- [Learn Git Branching](https://learngitbranching.js.org/) - a visual game;
  finish the first two sections and branching stops being scary.
- [Git and GitHub for Beginners (freeCodeCamp,
  video)](https://www.youtube.com/watch?v=RGOj5yH7evk) - one hour, covers
  exactly this module's ground with more repetition.
- [Oh Shit, Git](https://ohshitgit.com/) - short recipes for undoing the five
  mistakes everyone makes. Bookmark it before you need it.
- [The Missing Semester: the
  shell](https://missing.csail.mit.edu/2020/course-shell/) - MIT's lecture on
  the terminal, aimed at exactly the gap this module covers.
- [GitHub Docs: Managing
  files](https://docs.github.com/en/repositories/working-with-files/managing-files)
  - the browser-based way to edit a repo, useful on days you are not at your
  own machine.
