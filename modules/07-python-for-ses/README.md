# 07. Python for SEs

## Why an SE needs this

Halfway through a proof of concept, the customer says "here is our data" and
sends you a 40 MB JSON export with nested objects and inconsistent fields.
Nobody on the account team can load it into anything. The deal stalls for a
week waiting on an engineer. The SE who can write thirty lines of Python to
flatten that file into a CSV, load it into DuckDB, and hand back a working
dashboard the same afternoon is the SE who closes it. That is the entire
purpose of this module. You are not becoming a software engineer, and you will
not be asked to invert a binary tree. You are learning enough Python to move
data from where it is to where it needs to be.

## What you will be able to do

- Read a Python script line by line and say what it does.
- Store data in variables, lists, and dictionaries, and get values back out.
- Loop over rows, filter them with `if`, and build up a result.
- Write a function so you can reuse logic instead of copying it.
- Call an API with `requests`, check the status code, and parse the JSON.
- Read and write CSV files, including the Windows-specific trap.
- Catch errors with `try`/`except` so a script fails with a useful message.
- Run a script from PowerShell or Git Bash and read a traceback.
- Say clearly when Python is the right tool and when SQL is.

## Concepts

### Explicitly not in scope

No classes. No object-oriented design. No algorithms, big-O, or LeetCode. No
web frameworks. If a tutorial starts with "class Animal:", close it. Those
things are real and useful for software engineers and they are not what gets
you hired as an SE.

### Running a script

Save a file with a `.py` extension, open a terminal in that folder, and run:

```powershell
python weather_to_csv.py
```

That is it. The same command works in PowerShell, Git Bash, and macOS
Terminal. If `python` is not recognized, Python is not on your PATH; reinstall
it with the "Add python.exe to PATH" checkbox ticked.

### Variables and types

A **variable** is a name pointing at a value. Python figures out the type.

```python
company = "Nimbus Retail"   # str, a string of text
seats = 25                  # int, a whole number
mrr = 1499.50               # float, a decimal number
is_active = True            # bool, True or False
churn_date = None           # NoneType, the Python version of NULL
```

The type matters because `"25" + 1` is an error while `25 + 1` is 26. Every
value read from a CSV arrives as a string, which is the single most common
source of confusion for beginners. `int("25")` and `float("1499.50")` convert.

### f-strings

An **f-string** puts a variable's value inside a string. Prefix the string
with `f` and put the expression in braces.

```python
print(f"{company} has {seats} seats at ${mrr}/mo")
```

```
Nimbus Retail has 25 seats at $1499.5/mo
```

### Lists

A **list** is an ordered collection. Square brackets, zero-indexed.

```python
plans = ["Free", "Starter", "Pro", "Enterprise"]

plans[0]        # "Free"
plans[-1]       # "Enterprise", negative counts from the end
len(plans)      # 4
plans.append("Custom")   # adds to the end
```

### Dictionaries

A **dictionary** (dict) maps keys to values. Curly braces. This is the Python
shape of one JSON object, and of one row of data.

```python
customer = {
    "customer_id": 42,
    "company_name": "Nimbus Retail",
    "seats": 25,
    "owner": {"name": "Priya Raman", "email": "priya@example.com"},
}

customer["company_name"]        # "Nimbus Retail"
customer["owner"]["email"]      # "priya@example.com", nested access
customer.get("churn_date")      # None instead of crashing on a missing key
```

`customer["missing_key"]` raises a `KeyError` and stops the script.
`customer.get("missing_key")` returns `None`. When you are parsing a
customer's messy export where fields are inconsistent, `.get()` is what keeps
the script alive.

A list of dicts is the workhorse structure: it is exactly what a JSON array
of records looks like, and exactly what a table looks like.

```python
rows = [
    {"city": "New York", "high_f": 81.2},
    {"city": "London", "high_f": 71.4},
]
```

### Loops and conditions

A **loop** repeats work for every item. A **condition** decides whether to act.

```python
for row in rows:
    if row["high_f"] > 75:
        print(f"{row['city']} is warm")
```

```
New York is warm
```

Note the single quotes inside the f-string's braces: the outer string already
uses double quotes, so the inner key uses single quotes.

`continue` skips to the next item. That is the standard filtering shape:

```python
for row in reader:
    if not row["event_ts"].startswith("2026"):
        continue
    # everything below only runs for 2026 rows
```

Indentation is not cosmetic in Python. The indented block is the body of the
loop. Mixing tabs and spaces breaks the script; set your editor to insert
spaces.

### Functions

A **function** is a named, reusable block. `def` defines it, `return` sends a
value back.

```python
def events_per_customer(events, customers):
    if customers == 0:
        return 0
    return round(events / customers, 1)

events_per_customer(8266, 184)   # 44.9
```

Write a function the second time you need the same logic, not the first.

### Reading and writing files

Always use `with open(...)`, which closes the file automatically even if the
code inside fails.

```python
import csv

with open("customers.csv", newline="", encoding="utf-8") as handle:
    reader = csv.DictReader(handle)
    for row in reader:
        print(row["company_name"])
```

`csv.DictReader` gives each row as a dict keyed by the header names. Writing
back out:

```python
with open("out.csv", "w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=["city", "high_f"])
    writer.writeheader()
    writer.writerows(rows)
```

Two arguments you must not skip. `newline=""` prevents a blank line between
every row on Windows. `encoding="utf-8"` prevents a crash the first time a
customer's file contains an accented character or a currency symbol. Both of
these will bite you on a real customer file, usually during a demo.

### Calling an API

The `requests` library. Install it once with `pip install requests`.

```python
import requests

response = requests.get(
    "https://api.open-meteo.com/v1/forecast",
    params={"latitude": 40.7128, "longitude": -74.0060, "current": "temperature_2m"},
    timeout=20,
)

print(response.status_code)   # 200
data = response.json()        # JSON text becomes Python dicts and lists
print(data["current"]["temperature_2m"])
```

Three things to internalize:

- `params=` builds the query string for you, including URL-encoding. Never
  glue a URL together with `+` and string formatting.
- `timeout=` is not optional in practice. Without it a hung server hangs your
  script forever.
- `response.json()` turns the response body into dicts and lists. An **object**
  in JSON becomes a dict, an **array** becomes a list. `response.text` gives
  you the raw string instead, which is what you want when the response is not
  valid JSON and you need to see why.

`requests` does not raise an error for a 404 or a 500. It returns a response
object with that status code, and you have to check it yourself.

### Error handling

**Exception handling** means catching a failure and deciding what to do
instead of crashing.

```python
try:
    response = requests.get(url, timeout=20)
except requests.exceptions.RequestException as error:
    print(f"network error: {error}")
    return []
```

The rule that separates useful scripts from frustrating ones: catch the
specific error you expect, and print something that tells you what to do next.
A bare `except:` that swallows everything turns a five-minute fix into an
afternoon.

There are two distinct failure categories and they need different handling:

| Failure | Example | How you detect it |
|---|---|---|
| The request never completed | DNS failure, timeout, no network | An exception from `requests` |
| The request completed and failed | 401, 404, 429, 500 | `response.status_code` |

### Reading a traceback

When a script crashes, Python prints a **traceback**. Read it bottom-up. The
last line is what went wrong; the line above it is where.

```
  File "usage_summary.py", line 34, in the_python_way
    counts[row["evnt_type"]] += 1
KeyError: 'evnt_type'
```

`KeyError: 'evnt_type'` on line 34, and the cause is a typo. The four you will
see most: `KeyError` (no such dict key), `TypeError` (wrong type, often a
string where a number was expected), `FileNotFoundError` (wrong path), and
`IndexError` (list is shorter than you thought).

## Walkthrough

Two scripts ship in this folder. Run each, then read it line by line. Install
the dependencies first:

```powershell
pip install requests duckdb
```

### Part 1: API to CSV to SQL

`weather_to_csv.py` calls Open-Meteo for four cities, reshapes the JSON into
rows, writes `weather.csv`, and then queries that CSV with DuckDB.

```powershell
python weather_to_csv.py
```

Real output from 2026-09-07:

```
fetching New York...
fetching Chapel Hill...
fetching London...
fetching Singapore...

wrote 28 rows to weather.csv

7-day forecast summary by city
city           hottest_f  coldest_f  precip_in
Chapel Hill         96.7       60.7       0.35
Singapore           91.4       73.6       1.42
New York            88.2       59.0       0.03
London              71.4       55.0       0.77
```

And the first lines of the CSV it wrote:

```
city,forecast_date,high_f,low_f,precip_in
New York,2026-09-07,81.2,59.0,0.0
New York,2026-09-08,83.4,59.4,0.0
New York,2026-09-09,87.2,65.2,0.0
```

The interesting part is `fetch_city`. Open-Meteo does not return a list of
records. It returns parallel arrays:

```json
"daily": {
  "time": ["2026-09-07", "2026-09-08"],
  "temperature_2m_max": [81.2, 83.4]
}
```

Element 0 of every array describes the same day. `zip()` stitches them back
into one row per day:

```python
for day, high, low, rain in zip(
    daily["time"],
    daily["temperature_2m_max"],
    daily["temperature_2m_min"],
    daily["precipitation_sum"],
):
```

This reshaping step is the actual job. Real customer exports arrive in shapes
that are not rows, and turning them into rows is what unblocks everything
downstream.

One detail worth stealing: the script sends `precipitation_unit=inch`. Without
it, Open-Meteo returns millimetres and the column named `precip_in` would be
silently wrong by a factor of 25. Units are the most common quiet bug in
integrations, because nothing errors — the numbers are just wrong.

Then DuckDB reads the CSV directly off disk. There is no import step and no
table creation:

```python
duckdb.sql(f"SELECT ... FROM read_csv_auto('{OUT_PATH.as_posix()}') ...").fetchall()
```

`.fetchall()` returns a plain list of tuples. DuckDB can also print a drawn
table, but that uses box-drawing characters the default Windows console cannot
encode, and it crashes with a `UnicodeEncodeError`. Printing the rows yourself
avoids it.

### Part 2: Python versus SQL on the same question

`usage_summary.py` answers one question two ways against
`datasets/usage_events.csv` (38,382 rows): for each event type in 2026, how
many events, how many distinct customers, and events per customer.

```powershell
python usage_summary.py
```

Real output:

```
Plain Python  (0.045 seconds)
event_type          events  customers  per_cust
dashboard_viewed      8266        184      44.9
login                 8265        185      44.7
api_call              5464        184      29.7
report_created        3204        184      17.4
export                2210        185      11.9

One SQL query  (0.088 seconds)
event_type          events  customers  per_cust
dashboard_viewed      8266        184      44.9
login                 8265        185      44.7
api_call              5464        184      29.7
report_created        3204        184      17.4
export                2210        185      11.9

same answer from both: True
```

Read the timings honestly, because an interviewer might. At 38,000 rows the
hand-written Python is faster, since DuckDB spends time parsing the whole CSV
including the 2024 and 2025 rows it will throw away. SQL does not win this on
speed at this size. SQL wins on three other things.

**Lines of thinking.** The Python version needs a dict for counts, a dict of
sets for distinct customers, a filter, a division guarded against zero, and a
sort with a key function. The SQL version is one statement that reads almost
like the question:

```sql
SELECT event_type,
       count(*)                    AS events,
       count(DISTINCT customer_id) AS customers
FROM read_csv_auto('datasets/usage_events.csv')
WHERE year(event_ts) = 2026
GROUP BY event_type
ORDER BY events DESC
```

**Correctness.** `count(DISTINCT customer_id)` is one word in SQL. In Python
it is a dict of sets that you have to remember to build, and forgetting it is
a bug nobody catches until a number in a QBR deck is wrong.

**What happens when the question gets harder.** Add "and break it down by the
customer's industry, which lives in a different file." In SQL that is one more
line:

```sql
SELECT c.industry,
       count(DISTINCT e.customer_id) AS customers,
       count(*)                      AS api_calls
FROM read_csv_auto('datasets/usage_events.csv') e
JOIN read_csv_auto('datasets/customers.csv') c USING (customer_id)
WHERE year(e.event_ts) = 2026 AND e.event_type = 'api_call'
GROUP BY c.industry
ORDER BY api_calls DESC
```

Real result:

```
Education           30 customers    969 api_calls
Manufacturing       27 customers    874 api_calls
Financial Services  21 customers    729 api_calls
Media               26 customers    719 api_calls
Software            22 customers    676 api_calls
Logistics           20 customers    582 api_calls
Retail              21 customers    532 api_calls
Healthcare          17 customers    383 api_calls
```

In Python, that same change means loading a second CSV into a lookup dict,
joining by hand, and handling customers that appear in one file but not the
other. The Python version grows faster than the question does. That is the
whole argument.

The division of labour to remember: **Python moves and reshapes data. SQL
answers questions about data.** Use Python to get the customer's export into a
table, then stop writing Python and write SQL.

## Exercises

Write your answers as `.py` files in your own learning-log repository.
Solutions are in `solutions.md`.

1. Write a script that defines a list of dicts for three customers, each with
   `company_name`, `seats`, and `mrr`. Loop over it and print one line per
   customer using an f-string. Then print the total MRR.

2. Modify `weather_to_csv.py` to add two cities of your choice. Run it and
   confirm the row count in the output changes from 28 to 42.

3. Write a script that calls the NASA APOD endpoint with `DEMO_KEY` and prints
   only the `title` and `date` fields. Then change the API key to something
   invalid and add handling so the script prints
   `API returned 403: <message>` instead of crashing.

4. Read `datasets/support_tickets.csv` with `csv.DictReader` and count tickets
   by `priority`. Print the counts sorted from most to least. Do this in plain
   Python, no SQL.

5. Extend exercise 4: count how many tickets have a blank `closed_at`, which
   means still open. Print the number and the percentage of all tickets, to
   one decimal place. Watch what type an empty CSV cell arrives as.

6. Write the SQL that answers exercises 4 and 5 in a single DuckDB query, run
   it with `duckdb.sql(...).fetchall()`, and confirm the numbers match your
   Python. If they do not, one of the two is wrong — find out which.

7. Write a function `parse_score(value)` that takes the `satisfaction_score`
   field from `support_tickets.csv` and returns an `int` when it is a number
   and `None` when it is blank. Use it to compute the average satisfaction
   score across all tickets that have one. State clearly how many tickets you
   excluded and why that matters when you report the number.

8. The GitHub endpoint `https://api.github.com/repos/duckdb/duckdb/issues`
   returns a page of issues. Write a script that fetches the first three pages
   with `per_page=5`, collects every issue's `number` and `title` into one
   list, and writes them to `issues.csv`. Print the total count and confirm it
   is 15.

9. Take this failing snippet, predict the error before you run it, then run it
   and fix it:

   ```python
   import csv
   with open("../../datasets/plans.csv") as f:
       rows = list(csv.DictReader(f))
   total = 0
   for row in rows:
       total = total + row["monthly_price"]
   print(f"total monthly price across plans: {total}")
   ```

10. A customer sends `export.json` shaped like
    `{"records": [{"id": 1, "attributes": {"name": "Acme", "plan": "Pro"}}, ...]}`.
    Write a script that reads it and produces a flat CSV with columns `id`,
    `name`, `plan`. Create your own small `export.json` with four records to
    test against. Handle the case where one record is missing the `plan` key
    without crashing.

## Checkpoint

<details>
<summary>1. What is the difference between a list and a dictionary, and which one represents a row of data?</summary>

A list is an ordered collection accessed by numeric position (`plans[0]`). A
dictionary maps named keys to values and is accessed by key
(`customer["seats"]`). A dictionary represents one row, because a row has
named columns. A list of dictionaries represents a table, and it is also
exactly the shape a JSON array of records parses into.
</details>

<details>
<summary>2. This line crashes with a KeyError. Name two different fixes and say when each is right.</summary>

```python
plan = customer["plan_name"]
```

Fix one: `customer.get("plan_name")` returns `None` instead of raising. Right
when the field is genuinely optional and downstream code handles a missing
value. Fix two: wrap it in `try`/`except KeyError` and log which record was
malformed. Right when a missing field means the input is broken and someone
needs to know. Choosing `.get()` everywhere hides data-quality problems, which
is its own bug.
</details>

<details>
<summary>3. Why does `requests.get(url)` not raise an error when the server returns 404?</summary>

Because the request succeeded. The library's job is to complete an HTTP
exchange, and it did: it sent a request and received a response. The 404 is
the server's answer, not a failure of the transport. That is why you check
`response.status_code` yourself, and why `try`/`except` around a request only
catches network-level failures such as timeouts and DNS errors.
</details>

<details>
<summary>4. Both these produce the same numbers on 38,000 rows. Give two reasons to prefer the SQL version anyway.</summary>

First, it expresses the question in one statement instead of five moving
parts, so it is far easier for someone else to verify. Second, it survives the
question getting harder: adding a join to another table, a second grouping, or
a window function is one more line in SQL and a structural rewrite in Python.
A third reason worth saying out loud is `count(DISTINCT ...)`, which is one
word in SQL and a dict of sets in Python.
</details>

<details>
<summary>5. A script that worked on your machine crashes on a customer's file with `UnicodeDecodeError`. What did you forget?</summary>

`encoding="utf-8"` on the `open()` call. Windows defaults to a legacy
code page (cp1252), so the first accented character, curly quote, or currency
symbol in the customer's file causes the crash. Real customer data always has
one. Related trap: omitting `newline=""` when writing a CSV on Windows
produces a blank line between every row.
</details>

You can now say:

- "I write Python to pull data from APIs, reshape nested JSON into rows, and
  load it into a database so it can be queried."
- "I handle API failures explicitly: network exceptions and non-200 status
  codes are different problems and I check for both."
- "I know where the line is between Python and SQL. I use Python to move and
  reshape data, and SQL to answer questions about it."

## Put it on your résumé

- Wrote Python scripts using `requests` to pull data from public REST APIs,
  reshape nested JSON into tabular CSV, and load it into DuckDB for analysis,
  with explicit handling for network errors and non-200 responses.
- Automated a recurring manual data-reshaping task, converting a multi-step
  spreadsheet process into a single script that produces the same result in
  under one second.

## Go deeper

- [Automate the Boring Stuff with Python](https://automatetheboringstuff.com/) —
  free online, and the only beginner book aimed at exactly this use case:
  files and data, not computer science. Chapters 1 to 6, 9, and 16.
- [Requests quickstart](https://requests.readthedocs.io/en/latest/user/quickstart/) —
  short official documentation. Read the sections on parameters, response
  content, and status codes; skip the rest until you need it.
- [Python csv module docs](https://docs.python.org/3/library/csv.html) —
  specifically `DictReader` and `DictWriter`, which are the only two pieces
  you need.
- [DuckDB Python API docs](https://duckdb.org/docs/api/python/overview) — how
  to run SQL from Python and get results back as tuples or a DataFrame.
- [Real Python: exceptions](https://realpython.com/python-exceptions/) — a
  clear explanation of `try`/`except` and why catching everything is a trap.
