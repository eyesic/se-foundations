# 04. Solutions

Part one is the ten exercises. Part two is the fifteen interview questions from
the README. Every query was run against `northwind.duckdb`; the output shown is
the real output.

## Exercises

### 1. Top ten active subscriptions

```sql
SELECT c.company_name, p.name AS plan, s.seats, s.mrr
FROM subscriptions s
JOIN customers c ON c.customer_id = s.customer_id
JOIN plans p ON p.plan_id = s.plan_id
WHERE s.status = 'active'
ORDER BY s.mrr DESC
LIMIT 10;
```

```text
┌──────────────────────┬────────────┬───────┬───────┐
│     company_name     │    plan    │ seats │  mrr  │
├──────────────────────┼────────────┼───────┼───────┤
│ Solstice Foods       │ Enterprise │   398 │ 35820 │
│ Umber Labs Inc       │ Enterprise │   391 │ 35190 │
│ Sable Systems LLC    │ Enterprise │   390 │ 35100 │
│ Redwood Retail GmbH  │ Enterprise │   388 │ 34920 │
│ Blue Ridge Analytics │ Enterprise │   387 │ 34830 │
│ Meridian Media SA    │ Enterprise │   380 │ 34200 │
│ Falcon Partners      │ Enterprise │   375 │ 33750 │
│ Willow Digital       │ Enterprise │   355 │ 31950 │
│ Vertex Media Co      │ Enterprise │   347 │ 31230 │
│ Blue Ridge Media Pty │ Enterprise │   346 │ 31140 │
└──────────────────────┴────────────┴───────┴───────┘
```

### 2. Subscriptions with no invoices

```sql
SELECT c.customer_id, c.company_name, p.name AS plan
FROM customers c
JOIN subscriptions s ON s.customer_id = c.customer_id
JOIN plans p ON p.plan_id = s.plan_id
LEFT JOIN invoices i ON i.subscription_id = s.subscription_id
WHERE i.invoice_id IS NULL
ORDER BY c.customer_id
LIMIT 8;
```

```text
┌─────────────┬─────────────────────┬─────────┐
│ customer_id │    company_name     │  plan   │
├─────────────┼─────────────────────┼─────────┤
│           2 │ Vantage Media Inc   │ Free    │
│           9 │ Tidewater Group     │ Free    │
│          23 │ Aurora Freight GmbH │ Free    │
│          54 │ Anchor Learning     │ Starter │
│          58 │ Lakeside Media Pty  │ Free    │
│          66 │ Northwind Foods SA  │ Free    │
│          72 │ Bright Digital Inc  │ Free    │
│          75 │ Lakeside Media      │ Free    │
└─────────────┴─────────────────────┴─────────┘
```

26 subscriptions have no invoices. Two reasons: Free plans cost nothing, and
subscriptions still in `trial` status have not been billed yet. Anchor Learning
is the second kind. Check with:

```sql
SELECT count(*) AS subs_without_invoices
FROM subscriptions s
LEFT JOIN invoices i ON i.subscription_id = s.subscription_id
WHERE i.invoice_id IS NULL;
```

### 3. Tickets by industry

```sql
SELECT c.industry,
       count(t.ticket_id) AS tickets,
       count(DISTINCT c.customer_id) AS accounts
FROM customers c
LEFT JOIN support_tickets t ON t.customer_id = c.customer_id
GROUP BY c.industry
ORDER BY tickets DESC;
```

```text
┌────────────────────┬─────────┬──────────┐
│      industry      │ tickets │ accounts │
├────────────────────┼─────────┼──────────┤
│ Education          │     241 │       31 │
│ Media              │     240 │       29 │
│ Manufacturing      │     224 │       27 │
│ Financial Services │     219 │       25 │
│ Logistics          │     187 │       22 │
│ Retail             │     185 │       23 │
│ Software           │     177 │       23 │
│ Healthcare         │     142 │       20 │
└────────────────────┴─────────┴──────────┘
```

`count(t.ticket_id)` rather than `count(*)`, because the `LEFT JOIN` gives
ticketless accounts a NULL row that `count(*)` would count as 1.

### 4. Satisfaction by CSM

```sql
SELECT COALESCE(c.csm_owner, 'unassigned') AS csm,
       count(t.ticket_id) AS tickets,
       round(avg(t.satisfaction_score), 2) AS avg_score
FROM customers c
LEFT JOIN support_tickets t ON t.customer_id = c.customer_id
GROUP BY csm
ORDER BY avg_score DESC;
```

```text
┌─────────────────┬─────────┬───────────┐
│       csm       │ tickets │ avg_score │
├─────────────────┼─────────┼───────────┤
│ Marcus Bell     │     237 │      3.99 │
│ Jordan Reyes    │     202 │      3.94 │
│ unassigned      │     111 │       3.9 │
│ Priya Raman     │     189 │       3.9 │
│ Ella Nguyen     │     234 │       3.9 │
│ Tom Okafor      │     182 │      3.89 │
│ Sofia Marchetti │     193 │      3.69 │
│ Dana Whitfield  │     129 │      3.66 │
│ Chris Lindqvist │     138 │       3.6 │
└─────────────────┴─────────┴───────────┘
```

The spread is 3.6 to 3.99 on samples of roughly 100 to 240 tickets. That is
close to noise. Do not build a performance review on it, and say so if someone
tries.

### 5. New customers per month in 2026, cumulative

```sql
WITH monthly AS (
  SELECT date_trunc('month', signup_date) AS month, count(*) AS new_customers
  FROM customers
  WHERE signup_date >= DATE '2026-01-01'
  GROUP BY month
)
SELECT month, new_customers,
       sum(new_customers) OVER (ORDER BY month) AS cumulative
FROM monthly
ORDER BY month;
```

```text
┌─────────────────────┬───────────────┬────────────┐
│        month        │ new_customers │ cumulative │
├─────────────────────┼───────────────┼────────────┤
│ 2026-01-01 00:00:00 │            13 │         13 │
│ 2026-02-01 00:00:00 │            13 │         26 │
│ 2026-03-01 00:00:00 │            19 │         45 │
│ 2026-04-01 00:00:00 │             4 │         49 │
│ 2026-05-01 00:00:00 │             7 │         56 │
│ 2026-06-01 00:00:00 │             2 │         58 │
│ 2026-07-01 00:00:00 │             1 │         59 │
└─────────────────────┴───────────────┴────────────┘
```

### 6. Resolution speed buckets

```sql
SELECT CASE
         WHEN closed_at IS NULL THEN 'still open'
         WHEN date_diff('hour', opened_at, closed_at) <= 4 THEN 'under 4h'
         WHEN date_diff('hour', opened_at, closed_at) <= 24 THEN '4h to 24h'
         ELSE 'over 24h'
       END AS resolution_band,
       count(*) AS tickets,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct
FROM support_tickets
GROUP BY resolution_band
ORDER BY tickets DESC;
```

```text
┌─────────────────┬─────────┬────────┐
│ resolution_band │ tickets │  pct   │
├─────────────────┼─────────┼────────┤
│ over 24h        │     581 │   36.0 │
│ 4h to 24h       │     416 │   25.8 │
│ under 4h        │     389 │   24.1 │
│ still open      │     229 │   14.2 │
└─────────────────┴─────────┴────────┘
```

`sum(count(*)) OVER ()` is an aggregate of an aggregate: the window with an
empty `OVER ()` spans every group, giving you the grand total to divide by.
That is the standard "percent of total" trick.

### 7. Subscription sequence for multi-subscription customers

```sql
WITH seq AS (
  SELECT s.customer_id, c.company_name, s.plan_id, s.start_date, s.status,
         row_number() OVER (PARTITION BY s.customer_id ORDER BY s.start_date) AS n,
         count(*)     OVER (PARTITION BY s.customer_id) AS total_subs
  FROM subscriptions s
  JOIN customers c ON c.customer_id = s.customer_id
)
SELECT customer_id, company_name, n, plan_id, start_date, status
FROM seq
WHERE total_subs > 1
ORDER BY customer_id, n
LIMIT 8;
```

```text
┌─────────────┬─────────────────────────┬───────┬─────────┬────────────┬─────────┐
│ customer_id │      company_name       │   n   │ plan_id │ start_date │ status  │
├─────────────┼─────────────────────────┼───────┼─────────┼────────────┼─────────┤
│           2 │ Vantage Media Inc       │     1 │       1 │ 2025-12-25 │ churned │
│           2 │ Vantage Media Inc       │     2 │       2 │ 2026-04-24 │ active  │
│           5 │ Westgate Industries     │     1 │       2 │ 2025-06-11 │ churned │
│           5 │ Westgate Industries     │     2 │       3 │ 2026-02-21 │ active  │
│          10 │ Halcyon Industries GmbH │     1 │       2 │ 2025-05-26 │ churned │
│          10 │ Halcyon Industries GmbH │     2 │       3 │ 2026-07-27 │ active  │
│          13 │ Ironclad Labs           │     1 │       2 │ 2025-10-23 │ churned │
│          13 │ Ironclad Labs           │     2 │       3 │ 2026-05-17 │ active  │
└─────────────┴─────────────────────────┴───────┴─────────┴────────────┴─────────┘
```

`count(*) OVER (PARTITION BY customer_id)` puts the group size on every row, so
you can filter on it without a second pass over the table.

### 8. New MRR per month with percent change

```sql
WITH monthly AS (
  SELECT date_trunc('month', start_date) AS month, sum(mrr) AS new_mrr
  FROM subscriptions
  WHERE start_date >= DATE '2026-01-01'
  GROUP BY month
)
SELECT month, new_mrr,
       lag(new_mrr) OVER (ORDER BY month) AS prior_month,
       round(100.0 * (new_mrr - lag(new_mrr) OVER (ORDER BY month))
             / lag(new_mrr) OVER (ORDER BY month), 1) AS pct_change
FROM monthly
ORDER BY month;
```

```text
┌─────────────────────┬─────────┬─────────────┬────────────┐
│        month        │ new_mrr │ prior_month │ pct_change │
├─────────────────────┼─────────┼─────────────┼────────────┤
│ 2026-01-01 00:00:00 │   90810 │        NULL │       NULL │
│ 2026-02-01 00:00:00 │  108790 │       90810 │       19.8 │
│ 2026-03-01 00:00:00 │   87305 │      108790 │      -19.7 │
│ 2026-04-01 00:00:00 │  178220 │       87305 │      104.1 │
│ 2026-05-01 00:00:00 │   99230 │      178220 │      -44.3 │
│ 2026-06-01 00:00:00 │   92160 │       99230 │       -7.1 │
│ 2026-07-01 00:00:00 │  137740 │       92160 │       49.5 │
└─────────────────────┴─────────┴─────────────┴────────────┘
```

This counts every new subscription, including upgrades, so it is "new and
expansion MRR," not net new. A finance team would ask you to subtract the
churned MRR from the same month. Knowing which question you actually answered
matters more than the query.

### 9. Retention by signup quarter

```sql
WITH per_customer AS (
  SELECT c.customer_id,
         date_trunc('quarter', c.signup_date) AS cohort_quarter,
         max(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS retained
  FROM customers c
  JOIN subscriptions s ON s.customer_id = c.customer_id
  GROUP BY c.customer_id, cohort_quarter
)
SELECT cohort_quarter, count(*) AS signed_up, sum(retained) AS still_active,
       round(100.0 * sum(retained) / count(*), 1) AS retention_pct
FROM per_customer
GROUP BY cohort_quarter
ORDER BY cohort_quarter;
```

```text
┌─────────────────────┬───────────┬──────────────┬───────────────┐
│   cohort_quarter    │ signed_up │ still_active │ retention_pct │
├─────────────────────┼───────────┼──────────────┼───────────────┤
│ 2024-01-01 00:00:00 │         6 │            5 │          83.3 │
│ 2024-04-01 00:00:00 │         7 │            4 │          57.1 │
│ 2024-07-01 00:00:00 │        14 │           11 │          78.6 │
│ 2024-10-01 00:00:00 │        16 │           11 │          68.8 │
│ 2025-01-01 00:00:00 │        20 │           11 │          55.0 │
│ 2025-04-01 00:00:00 │        23 │           16 │          69.6 │
│ 2025-07-01 00:00:00 │        24 │           23 │          95.8 │
│ 2025-10-01 00:00:00 │        31 │           23 │          74.2 │
│ 2026-01-01 00:00:00 │        45 │           36 │          80.0 │
│ 2026-04-01 00:00:00 │        13 │            6 │          46.2 │
│ 2026-07-01 00:00:00 │         1 │            1 │         100.0 │
└─────────────────────┴───────────┴──────────────┴───────────────┘
```

### 10. Churn rate by region

```sql
WITH per_customer AS (
  SELECT c.customer_id, c.region,
         max(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS has_active
  FROM customers c
  JOIN subscriptions s ON s.customer_id = c.customer_id
  GROUP BY c.customer_id, c.region
)
SELECT region, count(*) AS customers,
       count(*) - sum(has_active) AS churned,
       round(100.0 * (count(*) - sum(has_active)) / count(*), 1) AS churn_rate_pct
FROM per_customer
GROUP BY region
ORDER BY churn_rate_pct DESC;
```

```text
┌─────────┬───────────┬─────────┬────────────────┐
│ region  │ customers │ churned │ churn_rate_pct │
├─────────┼───────────┼─────────┼────────────────┤
│ LATAM   │        13 │       5 │           38.5 │
│ NA      │        82 │      22 │           26.8 │
│ EMEA    │        71 │      18 │           25.4 │
│ APAC    │        34 │       8 │           23.5 │
└─────────┴───────────┴─────────┴────────────────┘
```

LATAM looks alarming until you notice it is 5 accounts out of 13. Lead with the
count, not the percentage.

## Interview question bank

### 1. Second-highest active MRR

```sql
SELECT max(mrr) AS second_highest
FROM subscriptions
WHERE status = 'active'
  AND mrr < (SELECT max(mrr) FROM subscriptions WHERE status = 'active');
```

Returns 35190. The window-function version, which also handles "third-highest"
by changing one number:

```sql
WITH ranked AS (
  SELECT mrr, dense_rank() OVER (ORDER BY mrr DESC) AS rnk
  FROM subscriptions WHERE status = 'active'
)
SELECT DISTINCT mrr FROM ranked WHERE rnk = 2;
```

Say why you avoided `LIMIT 1 OFFSET 1`: it breaks on ties and it is not
portable across engines.

### 2. Duplicate company names

```sql
SELECT company_name, count(*) AS accounts,
       min(customer_id) AS first_id, max(customer_id) AS second_id
FROM customers
GROUP BY company_name
HAVING count(*) > 1
ORDER BY company_name;
```

```text
┌─────────────────────────┬──────────┬──────────┬───────────┐
│      company_name       │ accounts │ first_id │ second_id │
├─────────────────────────┼──────────┼──────────┼───────────┤
│ Anchor Learning         │        2 │       16 │        54 │
│ Halcyon Industries GmbH │        2 │       10 │       140 │
│ Ironclad Labs           │        2 │       13 │       162 │
│ Ridgeline Industries    │        2 │       14 │        43 │
│ Vertex Robotics         │        2 │       19 │        37 │
│ Westgate Works          │        2 │       17 │       177 │
└─────────────────────────┴──────────┴──────────┴───────────┘
```

`min`/`max` only work here because each name appears exactly twice. With three
or more copies, use `ROW_NUMBER` as in the deduplication example.

### 3. Customers with no tickets

```sql
SELECT c.customer_id, c.company_name
FROM customers c
LEFT JOIN support_tickets t ON t.customer_id = c.customer_id
WHERE t.ticket_id IS NULL
ORDER BY c.customer_id;
```

Three: 39 Falcon Logistics Co, 104 Cobalt Industries, 196 Cobalt Interactive
Ltd. `NOT EXISTS` is an equally good answer and often faster on large tables.

### 4. Top three accounts by MRR per region

```sql
WITH ranked AS (
  SELECT c.region, c.company_name, s.mrr,
         row_number() OVER (PARTITION BY c.region ORDER BY s.mrr DESC) AS rn
  FROM subscriptions s
  JOIN customers c ON c.customer_id = s.customer_id
  WHERE s.status = 'active'
)
SELECT region, company_name, mrr FROM ranked WHERE rn <= 3
ORDER BY region, mrr DESC;
```

```text
┌─────────┬──────────────────────┬───────┐
│ region  │     company_name     │  mrr  │
├─────────┼──────────────────────┼───────┤
│ APAC    │ Sable Systems LLC    │ 35100 │
│ APAC    │ Tidewater Financial  │ 27270 │
│ APAC    │ Juniper Robotics Co  │ 26730 │
│ EMEA    │ Umber Labs Inc       │ 35190 │
│ EMEA    │ Meridian Media SA    │ 34200 │
│ EMEA    │ Willow Digital       │ 31950 │
│ LATAM   │ Cedar Robotics Co    │ 24660 │
│ LATAM   │ Umber Foods          │ 23670 │
│ LATAM   │ Orchard Works        │ 19080 │
│ NA      │ Solstice Foods       │ 35820 │
│ NA      │ Redwood Retail GmbH  │ 34920 │
│ NA      │ Blue Ridge Analytics │ 34830 │
└─────────┴──────────────────────┴───────┘
```

### 5. Month-over-month percent change in tickets

```sql
WITH monthly AS (
  SELECT date_trunc('month', opened_at) AS month, count(*) AS tickets
  FROM support_tickets WHERE opened_at >= DATE '2026-01-01' GROUP BY month
)
SELECT month, tickets,
       round(100.0 * (tickets - lag(tickets) OVER (ORDER BY month))
             / lag(tickets) OVER (ORDER BY month), 1) AS pct_change
FROM monthly ORDER BY month;
```

```text
┌─────────────────────┬─────────┬────────────┐
│        month        │ tickets │ pct_change │
├─────────────────────┼─────────┼────────────┤
│ 2026-01-01 00:00:00 │      89 │       NULL │
│ 2026-02-01 00:00:00 │      83 │       -6.7 │
│ 2026-03-01 00:00:00 │     115 │       38.6 │
│ 2026-04-01 00:00:00 │     137 │       19.1 │
│ 2026-05-01 00:00:00 │     145 │        5.8 │
│ 2026-06-01 00:00:00 │     153 │        5.5 │
│ 2026-07-01 00:00:00 │     168 │        9.8 │
│ 2026-08-01 00:00:00 │     154 │       -8.3 │
└─────────────────────┴─────────┴────────────┘
```

### 6. Year-to-date running ticket count

```sql
WITH monthly AS (
  SELECT date_trunc('month', opened_at) AS month, count(*) AS tickets
  FROM support_tickets WHERE opened_at >= DATE '2026-01-01' GROUP BY month
)
SELECT month, tickets, sum(tickets) OVER (ORDER BY month) AS ytd
FROM monthly ORDER BY month;
```

Ends at 1,044 tickets through August 2026.

### 7. Churn rate

```sql
WITH per_customer AS (
  SELECT customer_id,
         max(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS has_active
  FROM subscriptions GROUP BY customer_id
)
SELECT round(100.0 * (count(*) - sum(has_active)) / count(*), 1) AS churn_rate_pct
FROM per_customer;
```

26.5 percent. Follow-up you should volunteer: this is all-time logo churn, not
annual, and it counts logos rather than dollars.

### 8. Time to close by priority

```sql
SELECT priority,
       count(*) AS closed_tickets,
       round(avg(date_diff('hour', opened_at, closed_at)), 1) AS avg_hours,
       max(date_diff('hour', opened_at, closed_at)) AS worst_hours
FROM support_tickets
WHERE closed_at IS NOT NULL
GROUP BY priority
ORDER BY avg_hours DESC;
```

```text
┌──────────┬────────────────┬───────────┬─────────────┐
│ priority │ closed_tickets │ avg_hours │ worst_hours │
├──────────┼────────────────┼───────────┼─────────────┤
│ urgent   │            103 │      40.3 │         201 │
│ low      │            406 │      36.0 │         201 │
│ high     │            327 │      31.4 │         201 │
│ medium   │            550 │      28.8 │         201 │
└──────────┴────────────────┴───────────┴─────────────┘
```

Urgent tickets take the longest on average, which is the opposite of what a
support SLA promises. Noticing that and asking about it is the point of the
query.

### 9. Accounts above the average ticket count

```sql
WITH per_customer AS (
  SELECT customer_id, count(*) AS tickets FROM support_tickets GROUP BY customer_id
)
SELECT count(*) AS accounts_above_average
FROM per_customer
WHERE tickets > (SELECT avg(tickets) FROM per_customer);
```

84 of the 197 accounts that have tickets.

### 10. Percent resolved within 24 hours, by category

```sql
SELECT category,
       count(*) AS closed_tickets,
       round(100.0 * sum(CASE WHEN date_diff('hour', opened_at, closed_at) <= 24
                              THEN 1 ELSE 0 END) / count(*), 1) AS pct_within_24h
FROM support_tickets
WHERE closed_at IS NOT NULL
GROUP BY category
ORDER BY pct_within_24h DESC;
```

```text
┌─────────────┬────────────────┬────────────────┐
│  category   │ closed_tickets │ pct_within_24h │
├─────────────┼────────────────┼────────────────┤
│ How-to      │            316 │           61.1 │
│ Integration │            301 │           60.8 │
│ Access      │            101 │           60.4 │
│ Performance │             95 │           56.8 │
│ Bug         │            244 │           56.6 │
│ Billing     │            174 │           54.6 │
│ Data Import │            155 │           52.3 │
└─────────────┴────────────────┴────────────────┘
```

### 11. Users with no usage events

```sql
SELECT count(*) AS users_with_no_events
FROM users u
LEFT JOIN usage_events e ON e.user_id = u.user_id
WHERE e.event_id IS NULL;
```

272. And of those:

```sql
SELECT count(*) AS logged_in_but_no_events
FROM users u
LEFT JOIN usage_events e ON e.user_id = u.user_id
WHERE e.event_id IS NULL AND u.last_login_at IS NOT NULL;
```

3 users logged in and then did nothing at all. The other 269 never logged in.
Two different onboarding problems with two different fixes.

### 12. Top accounts by lifetime paid revenue

```sql
SELECT c.company_name, sum(i.amount) AS lifetime_paid
FROM invoices i
JOIN subscriptions s ON s.subscription_id = i.subscription_id
JOIN customers c ON c.customer_id = s.customer_id
WHERE i.status = 'paid'
GROUP BY c.company_name
ORDER BY lifetime_paid DESC
LIMIT 5;
```

```text
┌──────────────────────┬───────────────┐
│     company_name     │ lifetime_paid │
├──────────────────────┼───────────────┤
│ Cobalt Systems       │        518130 │
│ Solstice Foods       │        488700 │
│ Redwood Interactive  │        475380 │
│ Sable Labs           │        465120 │
│ Quarry Learning GmbH │        433520 │
└──────────────────────┴───────────────┘
```

`WHERE i.status = 'paid'` excludes overdue and void invoices. If the question
was "billed" rather than "collected," that filter changes and so does the
number. Ask which one they mean.

### 13. Enterprise accounts with an open urgent ticket

```sql
SELECT c.company_name, count(*) AS open_urgent
FROM customers c
JOIN subscriptions s
  ON s.customer_id = c.customer_id AND s.status = 'active' AND s.plan_id = 4
JOIN support_tickets t ON t.customer_id = c.customer_id
WHERE t.closed_at IS NULL AND t.priority = 'urgent'
GROUP BY c.company_name
ORDER BY open_urgent DESC, c.company_name
LIMIT 6;
```

```text
┌──────────────────────┬─────────────┐
│     company_name     │ open_urgent │
├──────────────────────┼─────────────┤
│ Marlow Systems       │           2 │
│ Anchor Financial Ltd │           1 │
│ Marlow Media         │           1 │
│ Meridian Financial   │           1 │
│ Nimbus Labs SA       │           1 │
│ Quill Retail SA      │           1 │
└──────────────────────┴─────────────┘
```

This is a real escalation list. Run it before a QBR.

### 14. First and last usage event per account

```sql
SELECT c.company_name,
       min(e.event_ts) AS first_event,
       max(e.event_ts) AS last_event,
       date_diff('day', min(e.event_ts), max(e.event_ts)) AS active_days
FROM usage_events e
JOIN customers c ON c.customer_id = e.customer_id
GROUP BY c.company_name
ORDER BY active_days DESC
LIMIT 5;
```

```text
┌────────────────────────┬─────────────────────┬─────────────────────┬─────────────┐
│      company_name      │     first_event     │     last_event      │ active_days │
├────────────────────────┼─────────────────────┼─────────────────────┼─────────────┤
│ Northwind Systems      │ 2024-05-14 10:07:11 │ 2026-08-31 11:13:12 │         839 │
│ Beacon Group           │ 2024-06-25 17:41:57 │ 2026-08-21 17:53:51 │         787 │
│ Cobalt Interactive Ltd │ 2024-06-01 14:36:39 │ 2026-07-27 14:35:58 │         786 │
│ Anchor Financial       │ 2024-08-13 15:25:15 │ 2026-08-29 14:21:54 │         746 │
│ Quarry Learning GmbH   │ 2024-06-06 14:20:44 │ 2026-06-06 07:52:22 │         730 │
└────────────────────────┴─────────────────────┴─────────────────────┴─────────────┘
```

### 15. Longest quiet gap between tickets, per account

```sql
WITH ticket_days AS (
  SELECT DISTINCT customer_id, CAST(opened_at AS DATE) AS ticket_day
  FROM support_tickets
),
gaps AS (
  SELECT customer_id, ticket_day,
         lag(ticket_day) OVER (PARTITION BY customer_id ORDER BY ticket_day) AS prior_day
  FROM ticket_days
)
SELECT c.company_name,
       max(date_diff('day', prior_day, ticket_day)) AS longest_quiet_gap_days,
       count(*) AS ticket_days
FROM gaps g
JOIN customers c ON c.customer_id = g.customer_id
GROUP BY c.company_name
ORDER BY longest_quiet_gap_days DESC
LIMIT 5;
```

```text
┌───────────────────────┬────────────────────────┬─────────────┐
│     company_name      │ longest_quiet_gap_days │ ticket_days │
├───────────────────────┼────────────────────────┼─────────────┤
│ Vertex Analytics      │                    521 │           3 │
│ Beacon Group          │                    452 │          11 │
│ Sable Labs            │                    336 │           3 │
│ Westgate Freight GmbH │                    306 │           7 │
│ Blue Ridge Media Pty  │                    306 │           6 │
└───────────────────────┴────────────────────────┴─────────────┘
```

This is the "gaps and islands" family of problems in its simplest form: pair
each row with the previous one using `LAG`, then measure the distance. The full
version, grouping consecutive runs into islands, adds one more step, and you
will not be asked for it in an associate SE screen.
