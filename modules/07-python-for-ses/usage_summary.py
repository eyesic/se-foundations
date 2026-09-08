"""The same question answered twice: once in plain Python, once in one query.

Question: for each event type in 2026, how many events were there, how many
distinct customers produced them, and what is the average number of events per
active customer?

Run it:
    python usage_summary.py

Needs:
    pip install duckdb
"""

import csv
import time
from collections import defaultdict
from pathlib import Path

import duckdb

# parents[0] is this folder, parents[1] is modules/, parents[2] is the repo
# root. Building the path this way means the script works no matter which
# directory you run it from.
DATA = Path(__file__).parents[2] / "datasets" / "usage_events.csv"


def the_python_way():
    """Read the CSV row by row and count things in dictionaries."""
    counts = defaultdict(int)
    customers = defaultdict(set)

    with open(DATA, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            # event_ts looks like "2024-03-24 10:11:56". Everything from the
            # CSV arrives as a string, so this is string slicing, not dates.
            if not row["event_ts"].startswith("2026"):
                continue
            event_type = row["event_type"]
            counts[event_type] += 1
            customers[event_type].add(row["customer_id"])

    results = []
    for event_type, total in counts.items():
        distinct = len(customers[event_type])
        results.append((event_type, total, distinct, round(total / distinct, 1)))

    # sort() with a key function: sort by the second item of each tuple,
    # largest first.
    results.sort(key=lambda r: r[1], reverse=True)
    return results


def the_sql_way():
    """Ask DuckDB the same question in one statement."""
    return duckdb.sql(
        f"""
        SELECT event_type,
               count(*)                     AS events,
               count(DISTINCT customer_id)  AS customers,
               round(count(*) * 1.0 / count(DISTINCT customer_id), 1)
                                            AS events_per_customer
        FROM read_csv_auto('{DATA.as_posix()}')
        WHERE year(event_ts) = 2026
        GROUP BY event_type
        ORDER BY events DESC
        """
    ).fetchall()


def show(title, rows, seconds):
    print(f"\n{title}  ({seconds:.3f} seconds)")
    print(f"{'event_type':<18}{'events':>8}{'customers':>11}{'per_cust':>10}")
    for event_type, events, customers, per_customer in rows:
        print(f"{event_type:<18}{events:>8}{customers:>11}{per_customer:>10}")


def main():
    if not DATA.exists():
        print(f"cannot find {DATA}. Run datasets/generate.py first.")
        return

    start = time.perf_counter()
    python_rows = the_python_way()
    python_seconds = time.perf_counter() - start

    start = time.perf_counter()
    sql_rows = the_sql_way()
    sql_seconds = time.perf_counter() - start

    show("Plain Python", python_rows, python_seconds)
    show("One SQL query", sql_rows, sql_seconds)

    # Compare the answers, not just the timings. Two implementations that
    # disagree mean one of them is wrong, and it is usually the hand-written
    # one.
    python_normalized = [(r[0], r[1], r[2]) for r in python_rows]
    sql_normalized = [(r[0], r[1], r[2]) for r in sql_rows]
    print("\nsame answer from both:", python_normalized == sql_normalized)


if __name__ == "__main__":
    main()
