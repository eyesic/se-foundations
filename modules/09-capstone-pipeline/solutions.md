# 09. Solutions

Exercises 1 to 3 have fixed answers, because they run against the repo
dataset. All numbers below were produced by executing
`example_queries.sql` against `datasets/*.csv`. Exercises 4 to 8 are about
your own project, so what follows is a worked example plus the standard the
answer has to meet.

## 1. Three results, interpreted

Here are three, with the distinction between reading a number and interpreting
it made explicit.

**From Q1, recurring revenue by plan:**

```
Enterprise   51 active subscriptions   $1,064,070 MRR
Pro          58 active subscriptions     $137,360 MRR
Starter      33 active subscriptions       $6,180 MRR
Free          5 active subscriptions           $0 MRR
```

Interpretation: 88 percent of revenue sits in 51 Enterprise accounts, while Pro
has more subscriptions and one eighth of the revenue. That is a concentration
risk — losing three Enterprise accounts costs more than losing every Starter
and Pro customer combined — and it says that CS attention, SE attention, and
escalation priority should not be allocated by account count.

**From Q11, ticket categories by resolution time:**

```
Billing       174 closed   40.6 avg hours   3.88 CSAT
Data Import   155 closed   35.9 avg hours   3.86 CSAT
Access        101 closed   31.2 avg hours   3.58 CSAT
Bug           244 closed   28.7 avg hours   3.98 CSAT
```

Interpretation: Billing tickets take 41 percent longer to close than bug
reports, which is backwards from what anyone expects — bugs need engineering
and billing does not. That points at a process problem rather than a technical
one, probably a handoff to a finance team with no ticket SLA. Note also that
Access has the worst satisfaction at 3.58 despite closing faster than Billing:
speed and satisfaction are different things, and being locked out annoys people
even when it is fixed quickly.

**From Q8, feature adoption:**

```
login            200 customers   11,591 events
dashboard_viewed 200 customers   11,559 events
api_call         200 customers    7,623 events
report_created   200 customers    4,515 events
export           200 customers    3,094 events
```

Interpretation: every single customer has used every feature, which in a real
product would be implausible and is a signal that this data is generated
rather than observed. Saying that out loud is the right move. Adoption
analysis needs depth, not breadth — the useful version is events per customer
and the share of customers above some threshold, not "did they ever click it
once."

That third one is the most important habit in this module: when a number looks
too clean, say so before someone else does.

## 2. Why "Free has the highest churn" is uninteresting

```
Free        76.2%   (16 of 21)
Starter     58.3%   (49 of 84)
Pro         43.4%   (46 of 106)
Enterprise  10.3%   (6 of 58)
```

Two sentences: Free-plan churn is 76 percent across a base of 21
subscriptions, so the number is both statistically fragile and financially
meaningless — churning a Free subscription costs zero MRR, and free plans are
supposed to have high attrition, since that is what a funnel does. Presenting
it as the headline tells a CS team to spend effort where there is no revenue,
which is the opposite of useful.

Rewrite the question as: **"Which plan is losing us the most money, and which
accounts should a CSM call this week?"** Weight churn by revenue rather than
counting subscriptions:

```sql
SELECT p.name,
       sum(s.mrr) FILTER (WHERE s.status = 'churned') AS churned_mrr,
       sum(s.mrr) FILTER (WHERE s.status = 'active')  AS active_mrr
FROM subscriptions s
JOIN plans p USING (plan_id)
GROUP BY p.name
ORDER BY churned_mrr DESC;
```

```
Enterprise   $117,270 churned MRR   $1,064,070 active
Pro          $101,280 churned MRR     $137,360 active
Starter       $10,170 churned MRR       $6,180 active
Free               $0 churned MRR            $0 active
```

The picture inverts completely. Enterprise has the lowest churn rate and the
largest absolute loss. And Pro has lost more MRR than it currently holds,
which is the actual finding buried in this dataset and the one worth a slide.

This is the single most transferable lesson in the module: a rate and an
absolute are different questions, and choosing the one that flatters your
narrative is how analysts lose credibility. Show both.

## 3. Silent accounts at 60 days versus 30 days

```
60 days silent:   8 accounts    $48,610 MRR at risk
30 days silent:  21 accounts   $158,185 MRR at risk
```

Loosening the threshold from 60 to 30 days nearly triples the account count
and more than triples the revenue figure.

Why you would not present the 30-day number alone to an executive: the
threshold is a choice, not a fact, and moving it changes the headline by 3x.
An executive shown only "$158,000 of revenue is at risk" has no way to know
whether that is a crisis or an artifact of where you drew the line. Thirty
days of silence in a product people use weekly is alarming; in a product used
for quarterly reporting it is completely normal.

The professional way to present it is both thresholds side by side, with the
definition stated: "21 accounts worth $158k have been silent 30 days; 8 of
those, worth $49k, have been silent 60 days. I would start with the 8." That
gives the executive the sensitivity and the recommendation in one breath, and
it is exactly the kind of framing that gets an SE invited back.

One more thing to notice, from the query itself: the `HAVING` clause includes
`OR max(l.last_event) IS NULL` to catch customers with no usage events at all.
Leaving that out is an easy mistake, and it hides the most at-risk accounts —
the ones that never activated.

## 4. Three questions and their query shapes

Worked example for idea A, the NYC 311 pipeline:

| Question | Shape of the answer |
|---|---|
| Which complaint types take longest to close, and has it changed since 2024? | `complaints`, `avg(date_diff('hour', created_date, closed_date))` grouped by `complaint_type` and `year(created_date)`, filtered to rows where `closed_date IS NOT NULL`, ordered by the average |
| Does complaint volume shift by borough and season? | `complaints`, `count(*)` grouped by `borough` and `date_trunc('month', created_date)`, with a window function computing each borough's share of the monthly total |
| Which agencies carry the largest open backlog relative to their volume? | `complaints`, `count(*)` and `count(*) FILTER (WHERE closed_date IS NULL)` grouped by `agency`, with the ratio computed and a `HAVING count(*) > 100` guard so tiny agencies do not top the list |

The standard your own answer must meet: each question is answerable by one
query, names a specific comparison, and could produce a number someone would
act on. If your question is "analyze the data," you do not have a question.
Notice the `HAVING` guard in the third row — writing that down *before* seeing
the data is what stops the Free-plan mistake from exercise 2.

## 5. Fields to keep and fields to drop

Worked example, from a real NYC 311 record fetched on 2026-09-07:

```json
{
  "unique_key": "70308126",
  "created_date": "2026-09-06T02:06:20.000",
  "agency": "TLC",
  "agency_name": "Taxi and Limousine Commission",
  "complaint_type": "For Hire Vehicle Complaint",
  "descriptor": "Car Service Company Complaint",
  "descriptor_2": "Unlicensed/Unauthorized",
  "location_type": "Street",
  "incident_zip": "11430",
  "incident_address": "JOHN F KENNEDY AIRPORT",
  "street_name": "JOHN F KENNEDY AIRPORT",
  "address_type": "PLACE",
  "city": "JAMAICA",
  "landmark": "JOHN F KENNEDY AIRPORT",
  "status": "In Progress",
  "community_board": "83 QUEENS",
  "council_district": "31",
  "police_precinct": "Precinct 113",
  "bbl": "4142600001",
  "borough": "QUEENS"
}
```

Keep: `unique_key`, `created_date`, `closed_date`, `agency`, `agency_name`,
`complaint_type`, `descriptor`, `status`, `borough`, `incident_zip`,
`location_type`. That is eleven fields, enough for volume, timing, category,
and geography.

Two dropped fields, with reasons:

- `bbl` is the Borough-Block-Lot parcel identifier. It is a precise property
  reference that none of my three questions ask about, and keeping it invites
  me to join to a property dataset I do not have. Dropped for scope.
- `landmark` is populated for a small minority of records and duplicates
  information already in `incident_address`. A column that is mostly null and
  redundant adds width to the table and nothing to the analysis. Dropped for
  sparsity.

The standard: "I dropped it because I did not need it" is fine, but say which
*kind* of not-needed — out of scope, mostly null, or redundant with a column
you kept. Those three reasons cover almost every case and each one is a real
modelling judgement.

## 6. The pagination loop

Worked example for Socrata:

```python
import json
import time
from pathlib import Path

import requests

RAW = Path("data/raw")
RAW.mkdir(parents=True, exist_ok=True)

BASE = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"
PAGE_SIZE = 1000
total = 0

for page in range(100):                       # a ceiling, not a target
    response = requests.get(
        BASE,
        params={
            "$limit": PAGE_SIZE,
            "$offset": page * PAGE_SIZE,
            "$where": "created_date > '2026-01-01T00:00:00'",
            "$order": "created_date",         # stable order, or pages overlap
        },
        timeout=30,
    )

    if response.status_code == 429:
        print("rate limited, waiting 60s")
        time.sleep(60)
        continue                              # retry the same page

    if response.status_code != 200:
        print(f"stopping at page {page}: HTTP {response.status_code}")
        print(response.text[:300])
        break

    records = response.json()
    if not records:                           # empty page means done
        print("no more records")
        break

    out = RAW / f"page_{page:04d}.json"
    out.write_text(json.dumps(records), encoding="utf-8")
    total += len(records)
    print(f"page {page}: {len(records)} records, {total} total")

    time.sleep(0.5)                           # be a good citizen

print(f"done: {total} records in {len(list(RAW.glob('*.json')))} files")
```

Answering the three questions the exercise asks:

- **How does it stop?** Three ways, in priority order: an empty page (the
  normal case), a non-200 status (the failure case), and the `range(100)`
  ceiling (a safety net so a bug cannot loop forever). It never stops because
  a counter reached a number you guessed.
- **What happens on a 429?** It waits 60 seconds and retries the *same* page
  rather than advancing, because advancing would silently skip 1,000 records.
  A production version would use exponential backoff and honour `Retry-After`;
  a fixed sleep is acceptable for a portfolio project as long as you can
  explain the difference.
- **How many records?** At 1,000 per page with a ceiling of 100 pages, at most
  100,000, and in practice however many match the `$where` filter. Run one
  request with `$select=count(1)` first so you know the answer before you
  start.

The detail most people miss is `$order`. Without a stable sort, offset
pagination can return the same record twice and skip another, because the
server is free to order rows however it likes. That single line prevents a
duplicate-records bug you would otherwise spend an evening chasing.

## 7. Records in, out, and dropped

The standard: your transform prints something like this, and you can explain
every line.

```
read     24,000 records from 24 files
dropped     412 duplicates on unique_key
dropped      37 with no created_date
kept     23,551 records -> data/clean.csv
note      3,102 records (13.2%) have no closed_date and are excluded
          from resolution-time averages
```

If your three numbers are equal — in equals out, nothing dropped — that is a
claim you have to earn, not an assumption. Verify it with three explicit
checks rather than trusting it:

```python
ids = [r.get("unique_key") for r in records]
print("records:", len(ids))
print("distinct ids:", len(set(ids)))
print("missing ids:", sum(1 for i in ids if not i))
```

If distinct ids equals the record count and no ID is missing, you have
genuinely verified there are no duplicates, and you can say so in the README.
Note that this only holds because the extractor used a stable `$order`; without
it, duplicates across page boundaries are close to guaranteed and "nothing was
dropped" would mean the check is broken, not that the data is clean.

The reason this matters beyond the project: "we deduplicate on the customer's
external ID" is a sentence you will say in real implementation calls, and the
follow-up question is always "how do you know the ID is unique?"

## 8. Scoring yourself

There is no answer key for this one. The standard is that your finishing plan
is specific and time-boxed. Compare:

Too vague to act on:

> - Improve README
> - Add more queries
> - Maybe record a video

Specific enough to finish:

> - Criterion 7 (findings): README lists what each script does, not what I
>   found. Rewrite the top section as three findings with numbers. 45 min.
> - Criterion 10 (limitations): none stated. Add the 13.2% missing
>   `closed_date` and the fact that the data covers 2026 only. 15 min.
> - Criterion 13 (video): not recorded. Script it against the demo template,
>   then record. 90 min, two takes.
> - Total: about 2.5 hours, one Saturday morning.

If your list looks like the first one, you have not actually scored yourself;
you have skimmed the rubric and felt bad. The rubric only works if you write
the number next to each of the fourteen criteria before writing the plan.

One last note on criterion 14, "you can defend it." Test it by opening a
random file in your repository and explaining out loud, to nobody, why each
part is there. Anywhere you find yourself saying "I think I copied that" is a
question an interviewer will ask. Go and understand that line, or delete it.
