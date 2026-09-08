# 07. Solutions

Every script here was run against `datasets/*.csv` and the live APIs. Output
shown is real. Paths assume you run from `modules/07-python-for-ses/`; adjust
if you run from somewhere else.

## 1. List of dicts, f-strings, total

```python
customers = [
    {"company_name": "Nimbus Retail",   "seats": 25, "mrr": 1499.50},
    {"company_name": "Delta Logistics", "seats": 60, "mrr": 3600.00},
    {"company_name": "Orchard Health",  "seats": 8,  "mrr": 320.00},
]

for c in customers:
    print(f"{c['company_name']}: {c['seats']} seats, ${c['mrr']:,.2f}/mo")

print(f"total MRR: ${sum(c['mrr'] for c in customers):,.2f}")
```

```
Nimbus Retail: 25 seats, $1,499.50/mo
Delta Logistics: 60 seats, $3,600.00/mo
Orchard Health: 8 seats, $320.00/mo
total MRR: $5,419.50
```

`:,.2f` inside an f-string means "thousands separators, two decimal places."
Worth memorizing, because unformatted money in a customer-facing output looks
careless.

## 2. Two more cities

Add two dicts to the `CITIES` list:

```python
CITIES = [
    {"name": "New York",    "latitude": 40.7128, "longitude": -74.0060},
    {"name": "Chapel Hill", "latitude": 35.9132, "longitude": -79.0558},
    {"name": "London",      "latitude": 51.5072, "longitude": -0.1276},
    {"name": "Singapore",   "latitude": 1.3521,  "longitude": 103.8198},
    {"name": "Denver",      "latitude": 39.7392, "longitude": -104.9903},
    {"name": "Sydney",      "latitude": -33.8688, "longitude": 151.2093},
]
```

Six cities at seven days each is 42 rows. If you got 35, one city failed; the
script prints the failure but keeps going, which is the behaviour you want in
a batch job. If you got 28, you edited the list but ran the wrong file.

## 3. NASA with error handling

```python
import requests

def apod(api_key):
    response = requests.get(
        "https://api.nasa.gov/planetary/apod",
        params={"api_key": api_key},
        timeout=20,
    )
    if response.status_code != 200:
        body = response.json()
        message = body.get("error", {}).get("message", response.text[:120])
        print(f"API returned {response.status_code}: {message}")
        return
    data = response.json()
    print(f"{data['date']}  {data['title']}")

apod("DEMO_KEY")
apod("NOT_A_REAL_KEY")
```

```
2026-09-07  The Pelican Nebula in Gas, Dust, and Stars
API returned 403: An invalid api_key was supplied. Get one at https://api.nasa.gov:443
```

Note the chained `.get()` calls. `body.get("error", {})` returns an empty dict
when there is no `error` key, so the second `.get("message", ...)` cannot
crash. That two-step default is the standard way to read a nested field that
might not be there.

Note also that the status is 403, not 401. Your handler must not hard-code an
assumption about which code means "bad credentials."

## 4. Ticket counts by priority, plain Python

```python
import csv
from pathlib import Path

DATA = Path(__file__).parents[2] / "datasets" / "support_tickets.csv"

with open(DATA, newline="", encoding="utf-8") as handle:
    tickets = list(csv.DictReader(handle))

counts = {}
for t in tickets:
    counts[t["priority"]] = counts.get(t["priority"], 0) + 1

for priority, n in sorted(counts.items(), key=lambda kv: kv[1], reverse=True):
    print(f"{priority:<10}{n:>6}")
```

```
medium       641
low          475
high         373
urgent       126
```

`counts.get(key, 0) + 1` is the counting idiom: read the current value or zero
if the key is new, add one, store it back. `collections.Counter` does this for
you once you know it exists.

## 5. Still-open tickets

```python
still_open = sum(1 for t in tickets if t["closed_at"] == "")
pct = round(still_open * 100 / len(tickets), 1)
print(f"open: {still_open} of {len(tickets)} = {pct}%")
```

```
open: 229 of 1615 = 14.2%
```

The type trap the exercise warned about: an empty cell in a CSV arrives as the
**empty string** `""`, not as `None`. `if t["closed_at"] is None` finds
nothing. When the same file is read by DuckDB, that empty cell becomes SQL
`NULL` instead, so the same logic in SQL is `WHERE closed_at IS NULL`. Same
data, two different representations of "missing", and knowing that is the
difference between a number that is right and a number that is quietly zero.

## 6. The same thing in one SQL query

```python
import duckdb

duckdb.sql("""
    SELECT priority,
           count(*)                                            AS tickets,
           count(*) FILTER (WHERE closed_at IS NULL)           AS still_open,
           round(100.0 * count(*) FILTER (WHERE closed_at IS NULL)
                 / count(*), 1)                                AS pct_open
    FROM read_csv_auto('../../datasets/support_tickets.csv')
    GROUP BY priority
    ORDER BY tickets DESC
""").fetchall()
```

```
('medium', 641, 91, 14.2)
('low',    475, 69, 14.5)
('high',   373, 46, 12.3)
('urgent', 126, 23, 18.3)
```

Totals across all priorities: 1615 tickets, 229 open, 14.2 percent. That
matches exercises 4 and 5 exactly.

`FILTER (WHERE ...)` counts only the rows matching a condition inside an
aggregate, so you get the total and the subset in one pass. Postgres and
DuckDB both support it. On engines that do not,
`sum(CASE WHEN closed_at IS NULL THEN 1 ELSE 0 END)` does the same job.

Worth noticing in the result: urgent tickets have the highest open rate at
18.3 percent. That is the kind of one-line finding that makes a demo land,
and it took one query.

## 7. Average satisfaction score

```python
def parse_score(value):
    if value is None or value.strip() == "":
        return None
    return int(value)

scores = [parse_score(t["satisfaction_score"]) for t in tickets]
have = [s for s in scores if s is not None]
print(f"avg {round(sum(have)/len(have), 2)} over {len(have)} scored, "
      f"{len(tickets) - len(have)} excluded")
```

```
avg 3.84 over 988 scored, 627 excluded
```

DuckDB agrees: `avg(satisfaction_score)` is 3.84 over 988 non-null values with
627 nulls. SQL aggregates ignore NULL automatically, which is convenient and
also exactly why people report misleading numbers without noticing.

Why the exclusions matter: 627 of 1615 tickets, or 38.8 percent, have no
score. So "our average satisfaction is 3.84" is really "3.84 among the 61
percent of tickets whose reporter chose to respond." If unhappy customers are
less likely to fill in a survey, the true average is lower. When you put a
number like this on a slide, state the denominator. An SE who says "3.84,
based on 988 of 1,615 tickets" is trusted; one who says "3.84" gets caught.

## 8. Paginating GitHub issues into a CSV

```python
import csv
import requests

issues = []
for page in (1, 2, 3):
    response = requests.get(
        "https://api.github.com/repos/duckdb/duckdb/issues",
        params={"state": "open", "per_page": 5, "page": page},
        timeout=20,
    )
    if response.status_code != 200:
        print("stopped:", response.status_code, response.text[:120])
        break
    batch = response.json()
    if not batch:          # empty page means we ran off the end
        break
    for item in batch:
        issues.append({"number": item["number"], "title": item["title"]})

with open("issues.csv", "w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=["number", "title"])
    writer.writeheader()
    writer.writerows(issues)

print("total:", len(issues))
```

```
total: 15
first: 25458 | perf(variant): Optimize shredded vector value retrieval
```

Three things this teaches that are not obvious:

- The `if not batch: break` guard. Hard-coding three pages works here, but a
  real sync does not know how many pages exist. Stopping on an empty page, or
  on a missing `rel="next"` link, is what makes the loop correct.
- The status check inside the loop. Page 1 can succeed and page 3 can return
  429 when you cross the rate limit. A loop without the check silently writes
  a partial file, which is worse than failing.
- GitHub's issues endpoint includes pull requests. Any item with a
  `pull_request` key is a PR, not an issue. If a customer asked for "open
  issues," filter those out and say that you did.

## 9. Predict, then fix

The error, before running:

```
TypeError: unsupported operand type(s) for +: 'int' and 'str'
```

`total` starts as the integer 0. `row["monthly_price"]` is the string `"15"`,
because everything from a CSV is a string. Python will not guess whether you
meant arithmetic or concatenation, so it refuses.

The fix, plus the two other problems in that snippet:

```python
import csv
from pathlib import Path

DATA = Path(__file__).parents[2] / "datasets" / "plans.csv"

with open(DATA, newline="", encoding="utf-8") as handle:
    rows = list(csv.DictReader(handle))

total = sum(int(row["monthly_price"]) for row in rows)
print(f"total monthly price across plans: {total}")
```

```
total monthly price across plans: 145
```

Free 0, Starter 15, Pro 40, Enterprise 90.

The two other problems: the original had no `newline=""` and no
`encoding="utf-8"`, and it used a relative path that only works if you happen
to be standing in the right directory. All three are the kind of thing that
works on your laptop and fails on a call.

One more point about the answer itself: summing list prices across plans is a
meaningless number. Nobody pays 145. This is a good habit to carry into
customer work — a query can be correct and the metric still nonsense, and it
is your job to say so rather than putting it on a slide.

## 10. Flatten a nested JSON export

Test file, `export.json`:

```json
{
  "records": [
    {"id": 1, "attributes": {"name": "Acme", "plan": "Pro"}},
    {"id": 2, "attributes": {"name": "Borealis", "plan": "Starter"}},
    {"id": 3, "attributes": {"name": "Cedar Labs"}},
    {"id": 4, "attributes": {"name": "Dunwoody", "plan": "Enterprise"}}
  ]
}
```

```python
import csv
import json
from pathlib import Path

data = json.loads(Path("export.json").read_text(encoding="utf-8"))

flat = []
for record in data["records"]:
    attributes = record.get("attributes", {})
    flat.append({
        "id":   record.get("id"),
        "name": attributes.get("name"),
        "plan": attributes.get("plan"),
    })

with open("flat.csv", "w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=["id", "name", "plan"])
    writer.writeheader()
    writer.writerows(flat)
```

```
id,name,plan
1,Acme,Pro
2,Borealis,Starter
3,Cedar Labs,
4,Dunwoody,Enterprise
```

Record 3 has no `plan`, and `.get("plan")` returned `None`, which the CSV
writer rendered as an empty cell. No crash, and the missing value is visible
in the output rather than hidden.

This twenty-line script is the POC-rescue scenario from the top of the module,
in miniature. The customer's export is nested; your product needs rows; the
gap between them is `.get()` and a loop. When you do this for real, add one
more step: print how many records had a missing field, and tell the customer.
Silently writing blanks into their system is how a data-quality problem
becomes your problem six weeks later.
