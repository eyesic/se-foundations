-- Module 03 exercises. Write your query under each prompt, run it in DuckDB,
-- then check solutions.md. Run from the repo root:  duckdb northwind.duckdb

-- 1. Company name and country of every customer in the Education industry,
--    sorted alphabetically by company name.


-- 2. The ten oldest customer accounts: customer_id, company_name, signup_date,
--    oldest first.


-- 3. customer_id, company_name and region for every account with no assigned
--    CSM.


-- 4. Total MRR of all active subscriptions and how many there are.
--    One row, two columns.


-- 5. One query returning: total tickets, tickets that have a satisfaction
--    score, and the average score rounded to two decimals.


-- 6. The ten largest active Enterprise subscriptions (plan_id 4) by MRR:
--    subscription_id, customer_id, seats, mrr.


-- 7. Tickets by priority for tickets opened on or after 2026-01-01, most first.


-- 8. Monthly ticket volume by priority for 2026: one row per month per
--    priority, ordered by month then ticket count descending.


-- 9. Users who have never logged in, counted by role, most first.


-- 10. Customers who opened 20 or more support tickets: customer_id and count.
