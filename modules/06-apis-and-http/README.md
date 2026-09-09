# 06. APIs and HTTP

## Why an SE needs this

Two moments will define your first year. The first is a prospect on a call
asking "does your product have an API, and what can we do with it?" The
second is a customer emailing at 4pm on a Friday saying "the integration
stopped working, we're getting a 401." Both are technical questions with
non-technical stakes: the first decides whether the deal moves forward, the
second decides whether the customer renews. An SE who can open a terminal or
Postman, make one request, read the response, and say "your token expired,
here is how to rotate it" is worth more than an SE who forwards it to
engineering and waits. This module gets you to that point.

## What you will be able to do

- Describe an API to a non-technical buyer in two sentences without jargon.
- Read a URL out loud and name every part of it.
- Send a GET request from curl and from Postman and read the response.
- Look at a status code and say what the customer should do about it.
- Read a JSON response and pull a specific value out of a nested structure.
- Explain the difference between an API key, a bearer token, and OAuth 2.
- Recognize rate limiting and pagination in real response headers.
- Navigate an unfamiliar API's documentation and find the one endpoint you
  need.

## Concepts

### What an API is

An **API** (Application Programming Interface) is a documented way for one
piece of software to ask another piece of software for something. When you
open a weather app, the app does not know the weather. It asks a weather
service over the internet, gets an answer back, and draws it on your screen.

The customer-facing version of that sentence: "Our API lets your systems talk
to our product directly, so you can pull your data or push data in without
anyone clicking through the interface."

Almost every API you will meet in a B2B SaaS job is a **REST API**: it works
over the web, you address things by URL, and you use standard HTTP verbs to
say what you want to do. REST is a style, not a standard, so APIs that call
themselves REST vary in the details.

### The URL, part by part

```
https://api.github.com/repos/duckdb/duckdb/issues?state=open&per_page=2
scheme   host          path                      query string
```

- **Scheme**: `https` means the connection is encrypted. You will effectively
  never see a production API on plain `http`.
- **Host**: which server answers. Many companies put their API on a separate
  host such as `api.example.com`.
- **Path**: which resource you want. Paths are usually plural nouns:
  `/repos`, `/customers`, `/tickets/4821`.
- **Query string**: everything after the question mark. It is a list of
  **query parameters** in `key=value` form joined by `&`. Query parameters
  filter, sort, or page the results. They never change data.

A **base URL** is the scheme plus host plus any common prefix, such as
`https://api.example.com/v2`. Documentation usually states the base URL once
and then lists paths relative to it.

### HTTP methods

An **HTTP method** (also called a verb) says what you want to do to the
resource at that URL.

| Method | Means | Example | Changes data |
|---|---|---|---|
| GET | Read something | `GET /customers/42` | No |
| POST | Create something | `POST /customers` | Yes |
| PUT | Replace something entirely | `PUT /customers/42` | Yes |
| PATCH | Update part of something | `PATCH /customers/42` | Yes |
| DELETE | Remove something | `DELETE /customers/42` | Yes |

GET is **safe** (it never changes anything) and **idempotent** (running it
five times has the same effect as running it once). PUT and DELETE are
idempotent too. POST is not: five POSTs create five records. That distinction
matters on a support call, because "can I just retry it?" has a different
answer for POST than for PUT.

### Headers

A **header** is a piece of metadata attached to a request or a response. It
travels alongside the data, not inside it. The four you will use constantly:

| Header | On | Purpose |
|---|---|---|
| `Authorization` | Request | Proves who you are |
| `Content-Type` | Both | What format the body is in, for example `application/json` |
| `Accept` | Request | What format you want back |
| `User-Agent` | Request | Who is calling. Some APIs reject requests without one |

### Request and response bodies

A **body** is the payload of data. GET requests almost never have one; the
query string carries the input instead. POST, PUT, and PATCH carry the new or
changed record in the body, nearly always as JSON.

The response body is what you get back. Also nearly always JSON.

### JSON

**JSON** (JavaScript Object Notation) is the text format APIs use to
represent structured data. It has a small number of building blocks.

```json
{
  "customer_id": 42,
  "company_name": "Nimbus Retail",
  "is_active": true,
  "churn_date": null,
  "seats": 25,
  "tags": ["enterprise", "emea"],
  "owner": {
    "name": "Priya Raman",
    "email": "priya@example.com"
  }
}
```

- An **object** is a pair of curly braces holding `"key": value` pairs. Think
  of it as one row, or one record.
- An **array** is a pair of square brackets holding an ordered list of values.
  Think of it as many rows.
- Strings are in double quotes. Numbers are bare. `true` and `false` are bare.
  `null` means "no value," the same idea as NULL in SQL.

Objects nest inside objects, arrays hold objects, and that is where people get
lost. Read it as a path. To get Priya's email from the object above: `owner`
then `email`. In most tools that is written `owner.email`. To get the first
tag: `tags[0]` — arrays start counting at zero.

### Status codes

Every response carries a three-digit **status code**. The first digit is the
category.

| Range | Meaning |
|---|---|
| 2xx | It worked |
| 3xx | It moved, go look elsewhere |
| 4xx | You made a mistake |
| 5xx | The server made a mistake |

The eight you must know cold, with what you actually say on a support call:

| Code | Name | What it means | What you tell the customer |
|---|---|---|---|
| 200 | OK | Request succeeded, data is in the body | Nothing, it worked |
| 201 | Created | POST succeeded, new record exists | Check the `id` in the response and save it |
| 400 | Bad Request | Malformed request: missing field, wrong type | The request itself is wrong. Read the error message, it usually names the field |
| 401 | Unauthorized | No credentials, or credentials are wrong | Your token is missing, expired, or wrong. Rotate it and retry |
| 403 | Forbidden | Credentials are valid but not allowed to do this | You are authenticated, but this key lacks permission. Check the key's scopes or the user's role |
| 404 | Not Found | No resource at that URL | Either the ID does not exist or the path is wrong. Confirm the ID in the UI first |
| 429 | Too Many Requests | You exceeded the rate limit | Slow down. Check the retry header and add backoff |
| 500 | Internal Server Error | Something broke on our side | This is on us. Capture the timestamp and request ID and file it |

The single most valuable distinction in that table is **401 versus 403**. 401
is "I do not know who you are." 403 is "I know who you are and you are not
allowed." Saying that out loud correctly in an interview signals more than any
buzzword.

### Authentication

**Authentication** is proving who you are. **Authorization** is what you are
allowed to do once you are known. Three mechanisms cover almost everything.

**API key.** A long random string the API gives you. You send it in a header
or, on older APIs, as a query parameter.

```
GET /planetary/apod?api_key=DEMO_KEY
```

Keys in the query string end up in server logs and browser history, which is
why headers are preferred. Keys usually do not expire on their own and are
tied to an account, not a person.

**Bearer token.** A token sent in the `Authorization` header with the word
`Bearer` in front. "Bearer" literally means whoever holds it can use it, so it
must be treated as a password.

```
Authorization: Bearer EXAMPLE_TOKEN_abc123_not_a_real_credential
```

Tokens usually expire, often in an hour, which is exactly why the Friday-4pm
401 happens.

**OAuth 2.** Not one thing, a framework for letting a user grant one
application limited access to their data in another application without
handing over their password. The flow you should be able to narrate:

1. Your app sends the user to the provider's login page.
2. The user logs in and sees a consent screen: "Acme wants to read your
   contacts."
3. The provider redirects back to your app with a short-lived
   **authorization code**.
4. Your app exchanges that code, plus its own client secret, for an
   **access token** and a **refresh token**.
5. The app calls the API with the access token. When it expires, the refresh
   token gets a new one silently.

What a buyer actually wants to hear: "Nobody has to share a password, the
customer sees and approves exactly what we access, and access can be revoked
from their side at any time."

A **scope** is a named permission attached to a token, such as `read:tickets`.
Scopes are why 403s happen to valid tokens.

### Rate limits

A **rate limit** caps how many requests you may send in a window. APIs
advertise it in response headers. From a real GitHub response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1788840076
```

Sixty requests per hour unauthenticated, fifty-nine left, and the counter
resets at that Unix timestamp.

The professional handling of 429 is **exponential backoff**: wait 1 second and
retry, then 2, then 4, then 8, with a small random jitter so that a thousand
clients do not all retry in the same instant. If the response includes a
`Retry-After` header, obey it instead of guessing.

### Pagination

APIs will not return 50,000 records at once. **Pagination** splits results
into pages. Three common styles:

| Style | Looks like | Notes |
|---|---|---|
| Page and size | `?page=3&per_page=100` | Simplest. Can skip or repeat rows if data changes mid-scan |
| Offset and limit | `?offset=200&limit=100` | Same idea, same weakness. Gets slow on huge tables |
| Cursor | `?after=Y3Vyc29yOnYyOpL...` | An opaque pointer to "where you stopped." Stable and fast. You cannot jump to page 7 |

GitHub advertises the next page in a `Link` header. This is a real one:

```
Link: <https://api.github.com/repositories/138754790/issues?state=open&per_page=2&page=2&after=Y3Vyc29yOnYyOpLPAAABoH6WXrjPAAAAAUC2k74%3D>; rel="next"
```

The loop you will write a hundred times: call the endpoint, keep the results,
follow `rel="next"`, stop when there is no next link.

### Reading API documentation

Every API's docs answer the same seven questions. When you open unfamiliar
docs, hunt for these in this order and ignore everything else:

1. What is the base URL?
2. How do I authenticate, and what header does it go in?
3. What is the one endpoint that returns the thing I care about?
4. What are the required parameters?
5. What does a successful response look like — is the data at the top level or
   nested under a key such as `data` or `results`?
6. How does pagination work?
7. What are the rate limits?

Finding those seven in under ten minutes on an API you have never seen is a
concrete, testable skill. It is also the skill a take-home interview exercise
is usually measuring.

### Postman

**Postman** is a desktop app for sending HTTP requests without writing code.
Three ideas matter.

- A **collection** is a saved folder of requests. SE teams keep one per
  product so anyone can demo the API in thirty seconds.
- An **environment** is a named set of variables, for example `dev` and
  `prod`, each holding its own `base_url` and `token`.
- A **variable** is written with double curly braces in a URL, header, or
  body, and Postman substitutes the current environment's value. This is how
  you avoid pasting a token into twenty requests, and how you avoid leaking a
  real token when you screen-share.

## Walkthrough

Two APIs, plus deliberate failures. The first needs no signup at all. The
second needs a key, and uses a public demo key so nothing blocks you.

Every response below is real output captured on 2026-09-07. Yours will differ
in the values, not in the shape.

PowerShell and Git Bash both have curl available on Windows 11. In PowerShell,
`curl` is an alias for a different command, so call `curl.exe` explicitly.

### Part 1: a keyless API (Open-Meteo)

Open-Meteo returns weather forecasts with no account and no key.

PowerShell:

```powershell
curl.exe "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,wind_speed_10m&timezone=America/New_York"
```

Git Bash or macOS:

```bash
curl "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,wind_speed_10m&timezone=America/New_York"
```

Real response, reformatted for readability:

```json
{
  "latitude": 40.710335,
  "longitude": -73.99308,
  "generationtime_ms": 0.04649162292480469,
  "utc_offset_seconds": -14400,
  "timezone": "America/New_York",
  "timezone_abbreviation": "GMT-4",
  "elevation": 32.0,
  "current_units": {
    "time": "iso8601",
    "interval": "seconds",
    "temperature_2m": "°C",
    "wind_speed_10m": "km/h"
  },
  "current": {
    "time": "2026-09-07T23:00",
    "interval": 900,
    "temperature_2m": 18.9,
    "wind_speed_10m": 7.6
  }
}
```

Read it as an SE would:

- The response is one object, not an array, because you asked about one place.
- `current.temperature_2m` is 18.9. The path has two steps.
- `current_units` is a separate object telling you 18.9 means Celsius. Many
  APIs separate values from units like this, and misreading it is a classic
  integration bug.
- `latitude` came back as 40.710335, not the 40.7128 you sent. The API snapped
  your point to its nearest grid cell. Noticing that a response does not
  exactly echo the request is a habit worth building.

Now break it on purpose. Send only a latitude:

```bash
curl -i "https://api.open-meteo.com/v1/forecast?latitude=40.71"
```

The `-i` flag prints the status line and headers before the body. Real
response:

```
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{"reason":"Parameter 'latitude' and 'longitude' must have the same number of elements","error":true}
```

400, and the message names the exact problem. This is the first thing you do
when a customer reports "the API is broken": get the full response, not their
paraphrase of it.

### Part 2: headers, rate limits, and pagination (GitHub)

GitHub's REST API allows 60 unauthenticated requests per hour per IP address.

```bash
curl -i "https://api.github.com/repos/duckdb/duckdb"
```

Real response, trimmed to the headers that matter and the first few fields:

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Server: github.com
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1788840076

{
  "id": 138754790,
  "name": "duckdb",
  "full_name": "duckdb/duckdb",
  "private": false,
  "owner": {
    "login": "duckdb",
    "id": 82039556,
    "type": "Organization"
  }
}
```

Now a 404. Ask for a repository that does not exist:

```bash
curl "https://api.github.com/repos/duckdb/does-not-exist-xyz"
```

```json
{"message":"Not Found","documentation_url":"https://docs.github.com/rest/repos/repos#get-a-repository","status":"404"}
```

Now a 401. Send a token that is not real:

```bash
curl -H "Authorization: Bearer not_a_real_token" "https://api.github.com/user"
```

```json
{
  "message": "Bad credentials",
  "documentation_url": "https://docs.github.com/rest",
  "status": "401"
}
```

That is the Friday-4pm escalation, reproduced in one command. "Bad
credentials" plus 401 means the token — not the endpoint, not the data.

Now pagination. Ask for two issues at a time:

```bash
curl -i "https://api.github.com/repos/duckdb/duckdb/issues?state=open&per_page=2&page=1"
```

The body is an array of two objects. The header that matters:

```
Link: <https://api.github.com/repositories/138754790/issues?state=open&per_page=2&page=2&after=Y3Vyc29yOnYyOpLPAAABoH6WXrjPAAAAAUC2k74%3D>; rel="next"
```

Note that GitHub handed back a cursor (`after=...`) even though you asked in
pages. Follow the link it gives you rather than building the next URL
yourself.

### Part 3: a key-based API (NASA APOD with DEMO_KEY)

NASA publishes `DEMO_KEY`, a shared public key meant for exactly this kind of
learning. It is limited to roughly 30 requests per hour per IP address, so if
you start getting 429 responses, wait and come back.

```bash
curl -i "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY"
```

Real response, trimmed:

```
HTTP/1.1 200 OK
Content-Type: application/json
X-Ratelimit-Limit: 10
X-Ratelimit-Remaining: 9

{
  "copyright": "Mark Killion",
  "date": "2026-09-07",
  "explanation": "The Pelican Nebula is slowly being transformed...",
  "media_type": "image",
  "title": "The Pelican Nebula in Gas, Dust, and Stars",
  "url": "https://apod.nasa.gov/apod/image/..."
}
```

Now send a wrong key:

```bash
curl -i "https://api.nasa.gov/planetary/apod?api_key=NOT_A_REAL_KEY"
```

```json
{
  "error": {
    "code": "API_KEY_INVALID",
    "message": "An invalid api_key was supplied. Get one at https://api.nasa.gov:443"
  }
}
```

The status code is **403**, not 401. NASA's gateway treats a malformed key as
"forbidden" rather than "unauthenticated." This is the real lesson of the
walkthrough: the specification says one thing, vendors do another, and you
must read the body, not just the number. When you write your escalation, you
quote both.

### Part 4: the same thing in Postman

1. Install Postman (the free tier is enough) and create a local workspace.
2. Create a **collection** named `SE Practice`.
3. Create an **environment** named `nasa` with one variable: `api_key` set to
   `DEMO_KEY`.
4. Add a request: GET `https://api.nasa.gov/planetary/apod?api_key={{api_key}}`.
   Select the `nasa` environment in the top-right dropdown, then Send.
5. In the response pane, switch between Pretty, Raw, and Headers. Find the
   status code, the time, the size, and `X-Ratelimit-Remaining`.
6. Change the environment variable to `NOT_A_REAL_KEY` and Send again. You get
   the 403 without editing the request itself. That is the whole point of
   environments, and it is how an SE keeps a real customer token off the
   screen during a demo.

## Exercises

Run these on your computer, in curl or Postman, whichever you prefer: every one
of them calls a live API over the network, which is exactly what a browser code
cell cannot do. Write your answers in a file named `06-answers.md` in your own
learning-log repository. Solutions are in `solutions.md`.

1. Label every part of this URL out loud, then write the labels down:
   `https://api.open-meteo.com/v1/forecast?latitude=35.9&longitude=-79.0&daily=temperature_2m_max&timezone=America/New_York`
   Name the scheme, host, path, and every query parameter with its value.

2. Get tomorrow's maximum temperature for Chapel Hill, North Carolina
   (latitude 35.9132, longitude -79.0558) in Fahrenheit. Read the Open-Meteo
   documentation for the parameter that changes temperature units and for the
   `daily` parameter. Write the full URL you used and the number you got.

3. Using the GitHub API, find how many open issues the `duckdb/duckdb`
   repository has. Give the endpoint you used and the exact JSON field name.
   Do not count an array yourself.

4. Make a request that returns 404 and a different request that returns 401.
   Paste both bodies. In one sentence each, write what you would tell a
   customer who reported each one.

5. Run any GitHub request three times in a row with `-i` and record
   `X-RateLimit-Remaining` each time. How many requests do you have left in
   the hour, and at what wall-clock time does it reset? Convert the Unix
   timestamp in `X-RateLimit-Reset` to a readable time.

6. Fetch the NASA picture of the day for 2024-07-04 using `DEMO_KEY`. Find the
   parameter name in the NASA API documentation yourself. Report the `title`
   field.

7. Fetch three NASA pictures of the day in one request using the `count`
   parameter. What changed about the shape of the response body compared with
   exercise 6, and what does that change mean for anyone writing code against
   it?

8. Open the Stripe API documentation, an API you have not used, and answer the
   seven documentation questions from the Concepts section for the "list
   customers" endpoint. You cannot call it without an account, and you do not
   need to. This exercise is reading, not calling.

9. A customer writes: "Your API returns 429 every afternoon around 2pm and our
   nightly sync is now failing." Write the five questions you would ask, and
   the two headers you would ask them to capture from a failing response.

10. In Postman, build a collection with two requests, one keyless (Open-Meteo)
    and one keyed (NASA), and an environment that holds the key as a variable.
    Export the collection to JSON and read the export. Where in that file does
    the variable appear, and would exporting it leak a real key?

## Checkpoint

Answer these before looking.

<details>
<summary>1. A customer's integration returns 403 on every request. Their token worked yesterday and they say nothing changed. What is your first hypothesis, and how is it different from a 401?</summary>

401 means the credentials are missing or unreadable, so the server does not
know who is calling. 403 means the credentials are fine and the caller is
recognized, but that identity is not permitted to perform this action. So the
first hypothesis for a sudden 403 is a permissions change, not a credential
change: the key's scopes were reduced, the underlying user's role changed, the
key was restricted to different IP addresses, or the resource moved somewhere
this key cannot see. Confirm by calling a known-safe endpoint with the same
token; if that returns 200, the token is fine and the problem is
authorization.
</details>

<details>
<summary>2. What is the practical difference between GET and POST, and why does it change your answer to "can we just retry it?"</summary>

GET reads and changes nothing, so retrying is always safe. POST creates, and
it is not idempotent, so retrying can create duplicate records. If a POST
times out you do not know whether the server processed it, which is why
well-designed APIs support an idempotency key on POST so a retry is recognized
as the same request.
</details>

<details>
<summary>3. In this response, what is the path to the owner's login, and what is the type of the value at `private`?</summary>

```json
{"name":"duckdb","private":false,"owner":{"login":"duckdb","id":82039556}}
```

The path is `owner.login`, whose value is the string `"duckdb"`. `private` is
a boolean, not a string: `false` with no quotes. Sending `"false"` in quotes
where a boolean is expected is a common cause of 400 responses.
</details>

<details>
<summary>4. An API returns 50,000 records. Describe two ways it might page them, and one advantage of the cursor approach.</summary>

Page-and-size (`?page=3&per_page=100`) or offset-and-limit
(`?offset=200&limit=100`) both ask for a numbered slice. Cursor pagination
returns an opaque pointer to where you stopped, and you pass it back as
`after=...`. The cursor advantage is stability and speed: if records are
inserted or deleted while you are paging, numbered pages can skip or repeat
rows, and deep offsets get slow, while a cursor resumes exactly where it left
off.
</details>

<details>
<summary>5. Explain OAuth 2 to a non-technical buyer in three sentences.</summary>

Instead of your team handing us a password, your administrator signs in to
your own system and approves exactly what our product may access. We receive a
revocable token, never the password, and that token is limited to only the
data that was approved. If you ever want to cut off access, you revoke it from
your side and our access stops immediately.
</details>

You can now say:

- "I can debug an integration failure by reproducing the request in curl or
  Postman and reading the status code and response body before escalating."
- "I understand the difference between authentication and authorization, and I
  can explain API keys, bearer tokens, and OAuth 2 to a technical buyer or a
  business buyer."
- "I can read unfamiliar API documentation and find the base URL, auth method,
  endpoint, pagination model, and rate limits in under ten minutes."

## Put it on your résumé

- Built a Postman collection covering keyless and key-authenticated public
  REST APIs, using environment variables to manage credentials, and documented
  the 400/401/403/404/429 response patterns as a support triage reference.
- Debugged live HTTP integrations by reproducing failing requests in curl,
  isolating authentication versus authorization errors, and reading rate-limit
  and pagination headers to identify root cause.

## Go deeper

- [MDN HTTP reference](https://developer.mozilla.org/en-US/docs/Web/HTTP) —
  the neutral, accurate reference for methods, headers, and every status code;
  use it to check yourself rather than trusting any one vendor's docs.
- [Postman Learning Center](https://learning.postman.com/docs/getting-started/introduction/) —
  short official tutorials on collections, environments, and variables, which
  is exactly the subset of Postman an SE uses.
- [Open-Meteo docs](https://open-meteo.com/en/docs) — a small, well-written,
  keyless API. Good for practicing the seven documentation questions without
  an account.
- [GitHub REST API docs](https://docs.github.com/en/rest) — a large, mature,
  professionally documented API. Read how it explains pagination and rate
  limiting; this is the standard your own product's docs will be compared to.
- [Stripe API reference](https://docs.stripe.com/api) — widely considered the
  best API documentation in the industry. Study the layout, not the payments.
