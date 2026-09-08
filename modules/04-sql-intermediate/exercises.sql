-- Module 04 exercises. Run from the repo root:  duckdb northwind.duckdb
-- Answers in solutions.md. The interview question bank is in the README,
-- with its answers in the second half of solutions.md.

-- 1. Top ten active subscriptions by MRR: company name, plan name, seats, mrr.


-- 2. Which subscriptions have never been invoiced? Show customer_id,
--    company_name and plan name. Add a comment explaining why they have none.


-- 3. Ticket count and account count by industry, most tickets first.
--    Every industry must appear even if some of its accounts have no tickets.


-- 4. Tickets and average satisfaction by CSM owner. Show accounts with no CSM
--    as 'unassigned'.


-- 5. New customers per month in 2026 with a running cumulative total.


-- 6. Bucket every ticket into 'under 4h', '4h to 24h', 'over 24h' or
--    'still open', with counts and percentage of total.


-- 7. For customers with more than one subscription, list their subscriptions
--    in start_date order with a sequence number.


-- 8. New MRR per month in 2026 with the percent change from the prior month.


-- 9. Retention by signup quarter: signed up, still active, retention percent.


-- 10. Churn rate by region, highest first.
