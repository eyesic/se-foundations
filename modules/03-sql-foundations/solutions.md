# 03. Solutions

Every query here was run against `northwind.duckdb` built from the CSVs in
`datasets/`. The output shown is the real output. If yours differs, first check
that you loaded all seven tables.

Your query does not have to match mine character for character. If it returns
the same rows, it is correct.

## 1. Education customers

```sql
SELECT company_name, country
FROM customers
WHERE industry = 'Education'
ORDER BY company_name;
```

31 rows. The first six:

```text
┌──────────────────────┬────────────────┐
│     company_name     │    country     │
├──────────────────────┼────────────────┤
│ Anchor Analytics Pty │ United States  │
│ Anchor Interactive   │ Germany        │
│ Aurora Supply        │ United States  │
│ Beacon Group Inc     │ Japan          │
│ Beacon Networks      │ Canada         │
│ Beacon Retail        │ United Kingdom │
└──────────────────────┴────────────────┘
```

## 2. The ten oldest accounts

```sql
SELECT customer_id, company_name, signup_date
FROM customers
ORDER BY signup_date
LIMIT 10;
```

```text
┌─────────────┬────────────────────────┬─────────────┐
│ customer_id │      company_name      │ signup_date │
├─────────────┼────────────────────────┼─────────────┤
│           9 │ Tidewater Group        │ 2024-02-02  │
│         183 │ Westgate Freight GmbH  │ 2024-02-03  │
│          12 │ Beacon Group           │ 2024-02-18  │
│         195 │ Northwind Systems      │ 2024-03-09  │
│          31 │ Quarry Learning GmbH   │ 2024-03-10  │
│         137 │ Onyx Foods             │ 2024-03-23  │
│         196 │ Cobalt Interactive Ltd │ 2024-04-26  │
│         180 │ Onyx Systems           │ 2024-04-28  │
│         131 │ Aurora Supply          │ 2024-05-08  │
│         200 │ Beacon Learning LLC    │ 2024-05-18  │
└─────────────┴────────────────────────┴─────────────┘
```

`ORDER BY signup_date` ascending puts the oldest first. Leaving off `ASC` is
fine; it is the default.

## 3. Accounts with no CSM

```sql
SELECT customer_id, company_name, region
FROM customers
WHERE csm_owner IS NULL
ORDER BY customer_id;
```

15 rows:

```text
┌─────────────┬───────────────────────┬─────────┐
│ customer_id │     company_name      │ region  │
├─────────────┼───────────────────────┼─────────┤
│          19 │ Vertex Robotics       │ NA      │
│          33 │ Falcon Partners       │ NA      │
│          82 │ Orchard Financial Ltd │ NA      │
│          89 │ Yardley Retail        │ NA      │
│         105 │ Willow Digital        │ EMEA    │
│         116 │ Marlow Digital Co     │ APAC    │
│         120 │ Anchor Financial Ltd  │ EMEA    │
│         133 │ Sable Systems         │ EMEA    │
│         142 │ Summit Health         │ APAC    │
│         148 │ Marlow Works Ltd      │ EMEA    │
│         151 │ Halcyon Supply LLC    │ NA      │
│         164 │ Summit Learning       │ NA      │
│         165 │ Beacon Networks       │ NA      │
│         175 │ Quarry Learning       │ NA      │
│         200 │ Beacon Learning LLC   │ APAC    │
└─────────────┴───────────────────────┴─────────┘
```

`= NULL` returns nothing. It has to be `IS NULL`.

## 4. Active MRR

```sql
SELECT sum(mrr) AS active_mrr, count(*) AS active_subscriptions
FROM subscriptions
WHERE status = 'active';
```

```text
┌────────────┬──────────────────────┐
│ active_mrr │ active_subscriptions │
├────────────┼──────────────────────┤
│    1207610 │                  147 │
└────────────┴──────────────────────┘
```

$1,207,610 of MRR, which is about $14.5M of annual recurring revenue. Being
able to say the ARR version out loud is worth doing.

## 5. Satisfaction, with the denominator

```sql
SELECT count(*) AS all_tickets,
       count(satisfaction_score) AS answered,
       round(avg(satisfaction_score), 2) AS avg_score
FROM support_tickets;
```

```text
┌─────────────┬──────────┬───────────┐
│ all_tickets │ answered │ avg_score │
├─────────────┼──────────┼───────────┤
│        1615 │      988 │      3.84 │
└─────────────┴──────────┴───────────┘
```

3.84 out of 5, across the 61 percent of tickets where anyone answered the
survey.

## 6. Largest active Enterprise subscriptions

```sql
SELECT subscription_id, customer_id, seats, mrr
FROM subscriptions
WHERE plan_id = 4 AND status = 'active'
ORDER BY mrr DESC
LIMIT 10;
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
│             146 │         107 │   380 │ 34200 │
│              45 │          33 │   375 │ 33750 │
│             142 │         105 │   355 │ 31950 │
│              35 │          26 │   347 │ 31230 │
│              68 │          50 │   346 │ 31140 │
└─────────────────┴─────────────┴───────┴───────┘
```

You had to look up that Enterprise is `plan_id` 4 by running
`SELECT * FROM plans;`. In module 04 you will join to `plans` and filter on
`name = 'Enterprise'` instead, which is safer because it does not depend on you
remembering an id.

## 7. 2026 tickets by priority

```sql
SELECT priority, count(*) AS tickets
FROM support_tickets
WHERE opened_at >= DATE '2026-01-01'
GROUP BY priority
ORDER BY tickets DESC;
```

```text
┌──────────┬─────────┐
│ priority │ tickets │
├──────────┼─────────┤
│ medium   │     413 │
│ low      │     308 │
│ high     │     245 │
│ urgent   │      78 │
└──────────┴─────────┘
```

## 8. Monthly ticket volume by priority, 2026

```sql
SELECT date_trunc('month', opened_at) AS month,
       priority,
       count(*) AS tickets
FROM support_tickets
WHERE opened_at >= DATE '2026-01-01'
  AND opened_at <  DATE '2026-09-01'
GROUP BY month, priority
ORDER BY month, tickets DESC;
```

32 rows, eight months times four priorities. The first eight:

```text
┌─────────────────────┬──────────┬─────────┐
│        month        │ priority │ tickets │
├─────────────────────┼──────────┼─────────┤
│ 2026-01-01 00:00:00 │ medium   │      39 │
│ 2026-01-01 00:00:00 │ low      │      31 │
│ 2026-01-01 00:00:00 │ high     │      16 │
│ 2026-01-01 00:00:00 │ urgent   │       3 │
│ 2026-02-01 00:00:00 │ medium   │      30 │
│ 2026-02-01 00:00:00 │ high     │      25 │
│ 2026-02-01 00:00:00 │ low      │      16 │
│ 2026-02-01 00:00:00 │ urgent   │      12 │
└─────────────────────┴──────────┴─────────┘
```

Two columns in `GROUP BY` gives you one row per combination. This is the shape
every stacked bar chart is built from.

The upper bound is written as `< DATE '2026-09-01'` rather than
`<= DATE '2026-08-31'` because `opened_at` is a timestamp: a ticket opened at
2026-08-31 14:00 is greater than `2026-08-31 00:00:00` and would be dropped.
Half-open ranges avoid that whole class of bug.

## 9. Users who never logged in, by role

```sql
SELECT role, count(*) AS never_logged_in
FROM users
WHERE last_login_at IS NULL
GROUP BY role
ORDER BY never_logged_in DESC;
```

```text
┌─────────┬─────────────────┐
│  role   │ never_logged_in │
├─────────┼─────────────────┤
│ member  │             168 │
│ viewer  │              64 │
│ admin   │              37 │
└─────────┴─────────────────┘
```

269 users out of 2,213 were provisioned and never signed in. In a real
onboarding review this is the slide: the customer is paying for seats nobody
activated.

## 10. Customers with 20 or more tickets

```sql
SELECT customer_id, count(*) AS tickets
FROM support_tickets
GROUP BY customer_id
HAVING count(*) >= 20
ORDER BY tickets DESC;
```

```text
┌─────────────┬─────────┐
│ customer_id │ tickets │
├─────────────┼─────────┤
│         176 │      21 │
│          59 │      20 │
│          63 │      20 │
│         135 │      20 │
└─────────────┴─────────┘
```

The filter is on `count(*)`, which only exists after grouping, so it must be in
`HAVING`. Putting it in `WHERE` is an error, and reading that error message is
the fastest way to make the rule stick.
