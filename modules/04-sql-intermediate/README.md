# 04. SQL intermediate

## Why an SE needs this

You are two days from a demo. The AE wants one screen that shows the
prospect's kind of business: top accounts by revenue, which ones are at risk,
and how the trend moved last quarter. Every one of those numbers lives in a
different table, so every one of them is a join. Module 03 got you answers with
`customer_id` in them; nobody in a meeting cares about `customer_id`. This
module is where SQL starts producing things a customer would actually look at,
and where the questions in an SE technical screen come from. Joins, CTEs, and
window functions are the three things interviewers check.

## What you will be able to do

- Combine tables with `INNER`, `LEFT`, `RIGHT`, and `FULL` joins and predict
  the row count before you run the query.
- Use a `LEFT JOIN ... IS NULL` to find records that are missing on one side.
- Join a table to itself to compare rows within one table.
- Write subqueries in `WHERE` and `FROM`, and rewrite them as readable CTEs.
- Use `CASE` to bucket, label, and count conditionally.
- Use `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, and running totals with
  `PARTITION BY`.
- Answer the standard SQL interview questions: second-highest, deduplication,
  top N per group, month-over-month change, cohort retention, churn rate.

## Concepts

Same seven Northwind tables as module 03, so there is no new setup. Run this in
the browser using the box under each query, or run it on your computer in
`duckdb northwind.duckdb`. The SQL is identical either way.

### Joins

A **join** combines rows from two tables using a condition, almost always
`table_a.some_id = table_b.some_id`. The column that points at another table's
primary key is a **foreign key**. In Northwind, `subscriptions.customer_id`
points at `customers.customer_id`.

An **INNER JOIN** keeps only rows that match on both sides.

```sql
SELECT c.company_name, s.seats, s.mrr
FROM subscriptions s
INNER JOIN customers c ON s.customer_id = c.customer_id
WHERE s.status = 'active'
ORDER BY s.mrr DESC
LIMIT 5;
```

```text
┌──────────────────────┬───────┬───────┐
│     company_name     │ seats │  mrr  │
├──────────────────────┼───────┼───────┤
│ Solstice Foods       │   398 │ 35820 │
│ Umber Labs Inc       │   391 │ 35190 │
│ Sable Systems LLC    │   390 │ 35100 │
│ Redwood Retail GmbH  │   388 │ 34920 │
│ Blue Ridge Analytics │   387 │ 34830 │
└──────────────────────┴───────┴───────┘
```

That is the module 03 query with names attached. `s` and `c` are **table
aliases**: short names so you can write `c.company_name` instead of
`customers.company_name`. Once two tables are in play, prefix every column.

Join as many tables as you need. `JOIN` on its own means `INNER JOIN`.

```sql
SELECT c.company_name, p.name AS plan, s.seats, s.mrr
FROM subscriptions s
JOIN customers c ON c.customer_id = s.customer_id
JOIN plans p ON p.plan_id = s.plan_id
WHERE s.status = 'active' AND p.name = 'Enterprise'
ORDER BY s.mrr DESC
LIMIT 5;
```

Filtering on `p.name = 'Enterprise'` is better than `s.plan_id = 4`. It says
what you mean and it survives someone renumbering the plans.

### The four join types and the row-count intuition

| join | keeps |
|---|---|
| `INNER JOIN` | rows that match in both tables |
| `LEFT JOIN` | all rows from the left table, plus matches from the right, NULLs where there is no match |
| `RIGHT JOIN` | all rows from the right table, plus matches from the left |
| `FULL JOIN` | every row from both sides, NULLs wherever there is no match |

`RIGHT JOIN` is `LEFT JOIN` with the tables written in the other order. Most
teams write `LEFT JOIN` for everything, and reviewers expect that.

The intuition that keeps you out of trouble: **a join does not preserve the row
count of either table.** It produces one row per matching pair.

```sql
SELECT
  (SELECT count(*) FROM customers) AS customers,
  (SELECT count(*) FROM support_tickets) AS tickets,
  (SELECT count(*) FROM customers c JOIN support_tickets t
     ON c.customer_id = t.customer_id) AS inner_rows,
  (SELECT count(*) FROM customers c LEFT JOIN support_tickets t
     ON c.customer_id = t.customer_id) AS left_rows;
```

```text
┌───────────┬─────────┬────────────┬───────────┐
│ customers │ tickets │ inner_rows │ left_rows │
├───────────┼─────────┼────────────┼───────────┤
│       200 │    1615 │       1615 │      1618 │
└───────────┴─────────┴────────────┴───────────┘
```

Read that carefully. The inner join returns 1,615 rows, not 200: each customer
appears once per ticket. The left join returns 1,618, three more, because three
customers have no tickets at all and a `LEFT JOIN` keeps them with NULLs.

If you ever sum a customer-level number after joining to a per-row table, you
will double count. That is the most expensive mistake in this module, and it
usually surfaces as a revenue number that is somehow four times too large.

### LEFT JOIN plus IS NULL: the anti-join

The most useful pattern in SE work: find rows on the left with nothing on the
right.

```sql
SELECT c.customer_id, c.company_name, c.signup_date
FROM customers c
LEFT JOIN support_tickets t ON t.customer_id = c.customer_id
WHERE t.ticket_id IS NULL;
```

```text
┌─────────────┬────────────────────────┬─────────────┐
│ customer_id │      company_name      │ signup_date │
├─────────────┼────────────────────────┼─────────────┤
│         104 │ Cobalt Industries      │ 2025-09-02  │
│          39 │ Falcon Logistics Co    │ 2026-02-28  │
│         196 │ Cobalt Interactive Ltd │ 2024-04-26  │
└─────────────┴────────────────────────┴─────────────┘
```

Three accounts have never opened a ticket. Depending on the conversation that
is either your happiest customer or the one nobody has heard from since
onboarding. That ambiguity is the job.

`count(*)` versus `count(column)` matters again here:

```sql
SELECT c.company_name, count(*) AS count_star, count(t.ticket_id) AS count_tickets
FROM customers c
LEFT JOIN support_tickets t ON t.customer_id = c.customer_id
WHERE c.customer_id IN (104, 19)
GROUP BY c.company_name;
```

```text
┌───────────────────┬────────────┬───────────────┐
│   company_name    │ count_star │ count_tickets │
├───────────────────┼────────────┼───────────────┤
│ Vertex Robotics   │          8 │             8 │
│ Cobalt Industries │          1 │             0 │
└───────────────────┴────────────┴───────────────┘
```

Cobalt Industries has zero tickets, but the left join gave it one row full of
NULLs, so `count(*)` says 1 and `count(t.ticket_id)` says 0. After a `LEFT
JOIN`, always count the right-hand table's column, never `*`.

### Self joins

A **self join** joins a table to itself, with two aliases. Use it to compare
rows inside one table. Northwind has six pairs of accounts that share a company
name:

```sql
SELECT a.customer_id AS id_a, b.customer_id AS id_b, a.company_name
FROM customers a
JOIN customers b
  ON a.company_name = b.company_name
 AND a.customer_id < b.customer_id
ORDER BY a.company_name;
```

```text
┌───────┬───────┬─────────────────────────┐
│ id_a  │ id_b  │      company_name       │
├───────┼───────┼─────────────────────────┤
│    16 │    54 │ Anchor Learning         │
│    10 │   140 │ Halcyon Industries GmbH │
│    13 │   162 │ Ironclad Labs           │
│    14 │    43 │ Ridgeline Industries    │
│    19 │    37 │ Vertex Robotics         │
│    17 │   177 │ Westgate Works          │
└───────┴───────┴─────────────────────────┘
```

The `a.customer_id < b.customer_id` condition does two jobs: it stops every row
from matching itself, and it returns each pair once instead of twice. This is
the exact query you run in week one of an implementation when the customer
swears they have no duplicate accounts.

### Subqueries

A **subquery** is a query inside a query. In `WHERE`, it produces a list or a
single value:

```sql
SELECT company_name, country
FROM customers
WHERE customer_id IN (
  SELECT customer_id FROM subscriptions WHERE plan_id = 4 AND status = 'active'
)
ORDER BY company_name
LIMIT 5;
```

```sql
SELECT count(*) AS above_average
FROM subscriptions
WHERE status = 'active'
  AND mrr > (SELECT avg(mrr) FROM subscriptions WHERE status = 'active');
```

That returns 49: only 49 of the 147 active subscriptions are above the average
MRR, because a handful of Enterprise deals drag the mean up. When a customer
asks for "the average," offering the median or the distribution instead is what
a good SE does.

In `FROM`, a subquery is a **derived table**: a temporary result you query
again. To average a count, you must count first, then average:

```sql
SELECT round(avg(ticket_count), 2) AS avg_tickets_per_customer
FROM (
  SELECT customer_id, count(*) AS ticket_count
  FROM support_tickets
  GROUP BY customer_id
) AS per_customer;
```

8.2 tickets per account that has any tickets.

### CTEs

A **CTE** (common table expression) is the same derived table, named and moved
to the top with `WITH`. Same result, far more readable, and you can chain
several.

```sql
WITH per_customer AS (
  SELECT customer_id, count(*) AS ticket_count
  FROM support_tickets
  GROUP BY customer_id
)
SELECT round(avg(ticket_count), 2) AS avg_tickets_per_customer,
       max(ticket_count) AS busiest_account
FROM per_customer;
```

```text
┌──────────────────────────┬─────────────────┐
│ avg_tickets_per_customer │ busiest_account │
├──────────────────────────┼─────────────────┤
│                      8.2 │              21 │
└──────────────────────────┴─────────────────┘
```

Write CTEs by default. When you are screen-sharing a query, a reader can follow
`WITH monthly AS (...)` and cannot follow three nested subqueries. Every
remaining example in this module uses them.

### CASE

`CASE` is an if-then-else that produces a value. Use it to bucket:

```sql
SELECT CASE
         WHEN mrr = 0 THEN '0 free'
         WHEN mrr < 1000 THEN '1 under 1k'
         WHEN mrr < 10000 THEN '2 1k to 10k'
         ELSE '3 10k plus'
       END AS mrr_band,
       count(*) AS subscriptions,
       sum(mrr) AS total_mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY mrr_band
ORDER BY mrr_band;
```

```text
┌─────────────┬───────────────┬───────────┐
│  mrr_band   │ subscriptions │ total_mrr │
├─────────────┼───────────────┼───────────┤
│ 0 free      │             5 │         0 │
│ 1 under 1k  │            42 │     12060 │
│ 2 1k to 10k │            55 │    183050 │
│ 3 10k plus  │            45 │   1012500 │
└─────────────┴───────────────┴───────────┘
```

45 of 147 subscriptions produce 84 percent of the revenue. The numeric prefixes
in the labels exist only so `ORDER BY` sorts them in business order rather than
alphabetically.

`CASE` inside `SUM` counts things conditionally, which is how you pivot:

```sql
SELECT region,
       count(*) AS accounts,
       sum(CASE WHEN csm_owner IS NULL THEN 1 ELSE 0 END) AS unassigned
FROM customers
GROUP BY region
ORDER BY accounts DESC;
```

### Window functions

A **window function** computes across a set of rows related to the current row
without collapsing them. `GROUP BY` gives you one row per group; a window
function keeps every row and adds a column.

The syntax is `function() OVER (PARTITION BY ... ORDER BY ...)`. `PARTITION BY`
starts the calculation over per group; `ORDER BY` sets the order inside it.

**ROW_NUMBER, RANK, DENSE_RANK** all number rows, and differ only on ties:

```sql
WITH counts AS (
  SELECT customer_id, count(*) AS tickets
  FROM support_tickets GROUP BY customer_id
)
SELECT customer_id, tickets,
       rank()       OVER (ORDER BY tickets DESC) AS rnk,
       dense_rank() OVER (ORDER BY tickets DESC) AS dense_rnk,
       row_number() OVER (ORDER BY tickets DESC, customer_id) AS rn
FROM counts
ORDER BY tickets DESC, customer_id
LIMIT 8;
```

```text
┌─────────────┬─────────┬───────┬───────────┬───────┐
│ customer_id │ tickets │  rnk  │ dense_rnk │  rn   │
├─────────────┼─────────┼───────┼───────────┼───────┤
│         176 │      21 │     1 │         1 │     1 │
│          59 │      20 │     2 │         2 │     2 │
│          63 │      20 │     2 │         2 │     3 │
│         135 │      20 │     2 │         2 │     4 │
│           3 │      19 │     5 │         3 │     5 │
│          18 │      19 │     5 │         3 │     6 │
│         109 │      19 │     5 │         3 │     7 │
│         179 │      19 │     5 │         3 │     8 │
└─────────────┴─────────┴───────┴───────────┴───────┘
```

Three accounts tie at 20. `rank` gives them all 2 and then skips to 5.
`dense_rank` gives them all 2 and continues at 3. `row_number` breaks the tie
arbitrarily unless you add a tiebreaker column, which is why the `row_number`
call above orders by `customer_id` as well. Being able to explain that
difference in one sentence is a genuine interview answer.

**Top N per group** is `ROW_NUMBER` in a CTE, filtered outside it. You cannot
filter on a window function in `WHERE`, because window functions run after
`WHERE`:

```sql
WITH ranked AS (
  SELECT c.region, c.company_name, s.mrr,
         row_number() OVER (PARTITION BY c.region ORDER BY s.mrr DESC) AS rn
  FROM subscriptions s
  JOIN customers c ON c.customer_id = s.customer_id
  WHERE s.status = 'active'
)
SELECT region, company_name, mrr, rn
FROM ranked
WHERE rn <= 2
ORDER BY region, rn;
```

```text
┌─────────┬─────────────────────┬───────┬───────┐
│ region  │    company_name     │  mrr  │  rn   │
├─────────┼─────────────────────┼───────┼───────┤
│ APAC    │ Sable Systems LLC   │ 35100 │     1 │
│ APAC    │ Tidewater Financial │ 27270 │     2 │
│ EMEA    │ Umber Labs Inc      │ 35190 │     1 │
│ EMEA    │ Meridian Media SA   │ 34200 │     2 │
│ LATAM   │ Cedar Robotics Co   │ 24660 │     1 │
│ LATAM   │ Umber Foods         │ 23670 │     2 │
│ NA      │ Solstice Foods      │ 35820 │     1 │
│ NA      │ Redwood Retail GmbH │ 34920 │     2 │
└─────────┴─────────────────────┴───────┴───────┘
```

**LAG** reaches back to the previous row, which is how every
month-over-month comparison gets built:

```sql
WITH monthly AS (
  SELECT date_trunc('month', opened_at) AS month, count(*) AS tickets
  FROM support_tickets
  WHERE opened_at >= DATE '2026-01-01'
  GROUP BY month
)
SELECT month, tickets,
       lag(tickets) OVER (ORDER BY month) AS prior_month,
       tickets - lag(tickets) OVER (ORDER BY month) AS change
FROM monthly
ORDER BY month;
```

```text
┌─────────────────────┬─────────┬─────────────┬────────┐
│        month        │ tickets │ prior_month │ change │
├─────────────────────┼─────────┼─────────────┼────────┤
│ 2026-01-01 00:00:00 │      89 │        NULL │   NULL │
│ 2026-02-01 00:00:00 │      83 │          89 │     -6 │
│ 2026-03-01 00:00:00 │     115 │          83 │     32 │
│ 2026-04-01 00:00:00 │     137 │         115 │     22 │
│ 2026-05-01 00:00:00 │     145 │         137 │      8 │
│ 2026-06-01 00:00:00 │     153 │         145 │      8 │
│ 2026-07-01 00:00:00 │     168 │         153 │     15 │
│ 2026-08-01 00:00:00 │     154 │         168 │    -14 │
└─────────────────────┴─────────┴─────────────┴────────┘
```

The first row is NULL because there is no earlier month. That NULL is correct,
and hiding it with `COALESCE(..., 0)` would invent a 100 percent increase in
January. `LEAD` is the same function pointing forward.

**Running totals** are an aggregate with `OVER (ORDER BY ...)`:

```sql
WITH monthly AS (
  SELECT date_trunc('month', start_date) AS month, sum(mrr) AS new_mrr
  FROM subscriptions
  WHERE status = 'active' AND start_date >= DATE '2026-01-01'
  GROUP BY month
)
SELECT month, new_mrr,
       sum(new_mrr) OVER (ORDER BY month) AS running_total
FROM monthly
ORDER BY month;
```

```text
┌─────────────────────┬─────────┬───────────────┐
│        month        │ new_mrr │ running_total │
├─────────────────────┼─────────┼───────────────┤
│ 2026-01-01 00:00:00 │   83870 │         83870 │
│ 2026-02-01 00:00:00 │   70775 │        154645 │
│ 2026-03-01 00:00:00 │   77025 │        231670 │
│ 2026-04-01 00:00:00 │  178010 │        409680 │
│ 2026-05-01 00:00:00 │   90640 │        500320 │
│ 2026-06-01 00:00:00 │   89880 │        590200 │
│ 2026-07-01 00:00:00 │  137740 │        727940 │
└─────────────────────┴─────────┴───────────────┘
```

**PARTITION BY** restarts the numbering per group. Here it exposes the upgrade
path hidden in `subscriptions`:

```sql
SELECT customer_id, subscription_id, plan_id, start_date, end_date, status,
       row_number() OVER (PARTITION BY customer_id ORDER BY start_date) AS seq
FROM subscriptions
WHERE customer_id IN (2, 5)
ORDER BY customer_id, seq;
```

```text
┌─────────────┬─────────────────┬─────────┬────────────┬────────────┬─────────┬───────┐
│ customer_id │ subscription_id │ plan_id │ start_date │  end_date  │ status  │  seq  │
├─────────────┼─────────────────┼─────────┼────────────┼────────────┼─────────┼───────┤
│           2 │               2 │       1 │ 2025-12-25 │ 2026-04-24 │ churned │     1 │
│           2 │               3 │       2 │ 2026-04-24 │ NULL       │ active  │     2 │
│           5 │               6 │       2 │ 2025-06-11 │ 2026-02-21 │ churned │     1 │
│           5 │               7 │       3 │ 2026-02-21 │ NULL       │ active  │     2 │
└─────────────┴─────────────────┴─────────┴────────────┴────────────┴─────────┴───────┘
```

Both customers show a `churned` subscription, and both are still customers.
They upgraded: Free to Starter, and Starter to Pro. This is why counting rows
where `status = 'churned'` gives 117 while only 53 customers actually left.

### Churn, done correctly

A customer has churned if none of their subscriptions is active. Collapse to
one row per customer first, then count:

```sql
WITH per_customer AS (
  SELECT customer_id,
         max(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS has_active
  FROM subscriptions
  GROUP BY customer_id
)
SELECT count(*) AS customers,
       sum(has_active) AS still_active,
       count(*) - sum(has_active) AS churned,
       round(100.0 * (count(*) - sum(has_active)) / count(*), 1) AS churn_rate_pct
FROM per_customer;
```

```text
┌───────────┬──────────────┬─────────┬────────────────┐
│ customers │ still_active │ churned │ churn_rate_pct │
├───────────┼──────────────┼─────────┼────────────────┤
│       200 │          147 │      53 │           26.5 │
└───────────┴──────────────┴─────────┴────────────────┘
```

`max(CASE WHEN ... THEN 1 ELSE 0 END)` is the SQL way to say "is any row in
this group true." The `100.0` is deliberate: `100` would do integer division in
some engines and hand you a 0.

### Cohort retention

A **cohort** is a group defined by when they started. Retention by cohort is
the standard SaaS health chart, and it is a CTE plus a `GROUP BY`:

```sql
WITH cohort AS (
  SELECT c.customer_id,
         date_trunc('month', c.signup_date) AS cohort_month,
         max(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS retained
  FROM customers c
  JOIN subscriptions s ON s.customer_id = c.customer_id
  GROUP BY c.customer_id, cohort_month
)
SELECT cohort_month, count(*) AS signed_up, sum(retained) AS still_active,
       round(100.0 * sum(retained) / count(*), 1) AS retention_pct
FROM cohort
WHERE cohort_month >= DATE '2026-01-01'
GROUP BY cohort_month
ORDER BY cohort_month;
```

```text
┌─────────────────────┬───────────┬──────────────┬───────────────┐
│    cohort_month     │ signed_up │ still_active │ retention_pct │
├─────────────────────┼───────────┼──────────────┼───────────────┤
│ 2026-01-01 00:00:00 │        13 │           12 │          92.3 │
│ 2026-02-01 00:00:00 │        13 │            7 │          53.8 │
│ 2026-03-01 00:00:00 │        19 │           17 │          89.5 │
│ 2026-04-01 00:00:00 │         4 │            2 │          50.0 │
│ 2026-05-01 00:00:00 │         7 │            3 │          42.9 │
│ 2026-06-01 00:00:00 │         2 │            1 │          50.0 │
│ 2026-07-01 00:00:00 │         1 │            1 │         100.0 │
└─────────────────────┴───────────┴──────────────┴───────────────┘
```

Look at the last row before you present this: 100 percent retention out of one
customer. Always show the denominator next to the percentage, or someone will
put "100% retention" on a slide.

### Deduplication

The standard pattern: number the duplicates, keep number 1.

```sql
WITH ranked AS (
  SELECT customer_id, company_name,
         row_number() OVER (PARTITION BY company_name ORDER BY customer_id) AS rn
  FROM customers
)
SELECT customer_id, company_name FROM ranked WHERE rn > 1 ORDER BY company_name;
```

Six rows come back, the second copy of each duplicated name. `WHERE rn = 1`
gives you the clean list of 194. During a data migration this query is how you
tell the customer exactly which records you are about to merge.

### Interview question bank

Fifteen questions in the style you will get in an SE technical screen or on
DataLemur. Solve them against Northwind, then check the second half of
`solutions.md`.

1. What is the second-highest active MRR, without using `LIMIT 1 OFFSET 1`?
2. Which company names appear on more than one account, and what are the ids?
3. Which customers have never opened a support ticket?
4. Show the top three accounts by active MRR within each region.
5. Month-over-month percent change in ticket volume for 2026.
6. Running year-to-date ticket count by month for 2026.
7. What percentage of customers have churned?
8. Average and worst hours to close, by priority, closed tickets only.
9. How many accounts open more tickets than the average account?
10. Percentage of closed tickets resolved within 24 hours, by category.
11. How many users have never generated a usage event, and how many of those
    have logged in at least once?
12. Top five accounts by lifetime paid invoice revenue.
13. Which Enterprise accounts have an open urgent ticket right now?
14. For each account, the first and last usage event and the days between.
15. For each account, the longest gap in days between one ticket and the next.

## Walkthrough

The demo query: **one screen the AE can show a prospect.** One row per active
account with plan, revenue, support load, and a health flag. This is the query
that becomes a dashboard tile in module 09.

Step 1. Start with the account and its active subscription, joined to the plan
name.

```sql
SELECT c.customer_id, c.company_name, c.region, p.name AS plan, s.mrr
FROM customers c
JOIN subscriptions s ON s.customer_id = c.customer_id AND s.status = 'active'
JOIN plans p ON p.plan_id = s.plan_id
LIMIT 5;
```

```text
┌─────────────┬───────────────────────┬─────────┬────────────┬───────┐
│ customer_id │     company_name      │ region  │    plan    │  mrr  │
├─────────────┼───────────────────────┼─────────┼────────────┼───────┤
│           1 │ Redwood Analytics     │ NA      │ Starter    │   105 │
│           2 │ Vantage Media Inc     │ NA      │ Starter    │   195 │
│           3 │ Meridian Financial    │ APAC    │ Enterprise │ 15750 │
│           4 │ Nimbus Industries Pty │ NA      │ Enterprise │ 18450 │
│           5 │ Westgate Industries   │ EMEA    │ Pro        │  3520 │
└─────────────┴───────────────────────┴─────────┴────────────┴───────┘
```

Note the extra condition on the join itself: `AND s.status = 'active'`. Putting
it in the `ON` clause of an inner join has the same effect as putting it in
`WHERE`. For a `LEFT JOIN` the two are very different, which is step 3.

Step 2. Get support load per account as its own CTE. Keeping it separate is
what stops the double counting.

```sql
WITH tickets AS (
  SELECT customer_id,
         count(*) AS tickets_all_time,
         sum(CASE WHEN closed_at IS NULL THEN 1 ELSE 0 END) AS open_tickets,
         round(avg(satisfaction_score), 2) AS avg_csat
  FROM support_tickets
  GROUP BY customer_id
)
SELECT * FROM tickets ORDER BY open_tickets DESC, customer_id LIMIT 3;
```

```text
┌─────────────┬──────────────────┬──────────────┬──────────┐
│ customer_id │ tickets_all_time │ open_tickets │ avg_csat │
├─────────────┼──────────────────┼──────────────┼──────────┤
│          99 │               13 │            7 │      3.4 │
│           3 │               19 │            5 │      3.9 │
│          59 │               20 │            5 │     3.75 │
└─────────────┴──────────────────┴──────────────┴──────────┘
```

Step 3. Get last activity per account, then assemble. The ticket and usage CTEs
are joined with `LEFT JOIN` so that accounts with no tickets and no events stay
on the list instead of vanishing.

```sql
WITH tickets AS (
  SELECT customer_id,
         count(*) AS tickets_all_time,
         sum(CASE WHEN closed_at IS NULL THEN 1 ELSE 0 END) AS open_tickets,
         round(avg(satisfaction_score), 2) AS avg_csat
  FROM support_tickets
  GROUP BY customer_id
),
activity AS (
  SELECT customer_id, max(event_ts) AS last_event, count(*) AS lifetime_events
  FROM usage_events
  GROUP BY customer_id
)
SELECT c.company_name,
       c.region,
       p.name AS plan,
       s.mrr,
       COALESCE(t.open_tickets, 0) AS open_tickets,
       t.avg_csat,
       a.last_event,
       CASE
         WHEN a.last_event < DATE '2026-07-02' THEN 'at risk: quiet'
         WHEN COALESCE(t.open_tickets, 0) >= 3 THEN 'at risk: support load'
         ELSE 'healthy'
       END AS health
FROM customers c
JOIN subscriptions s ON s.customer_id = c.customer_id AND s.status = 'active'
JOIN plans p ON p.plan_id = s.plan_id
LEFT JOIN tickets t ON t.customer_id = c.customer_id
LEFT JOIN activity a ON a.customer_id = c.customer_id
ORDER BY s.mrr DESC
LIMIT 6;
```

```text
┌──────────────────────┬─────────┬────────────┬───────┬──────────────┬──────────┬─────────────────────┬─────────┐
│     company_name     │ region  │    plan    │  mrr  │ open_tickets │ avg_csat │     last_event      │ health  │
├──────────────────────┼─────────┼────────────┼───────┼──────────────┼──────────┼─────────────────────┼─────────┤
│ Solstice Foods       │ NA      │ Enterprise │ 35820 │            1 │      3.0 │ 2026-08-25 13:59:41 │ healthy │
│ Umber Labs Inc       │ EMEA    │ Enterprise │ 35190 │            1 │      2.0 │ 2026-08-29 15:15:04 │ healthy │
│ Sable Systems LLC    │ APAC    │ Enterprise │ 35100 │            0 │      5.0 │ 2026-08-17 10:06:45 │ healthy │
│ Redwood Retail GmbH  │ NA      │ Enterprise │ 34920 │            0 │     3.14 │ 2026-08-29 12:37:11 │ healthy │
│ Blue Ridge Analytics │ NA      │ Enterprise │ 34830 │            0 │      4.0 │ 2026-08-19 17:43:25 │ healthy │
│ Meridian Media SA    │ EMEA    │ Enterprise │ 34200 │            1 │     3.67 │ 2026-08-31 10:47:50 │ healthy │
└──────────────────────┴─────────┴────────────┴───────┴──────────────┴──────────┴─────────────────────┴─────────┘
```

Umber Labs is your second-largest account and its average satisfaction score is
2.0. That is the row the AE needs to see before the call, and no single table
could have told you.

Step 4. Sanity-check the row count before you show anyone. There are 147 active
subscriptions, so this query must return 147 rows. Wrap the whole thing in
`SELECT count(*) FROM ( ... )`, or drop the `ORDER BY` and `LIMIT` and count:

```text
┌───────────────┐
│ rows_returned │
├───────────────┤
│           147 │
└───────────────┘
```

If you get more than 147, a join fanned out and every revenue number on the
screen is wrong.

Step 5. Say the sentence the query is for: "These are your top accounts by
revenue, with support load and last activity next to each one, flagged where
either signal looks bad." That sentence is the demo. The SQL is only how you
got it.

## Exercises

<!-- cells -->

In the browser, write each answer in the empty box under it and press Run. On
your computer, write them in `exercises.sql` and run them in DuckDB. Then check
`solutions.md`.

1. Top ten active subscriptions by MRR, showing company name, plan name, seats,
   and MRR.
2. Which subscriptions have never been invoiced? Show customer id, company
   name, and plan name, and explain in a comment why they have no invoices.
3. Ticket count and account count by industry, most tickets first. Include
   industries whose accounts have no tickets.
4. Tickets and average satisfaction by CSM owner, with unassigned accounts
   shown as `unassigned` rather than NULL.
5. New customers per month in 2026 with a running cumulative total.
6. Bucket every ticket into `under 4h`, `4h to 24h`, `over 24h`, or
   `still open`, with counts and percentage of total.
7. For customers with more than one subscription, list the subscriptions in
   order with a sequence number.
8. New MRR per month in 2026 with the percent change from the prior month.
9. Retention by signup quarter: customers signed up, still active, and
   retention percentage.
10. Churn rate by region, highest first.

## Checkpoint

<details>
<summary>1. You join <code>customers</code> to <code>support_tickets</code> and your total revenue triples. What happened?</summary>

The join produced one row per ticket, so each customer's MRR was repeated once
per ticket and summed many times. Aggregate the tickets in a CTE first, then
join one row per customer to one row per customer.
</details>

<details>
<summary>2. When is <code>LEFT JOIN</code> the right answer instead of <code>INNER JOIN</code>?</summary>

When rows on the left must survive even with no match on the right: listing
every account including ones with zero tickets, or finding the missing ones
with `WHERE right_table.id IS NULL`.
</details>

<details>
<summary>3. Difference between <code>RANK</code> and <code>DENSE_RANK</code>?</summary>

Both give tied rows the same number. `RANK` then skips values (1, 2, 2, 2, 5);
`DENSE_RANK` does not (1, 2, 2, 2, 3). `ROW_NUMBER` never ties and needs a
tiebreaker column to be deterministic.
</details>

<details>
<summary>4. Why can't you write <code>WHERE row_number() OVER (...) = 1</code>?</summary>

`WHERE` runs before window functions are computed. Compute the window function
in a CTE or subquery, then filter on its column in the outer query.
</details>

<details>
<summary>5. The subscriptions table shows 117 churned rows but only 53 customers have actually left. Why?</summary>

An upgrade ends the old subscription and starts a new one, so the old row is
marked churned while the customer is still active. Churn has to be measured per
customer: no active subscription anywhere.
</details>

You can now say:

- "I write multi-table SQL with joins and CTEs, and I check the row count after
  a join because fan-out is the usual cause of an inflated total."
- "I use window functions for ranking, top N per group, month-over-month change,
  and running totals."
- "I calculate churn and cohort retention from raw subscription records, and I
  know why counting churned rows is not the same as counting churned customers."

## Put it on your résumé

- Built a 147-account health query in DuckDB joining five tables, combining
  revenue, support load, and product usage with CTEs and window functions into
  a single customer-facing view.
- Answered 15 standard SQL interview problems, including top N per group,
  deduplication, cohort retention, and churn rate, on a 45,000-row SaaS dataset.

## Go deeper

- [DataLemur SQL questions](https://datalemur.com/questions) - free tier of the
  interview questions this bank imitates; do the easy and medium ones.
- [Mode SQL Tutorial, Intermediate and
  Advanced](https://mode.com/sql-tutorial/sql-window-functions/) - the clearest
  written explanation of window functions.
- [PostgreSQL window function
  tutorial](https://www.postgresql.org/docs/current/tutorial-window.html) - the
  official version, short, worth reading once you have the intuition.
- [Use The Index, Luke](https://use-the-index-luke.com/) - why a query is slow
  and what an index does, for when a customer asks about performance.
- [SQL Murder Mystery](https://mystery.knightlab.com/) - a joins-and-subqueries
  puzzle you can finish in an hour. Good for a low-energy day.
