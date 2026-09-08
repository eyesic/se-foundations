# 00. Solutions

Most of this module's exercises produce output that is personal to you. What
follows is what a good answer looks like, so you can compare rather than copy.

## 1. Verification output

Your version numbers will differ. What matters is that all five commands
returned something instead of an error.

```text
> python --version
Python 3.12.4

> pip install duckdb
Successfully installed duckdb-1.1.3

> python -c "import duckdb; print(duckdb.sql('SELECT 42 AS answer'))"
┌────────┐
│ answer │
│ int32  │
├────────┤
│     42 │
└────────┘

> git --version
git version 2.46.0.windows.1

> python datasets/generate.py
wrote plans.csv                   4 rows
...
done. seed = 42
```

If `python --version` opened the Microsoft Store, Python is installed but not
on your PATH. Reinstall it and check **Add python.exe to PATH**. If
`pip install duckdb` failed with a permissions error, try
`python -m pip install duckdb`.

## 2. What each tool is for

Sample answers, in the register you would use with a non-technical friend.

**Python** is a programming language that is readable enough to be a first one.
In this repo it is how I pull data from an API and turn a messy file into
something a database can read.

**DuckDB** is a database that lives in one file on my laptop, with nothing to
install or administer. It lets me practice real SQL on a realistic dataset
without needing a server or a company to give me access to theirs.

**Git** records every change I make to a set of files, so I can see what I did
last Tuesday and undo something safely. Combined with GitHub it also makes my
work visible to other people, which is why my learning log is worth keeping in
it.

## 3. First learning log entry

```text
2026-09-08
Built: local environment. Python 3.12, DuckDB, Git, VS Code, Postman, and a
       GitHub account. Regenerated the Northwind dataset, 7 CSVs.
Broke: `python --version` opened the Microsoft Store instead of running.
       Python was installed without being added to PATH. Reinstalled with the
       PATH box checked.
Understood: PATH is the list of folders the terminal searches for a command.
       If a program is not in one of them, the terminal acts like it does not
       exist even though it is installed.
```

That "understood" line is the standard to aim for: a thing you can now explain,
not a thing you did.

## 4. The seven tables

| table | one row is |
|---|---|
| `plans` | one pricing plan Northwind sells |
| `customers` | one company that bought Northwind |
| `subscriptions` | one plan a customer was on for a stretch of time |
| `users` | one person inside a customer company |
| `usage_events` | one action a user took in the product |
| `support_tickets` | one support request an account opened |
| `invoices` | one bill sent for one subscription in one month |

The distinction that matters later: `customers` are companies, `users` are
people, and one company has many people.

## 5. Calendar blocks

There is no answer to check. The only thing worth saying: put the module number
in the block title ("SE: module 04 joins") rather than "study." A vague block
gets moved. A specific one gets done.

## 6. Job posting gap list

Example, from a real associate-SE posting shape:

| requirement | status |
|---|---|
| Excellent communication, customer-facing experience | already have (CS internship) |
| Bachelor's degree | already have |
| Basic SQL | covered by modules 03 and 04 |
| Familiarity with REST APIs and JSON | covered by module 06 |
| Scripting experience (Python preferred) | covered by module 07 |
| Understanding of SaaS architecture and integrations | covered by module 08 |
| Ability to build and deliver product demos | covered by modules 09 and 10 |
| 1-2 years in a technical customer-facing role | gap: partially offset by the internship and the capstone |
| Experience with Salesforce or similar CRM | gap: name it honestly in interviews |

Two real gaps out of nine, and one of them is time. Keep this file. In week 8
you will rewrite your résumé against it, and in week 11 you will notice most
postings share the same nine lines.

## 7. Describing the job in three sentences

```text
When a company is considering buying business software, there is a salesperson
who handles the relationship and a solutions engineer who handles the
technical side. I'm the one who listens to how the customer's systems actually
work, shows them how the product fits, and answers the hard questions about
data, security, and integrations. It's half teaching and half technical
problem-solving, in front of the customer.
```

If you can say that out loud without reading it, you have already cleared the
first phone screen question.
