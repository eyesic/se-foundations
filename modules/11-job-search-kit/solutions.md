# 11. Solutions

Model answers at associate-SE depth. Say each one out loud before reading —
the gap between knowing an answer and saying it fluently is the whole point of
this exercise.

Two rules that apply to every technical answer below. Keep the first answer to
about ninety seconds and stop; let them ask the follow-up. And when you do not
know, say "I don't know" followed by how you would find out, because that
sentence is being tested more often than the fact is.

## Exercise 1: the 20 technical questions

**1. What is an API, explained to someone non-technical?**

"It is a documented way for two pieces of software to talk to each other
directly, without a person clicking through a screen. When you check the
weather on your phone, the app does not know the weather — it asks a weather
service and gets an answer back. For a customer, our API means their systems
can pull their data or push data in automatically, so nobody has to export a
spreadsheet every Monday."

**2. What is the difference between a 401 and a 403?**

"401 is 'I don't know who you are' — credentials are missing, malformed, or
expired. 403 is 'I know who you are and you're not allowed to do this' —
authentication succeeded, authorization failed. That distinction changes the
fix: a 401 means rotate the token, a 403 means look at the key's scopes or the
user's role. Worth knowing that vendors are inconsistent about it — NASA's API
returns 403 for an invalid key — so I read the response body, not just the
number."

**3. What happens when you type a URL and press enter?**

"The browser resolves the domain name to an IP address through DNS, opens a
TCP connection to that address, and negotiates TLS if it is HTTPS. It sends an
HTTP GET request. A server — usually a load balancer first — routes it to an
application server, which may query a database, and returns a response with a
status code and a body. The browser parses the HTML and makes more requests
for CSS, JavaScript, images, and usually API calls that fetch the actual data
as JSON. You can watch all of it in the network tab of dev tools."

**4. GET versus POST, and why does it matter for retries?**

"GET reads and changes nothing, so it is safe and idempotent — calling it five
times is the same as calling it once. POST creates, and it is not idempotent,
so five POSTs create five records. That matters the moment a request times out
and you don't know whether the server processed it. Retrying a GET is always
fine; retrying a POST can duplicate data, which is why well-designed APIs
accept an idempotency key so a retry is recognized as the same request."

**5. JSON versus CSV?**

"CSV is flat — rows and columns, one type of record per file, no nesting. JSON
is structured and can nest objects inside objects and hold arrays, so it can
represent a customer with a list of contacts in one record. APIs use JSON
because real data is nested; spreadsheets and databases use CSV because it
loads directly into a table. Most of the Python I write for a customer is
turning their JSON into rows so it can go into a table."

**6. Primary key and foreign key?**

"A primary key uniquely identifies each row in a table — `customer_id` in a
customers table, never null, never duplicated. A foreign key is a column in
another table that points at that primary key, like `customer_id` in a
subscriptions table. That is what lets you join them, and it is what enforces
that you cannot have a subscription belonging to a customer who does not
exist."

**7. INNER JOIN versus LEFT JOIN?**

"INNER JOIN returns only rows with a match on both sides. LEFT JOIN returns
every row from the left table, with nulls where the right side has no match.
The practical difference shows up in a question like 'which customers have no
support tickets' — that is a LEFT JOIN with `WHERE tickets.ticket_id IS NULL`.
If you use an INNER JOIN there you silently drop exactly the rows you were
looking for, and the query still runs, which is what makes it dangerous."

**8. Second-highest value?**

"Two ways. The straightforward one:"

```sql
SELECT max(mrr) FROM subscriptions
WHERE mrr < (SELECT max(mrr) FROM subscriptions);
```

"Or with a window function, which generalizes to Nth:"

```sql
SELECT mrr FROM (
    SELECT mrr, dense_rank() OVER (ORDER BY mrr DESC) AS rk
    FROM subscriptions
) t WHERE rk = 2 LIMIT 1;
```

"Both return 35190 on our dataset. I'd use `DENSE_RANK` rather than
`ROW_NUMBER` so ties are handled the way people expect — with `ROW_NUMBER`,
two customers tied at the top means 'second highest' returns the same value
again."

**9. WHERE versus HAVING?**

"WHERE filters individual rows before grouping. HAVING filters groups after
aggregation, so it is where you put conditions on aggregate values. 'Customers
in the US' is WHERE; 'customers with more than five tickets' is HAVING,
because `count(*)` does not exist until after the GROUP BY."

**10. What does GROUP BY do?**

"It collapses rows that share the same value in the grouping columns into one
row each, so you can aggregate over them — count, sum, average. You need it
whenever you want one number per category rather than one number overall.
The rule that trips people up: every column in the SELECT must either be in
the GROUP BY or wrapped in an aggregate function, because otherwise the
database has no way to know which of the many values to show."

**11. Window function versus GROUP BY?**

"GROUP BY collapses rows; a window function keeps every row and adds a
calculated column computed over a related set of rows. So if I want each
customer's ticket count I use GROUP BY, but if I want every ticket listed
alongside that customer's total, or each customer's rank within their
industry, I use a window function. The ones I use most are `ROW_NUMBER` with
`PARTITION BY` for ranking within a group, and `LAG` for month-over-month
comparisons."

**12. How would you find duplicate records?**

```sql
SELECT company_name, count(*) AS n
FROM customers
GROUP BY company_name
HAVING count(*) > 1
ORDER BY n DESC;
```

"Group by whatever should be unique and keep the groups with more than one
row. Our sample dataset has several — Ironclad Labs and Westgate Works each
appear twice with different customer IDs. The interesting part is deciding
whether they are actually duplicates: two divisions of the same company with
separate contracts are two legitimate rows, and that is a conversation with
the customer, not a delete statement."

**13. Database versus data warehouse?**

"A transactional database runs the application — many small reads and writes,
row-oriented, always current. Postgres or MySQL. A data warehouse answers
questions across all the data — large scans and aggregates, column-oriented,
refreshed on a schedule. Snowflake, BigQuery, Redshift. Companies have both
because running heavy analytical queries against the production database would
slow the product down for every user. That is also why a customer's dashboard
number can lag the number in the product, which is a conversation I would
expect to have."

**14. Webhook versus polling?**

"Polling means we ask the other system on a schedule whether anything changed,
so most calls come back empty and freshness is limited by the interval. A
webhook reverses it: we register a URL and they call us the moment something
happens, so it is near-instant with no wasted calls. The trade-off is that a
webhook needs a publicly reachable endpoint, which enterprise firewalls often
block, and delivery is at-least-once — so the receiver has to be idempotent,
verify the signature, and there has to be a retry story for when our endpoint
is down."

**15. SSO, SAML, and OIDC?**

"SSO means a user signs in once to their company's identity provider — Okta,
Entra — and gets into every connected application without a separate password.
SAML and OIDC are the two protocols. SAML is older, XML-based, and still the
default in enterprise deals. OIDC is newer, JSON-based, built on OAuth 2, and
common in mobile and modern web. I'd add SCIM to that answer unprompted,
because SSO only handles login — SCIM handles creating and, more importantly,
deprovisioning the account when someone leaves. Security teams ask about
that specifically."

**16. Encrypted at rest and in transit?**

"In transit means encrypted while moving over the network — TLS 1.2 or higher,
which is what the S in HTTPS gives you. At rest means encrypted while stored
on disk — typically AES-256 — covering databases, backups, and file storage.
They protect different things: in transit stops interception, at rest protects
against someone obtaining the physical disk or a snapshot. Neither protects
against a compromised application account, which is what access controls are
for."

**17. Multi-tenancy?**

"Multi-tenant means one deployment of the application serves many customers,
with data separated logically rather than by running a separate copy per
customer. It is what makes SaaS economics work: one system to patch, one
version to support, and everyone gets the upgrade at once. Customers ask
because they want to know their data cannot leak into someone else's view, so
the real answer covers tenant isolation, whether encryption keys are shared or
per-tenant, and what testing verifies it. If I did not know the specifics for
my product I would get them from security rather than reassure them."

**18. ETL versus ELT?**

"ETL transforms the data on a separate server before loading it into the
warehouse. ELT loads the raw data first and transforms it inside the warehouse
with SQL. The industry moved to ELT because cloud warehouse storage and
compute got cheap, and because keeping the raw data means you can re-run the
transformation when a business definition changes — and definitions like
'active customer' change constantly. Under ETL, anything the transform
discarded was gone."

**19. The integration is broken — your first fifteen minutes.**

"First, get specifics rather than the paraphrase: what exact request, what
status code, what response body, what timestamp, and did it ever work. Second,
reproduce it myself in curl or Postman with a test credential, because half
the time the customer's description and the actual response differ. Third,
localize it — is it authentication, the request, or their data? A known-good
endpoint with the same token tells me instantly whether the credentials are
fine. Then check the obvious environmental causes: expired token, changed
permissions, a rate limit, a recent deploy on either side. If it is on our
side I escalate with the request ID and timestamp rather than a description,
and I tell the customer what I know and when I will update them, even if the
update is 'still investigating.'"

**20. Tell me about a technical project you built.**

Use the capstone, and lead with the finding rather than the architecture.

"I built a data pipeline over NYC's 311 service request data — it is
essentially a public support queue, which is why I picked it. A Python script
pulls about 24,000 records from their REST API with pagination and retry
handling, a second script flattens the nested JSON into a typed CSV, and that
loads into DuckDB. Then I wrote fifteen analytical queries. The one that
surprised me was that billing-category requests took 41 percent longer to
close than technical ones, which points at a process handoff rather than
capacity. I kept extraction and transformation as separate scripts so I could
fix transform bugs without re-hitting the API. It is on GitHub with the
queries, four charts, a README with the limitations stated, and a ten-minute
walkthrough video."

Then stop. Every clause in that answer is a thread they can pull, and letting
them choose which one is better than pre-empting it.

## Exercise 2: the 15 behavioral questions

STAR means Situation, Task, Action, Result. The two failure modes are spending
sixty seconds on Situation and never reaching Result, and giving a Result with
no number or concrete outcome. Aim for roughly 20/10/50/20 percent.

Prepare **five stories** and map them to all fifteen questions rather than
preparing fifteen answers. Suggested five: a hard customer interaction, a time
you learned something fast, a mistake, a time you changed someone's mind, and
the capstone project.

**1. Tell me about yourself.** Ninety seconds, three parts: where you came
from, what you did about it, what you want next. "I studied information
science and biology at UNC and spent last summer in customer success at SAS.
The part of that job I liked most was the technical half — figuring out what a
customer actually meant and translating it into what the product needed to do.
So over the past two months I built the technical floor under that
deliberately: SQL, REST APIs, Python, data modeling, and an end-to-end
pipeline project I published. I'm finishing an MS in Information Science and
looking for an associate SE or implementation role in New York."

**2. Why solutions engineering, why now?** Name the specific moment. "In my
internship the calls I looked forward to were the ones where a customer's
question was technical and my answer changed what they did next. I noticed
that the person who could answer those was the SE, and that the job is mostly
listening and translating, which is the part I was already good at. What I was
missing was the technical floor, so I built it rather than waiting for a job
to teach me."

**3. Explaining something technical to a non-technical person.** Use the
data-freshness explanation from module 08 or a real internship moment. The
Result should be that the person acted differently, not that they said thanks.

**4. Not knowing the answer in front of a customer.** The Action is the whole
answer: say you do not know, commit to a specific time, and deliver. The
Result is that you delivered by the time you promised. Interviewers ask this
to find out whether you bluff.

**5. A difficult customer.** Pick one where you did not win. The Action should
include a moment where you stopped defending and started asking. The Result can
be an honest "they stayed frustrated, but they stayed, and here is what I
changed afterwards."

**6. Learning something quickly.** This curriculum is a legitimate answer.
Situation: every SE posting required SQL. Action: eight weeks, ninety minutes
a day, a structured path ending in a published project. Result: fifteen
analytical queries, a working pipeline, and the ability to answer these
questions. Name the number of weeks, because it demonstrates the pace you
would ramp at.

**7. Disagreeing with a colleague.** Choose a disagreement you lost or where
you compromised. Interviewers are looking for how you disagree, not whether
you were right. The Action includes taking it privately and bringing evidence.

**8. A mistake.** Real, yours, with a consequence. Name what you did in the
first hour after realizing, and the process change that came out of it. Never
choose a mistake that is secretly a strength.

**9. Prioritizing three customers at once.** Give the actual rule you use:
severity and blast radius first, then commitments already made, then quickest
resolution. The Action that matters is telling the other two customers a
specific time rather than leaving them silent. Silence is what makes people
angry, not waiting.

**10. Influencing without authority.** Bring evidence, frame it as their
problem rather than your opinion, and give them the credit. Result: the
decision changed, and name what changed.

**11. Saying no to a customer.** Say it plainly, then ask whether it is a hard
requirement or a preference, then offer what you can do. Result: trust
survived, and often the requirement turned out to be softer than stated.

**12. Most technical thing you have done.** The capstone. Same answer as
technical question 20, and it is fine to reuse it.

**13. A demo or presentation going wrong.** If you have no demo story, use a
presentation. The ranked responses from module 10 apply: name it, try once,
move to the fallback, follow up the same day. Result: you finished the
meeting and delivered the recording within hours.

**14. Working with a salesperson.** From the internship: a renewal or an
expansion conversation where you fed the account team information. The Action
is what you told them and when — especially bad news early. Result: a decision
they made differently because of what you said.

**15. Where do you want to be in three years?** Be specific and modest.
"Running discovery and demos independently on mid-market deals, with enough
depth in one product area that other SEs come to me for it, and mentoring
whoever is in the seat I'm in now." Do not say "management," and do not say
"still learning."

## Exercise 3: rewriting your own bullets

The standard is that you can name which of the four components — action, what
you did, tool, number — was missing in each original. In practice the missing
one is the number about eighty percent of the time, and the second most common
is a weak action verb ("helped", "assisted", "worked on", "participated in",
"responsible for").

If a bullet genuinely has no number available to it, use scope instead: across
60 accounts, 3 systems, 15 onboardings. Scope is a real number. Do not invent
percentages — every fabricated metric is a question waiting to be asked, and
"how did you measure that?" is a question interviewers ask precisely because
it catches people.

## Exercise 4: gap table and cover note

The standard for the table: every line of the posting lands in exactly one
column, and the Adjacent column is not empty. An empty Adjacent column means
you sorted into "qualified" and "not qualified", which is the binary thinking
this exercise exists to break.

The standard for the cover note: two sentences, and it uses their words.

> I'm applying for the Associate Solutions Engineer role. Your posting asks
> for SQL and comfort with REST APIs in a customer-facing setting — I spent
> the summer in customer success at SAS handling technical escalations, and I
> recently published an end-to-end pipeline project that pulls from a public
> API and answers fifteen analytical questions in SQL: [URL].

Two sentences, one claim per requirement, one link. Anything longer does not
get read, and a paragraph about your passion for technology actively costs
you.

## Exercise 5: the 30/60/90

The standard: every item is specific to that company. If your plan would read
identically for a different employer, it is a template, not a plan.

Weak: "Learn the product." Strong: "Complete the [Product] Administrator
certification and rebuild the standard demo environment from scratch myself,
so I understand the setup rather than the script."

Weak: "Contribute to the team." Strong: "Own the technical response for two
RFP sections and write the reusable answer block for the SSO and SCIM
questions, which I noticed comes up in most security reviews."

The 61-to-90 column is the one interviewers read most carefully, because it is
where you say what you will own. Include one item that creates leverage for
other people — an internal asset, a documented answer, a demo the team reuses.

## Exercise 6: outreach results

There is no answer key. The thing to notice after two weeks: the people who
reply are disproportionately those who made the same transition themselves,
those with under five years in the role, and those where your second sentence
named something specific about them rather than their company. Cold messages
that could have been sent to anyone get a reply rate near zero; specific ones
run around 25 to 35 percent.

If nobody replies after fifteen messages, the problem is almost always the
second sentence. Rewrite it so it could only have been sent to that person.

## Exercise 7: the take-home demo

Worked example for a 200-person logistics company with a manual reporting
process.

**Three things to show:**

1. The finished weekly report, already built, on screen in the first thirty
   seconds. Answers "it takes us two days to produce this."
2. Changing one filter live and watching the numbers update. Answers "any new
   question means another two days."
3. The scheduled delivery landing in an inbox. Answers "and then I have to
   remember to send it."

**The first sixty seconds, verbatim:**

> "You told me the weekly ops report takes two people the better part of two
> days, and by the time it lands it's describing last week. So I'm going to
> start at the end. This is that report, for a logistics company about your
> size, built and delivered automatically. I'll show you three things: the
> report itself, what happens when you want to ask a different question, and
> how it gets to the people who need it without anyone remembering to send it.
> If at any point you want to go deeper on something, stop me — I've got
> twenty minutes of material for a thirty-minute slot on purpose."

**The planted unknown:** when asked about connecting to their specific TMS,
answer "I don't know whether we have a prebuilt connector for that one. I
know we handle the pattern — nightly pull, matched on a shipment ID — and I'd
want to check the connector list rather than guess. What I can tell you is
what it looks like if there isn't one." That is a deliberate, prepared moment
of honesty, and it is worth more than a fourth feature.

Note the last line of the opening: telling them you have twenty minutes of
material for a thirty-minute slot signals that you have prepared and invites
interruption, which is what turns a demo into a conversation.

## Exercise 8: ten questions to ask them

*About the role*

1. What does the first ninety days look like for someone in this seat?
2. How is the SE involved in a deal here — from qualification, or only at
   demo stage? *Tells you whether you will do discovery or be a demo resource.*
3. What is the ratio of SEs to AEs, and how are you paired? *A 1:4 ratio is a
   very different job from 1:1.*
4. What proportion of the role is demos versus POCs versus written technical
   responses? *Tells you what you will actually spend Tuesday doing.*

*About the team*

5. Who was the last person to join this team, and what made them successful?
6. How does the team share demo assets and technical answers — is there a
   library, or does everyone rebuild? *A revealing question about maturity.*
7. How do SEs work with product here? Is there a route for field feedback?

*About success*

8. How is an SE measured here — quota attainment, activity, something else?
   *If nobody can answer this, that is your answer.*
9. What separates a good SE on this team from a great one?
10. What is the biggest technical objection your team hears right now, and how
    do you handle it? *The best question on the list: it is a real question,
    the answer is genuinely useful, and it makes you sound like a peer.*

The one to always ask: question 5. It is the least rehearsed, and the answer
tells you what this team actually rewards rather than what the posting says.
