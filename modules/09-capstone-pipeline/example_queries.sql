-- 09. Example analytical query set
--
-- Fifteen queries against the repo dataset. This is the shape and the depth
-- your capstone needs: not fifteen variations of SELECT *, but fifteen
-- questions a person at the company would actually ask, each answered once.
--
-- Paths below are relative to the repo root, so run from the repo root.
--
-- With the DuckDB CLI:
--     duckdb
--     D .read modules/09-capstone-pipeline/example_queries.sql
--
-- Without the CLI, from Python (this is the path that was verified):
--     import duckdb
--     con = duckdb.connect()
--     con.execute(open('modules/09-capstone-pipeline/example_queries.sql').read())
--     con.sql("SELECT * FROM subscriptions LIMIT 5").show()
--
-- con.execute() runs the whole file and creates the views. After that, run
-- any single query interactively with con.sql(...).fetchall().
--
-- Every query below was executed against datasets/*.csv and returns rows.

-- Load the CSVs once as views so the rest of the file reads normally.
CREATE OR REPLACE VIEW customers      AS SELECT * FROM read_csv_auto('datasets/customers.csv');
CREATE OR REPLACE VIEW plans          AS SELECT * FROM read_csv_auto('datasets/plans.csv');
CREATE OR REPLACE VIEW subscriptions  AS SELECT * FROM read_csv_auto('datasets/subscriptions.csv');
CREATE OR REPLACE VIEW users          AS SELECT * FROM read_csv_auto('datasets/users.csv');
CREATE OR REPLACE VIEW usage_events   AS SELECT * FROM read_csv_auto('datasets/usage_events.csv');
CREATE OR REPLACE VIEW support_tickets AS SELECT * FROM read_csv_auto('datasets/support_tickets.csv');
CREATE OR REPLACE VIEW invoices       AS SELECT * FROM read_csv_auto('datasets/invoices.csv');


-- Q1. How much recurring revenue do we have, and where does it come from?
-- The first question any executive asks.
SELECT p.name              AS plan,
       count(*)            AS active_subscriptions,
       sum(s.seats)        AS seats,
       sum(s.mrr)          AS mrr,
       round(avg(s.mrr), 2) AS avg_mrr
FROM subscriptions s
JOIN plans p USING (plan_id)
WHERE s.status = 'active'
GROUP BY p.name
ORDER BY mrr DESC;


-- Q2. Are we growing? New subscriptions by month.
SELECT date_trunc('month', start_date) AS month,
       count(*)                        AS new_subscriptions,
       sum(mrr)                        AS new_mrr
FROM subscriptions
GROUP BY month
ORDER BY month;


-- Q3. What is our churn rate, overall and by plan?
-- Churned divided by everything that ever started on that plan.
SELECT p.name AS plan,
       count(*)                                          AS all_subscriptions,
       count(*) FILTER (WHERE s.status = 'churned')      AS churned,
       round(100.0 * count(*) FILTER (WHERE s.status = 'churned')
             / count(*), 1)                              AS churn_rate_pct
FROM subscriptions s
JOIN plans p USING (plan_id)
GROUP BY p.name
ORDER BY churn_rate_pct DESC;


-- Q4. How long do churned customers last before they leave?
SELECT p.name AS plan,
       count(*)                                              AS churned,
       round(avg(date_diff('day', s.start_date, s.end_date)), 0) AS avg_days_to_churn,
       min(date_diff('day', s.start_date, s.end_date))       AS fastest_churn_days
FROM subscriptions s
JOIN plans p USING (plan_id)
WHERE s.status = 'churned' AND s.end_date IS NOT NULL
GROUP BY p.name
ORDER BY avg_days_to_churn;


-- Q5. Who are our ten largest active customers?
SELECT c.company_name,
       c.industry,
       c.csm_owner,
       sum(s.mrr)   AS mrr,
       sum(s.seats) AS seats
FROM customers c
JOIN subscriptions s USING (customer_id)
WHERE s.status = 'active'
GROUP BY c.company_name, c.industry, c.csm_owner
ORDER BY mrr DESC
LIMIT 10;


-- Q6. Which accounts are silent? Active subscription, no usage in 60 days.
-- This is the query that gets built live on a discovery call.
WITH last_seen AS (
    SELECT customer_id, max(event_ts) AS last_event
    FROM usage_events
    GROUP BY customer_id
)
SELECT c.company_name,
       c.csm_owner,
       sum(s.mrr)                                      AS mrr_at_risk,
       CAST(max(l.last_event) AS DATE)                 AS last_activity,
       date_diff('day', max(l.last_event), DATE '2026-08-31') AS days_silent
FROM customers c
JOIN subscriptions s USING (customer_id)
LEFT JOIN last_seen l USING (customer_id)
WHERE s.status = 'active'
GROUP BY c.company_name, c.csm_owner
HAVING max(l.last_event) < DATE '2026-08-31' - INTERVAL 60 DAY
    OR max(l.last_event) IS NULL
ORDER BY mrr_at_risk DESC
LIMIT 15;


-- Q7. Monthly active customers, and the month-over-month change.
-- LAG() reaches back one row to compare against the previous month.
WITH monthly AS (
    SELECT date_trunc('month', event_ts)   AS month,
           count(DISTINCT customer_id)     AS active_customers,
           count(*)                        AS events
    FROM usage_events
    GROUP BY month
)
SELECT month,
       active_customers,
       events,
       events - lag(events) OVER (ORDER BY month) AS event_change,
       round(100.0 * (events - lag(events) OVER (ORDER BY month))
             / lag(events) OVER (ORDER BY month), 1) AS pct_change
FROM monthly
ORDER BY month;


-- Q8. Feature adoption: what share of active customers uses each feature?
SELECT e.event_type,
       count(DISTINCT e.customer_id) AS customers,
       round(100.0 * count(DISTINCT e.customer_id)
             / (SELECT count(DISTINCT customer_id) FROM usage_events), 1) AS pct_of_active,
       count(*) AS events
FROM usage_events e
GROUP BY e.event_type
ORDER BY customers DESC;


-- Q9. Rank customers by usage inside their own industry.
-- ROW_NUMBER with PARTITION BY: restart the count for each industry.
WITH usage AS (
    SELECT customer_id, count(*) AS events
    FROM usage_events
    WHERE event_ts >= DATE '2026-01-01'
    GROUP BY customer_id
)
SELECT industry, company_name, events, rank_in_industry
FROM (
    SELECT c.industry,
           c.company_name,
           u.events,
           row_number() OVER (PARTITION BY c.industry ORDER BY u.events DESC) AS rank_in_industry
    FROM customers c
    JOIN usage u USING (customer_id)
) ranked
WHERE rank_in_industry <= 2
ORDER BY industry, rank_in_industry;


-- Q10. Support load: tickets by month and priority.
SELECT date_trunc('month', opened_at) AS month,
       count(*)                                          AS tickets,
       count(*) FILTER (WHERE priority = 'urgent')       AS urgent,
       count(*) FILTER (WHERE closed_at IS NULL)         AS still_open
FROM support_tickets
WHERE opened_at >= DATE '2026-01-01'
GROUP BY month
ORDER BY month;


-- Q11. Which ticket categories take longest to resolve?
SELECT category,
       count(*)                                                        AS closed_tickets,
       round(avg(date_diff('hour', opened_at, closed_at)), 1)          AS avg_hours_to_close,
       round(avg(satisfaction_score), 2)                               AS avg_csat,
       count(satisfaction_score)                                       AS scored_tickets
FROM support_tickets
WHERE closed_at IS NOT NULL
GROUP BY category
ORDER BY avg_hours_to_close DESC;


-- Q12. Does support load predict churn?
-- Compare ticket volume for churned versus active customers.
WITH ticket_counts AS (
    SELECT customer_id, count(*) AS tickets
    FROM support_tickets
    GROUP BY customer_id
)
SELECT s.status,
       count(DISTINCT s.customer_id)              AS customers,
       round(avg(coalesce(t.tickets, 0)), 2)      AS avg_tickets,
       max(coalesce(t.tickets, 0))                AS max_tickets
FROM subscriptions s
LEFT JOIN ticket_counts t USING (customer_id)
GROUP BY s.status
ORDER BY avg_tickets DESC;


-- Q13. Money at risk: overdue invoices by customer.
SELECT c.company_name,
       c.csm_owner,
       count(*)      AS overdue_invoices,
       sum(i.amount) AS overdue_amount
FROM invoices i
JOIN subscriptions s USING (subscription_id)
JOIN customers c USING (customer_id)
WHERE i.status = 'overdue'
GROUP BY c.company_name, c.csm_owner
ORDER BY overdue_amount DESC
LIMIT 10;


-- Q14. Expansion: customers who have had more than one subscription.
-- A second subscription usually means an upgrade or a re-signing.
SELECT c.company_name,
       count(*)                                     AS subscription_count,
       min(s.start_date)                            AS first_start,
       max(s.start_date)                            AS latest_start,
       string_agg(p.name, ' -> ' ORDER BY s.start_date) AS plan_path
FROM customers c
JOIN subscriptions s USING (customer_id)
JOIN plans p USING (plan_id)
GROUP BY c.company_name
HAVING count(*) > 1
ORDER BY subscription_count DESC, c.company_name
LIMIT 15;


-- Q15. Signup cohorts: do customers who signed up more recently stick?
SELECT date_trunc('month', c.signup_date)                           AS cohort_month,
       count(DISTINCT c.customer_id)                                AS customers,
       count(DISTINCT c.customer_id) FILTER (WHERE s.status = 'churned') AS churned,
       round(100.0 * count(DISTINCT c.customer_id) FILTER (WHERE s.status = 'churned')
             / count(DISTINCT c.customer_id), 1)                    AS churn_rate_pct
FROM customers c
JOIN subscriptions s USING (customer_id)
GROUP BY cohort_month
HAVING count(DISTINCT c.customer_id) >= 5
ORDER BY cohort_month;
