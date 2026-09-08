# Project README template

Copy everything between the lines into your project's `README.md` and fill it
in. Used in module 09.

A reader gives a README about thirty seconds. Sections are ordered so that the
thirty seconds are spent on what the project is and whether it works.

---

```markdown
# PROJECT NAME

One sentence: what this does and what data it uses.

![screenshot or chart](images/CHART.png)

## The question

What were you actually trying to answer? Two or three sentences. Name the
audience: who would care about the answer.

## What it does

- Pulls DATA from SOURCE via API
- Loads it into DuckDB alongside TABLE COUNT tables
- Answers N analytical questions in SQL
- Produces CHART COUNT charts / a dashboard

## Data

| source | rows | date range | how it was obtained |
|---|---|---|---|
| SOURCE NAME | N | START to END | API endpoint or download link |

Note any limits: rate limits, pagination, fields that were missing or dirty,
and what you did about them.

## Running it

    pip install -r requirements.txt
    python pull_data.py
    duckdb project.duckdb < queries/all.sql

Requires Python 3.10+. Takes about N minutes; the API call is the slow part.

## Findings

Three to five bullets, each one a sentence a non-technical person would find
interesting, with the number in it.

- FINDING, with the number.
- FINDING, with the number.
- FINDING, with the number.

## Repository layout

    pull_data.py      pulls from the API, writes raw JSON and a CSV
    load.py           loads the CSV into DuckDB
    queries/          the SQL, one file per question
    charts/           chart-generating script and output images
    README.md         this file

## What I learned

Three or four sentences, specific and honest. What surprised you, what broke,
what you would do differently. This section is read more often than you expect,
because it is the only part of a README that shows how someone thinks.

## Limitations

What this does not do, and what would make it better with more time. Naming
your own limitations reads as confidence, not weakness.
```

---

## Completed example

```markdown
# NYC 311 service requests: which complaints take longest to close

Pulls 60,000 NYC 311 service requests from the city's open data API, loads them
into DuckDB, and answers 14 questions about volume, response time, and
geography.

![Median days to close by complaint type](images/days_to_close.png)

## The question

New York City publishes every 311 complaint it receives. I wanted to know which
complaint types take longest to resolve, whether that varies by borough, and
whether response times have improved since 2023. The audience is anyone who
would sit in a city operations meeting.

## What it does

- Pulls 60,000 service requests from the NYC Open Data API, handling pagination
- Loads them into a DuckDB database
- Answers 14 analytical questions in SQL, including monthly trend, median time
  to close by type, and borough comparison
- Produces 5 charts with matplotlib

## Data

| source | rows | date range | how it was obtained |
|---|---|---|---|
| NYC Open Data 311 Service Requests | 60,000 | 2023-01-01 to 2026-06-30 | Socrata API, paginated at 1,000 rows per request |

The API caps a single response at 1,000 rows, so `pull_data.py` loops with an
offset. About 4 percent of records have no `closed_date`; those are still open
and are excluded from resolution-time calculations rather than counted as zero.

## Running it

    pip install -r requirements.txt
    python pull_data.py
    python load.py
    duckdb nyc311.duckdb < queries/all.sql

Requires Python 3.10+. Takes about 4 minutes, almost all of it the 60 API
calls.

## Findings

- Heat and hot water complaints are 22 percent of all requests but close in a
  median of 2 days; noise complaints close in a median of 9.
- The Bronx has the longest median resolution time at 6.1 days, Manhattan the
  shortest at 3.4.
- Complaint volume rose 14 percent year over year while median resolution time
  was flat, which suggests capacity kept up.

## Repository layout

    pull_data.py      paginated API pull, writes raw JSON and requests.csv
    load.py           loads requests.csv into nyc311.duckdb
    queries/          14 SQL files, one per question
    charts/           make_charts.py and 5 PNG outputs
    README.md         this file

## What I learned

The API's row cap forced me to learn pagination properly rather than reading
about it. The bigger lesson was in the data: 4 percent of rows have no close
date, and including them as zero would have made every borough look 15 percent
faster. I also rewrote a Python loop that aggregated 60,000 rows as a single
GROUP BY query; the SQL version ran in under a second and was five lines
instead of thirty.

## Limitations

One city, one date range, no weather or population normalization, so borough
comparisons are raw. A scheduled daily pull and a live dashboard would make
this genuinely useful rather than a snapshot.
```
