"""Call a public API, parse the JSON, write a CSV, then query it with SQL.

This is the whole shape of an SE data task in about sixty lines: get data from
somewhere you do not control, reshape it into rows and columns, and answer a
question with SQL.

Run it:
    python weather_to_csv.py

Needs:
    pip install requests duckdb
"""

import csv
from pathlib import Path

import duckdb
import requests

# Where the data comes from and where it lands. Path(__file__).parent means
# "the folder this script lives in", so the CSV shows up next to the script no
# matter which directory you ran it from.
API_URL = "https://api.open-meteo.com/v1/forecast"
OUT_PATH = Path(__file__).parent / "weather.csv"

# Four cities where a fictional customer has offices.
CITIES = [
    {"name": "New York", "latitude": 40.7128, "longitude": -74.0060},
    {"name": "Chapel Hill", "latitude": 35.9132, "longitude": -79.0558},
    {"name": "London", "latitude": 51.5072, "longitude": -0.1276},
    {"name": "Singapore", "latitude": 1.3521, "longitude": 103.8198},
]


def fetch_city(city):
    """Ask the API for one city's daily forecast and return a list of rows."""
    params = {
        "latitude": city["latitude"],
        "longitude": city["longitude"],
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "temperature_unit": "fahrenheit",
        "precipitation_unit": "inch",
        "timezone": "auto",
        "forecast_days": 7,
    }

    try:
        response = requests.get(API_URL, params=params, timeout=20)
    except requests.exceptions.RequestException as error:
        # The network itself failed: no DNS, no route, timed out. There is no
        # status code to read because no response ever arrived.
        print(f"  network error for {city['name']}: {error}")
        return []

    if response.status_code != 200:
        # A response arrived and it is not a success. Print the body, because
        # the body is where the API explains what you did wrong.
        print(f"  HTTP {response.status_code} for {city['name']}: {response.text[:200]}")
        return []

    data = response.json()

    # Open-Meteo returns parallel arrays, not a list of records:
    #   "daily": {"time": [...], "temperature_2m_max": [...], ...}
    # Element 0 of every array describes the same day, so zip() stitches them
    # back into one row per day.
    daily = data["daily"]
    rows = []
    for day, high, low, rain in zip(
        daily["time"],
        daily["temperature_2m_max"],
        daily["temperature_2m_min"],
        daily["precipitation_sum"],
    ):
        rows.append(
            {
                "city": city["name"],
                "forecast_date": day,
                "high_f": high,
                "low_f": low,
                "precip_in": rain,
            }
        )
    return rows


def main():
    all_rows = []
    for city in CITIES:
        print(f"fetching {city['name']}...")
        all_rows.extend(fetch_city(city))

    if not all_rows:
        print("no rows fetched, stopping")
        return

    # newline="" is required on Windows. Without it every other line in the
    # CSV is blank, which is a classic first-time bug.
    with open(OUT_PATH, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(all_rows[0].keys()))
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"\nwrote {len(all_rows)} rows to {OUT_PATH.name}")

    # DuckDB reads the CSV straight off disk. No server, no table creation, no
    # import step.
    #
    # .fetchall() gives back a plain list of tuples. DuckDB can also print a
    # drawn table, but that uses box-drawing characters the default Windows
    # console cannot encode, so printing rows ourselves keeps this portable.
    rows = duckdb.sql(
        f"""
        SELECT city,
               max(high_f)  AS hottest_f,
               min(low_f)   AS coldest_f,
               round(sum(precip_in), 2) AS total_precip_in
        FROM read_csv_auto('{OUT_PATH.as_posix()}')
        GROUP BY city
        ORDER BY hottest_f DESC
        """
    ).fetchall()

    print("\n7-day forecast summary by city")
    print(f"{'city':<14}{'hottest_f':>10}{'coldest_f':>11}{'precip_in':>11}")
    for city, hottest, coldest, precip in rows:
        print(f"{city:<14}{hottest:>10}{coldest:>11}{precip:>11}")


if __name__ == "__main__":
    main()
