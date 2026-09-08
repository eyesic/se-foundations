# 06. Solutions

Try every exercise before reading these. Where a live value is shown, it was
captured on 2026-09-07 — yours will differ in the numbers, not in the shape.

## 1. Label the URL

```
https://api.open-meteo.com/v1/forecast?latitude=35.9&longitude=-79.0&daily=temperature_2m_max&timezone=America/New_York
```

| Part | Value |
|---|---|
| Scheme | `https` |
| Host | `api.open-meteo.com` |
| Path | `/v1/forecast` |
| Query parameter | `latitude` = `35.9` |
| Query parameter | `longitude` = `-79.0` |
| Query parameter | `daily` = `temperature_2m_max` |
| Query parameter | `timezone` = `America/New_York` |

`/v1` is a version prefix. Most APIs version in the path like this so they can
change the response shape later without breaking existing customers. When a
customer asks "will this break when you upgrade," the answer is usually "we
publish a new version path and support the old one for N months."

## 2. Chapel Hill max temperature in Fahrenheit

The parameter is `temperature_unit=fahrenheit`. Full URL:

```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=35.9132&longitude=-79.0558&daily=temperature_2m_max&temperature_unit=fahrenheit&timezone=America/New_York&forecast_days=3"
```

Real response:

```json
{
  "latitude": 35.924107,
  "longitude": -79.04457,
  "timezone": "America/New_York",
  "elevation": 151.0,
  "daily_units": {"time": "iso8601", "temperature_2m_max": "°F"},
  "daily": {
    "time": ["2026-09-07", "2026-09-08", "2026-09-09"],
    "temperature_2m_max": [86.0, 87.6, 89.5]
  }
}
```

Today is index 0, so tomorrow's maximum is index 1: 87.6°F.

The thing to notice: `daily` is not a list of records. It is one object
holding parallel arrays, where `time[1]` lines up with
`temperature_2m_max[1]`. That is a real format used by real APIs, and it is a
different mental model from "an array of rows." If you feed this straight into
a spreadsheet expecting rows, you get nothing. Module 07 turns this exact
shape into a CSV.

## 3. Open issue count for duckdb/duckdb

```bash
curl "https://api.github.com/repos/duckdb/duckdb"
```

The field is `open_issues_count`, at the top level of the object. On
2026-09-07 it was `851`. There is also `open_issues`, which is the older
duplicate of the same number.

The trap: GitHub counts pull requests as issues, so `open_issues_count` is
open issues plus open pull requests. If a customer asked "how many open bugs,"
this number would be wrong and you would need the search endpoint with
`is:issue is:open`. That is the general lesson: a field name is a claim, not a
guarantee. Check what a number actually counts before you put it in a slide.

## 4. A 404 and a 401

404:

```bash
curl "https://api.github.com/repos/duckdb/does-not-exist-xyz"
```

```json
{"message":"Not Found","documentation_url":"https://docs.github.com/rest/repos/repos#get-a-repository","status":"404"}
```

401:

```bash
curl -H "Authorization: Bearer not_a_real_token" "https://api.github.com/user"
```

```json
{"message":"Bad credentials","documentation_url":"https://docs.github.com/rest","status":"401"}
```

What you say to the customer:

- 404: "The URL is reaching us, but there is nothing at that address. Send me
  the exact ID you are requesting and I will confirm whether it exists in your
  account, since it may also be a typo in the path."
- 401: "We are not able to read your credentials, so the request never gets as
  far as your data. Generate a fresh token and retry. If it works, the old
  token expired or was revoked."

One caution: some APIs deliberately return 404 instead of 403 for resources
you are not allowed to see, so that you cannot learn a record exists by
probing. If a 404 appears on a record the customer swears exists, permissions
are a live hypothesis.

## 5. Rate limit headers

```bash
curl -i "https://api.github.com/repos/duckdb/duckdb" | head -20
```

Three runs in a row produced `X-RateLimit-Remaining: 59`, then `58`, then
`57`, against `X-RateLimit-Limit: 60`.

`X-RateLimit-Reset: 1788840369` is a Unix timestamp, meaning seconds since
1970-01-01 UTC. Convert it:

```bash
python -c "import datetime;print(datetime.datetime.fromtimestamp(1788840369))"
```

```
2026-09-08 00:06:09
```

In PowerShell:

```powershell
[DateTimeOffset]::FromUnixTimeSeconds(1788840369).LocalDateTime
```

Being able to convert a Unix timestamp on the spot is a small skill that comes
up constantly in log files and API responses.

## 6. NASA APOD for a specific date

The parameter is `date`, in `YYYY-MM-DD` form.

```bash
curl "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=2024-07-04"
```

Title: `A Beautiful Trifid`, `media_type` of `image`.

## 7. NASA APOD with count=3

```bash
curl "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=3"
```

Returns three random entries, for example: "Mysterious Black Water in Florida
Bay", "South Celestial Rocket Launch", "IC 4592: The Blue Horsehead Reflection
Nebula".

What changed: the top level of the response is now an **array** of objects,
where before it was a single **object**. Nothing else about the fields
changed.

Why that matters: code written for the single-object version breaks
immediately on the array version, usually with an error such as "list indices
must be integers." An API that changes its top-level type depending on a
parameter is a real-world hazard, and spotting it is exactly the kind of thing
an SE flags during a POC before it bites the customer in production. The safe
handling is to normalize: if the parsed result is not a list, wrap it in a
one-item list, then loop over it either way.

## 8. The seven questions for Stripe's "list customers"

| Question | Answer |
|---|---|
| Base URL | `https://api.stripe.com/v1` |
| Auth | Secret API key, sent as HTTP Basic auth with the key as the username and an empty password. Documented as `-u sk_test_...:` in their curl examples. Newer keys may also be sent as a bearer token |
| Endpoint | `GET /v1/customers` |
| Required parameters | None. Everything (`email`, `created`, `limit`) is an optional filter |
| Success shape | An object with `object: "list"`, a `data` array holding the customers, `has_more` as a boolean, and a `url`. The records are nested under `data`, not at the top level |
| Pagination | Cursor-based, using `limit` (1 to 100, default 10) with `starting_after` or `ending_before` set to an object ID. `has_more` tells you when to stop |
| Rate limits | Roughly 100 read requests per second in live mode and 25 per second in test mode, per account, returning 429 when exceeded |

The two habits to take away: the records are under `data` rather than at the
top level, and `has_more` is the loop condition. Both patterns recur across
dozens of APIs.

## 9. The 429 escalation

Five questions:

1. What is the exact timestamp, in UTC, of a failing request, and can you send
   the full response including headers?
2. How many requests per minute is your sync sending, and is it single-
   threaded or parallel?
3. Did the volume of records change recently, or did you add another job or
   environment using the same key?
4. Are you using one API key across multiple systems? Rate limits are
   typically per key or per account, so a second integration can exhaust the
   budget for the first.
5. What does your client do when it gets a 429 — retry immediately, retry with
   a delay, or fail the run?

Two headers to capture: `Retry-After` (how long to wait, if the API sends it)
and the rate-limit family (`X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset`) so you can see the size of the budget and when it resets.

The likely root cause to have in mind: immediate retries on 429 make the
problem worse, so a client without backoff turns a brief limit into a
sustained outage. The fix is exponential backoff with jitter, plus spreading
the sync out rather than firing it all at 2pm.

## 10. Postman export

In a Postman v2.1 collection export, a variable used in a URL appears as the
literal text `{{api_key}}` inside the request `url.raw` field. Collection-level
variables appear in a top-level `variable` array with `key` and `value`.

Whether it leaks depends on where you put the value:

- Value stored in an **environment**: environments are exported as a separate
  file, so the collection export contains only the placeholder. Safe to share.
- Value stored as a **collection variable**: the value is inside the
  collection JSON and is exported with it. This leaks.
- Value typed directly into the URL: obviously leaks.

The professional habit: keep credentials in an environment, use Postman's
"secret" variable type, and never commit an exported environment file to Git.
Add `*.postman_environment.json` to `.gitignore`. If you ever do paste a real
key into a shared collection, rotate the key — deleting the file is not enough
once it has been shared or committed.
