# 03. SQL foundations

## Why an SE needs this

Halfway through a discovery call, the VP of Operations says: "Before we go
further, can you show me which of our accounts have gone quiet?" The AE looks
at you. You are the person in the room who can answer that, and the answer is
a SQL query against the product's database. Every solutions engineer job
posting lists SQL because SEs are the ones who turn a customer's vague
question into a precise one and then answer it in front of them. This module
takes you from never having written SQL to answering that question without
help. It is the single highest-leverage skill in this repo.

## What you will be able to do

- Install DuckDB and load the Northwind Analytics CSVs into a database.
- Read a table's shape and pull back only the rows and columns you want.
- Filter with `WHERE`, including text patterns, ranges, lists, and NULLs.
- Sort, deduplicate, and limit results.
- Summarize data with `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.
- Group summaries by any column and filter the groups with `HAVING`.
- Group by month or year using date functions.
- Explain out loud why `WHERE csm_owner = NULL` returns nothing.

## Concepts

### The one-sentence version

A **query** is a written question you send to a **database**, and the database
sends back a table of rows. That is the whole idea. SQL (Structured Query
Language) is the language you write the question in.

If you know Excel, the mapping is: a **table** is a sheet, a **column** is a
column, a **row** is a row, `WHERE` is a filter, `GROUP BY` is a pivot table,
and `SUM`/`AVG` are the same functions you already use. The difference is that
SQL works on 40 million rows as easily as 40, and you can save the question and
re-run it tomorrow.

### Setup: DuckDB

**DuckDB** is a database that runs inside a single file with no server to
install and no admin to ask. You will use it for every SQL module here.

You can **run this in the browser**. On the site, every SQL block in this
module has a Run button under it and the seven Northwind tables are already
loaded, so you can write your first query without installing anything. If that
is how you are working, skip ahead to `SELECT and FROM` and come back here when
you want DuckDB on your own machine.

To **run this on your computer** instead, which is how you will work from
module 07 onward, install the Python package and the command-line tool:

```bash
pip install duckdb
```

That gives you the Python library. For the interactive command line, download
the DuckDB CLI from <https://duckdb.org/docs/installation/> and put it
somewhere on your PATH. If you would rather not deal with PATH, skip the CLI
and use the Python one-liner shown below. Both run identical SQL.

On your computer, you create the database and load the CSVs once. From the repo
root, type `duckdb northwind.duckdb` to start the CLI, then paste:

<!-- local: creates the database file on your machine; the site has already run these seven statements for you -->
```sql
CREATE TABLE plans            AS SELECT * FROM read_csv_auto('datasets/plans.csv');
CREATE TABLE customers        AS SELECT * FROM read_csv_auto('datasets/customers.csv');
CREATE TABLE subscriptions    AS SELECT * FROM read_csv_auto('datasets/subscriptions.csv');
CREATE TABLE users            AS SELECT * FROM read_csv_auto('datasets/users.csv');
CREATE TABLE usage_events     AS SELECT * FROM read_csv_auto('datasets/usage_events.csv');
CREATE TABLE support_tickets  AS SELECT * FROM read_csv_auto('datasets/support_tickets.csv');
CREATE TABLE invoices         AS SELECT * FROM read_csv_auto('datasets/invoices.csv');
```

`read_csv_auto` reads a CSV and guesses each column's type. `CREATE TABLE ... AS
SELECT` copies the result into a stored table. You do this once. Leave the CLI
with `.quit` and your data is still there in `northwind.duckdb`. The site runs
these same seven statements when a page loads, which is why the browser boxes
and your machine return identical rows.

If you skipped the CLI, the Python equivalent of running any query on your
computer is:

<!-- local: needs the duckdb Python package and the northwind.duckdb file you just created -->
```python
import duckdb
con = duckdb.connect("northwind.duckdb")
print(con.sql("SELECT count(*) FROM customers"))
```

`northwind.duckdb` is in `.gitignore` on purpose. The CSVs are the real
artifact; the database file is disposable and you can rebuild it in ten
seconds.

Read `datasets/README.md` now if you have not. Every query below runs against
those seven tables.

### SELECT and FROM

`SELECT` names the columns you want. `FROM` names the table.

Question: what does a customer record even look like?

```sql
SELECT * FROM customers LIMIT 5;
```

```text
┌─────────────┬───────────────────────┬────────────────────┬───────────────┬─────────┬─────────────┬─────────────────┐
│ customer_id │     company_name      │      industry      │    country    │ region  │ signup_date │    csm_owner    │
├─────────────┼───────────────────────┼────────────────────┼───────────────┼─────────┼─────────────┼─────────────────┤
│           1 │ Redwood Analytics     │ Healthcare         │ United States │ NA      │ 2025-12-05  │ Marcus Bell     │
│           2 │ Vantage Media Inc     │ Software           │ United States │ NA      │ 2025-12-25  │ Jordan Reyes    │
│           3 │ Meridian Financial    │ Software           │ Australia     │ APAC    │ 2024-12-08  │ Jordan Reyes    │
│           4 │ Nimbus Industries Pty │ Financial Services │ United States │ NA      │ 2025-05-28  │ Ella Nguyen     │
│           5 │ Westgate Industries   │ Financial Services │ Netherlands   │ EMEA    │ 2025-06-11  │ Sofia Marchetti │
└─────────────┴───────────────────────┴────────────────────┴───────────────┴─────────┴─────────────┴─────────────────┘
```

`*` means every column. `LIMIT 5` means stop after five rows. Always put a
`LIMIT` on your first look at an unfamiliar table, or you will pull back 40,000
rows you never wanted to read.

Naming the columns gives you a narrower result:

```sql
SELECT company_name, industry, country FROM customers LIMIT 5;
```

### Aliases

An **alias** renames a column in the output with `AS`. Use it whenever the
underlying name would confuse the person you are showing the screen to.

```sql
SELECT company_name AS account, signup_date AS became_customer
FROM customers
LIMIT 3;
```

```text
┌────────────────────┬─────────────────┐
│      account       │ became_customer │
├────────────────────┼─────────────────┤
│ Redwood Analytics  │ 2025-12-05      │
│ Vantage Media Inc  │ 2025-12-25      │
│ Meridian Financial │ 2024-12-08      │
└────────────────────┴─────────────────┘
```

### WHERE

`WHERE` keeps only the rows where a condition is true.

Question: which accounts are in Germany?

```sql
SELECT company_name, country, signup_date
FROM customers
WHERE country = 'Germany'
LIMIT 5;
```

```text
┌──────────────────────┬─────────┬─────────────┐
│     company_name     │ country │ signup_date │
├──────────────────────┼─────────┼─────────────┤
│ Meridian Health GmbH │ Germany │ 2025-12-25  │
│ Aurora Freight GmbH  │ Germany │ 2026-02-08  │
│ Halcyon Retail       │ Germany │ 2025-07-08  │
│ Willow Labs          │ Germany │ 2026-06-17  │
│ Falcon Labs          │ Germany │ 2024-10-13  │
└──────────────────────┴─────────┴─────────────┘
```

Text values go in single quotes. Numbers and dates do not need them, though a
date is clearest written as `DATE '2025-01-01'`.

The comparison operators:

| operator | meaning | example |
|---|---|---|
| `=` | equal to | `country = 'Germany'` |
| `<>` or `!=` | not equal to | `status <> 'churned'` |
| `>` `<` `>=` `<=` | greater, less, or equal | `mrr >= 5000` |
| `BETWEEN a AND b` | inclusive range | `signup_date BETWEEN DATE '2025-01-01' AND DATE '2025-03-31'` |
| `IN (a, b, c)` | matches any in the list | `industry IN ('Software', 'Retail')` |
| `LIKE 'Acme%'` | text pattern, `%` is any characters | `company_name LIKE 'Acme%'` |

Combine conditions with `AND` (both must be true), `OR` (either), and `NOT`.

```sql
SELECT company_name, industry, region
FROM customers
WHERE region = 'EMEA' AND industry = 'Healthcare';
```

That returns eight accounts. Swap `AND` for `OR` and you get every EMEA account
plus every Healthcare account anywhere, which is a much longer list. Mixing
`AND` and `OR` in one `WHERE` without parentheses is the single most common
source of a wrong answer in a live call. Use parentheses.

### NULL, the thing that will bite you

**NULL** means "no value here." It is not zero, and it is not an empty string.
Fifteen of the 200 Northwind customers are self-serve accounts with no assigned
customer success manager, so their `csm_owner` is NULL.

This looks right and is wrong:

```sql
SELECT count(*) AS rows_returned FROM customers WHERE csm_owner = NULL;
```

```text
┌───────────────┐
│ rows_returned │
├───────────────┤
│             0 │
└───────────────┘
```

Zero rows, even though fifteen accounts have no CSM. NULL means "unknown," and
"unknown = unknown" is not true, it is unknown. Comparison operators never
match NULL. You need `IS NULL` and `IS NOT NULL`:

```sql
SELECT customer_id, company_name, csm_owner
FROM customers
WHERE csm_owner IS NULL
LIMIT 5;
```

```text
┌─────────────┬───────────────────────┬───────────┐
│ customer_id │     company_name      │ csm_owner │
├─────────────┼───────────────────────┼───────────┤
│          19 │ Vertex Robotics       │ NULL      │
│          33 │ Falcon Partners       │ NULL      │
│          82 │ Orchard Financial Ltd │ NULL      │
│          89 │ Yardley Retail        │ NULL      │
│         105 │ Willow Digital        │ NULL      │
└─────────────┴───────────────────────┴───────────┘
```

`COALESCE(a, b)` returns `a` unless it is NULL, in which case it returns `b`.
Use it to make output presentable in front of a customer:

```sql
SELECT company_name, COALESCE(csm_owner, 'unassigned') AS owner
FROM customers
WHERE csm_owner IS NULL
LIMIT 3;
```

```text
┌───────────────────────┬────────────┐
│     company_name      │   owner    │
├───────────────────────┼────────────┤
│ Vertex Robotics       │ unassigned │
│ Falcon Partners       │ unassigned │
│ Orchard Financial Ltd │ unassigned │
└───────────────────────┴────────────┘
```

Whenever a customer says "your number is wrong," NULL handling is the first
place to look.

### ORDER BY and LIMIT

`ORDER BY` sorts. `ASC` is ascending and is the default; `DESC` is descending.

Question: what are our five largest active subscriptions?

```sql
SELECT subscription_id, customer_id, seats, mrr
FROM subscriptions
WHERE status = 'active'
ORDER BY mrr DESC
LIMIT 5;
```

```text
┌─────────────────┬─────────────┬───────┬───────┐
│ subscription_id │ customer_id │ seats │  mrr  │
├─────────────────┼─────────────┼───────┼───────┤
│             144 │         106 │   398 │ 35820 │
│             154 │         113 │   391 │ 35190 │
│             126 │          92 │   390 │ 35100 │
│             176 │         127 │   388 │ 34920 │
│              96 │          70 │   387 │ 34830 │
└─────────────────┴─────────────┴───────┴───────┘
```

`mrr` is **monthly recurring revenue**: the predictable revenue a subscription
produces every month. It is the number a SaaS company runs on, and you will
hear it in every internal meeting you ever attend.

You cannot yet show the company name next to these, because the name lives in
a different table. That is a **join**, and it is the first thing in module 04.

### DISTINCT

`DISTINCT` removes duplicate rows from the result.

```sql
SELECT DISTINCT industry FROM customers ORDER BY industry;
```

Eight rows come back: Education, Financial Services, Healthcare, Logistics,
Manufacturing, Media, Retail, Software. This is how you learn the allowed
values of a column you have never seen, which is exactly what you do on day one
with a customer's data export.

`COUNT(DISTINCT column)` counts unique values:

```sql
SELECT count(*) AS ticket_rows,
       count(DISTINCT customer_id) AS customers_with_tickets
FROM support_tickets;
```

```text
┌─────────────┬────────────────────────┐
│ ticket_rows │ customers_with_tickets │
├─────────────┼────────────────────────┤
│        1615 │                    197 │
└─────────────┴────────────────────────┘
```

1,615 tickets came from 197 different accounts. Two very different numbers, and
saying the wrong one on a call is embarrassing in a way you only need to
experience once.

### Aggregate functions

An **aggregate function** collapses many rows into one number.

| function | what it does | NULL behavior |
|---|---|---|
| `count(*)` | counts rows | counts every row |
| `count(col)` | counts non-NULL values in `col` | skips NULLs |
| `sum(col)` | adds values | skips NULLs |
| `avg(col)` | mean | skips NULLs |
| `min(col)` / `max(col)` | smallest / largest | skips NULLs |
| `round(x, 2)` | rounds to 2 decimals | not an aggregate, but you will use it constantly |

The `count(*)` versus `count(col)` difference is a favorite interview question,
and here it is in one query:

```sql
SELECT count(*) AS all_customers, count(csm_owner) AS with_csm FROM customers;
```

```text
┌───────────────┬──────────┐
│ all_customers │ with_csm │
├───────────────┼──────────┤
│           200 │      185 │
└───────────────┴──────────┘
```

Several aggregates at once:

```sql
SELECT count(*) AS active_subs,
       sum(mrr) AS total_mrr,
       round(avg(mrr), 2) AS avg_mrr,
       min(mrr) AS smallest,
       max(mrr) AS largest
FROM subscriptions
WHERE status = 'active';
```

```text
┌─────────────┬───────────┬─────────┬──────────┬─────────┐
│ active_subs │ total_mrr │ avg_mrr │ smallest │ largest │
├─────────────┼───────────┼─────────┼──────────┼─────────┤
│         147 │   1207610 │ 8215.03 │        0 │   35820 │
└─────────────┴───────────┴─────────┴──────────┴─────────┘
```

Northwind runs about 1.2 million dollars of MRR across 147 active
subscriptions. The smallest is zero because Free-plan customers have real
subscriptions at no cost.

Now the NULL trap again, this time inside an average:

```sql
SELECT count(*) AS all_tickets,
       count(satisfaction_score) AS scored_tickets,
       round(avg(satisfaction_score), 2) AS avg_score
FROM support_tickets;
```

```text
┌─────────────┬────────────────┬───────────┐
│ all_tickets │ scored_tickets │ avg_score │
├─────────────┼────────────────┼───────────┤
│        1615 │            988 │      3.84 │
└─────────────┴────────────────┴───────────┘
```

"Our average satisfaction is 3.84" is true only for the 988 tickets where
someone answered the survey. If you present 3.84 as the score across all 1,615
tickets, you have quietly assumed the 627 non-responders felt the same as the
responders. Say the denominator out loud. It builds more trust than the number
does.

### GROUP BY

`GROUP BY` splits rows into buckets and runs the aggregate once per bucket. It
is a pivot table.

Question: how many customers do we have per region?

```sql
SELECT region, count(*) AS customers
FROM customers
GROUP BY region
ORDER BY customers DESC;
```

```text
┌─────────┬───────────┐
│ region  │ customers │
├─────────┼───────────┤
│ NA      │        82 │
│ EMEA    │        71 │
│ APAC    │        34 │
│ LATAM   │        13 │
└─────────┴───────────┘
```

The rule: every column in your `SELECT` must either be in the `GROUP BY` or be
wrapped in an aggregate function. If you break it, the database will tell you
so, which is how you learn it.

Question: how does MRR split across subscription statuses?

```sql
SELECT status, count(*) AS subscriptions, sum(mrr) AS total_mrr
FROM subscriptions
GROUP BY status
ORDER BY total_mrr DESC;
```

```text
┌─────────┬───────────────┬───────────┐
│ status  │ subscriptions │ total_mrr │
├─────────┼───────────────┼───────────┤
│ active  │           147 │   1207610 │
│ churned │           117 │    228720 │
│ trial   │             5 │     10870 │
└─────────┴───────────────┴───────────┘
```

Careful with that middle row. 117 churned *subscriptions* is not 117 churned
*customers*: when a customer upgrades from Pro to Enterprise, the old
subscription row ends and is marked `churned` while a new row starts. Module 04
teaches you to count churned customers correctly. For now, notice the trap.

### HAVING

`WHERE` filters rows before grouping. `HAVING` filters groups after grouping.
That is the entire difference, and it is another standard interview question.

Question: which industries have more than 25 customers?

```sql
SELECT industry, count(*) AS customers
FROM customers
GROUP BY industry
HAVING count(*) > 25
ORDER BY customers DESC;
```

```text
┌───────────────┬───────────┐
│   industry    │ customers │
├───────────────┼───────────┤
│ Education     │        31 │
│ Media         │        29 │
│ Manufacturing │        27 │
└───────────────┴───────────┘
```

Both together, which is the normal case:

```sql
SELECT industry, count(*) AS emea_customers
FROM customers
WHERE region = 'EMEA'
GROUP BY industry
HAVING count(*) >= 5
ORDER BY emea_customers DESC;
```

`WHERE region = 'EMEA'` throws away non-EMEA rows first; `HAVING count(*) >= 5`
then throws away the small industries.

### Dates

Dates are where SQL dialects differ most, so learn the concept and look up the
exact function name per database.

`date_trunc('month', ts)` flattens a timestamp to the first instant of its
month. It is how every "per month" chart gets built.

```sql
SELECT date_trunc('month', opened_at) AS month, count(*) AS tickets
FROM support_tickets
WHERE opened_at >= DATE '2026-01-01'
GROUP BY month
ORDER BY month;
```

```text
┌─────────────────────┬─────────┐
│        month        │ tickets │
├─────────────────────┼─────────┤
│ 2026-01-01 00:00:00 │      89 │
│ 2026-02-01 00:00:00 │      83 │
│ 2026-03-01 00:00:00 │     115 │
│ 2026-04-01 00:00:00 │     137 │
│ 2026-05-01 00:00:00 │     145 │
│ 2026-06-01 00:00:00 │     153 │
│ 2026-07-01 00:00:00 │     168 │
│ 2026-08-01 00:00:00 │     154 │
└─────────────────────┴─────────┘
```

`year(col)` pulls the year out as a number:

```sql
SELECT year(signup_date) AS signup_year, count(*) AS customers
FROM customers
GROUP BY signup_year
ORDER BY signup_year;
```

```text
┌─────────────┬───────────┐
│ signup_year │ customers │
├─────────────┼───────────┤
│        2024 │        43 │
│        2025 │        98 │
│        2026 │        59 │
└─────────────┴───────────┘
```

`date_diff('unit', start, end)` measures elapsed time:

```sql
SELECT ticket_id, opened_at, closed_at,
       date_diff('hour', opened_at, closed_at) AS hours_to_close
FROM support_tickets
WHERE closed_at IS NOT NULL
ORDER BY ticket_id
LIMIT 5;
```

```text
┌───────────┬─────────────────────┬─────────────────────┬────────────────┐
│ ticket_id │      opened_at      │      closed_at      │ hours_to_close │
├───────────┼─────────────────────┼─────────────────────┼────────────────┤
│         2 │ 2024-03-19 10:19:07 │ 2024-03-19 18:36:07 │              8 │
│         3 │ 2024-04-10 10:34:58 │ 2024-04-10 12:43:58 │              2 │
│         4 │ 2024-04-29 14:14:35 │ 2024-04-29 22:26:35 │              8 │
│         5 │ 2024-05-02 09:13:15 │ 2024-05-05 09:25:15 │             72 │
│         6 │ 2024-05-04 08:10:59 │ 2024-05-05 11:06:59 │             27 │
└───────────┴─────────────────────┴─────────────────────┴────────────────┘
```

The `WHERE closed_at IS NOT NULL` is not optional. Without it the 229 still-open
tickets come back with NULL hours and drag your "average time to close" into
fiction.

### The order the database actually reads your query

You write it in this order:

```text
SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY -> LIMIT
```

The database evaluates it in this order:

```text
FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT
```

That one fact explains two things that otherwise feel arbitrary: you cannot use
a `SELECT` alias inside `WHERE` (the alias does not exist yet), and you can use
it inside `ORDER BY` (by then it does).

### Does this SQL work anywhere else

Yes, mostly. `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`,
`LIMIT`, and the aggregates are identical in **PostgreSQL**, **Snowflake**,
**BigQuery**, and DuckDB. What differs:

| thing | DuckDB / PostgreSQL | Snowflake | SQL Server |
|---|---|---|---|
| limit rows | `LIMIT 10` | `LIMIT 10` | `TOP 10` |
| string join | `'a' \|\| 'b'` | `'a' \|\| 'b'` | `'a' + 'b'` |
| current time | `now()` | `current_timestamp()` | `GETDATE()` |
| date difference | `date_diff('day', a, b)` | `datediff('day', a, b)` | `DATEDIFF(day, a, b)` |

When a customer asks "does this work on our Snowflake," the honest answer is
"the query logic is the same, the date functions get renamed." That is a real
SE answer.

## Walkthrough

The discovery-call question: **which accounts have gone quiet?** Northwind's
last data is from 2026-08-31, so "quiet" means no usage event in the 60 days
before then, meaning nothing since 2026-07-02.

Step 1. Get to somewhere you can run SQL. In the browser, that is any of the
boxes on this page; the tables are already loaded, so there is nothing to do.
On your computer, open the database from the repo root.

```bash
duckdb northwind.duckdb
```

Step 2. Confirm you are pointed at real data.

```sql
SELECT count(*) AS customers FROM customers;
```

```text
┌───────────┐
│ customers │
├───────────┤
│       200 │
└───────────┘
```

Step 3. Find the last time each account did anything. `usage_events` carries
`customer_id`, so you do not need another table yet.

```sql
SELECT customer_id, max(event_ts) AS last_activity
FROM usage_events
GROUP BY customer_id
ORDER BY last_activity
LIMIT 10;
```

```text
┌─────────────┬─────────────────────┐
│ customer_id │    last_activity    │
├─────────────┼─────────────────────┤
│          41 │ 2025-01-12 14:23:09 │
│         153 │ 2025-01-30 17:23:57 │
│          29 │ 2025-05-06 15:43:20 │
│          25 │ 2025-06-27 10:00:42 │
│         187 │ 2025-07-03 13:58:27 │
│         149 │ 2025-08-13 02:16:58 │
│         168 │ 2025-09-01 09:29:52 │
│         132 │ 2025-10-04 12:55:49 │
│         181 │ 2025-11-24 13:53:25 │
│         179 │ 2025-11-27 20:09:08 │
└─────────────┴─────────────────────┘
```

Step 4. Keep only the groups whose last activity is older than the cutoff. The
filter is on an aggregate, so it belongs in `HAVING`, not `WHERE`.

```sql
SELECT customer_id, max(event_ts) AS last_activity, count(*) AS lifetime_events
FROM usage_events
GROUP BY customer_id
HAVING max(event_ts) < DATE '2026-07-02'
ORDER BY last_activity DESC;
```

```text
┌─────────────┬─────────────────────┬─────────────────┐
│ customer_id │    last_activity    │ lifetime_events │
├─────────────┼─────────────────────┼─────────────────┤
│         137 │ 2026-06-30 09:30:02 │             138 │
│          77 │ 2026-06-27 13:38:25 │              35 │
│           8 │ 2026-06-16 07:42:41 │             193 │
│         197 │ 2026-06-10 06:57:19 │              87 │
│          31 │ 2026-06-06 07:52:22 │             130 │
│           ·  │          ·         │              ·  │
│         153 │ 2025-01-30 17:23:57 │              79 │
│          41 │ 2025-01-12 14:23:09 │             370 │
└─────────────┴─────────────────────┴─────────────────┘
  43 rows (20 shown)                        3 columns
```

43 accounts out of 200 have gone quiet. Note the last column: customer 41
generated 370 events and then stopped completely, which is a very different
story from customer 77, who barely started. On a real call that distinction is
the whole conversation.

Step 5. Write down what you would actually say. Something like: "43 of your 200
accounts have had no activity in the last 60 days. 31 of them logged more than a hundred events
before they stopped, which usually means an internal champion left. I can
send you that list broken out by account owner."

You cannot yet put company names on that list, because the names are in
`customers` and the events are in `usage_events`. That gap is the reason module
04 exists.

## Exercises

<!-- cells -->

Ten questions, all against the seven Northwind tables. In the browser, write
each answer in the empty box under it and press Run. On your computer, write
them in `exercises.sql` in this folder and run them in DuckDB. Either way,
check `solutions.md` afterward. Try each one before you look. Getting a syntax
error and fixing it is the learning.

1. List the company name and country of every customer in the Education
   industry, sorted alphabetically by company name.
2. Show the ten oldest customer accounts: `customer_id`, `company_name`, and
   `signup_date`, oldest first.
3. List `customer_id`, `company_name`, and `region` for every account with no
   assigned CSM.
4. What is the total MRR of all active subscriptions, and how many active
   subscriptions are there? One row, two columns.
5. In one query, return the total number of tickets, the number that have a
   satisfaction score, and the average score rounded to two decimals.
6. List the ten largest active Enterprise subscriptions (`plan_id` 4) by MRR,
   showing `subscription_id`, `customer_id`, `seats`, and `mrr`.
7. Count tickets by priority for tickets opened on or after 2026-01-01, most
   first.
8. Monthly ticket volume by priority for 2026: one row per month per priority,
   ordered by month, then by ticket count descending.
9. How many users have never logged in, broken out by role, most first.
10. Which customers opened 20 or more support tickets? Show `customer_id` and
    the count.

## Checkpoint

<details>
<summary>1. Why does <code>WHERE csm_owner = NULL</code> return zero rows?</summary>

NULL means "unknown." Comparing anything to an unknown value produces neither
true nor false, so no row passes the filter. Use `IS NULL` instead.
</details>

<details>
<summary>2. What is the difference between <code>WHERE</code> and <code>HAVING</code>?</summary>

`WHERE` filters individual rows before they are grouped. `HAVING` filters the
groups after aggregation, so it is the only one that can reference `count(*)`,
`sum(...)`, and other aggregates.
</details>

<details>
<summary>3. <code>count(*)</code> returned 200 and <code>count(csm_owner)</code> returned 185 on the same table. Why?</summary>

`count(*)` counts rows. `count(column)` counts rows where that column is not
NULL. Fifteen customers have no CSM assigned.
</details>

<details>
<summary>4. You wrote <code>SELECT mrr AS revenue FROM subscriptions WHERE revenue > 5000</code> and got an error. Why?</summary>

The database evaluates `WHERE` before `SELECT`, so the alias `revenue` does not
exist yet. Repeat the expression in `WHERE`, or use the alias in `ORDER BY`,
which does run after `SELECT`.
</details>

<details>
<summary>5. A customer asks for "average time to close a ticket." What do you check before answering?</summary>

Whether open tickets are excluded. 229 tickets have a NULL `closed_at`; the
average silently ignores them, so the number describes only tickets that were
closed. Say the denominator out loud.
</details>

You can now say:

- "I write SQL against a live dataset: filtering, aggregating, grouping, and
  handling NULLs correctly."
- "I know why `WHERE` and `HAVING` are different and when a filter has to run
  after aggregation."
- "I check the denominator before I present an average, because NULLs are
  excluded silently and that changes what the number means."

## Put it on your résumé

- Wrote 30-plus SQL queries against a seven-table, 45,000-row B2B SaaS dataset
  in DuckDB to answer account-health questions, including a query that flagged
  43 of 200 accounts with no product usage in 60 days.
- Built customer-facing summaries of usage, support, and revenue data using
  aggregation, grouping, and NULL-safe filtering.

## Go deeper

- [SQLBolt](https://sqlbolt.com/) - interactive lessons in the browser with no
  setup; do lessons 1 through 6 as a second pass over this module.
- [Mode's SQL Tutorial, Basic
  section](https://mode.com/sql-tutorial/introduction-to-sql/) - the same
  material written for analysts, with a business framing close to SE work.
- [DuckDB SQL introduction](https://duckdb.org/docs/sql/introduction) - the
  reference for the exact engine you are running.
- [Select Star SQL](https://selectstarsql.com/) - a free book that teaches SQL
  through one real dataset, good for building query intuition.
- [PostgreSQL date/time functions](https://www.postgresql.org/docs/current/functions-datetime.html)
  - the dialect most SaaS products use; skim it so the differences stop
  surprising you.
