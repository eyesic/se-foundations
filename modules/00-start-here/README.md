# 00. Start here

## Why an SE needs this

A **solutions engineer** is the technical person in a sales conversation. You
sit next to the account executive, listen to what the customer is trying to do,
and show them how the product does it. The job is judged on two things:
explaining clearly and connecting systems accurately. You already do the first
one, professionally, every day. This repo builds the second one, to the floor
that entry-level SE postings ask for and no higher. This module sets up your
tools, your schedule, and the habit that turns the next eight weeks into
résumé bullets instead of a folder of notes nobody reads.

## What you will be able to do

- Explain what a solutions engineer does and which parts you can already do.
- Know which code you can run in the browser on the site and which you have to
  run on your own computer, and why.
- Run Python, DuckDB, and Git from a terminal on your own machine.
- Have a GitHub account and know what a repository is for.
- Keep a learning log that converts directly into résumé bullets and LinkedIn
  posts.
- Follow an eight-week plan at 90 minutes a day and know exactly what to open
  tomorrow.

## Concepts

### What this repo is

Twelve modules. Each one is a folder with a `README.md` you read, exercises you
do, and a `solutions.md` you check afterward. Modules 03 through 09 use one
made-up SaaS company's dataset (`datasets/`), so what you learn in module 03
still applies in module 09.

Each module ends the same way: a five-question checkpoint, three sentences you
can say in an interview, and a résumé bullet you can paste once the work is
actually done. That structure exists because the gap you are closing is not
only knowledge. It is being able to prove the knowledge to a stranger in
thirty seconds.

### Two ways to work through this

There are two surfaces, and you will use both.

The **site** at <https://eyesic.github.io/se-foundations/> is the same twelve
modules with the SQL and Python examples turned into boxes you can edit and
run. The Northwind dataset is already loaded there, so you can start module 03
before you have installed anything, on any machine, including one you do not
control.

The **repo** is the canonical source: the `modules/` folders you are reading
now, on GitHub or on your own disk. The site is generated from them. If the
two ever disagree, the Markdown in `modules/` is the one that is right.

Two phrases run through every module from here on, and they always mean the
same thing:

- **Run this in the browser.** Use the box under the code on the site and press
  Run. The seven Northwind tables are already loaded.
- **Run this on your computer.** Use the tools you install in the walkthrough
  below, in a terminal or in VS Code. On the site these blocks are marked as
  local-only, with the reason, and have no Run button.

Three kinds of work always need your own computer, which is why the setup below
is not optional:

- **Module 02, terminal and Git.** The whole point is your machine.
- **Anything that calls a live service.** Module 06, and the API exercises in
  modules 07 and 09. A browser cell cannot reach an outside API.
- **Anything that writes a file you keep.** Module 07's `weather_to_csv.py` and
  its CSV exercises, and the whole module 09 capstone. A browser cell has
  nowhere to put a file.

One more thing about the site: whatever you type into it is stored in that one
browser only. Clear your browser data or switch machines and it is gone. It is
convenience while you work, not a record. The record is `progress.md` ticked
and committed, and your learning log.

### The eight-week path

Ninety minutes a day, five days a week. Two hours is fine. Four hours is how
people quit in week three.

| week | modules | what exists at the end |
|---|---|---|
| 1 | 00, 01, 02 | tools installed, GitHub account, learning-log repo with commits |
| 2 | 03 | 10 SQL queries answering real questions about a SaaS dataset |
| 3 | 04 | joins, CTEs, window functions, 15 interview questions solved |
| 4 | 05 and start 09 | an ERD you drew, a data mapping doc, capstone project chosen |
| 5 | 06 | Postman collection, API calls against a real public API |
| 6 | 07, 08 | a Python script that calls an API and loads a database, an architecture diagram |
| 7 | 09 | capstone finished: repo, queries, dashboard, README |
| 8 | 10, 11 | demo video recorded, résumé rewritten, LinkedIn updated, 10 applications sent |

Weeks 4 and 7 both touch module 09 on purpose. Picking the capstone early gives
the API and Python modules something concrete to attach to.

### The 90-minute session

Roughly: 15 minutes rereading yesterday's notes and the last thing you built,
50 minutes on new material and exercises, 15 minutes writing your learning log,
10 minutes of slack. The rereading is not optional. It is what makes week 6
possible.

### The learning log

A **learning log** is a short daily note in your own GitHub repo. Three lines:

```text
2026-09-08
Built: monthly ticket volume query grouped by priority, 8 rows out.
Broke: WHERE csm_owner = NULL returned nothing. NULL never equals anything,
       it needs IS NULL.
Understood: HAVING filters groups, WHERE filters rows, because the database
       runs WHERE before it groups.
```

Built, broke, understood. Two minutes. It does four jobs at once.

1. Writing something down is what moves it from "I saw that" to "I know that."
2. In week 8 it is the raw material for your résumé. "Wrote 40 SQL queries
   across 6 weeks" is a sentence you can only write honestly if you counted.
3. It is public evidence. A hiring manager who opens a repo with 40 dated
   commits sees someone who finishes things.
4. On the days you feel like you know nothing, it is the receipt that says
   otherwise.

Module 02 walks you through creating this repo. Do not skip it because it feels
like homework decoration. It is the artifact that makes the rest legible to
other people.

### The tools, and what each one is for

| tool | what it is | why you need it |
|---|---|---|
| **Python 3** | a programming language | modules 07 and 09; also runs the dataset generator |
| **DuckDB** | a database that runs from a single file, no server | modules 03 through 09 |
| **VS Code** | a text editor for code | writing SQL and Python, reading this repo |
| **Git** | version control: tracks every change to your files | module 02, and every SE team uses it |
| **GitHub** | a website that hosts Git repositories | where your learning log and capstone live |
| **Postman** | an app for sending API requests by hand | module 06 |

All free. Nothing in this repo requires a paid tool.

### About feeling unqualified

You are going to hit a moment, probably in module 04 or 06, where you feel like
everyone else was handed a manual you never got. Three things that are true and
useful:

**The technical floor for this job is finite, and this repo is the floor.** Not
a metaphor. SQL that joins and aggregates, HTTP and JSON, enough Python to move
data, and the vocabulary to discuss integrations, security, and architecture at
the level of a first customer conversation. That is the list. It is twelve
modules long, and it ends.

**The half of the job that is harder to teach, you have already been paid to
do.** Listening to a customer describe a problem in their own words, figuring
out what they actually need, explaining something technical without making
someone feel stupid, staying calm when a call goes badly. That is a customer
success internship, and it is the half most SE candidates are weakest at. The
SQL is the part that can be learned in eight weeks. Notice which half you got
the hard way.

**"I don't know, let me find out" is the correct answer in this job.** SEs say
it in front of customers constantly, and the good ones say it without
flinching, then follow up the same day. You are not training to know
everything. You are training to be the person who can find out and explain it
back.

If you want the practical version of this: keep the learning log. On a bad
Thursday, scroll up. That is what you did not know four weeks ago.

## Walkthrough

Install the tools and verify each one. You will spend one session here. Do it
now. Modules 02, 06, 07, and 09 do not work without it, and having the tools
locally is how the job itself works.

If you are reading this on the site and want to start module 03 today, you can:
the SQL there runs in the browser. Finish this walkthrough before the end of
week 1 anyway.

Windows commands are shown for **PowerShell**. If you prefer **Git Bash**
(installed with Git), the same commands work except where noted. Mac and Linux
use Terminal, and the commands are the same as Git Bash.

Step 1. Install Python 3 from <https://www.python.org/downloads/>. On Windows,
check the box that says **Add python.exe to PATH** during install. That
checkbox is the difference between the next command working and not.

```powershell
python --version
```

```text
Python 3.12.4
```

Any version 3.10 or higher is fine. If Windows opens the Microsoft Store
instead, Python is not on your PATH: reinstall with the box checked.

Step 2. Install DuckDB.

```powershell
pip install duckdb
```

```text
Successfully installed duckdb-1.1.3
```

Then verify:

```powershell
python -c "import duckdb; print(duckdb.sql('SELECT 42 AS answer'))"
```

```text
┌────────┐
│ answer │
│ int32  │
├────────┤
│     42 │
└────────┘
```

Optionally also download the DuckDB command-line tool from
<https://duckdb.org/docs/installation/>. It is nicer for interactive work.
Module 03 shows both ways, so you are not blocked either way.

Step 3. Install VS Code from <https://code.visualstudio.com/>. Open this repo
folder with File, then Open Folder. Install the Python extension when it
offers.

Step 4. Install Git from <https://git-scm.com/downloads>.

```powershell
git --version
```

```text
git version 2.46.0.windows.1
```

Set your identity, which Git stamps on every commit:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

Step 5. Create a GitHub account at <https://github.com> if you do not have one.
Use a username you would put on a résumé.

Step 6. Install Postman from <https://www.postman.com/downloads/>. You will not
use it until module 06. Install it now anyway, so a download is never the
reason you skip a session.

Step 7. Get this repo onto your machine and confirm the dataset is there.

```powershell
git clone https://github.com/eyesic/se-foundations.git
cd se-foundations
python datasets/generate.py
```

```text
wrote plans.csv                   4 rows
wrote customers.csv             200 rows
wrote subscriptions.csv         269 rows
wrote users.csv                2213 rows
wrote usage_events.csv        38382 rows
wrote support_tickets.csv      1615 rows
wrote invoices.csv             2333 rows
done. seed = 42
```

The CSVs are already committed, so this only proves your Python works. If you
see those eight lines, your environment is correct and you are done with setup
for the entire repo.

Step 8. Open `progress.md` in the repo root and tick module 00.

## Exercises

Answers and worked examples are in `solutions.md`.

1. Run all five verification commands from the walkthrough and paste the output
   into a file called `setup-notes.md` in your own learning-log folder.
2. In two sentences each, write what Python, DuckDB, and Git are for. Do not
   copy the table above; use your own words.
3. Write your first learning log entry using the Built / Broke / Understood
   format, about today's setup session. If nothing broke, write "nothing
   broke," and notice how rare that will be.
4. Open `datasets/README.md` and write down the names of the seven tables and
   one sentence each on what a single row represents.
5. Put the eight-week schedule into your actual calendar as 90-minute blocks,
   with the module number in the title of each block.
6. Find one entry-level solutions engineer job posting in New York. Copy the
   requirements section into a file. Mark each requirement as: already have,
   covered by this repo, or gap.
7. Write three sentences you could say today about what a solutions engineer
   does, aimed at someone who does not work in software.

## Checkpoint

<details>
<summary>1. What are the two things a solutions engineer is judged on?</summary>

Explaining clearly and connecting systems accurately. The first is
communication and discovery; the second is the technical floor this repo
builds.
</details>

<details>
<summary>2. What is DuckDB and why does this repo use it instead of a "real" database?</summary>

A database that runs from a single file with no server to install or
administer, reading CSVs directly. The SQL you write in it is standard, so
everything transfers to PostgreSQL or Snowflake with minor differences.
</details>

<details>
<summary>3. What are the three lines of a learning log entry?</summary>

Built, broke, understood. What you made, what went wrong, and what you now
understand that you did not this morning.
</details>

<details>
<summary>4. Which weeks do you touch module 09, and why is it split?</summary>

Weeks 4 and 7. You choose the capstone project in week 4 so that the API and
Python modules in weeks 5 and 6 have something concrete to build toward, then
finish it in week 7.
</details>

<details>
<summary>5. A customer asks you something you do not know the answer to. What do you say?</summary>

"I don't know, let me find out and get back to you today." Then do it. Guessing
in front of a customer costs you the deal; following up quickly builds the
credibility the whole role runs on.
</details>

You can now say:

- "I have a working local environment: Python, DuckDB, Git, and VS Code, and I
  can verify each of them from the command line."
- "I keep a daily engineering learning log in a public GitHub repo."
- "I know what a solutions engineer does across a deal, and which parts of it
  my customer success experience already covers."

## Put it on your résumé

- Completed a self-directed eight-week technical curriculum covering SQL, APIs,
  Python, data modeling, and integration architecture, with all work published
  to GitHub.
- Maintain a public daily engineering learning log documenting what was built,
  what broke, and what was learned across 40-plus sessions.

## Go deeper

- [PreSales Collective](https://www.presalescollective.com/) - the largest free
  SE community, with a Slack, job board, and beginner content.
- [What does a sales engineer actually do (Sales Engineer
  Podcast)](https://www.se-podcast.com/) - hear practitioners describe the day
  job in their own words.
- [The Six Habits of Highly Effective Sales
  Engineers](https://www.amazon.com/dp/1949635155) - short, practical, and
  available in most libraries; skim it during week 1.
- [GitHub Docs: Hello World](https://docs.github.com/en/get-started/quickstart/hello-world)
  - fifteen minutes, and it makes module 02 easier.
- [Levels.fyi solutions engineer
  salaries](https://www.levels.fyi/t/solution-architect) - useful context on
  what the ladder looks like above the role you are applying for.
