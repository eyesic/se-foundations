"""Generate the Northwind Analytics sample dataset.

Northwind Analytics is a fictional B2B SaaS company. This script writes seven
CSV files into the same folder as the script. It is deterministic: the seed is
fixed, so running it again produces byte-identical files.

Requirements: Python 3.10 or newer. Standard library only, no installs.

Usage:
    python generate.py
"""

import csv
import os
import random
from datetime import date, datetime, timedelta

SEED = 42
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

WINDOW_START = date(2024, 1, 1)
WINDOW_END = date(2026, 8, 31)
TOTAL_DAYS = (WINDOW_END - WINDOW_START).days

# --------------------------------------------------------------------------
# Reference data
# --------------------------------------------------------------------------

PLANS = [
    # plan_id, name, monthly_price (list price per seat per month), seat_limit
    (1, "Free", 0, 3),
    (2, "Starter", 15, 25),
    (3, "Pro", 40, 100),
    (4, "Enterprise", 90, 1000),
]

PLAN_WEIGHTS = [0.12, 0.38, 0.35, 0.15]

SEAT_RANGE = {1: (1, 3), 2: (3, 25), 3: (10, 100), 4: (60, 400)}

INDUSTRIES = [
    "Software",
    "Financial Services",
    "Healthcare",
    "Retail",
    "Manufacturing",
    "Education",
    "Logistics",
    "Media",
]

COUNTRY_REGION = [
    ("United States", "NA"),
    ("Canada", "NA"),
    ("United Kingdom", "EMEA"),
    ("Germany", "EMEA"),
    ("France", "EMEA"),
    ("Netherlands", "EMEA"),
    ("Australia", "APAC"),
    ("Japan", "APAC"),
    ("India", "APAC"),
    ("Brazil", "LATAM"),
]

COUNTRY_WEIGHTS = [0.34, 0.08, 0.12, 0.09, 0.06, 0.05, 0.07, 0.06, 0.07, 0.06]

CSMS = [
    "Dana Whitfield",
    "Marcus Bell",
    "Priya Raman",
    "Tom Okafor",
    "Sofia Marchetti",
    "Ella Nguyen",
    "Jordan Reyes",
    "Chris Lindqvist",
]

NAME_FIRST = [
    "Acme", "Northwind", "Blue Ridge", "Harbor", "Cobalt", "Summit", "Lakeside",
    "Redwood", "Vertex", "Ironclad", "Bright", "Pine", "Granite", "Aurora",
    "Meridian", "Copper", "Falcon", "Sable", "Willow", "Anchor", "Quill",
    "Nimbus", "Orchard", "Beacon", "Cedar", "Halcyon", "Juniper", "Keystone",
    "Lantern", "Marlow", "Onyx", "Pivot", "Quarry", "Ridgeline", "Solstice",
    "Tidewater", "Umber", "Vantage", "Westgate", "Yardley",
]

NAME_SECOND = [
    "Analytics", "Logistics", "Health", "Retail", "Systems", "Labs", "Partners",
    "Group", "Industries", "Digital", "Works", "Networks", "Foods", "Media",
    "Financial", "Robotics", "Learning", "Freight", "Interactive", "Supply",
]

NAME_SUFFIX = ["Inc", "LLC", "Ltd", "Co", "GmbH", "SA", "Pty"]

ROLES = ["admin", "member", "viewer"]
ROLE_WEIGHTS = [0.15, 0.6, 0.25]

EVENT_TYPES = ["login", "report_created", "export", "api_call", "dashboard_viewed"]
EVENT_WEIGHTS = [0.3, 0.12, 0.08, 0.2, 0.3]

PRIORITIES = ["low", "medium", "high", "urgent"]
PRIORITY_WEIGHTS = [0.3, 0.4, 0.22, 0.08]

CATEGORIES = [
    "Billing",
    "Integration",
    "Bug",
    "How-to",
    "Data Import",
    "Performance",
    "Access",
]
CATEGORY_WEIGHTS = [0.14, 0.2, 0.18, 0.22, 0.12, 0.07, 0.07]

FIRST_NAMES = [
    "alex", "sam", "jordan", "casey", "riley", "morgan", "avery", "quinn",
    "taylor", "hayden", "rowan", "emerson", "kai", "noor", "mateo", "ines",
    "yuki", "lars", "amara", "dev",
]

LAST_NAMES = [
    "patel", "kim", "garcia", "smith", "muller", "rossi", "novak", "silva",
    "ali", "chen", "dubois", "hansen", "okoro", "tanaka", "murphy", "walsh",
    "ivanov", "santos", "berg", "young",
]


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------


def random_date(start: date, end: date) -> date:
    """Uniform random date between start and end, inclusive."""
    span = (end - start).days
    if span <= 0:
        return start
    return start + timedelta(days=random.randint(0, span))


def growth_signup_date() -> date:
    """A signup date skewed toward recent months, the way a growing SaaS looks."""
    if random.random() < 0.25:
        offset = random.randint(0, TOTAL_DAYS - 30)
    else:
        offset = int(random.triangular(0, TOTAL_DAYS - 30, TOTAL_DAYS * 0.8))
    return WINDOW_START + timedelta(days=offset)


def random_time_on(day: date) -> datetime:
    """A plausible business-hours-ish timestamp on the given day."""
    hour = random.choices(
        range(24),
        weights=[1, 1, 1, 1, 1, 2, 4, 7, 10, 12, 12, 11, 9, 10, 11, 10, 8, 6, 4, 3, 2, 2, 1, 1],
    )[0]
    return datetime(day.year, day.month, day.day, hour, random.randint(0, 59), random.randint(0, 59))


def iso(value) -> str:
    """ISO-8601 text, or empty string for None (which DuckDB reads as NULL)."""
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    return value.isoformat()


def write_csv(filename: str, header: list, rows: list) -> None:
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(header)
        writer.writerows(rows)
    print(f"wrote {filename:22} {len(rows):>6} rows")


# --------------------------------------------------------------------------
# Table builders
# --------------------------------------------------------------------------


def build_customers(n=200):
    """200 customers. A few share a company name with a different customer_id,
    which is deliberate: duplicate-looking accounts are a real data problem."""
    customers = []
    used_names = set()
    for i in range(1, n + 1):
        while True:
            name = f"{random.choice(NAME_FIRST)} {random.choice(NAME_SECOND)}"
            if random.random() < 0.35:
                name = f"{name} {random.choice(NAME_SUFFIX)}"
            if name not in used_names:
                used_names.add(name)
                break
        country, region = random.choices(COUNTRY_REGION, weights=COUNTRY_WEIGHTS)[0]
        customers.append(
            {
                "customer_id": i,
                "company_name": name,
                "industry": random.choice(INDUSTRIES),
                "country": country,
                "region": region,
                "signup_date": growth_signup_date(),
                "csm_owner": random.choice(CSMS),
            }
        )

    # Six accounts are duplicates of an earlier company name with a new id.
    dupe_targets = random.sample(range(20, n), 6)
    dupe_sources = random.sample(range(0, 20), 6)
    for target, source in zip(dupe_targets, dupe_sources):
        customers[target]["company_name"] = customers[source]["company_name"]

    # Fifteen self-serve accounts have no assigned CSM, so csm_owner is NULL.
    for idx in random.sample(range(n), 15):
        customers[idx]["csm_owner"] = None

    return customers


def build_subscriptions(customers):
    """One subscription per customer, plus an upgrade for roughly a third.

    status is one of active, churned, trial. An upgraded customer has an old
    churned row and a new active row, so counting churned subscriptions is not
    the same as counting churned customers. Modules 03 and 04 use that.
    """
    subscriptions = []
    sub_id = 1
    for cust in customers:
        plan_id = random.choices([p[0] for p in PLANS], weights=PLAN_WEIGHTS)[0]
        low, high = SEAT_RANGE[plan_id]
        seats = random.randint(low, high)
        start = cust["signup_date"]
        price = PLANS[plan_id - 1][2]
        roll = random.random()
        days_live = (WINDOW_END - start).days

        if roll < 0.35 and days_live < 120:
            status, end_date = "trial", None
        elif roll < 0.30 and days_live > 120:
            status = "churned"
            end_date = start + timedelta(days=random.randint(90, max(91, days_live)))
            if end_date > WINDOW_END:
                end_date = WINDOW_END
        else:
            status, end_date = "active", None

        subscriptions.append(
            {
                "subscription_id": sub_id,
                "customer_id": cust["customer_id"],
                "plan_id": plan_id,
                "start_date": start,
                "end_date": end_date,
                "status": status,
                "seats": seats,
                "mrr": round(price * seats, 2),
            }
        )
        sub_id += 1

        # Upgrade path: close the first subscription and open a bigger one.
        if status == "active" and plan_id < 4 and days_live > 150 and random.random() < 0.55:
            switch = start + timedelta(days=random.randint(100, days_live - 30))
            subscriptions[-1]["status"] = "churned"
            subscriptions[-1]["end_date"] = switch
            new_plan = plan_id + 1
            low, high = SEAT_RANGE[new_plan]
            new_seats = max(seats, random.randint(low, high))
            subscriptions.append(
                {
                    "subscription_id": sub_id,
                    "customer_id": cust["customer_id"],
                    "plan_id": new_plan,
                    "start_date": switch,
                    "end_date": None,
                    "status": "active",
                    "seats": new_seats,
                    "mrr": round(PLANS[new_plan - 1][2] * new_seats, 2),
                }
            )
            sub_id += 1

    return subscriptions


def build_users(customers, subs_by_customer):
    """Between 2 and 30 users per customer, scaled to the seats they bought."""
    users = []
    user_id = 1
    for cust in customers:
        subs = subs_by_customer[cust["customer_id"]]
        seats = max(s["seats"] for s in subs)
        target = min(30, max(2, int(random.triangular(2, min(30, seats + 4), 8))))
        last_end = max((s["end_date"] or WINDOW_END) for s in subs)
        for _ in range(target):
            created = random_date(cust["signup_date"], min(last_end, WINDOW_END))
            local = f"{random.choice(FIRST_NAMES)}.{random.choice(LAST_NAMES)}{random.randint(1, 99)}"
            domain = cust["company_name"].split()[0].lower().replace(".", "")
            if random.random() < 0.12:
                last_login = None
            else:
                last_login = random_time_on(random_date(created, min(last_end, WINDOW_END)))
            users.append(
                {
                    "user_id": user_id,
                    "customer_id": cust["customer_id"],
                    "email": f"{local}@{domain}.com",
                    "role": random.choices(ROLES, weights=ROLE_WEIGHTS)[0],
                    "created_at": random_time_on(created),
                    "last_login_at": last_login,
                }
            )
            user_id += 1
    return users


def build_usage_events(users, target_rows=40000):
    """Activity per user, weighted so a few power users generate a lot."""
    events = []
    event_id = 1
    active_users = [u for u in users if u["last_login_at"] is not None]
    per_user = target_rows / max(1, len(active_users))
    for user in active_users:
        count = max(0, int(random.triangular(0, per_user * 2.4, per_user * 0.6)))
        first = user["created_at"].date()
        last = user["last_login_at"].date()
        for _ in range(count):
            day = random_date(first, last)
            events.append(
                {
                    "event_id": event_id,
                    "user_id": user["user_id"],
                    "customer_id": user["customer_id"],
                    "event_type": random.choices(EVENT_TYPES, weights=EVENT_WEIGHTS)[0],
                    "event_ts": random_time_on(day),
                }
            )
            event_id += 1
    events.sort(key=lambda e: e["event_ts"])
    for new_id, event in enumerate(events, start=1):
        event["event_id"] = new_id
    return events


def build_tickets(customers, subs_by_customer, target_rows=1500):
    """Support tickets. Some are still open, so closed_at and
    satisfaction_score are NULL for them."""
    tickets = []
    ticket_id = 1
    per_customer = target_rows / len(customers)
    for cust in customers:
        subs = subs_by_customer[cust["customer_id"]]
        last_end = max((s["end_date"] or WINDOW_END) for s in subs)
        count = max(0, int(random.triangular(0, per_customer * 3, per_customer * 0.6)))
        for _ in range(count):
            opened_day = random_date(cust["signup_date"], min(last_end, WINDOW_END))
            opened = random_time_on(opened_day)
            still_open = random.random() < 0.12 or opened_day > WINDOW_END - timedelta(days=5)
            if still_open:
                closed, score = None, None
            else:
                hours = random.choices([2, 8, 26, 72, 200], weights=[0.3, 0.3, 0.2, 0.15, 0.05])[0]
                closed = opened + timedelta(hours=hours, minutes=random.randint(0, 59))
                if closed > datetime(WINDOW_END.year, WINDOW_END.month, WINDOW_END.day, 23, 59):
                    closed = None
                score = None if (closed is None or random.random() < 0.3) else random.choices(
                    [1, 2, 3, 4, 5], weights=[0.05, 0.08, 0.17, 0.35, 0.35]
                )[0]
            tickets.append(
                {
                    "ticket_id": ticket_id,
                    "customer_id": cust["customer_id"],
                    "opened_at": opened,
                    "closed_at": closed,
                    "priority": random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS)[0],
                    "category": random.choices(CATEGORIES, weights=CATEGORY_WEIGHTS)[0],
                    "satisfaction_score": score,
                }
            )
            ticket_id += 1
    tickets.sort(key=lambda t: t["opened_at"])
    for new_id, ticket in enumerate(tickets, start=1):
        ticket["ticket_id"] = new_id
    return tickets


def add_months(day: date, months: int) -> date:
    month_index = day.month - 1 + months
    year = day.year + month_index // 12
    month = month_index % 12 + 1
    last_day = [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
    return date(year, month, min(day.day, last_day))


def build_invoices(subscriptions):
    """One invoice per month for every paid subscription.
    Free plans and trials are never invoiced."""
    invoices = []
    invoice_id = 1
    for sub in subscriptions:
        if sub["plan_id"] == 1 or sub["status"] == "trial" or sub["mrr"] == 0:
            continue
        step = 1  # every paid subscription is billed monthly
        amount_per_invoice = sub["mrr"] * step
        stop = sub["end_date"] or WINDOW_END
        cycle = 0
        while True:
            invoice_date = add_months(sub["start_date"], cycle * step)
            if invoice_date > stop or invoice_date > WINDOW_END:
                break
            age_days = (WINDOW_END - invoice_date).days
            roll = random.random()
            if roll < 0.02:
                status = "void"
            elif age_days < 75 and roll < 0.20:
                status = "overdue"
            elif roll < 0.035:
                status = "overdue"
            else:
                status = "paid"
            invoices.append(
                {
                    "invoice_id": invoice_id,
                    "subscription_id": sub["subscription_id"],
                    "invoice_date": invoice_date,
                    "amount": round(amount_per_invoice, 2),
                    "status": status,
                }
            )
            invoice_id += 1
            cycle += 1
    invoices.sort(key=lambda i: (i["invoice_date"], i["subscription_id"]))
    for new_id, invoice in enumerate(invoices, start=1):
        invoice["invoice_id"] = new_id
    return invoices


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------


def main() -> None:
    random.seed(SEED)

    customers = build_customers()
    subscriptions = build_subscriptions(customers)

    subs_by_customer = {}
    for sub in subscriptions:
        subs_by_customer.setdefault(sub["customer_id"], []).append(sub)

    users = build_users(customers, subs_by_customer)
    usage_events = build_usage_events(users)
    tickets = build_tickets(customers, subs_by_customer)
    invoices = build_invoices(subscriptions)

    write_csv(
        "plans.csv",
        ["plan_id", "name", "monthly_price", "seat_limit"],
        [list(p) for p in PLANS],
    )
    write_csv(
        "customers.csv",
        ["customer_id", "company_name", "industry", "country", "region", "signup_date", "csm_owner"],
        [
            [c["customer_id"], c["company_name"], c["industry"], c["country"], c["region"],
             iso(c["signup_date"]), c["csm_owner"] or ""]
            for c in customers
        ],
    )
    write_csv(
        "subscriptions.csv",
        ["subscription_id", "customer_id", "plan_id", "start_date", "end_date", "status", "seats", "mrr"],
        [
            [s["subscription_id"], s["customer_id"], s["plan_id"], iso(s["start_date"]),
             iso(s["end_date"]), s["status"], s["seats"], s["mrr"]]
            for s in subscriptions
        ],
    )
    write_csv(
        "users.csv",
        ["user_id", "customer_id", "email", "role", "created_at", "last_login_at"],
        [
            [u["user_id"], u["customer_id"], u["email"], u["role"], iso(u["created_at"]),
             iso(u["last_login_at"])]
            for u in users
        ],
    )
    write_csv(
        "usage_events.csv",
        ["event_id", "user_id", "customer_id", "event_type", "event_ts"],
        [
            [e["event_id"], e["user_id"], e["customer_id"], e["event_type"], iso(e["event_ts"])]
            for e in usage_events
        ],
    )
    write_csv(
        "support_tickets.csv",
        ["ticket_id", "customer_id", "opened_at", "closed_at", "priority", "category",
         "satisfaction_score"],
        [
            [t["ticket_id"], t["customer_id"], iso(t["opened_at"]), iso(t["closed_at"]),
             t["priority"], t["category"], "" if t["satisfaction_score"] is None else t["satisfaction_score"]]
            for t in tickets
        ],
    )
    write_csv(
        "invoices.csv",
        ["invoice_id", "subscription_id", "invoice_date", "amount", "status"],
        [
            [i["invoice_id"], i["subscription_id"], iso(i["invoice_date"]), i["amount"], i["status"]]
            for i in invoices
        ],
    )
    print("done. seed =", SEED)


if __name__ == "__main__":
    main()
