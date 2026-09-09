# se-foundations

A twelve-module, eight-week curriculum that takes someone with no programming
background from zero to the technical floor an entry-level solutions engineer
job actually asks for: SQL, APIs, a little Python, data modeling, integration
architecture, and a portfolio project you can demo. It was written for a recent
information science graduate with a customer success background who is applying
for associate SE, solutions consultant, and implementation specialist roles. If
that is roughly your situation, it will work for you too.

Everything here is free. No paid tools, no accounts beyond GitHub, no course to
buy.

## Two ways to work through this

Read it here on GitHub, or read it on the site at
**<https://eyesic.github.io/se-foundations/>**, where the SQL and Python
examples are boxes you can edit and run against the dataset in your browser
with nothing installed. The site is generated from the `modules/` folders in
this repo; that Markdown is the canonical source, and it is complete on its own.
Anything the browser cannot do — the terminal and Git module, live API calls,
and the scripts that write files — is marked local-only on the site and is
covered by the tool setup in module 00.

## The modules

| module | what it covers | what you produce |
|---|---|---|
| [00 Start here](modules/00-start-here/) | how to use this repo, the 8-week plan, tool setup, the learning-log habit | a working environment and a job-posting gap list |
| [01 How software works](modules/01-how-software-works/) | client and server, front end, back end, database, the cloud, SaaS, multi-tenancy | the request lifecycle, traced end to end |
| [02 Terminal and Git](modules/02-terminal-and-git/) | shell navigation on Windows and Mac, Git, GitHub, .gitignore, READMEs | a public learning-log repository |
| [03 SQL foundations](modules/03-sql-foundations/) | SELECT, WHERE, NULLs, ORDER BY, aggregates, GROUP BY, HAVING, dates | 10 queries answering real account questions |
| [04 SQL intermediate](modules/04-sql-intermediate/) | joins, subqueries, CTEs, CASE, window functions, churn and cohorts | an account health query plus 15 interview answers |
| [05 Data modeling](modules/05-data-modeling/) | keys, cardinality, junction tables, normalization, ERDs, star schema | an ERD, a schema change, a data mapping document |
| [06 APIs and HTTP](modules/06-apis-and-http/) | methods, status codes, JSON, auth, rate limits, pagination, Postman | a Postman collection against a real API |
| [07 Python for SEs](modules/07-python-for-ses/) | variables, lists, dicts, loops, functions, files, requests, error handling | a script that calls an API and loads DuckDB |
| [08 Integrations and architecture](modules/08-integrations-and-architecture/) | file transfer, REST sync, webhooks, ETL, SSO, cloud basics, security vocabulary | an architecture diagram and security questionnaire answers |
| [09 Capstone pipeline](modules/09-capstone-pipeline/) | API to Python to DuckDB to SQL to dashboard to GitHub | the portfolio project |
| [10 The SE craft](modules/10-the-se-craft/) | discovery, demo, POC, objection handling, working with the AE | a discovery notes doc, a demo script, a recorded demo |
| [11 Job search kit](modules/11-job-search-kit/) | target titles, résumé bullets, LinkedIn, interview prep, networking | a rewritten résumé and the first 10 applications |

## The eight-week path

| week | modules |
|---|---|
| 1 | 00, 01, 02 |
| 2 | 03 |
| 3 | 04 |
| 4 | 05, and choose the capstone in 09 |
| 5 | 06 |
| 6 | 07, 08 |
| 7 | 09 |
| 8 | 10, 11 |

Ninety minutes a day, five days a week. Module 00 explains how to structure a
session and why the daily learning log matters more than it looks like it does.

## Start today

Three commands, from the folder where you keep projects:

```bash
git clone https://github.com/eyesic/se-foundations.git
cd se-foundations
python datasets/generate.py
```

If those seven CSV lines print, your environment works. Then open
[`modules/00-start-here/README.md`](modules/00-start-here/) and start reading.

You need Python 3.10 or newer. Everything else is installed in module 00.

## How the modules are built

Every module has the same nine sections, in the same order: why an SE needs it,
what you will be able to do, the concepts with worked examples, a hands-on
walkthrough with every command and its real output, 5 to 10 exercises, a
five-question checkpoint with three interview sentences, a résumé bullet you can
paste once the work is real, and free resources to go deeper.

Solutions live in a separate `solutions.md` in each module folder, so you try
first. Every SQL solution in this repo was executed against the dataset in
`datasets/`; the outputs shown are the real outputs, not illustrations.

## The dataset

Modules 03 through 09 use one fictional B2B SaaS company, Northwind Analytics:
seven tables, about 45,000 rows, spanning 2024 to 2026. It has churn, upgrades,
duplicate account names, unresolved tickets, overdue invoices, and NULLs
everywhere they would really be, because clean data teaches you nothing. See
[`datasets/README.md`](datasets/README.md) for the schema, the ERD, and a list
of the deliberate messiness.

Regenerate it any time with `python datasets/generate.py`. It uses only the
Python standard library and is seeded, so it produces identical files every
run.

## Using progress.md

[`progress.md`](progress.md) is the tracker: one checkbox per module, per
exercise set, and per artifact. Tick a box when the work is done, not when you
have read about it, and commit the file each time. In week 8 that commit
history is evidence of how you work, and it is the raw material for the résumé
bullets in module 11.

## Templates

[`templates/`](templates/) holds five fill-in-the-blank documents you will use
in modules 05, 09, and 10: a résumé bullet formula, a project README, a demo
script, discovery call notes, and an architecture diagram. Each has a completed
example so you can see what "good" looks like before you write your own.

## Honest note

This repo was assembled by Isaac with AI assistance for one specific person
starting a job search. It is shared as-is, in case it is useful to someone in
the same position. It is opinionated, it is not a substitute for building real
things with real customers, and nothing in it is affiliated with any company
named in it. The dataset is fabricated. Corrections and improvements are
welcome.

## License

MIT. See [LICENSE](LICENSE).
