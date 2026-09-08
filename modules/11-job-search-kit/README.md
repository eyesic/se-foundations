# 11. Job search kit

## Why an SE needs this

You now have the technical floor and a project that proves it. This module is
the conversion step: turning what you built into a résumé a recruiter
shortlists, a LinkedIn profile that gets found, answers that survive a
technical screen, and enough outreach that you are not relying on the apply
button. The honest framing is that the work of the last eight weeks does
nothing for you until it is legible to someone who has ninety seconds. That
is a translation problem, and translation is the job you are applying for.

## What you will be able to do

- Name the six titles that fit you and tell them apart on a posting.
- Read a job posting and produce a gap list instead of a feeling.
- Write résumé bullets with the action-tool-outcome-number formula.
- Rewrite customer success bullets so they read as SE-adjacent without lying.
- Write a projects section from your capstone that a hiring manager reads.
- Answer 20 technical and 15 behavioral questions at associate-SE depth.
- Approach a take-home demo assignment without over-building it.
- Ask for an informational interview in three sentences that get a reply.
- Walk into day one with a written 30/60/90 plan.

## Concepts

### The six titles

| Title | What it actually is | Watch for |
|---|---|---|
| **Associate / Junior Sales Engineer** | The entry point. Shadowing, demo prep, RFP responses, then owning small deals | Rare and competitive. Apply the day it posts |
| **SE Academy / SE Residency** | A structured 3 to 6 month training program, then placement on a team | The single best entry path. Salesforce, MongoDB, Datadog, Snowflake and others run them, usually with fixed application windows |
| **Solutions Consultant** | The same job, different word. Common at Salesforce, Workday, ServiceNow | Sometimes means post-sale consulting. Read the responsibilities, not the title |
| **Implementation Specialist / Consultant** | Post-sale. Onboarding, configuration, data migration, training | The most realistic first job for a CS background, and a proven route into SE within 12 to 18 months |
| **Technical Account Manager (TAM)** | Post-sale technical ownership of named accounts | Closest to your internship. Often the fastest offer, sometimes the slowest path to sales |
| **Sales Engineer** (no qualifier) | Usually 2 to 5 years experience expected | Apply anyway if you match 60 percent. "Required" lists are wish lists |

The two to bias toward: **SE academy programs**, because they hire for aptitude
and are built for people without the background, and **implementation
specialist**, because your CS experience is directly relevant and it puts you
in the room with SEs every week.

### Where the postings are

- Company career pages directly, for anyone you would genuinely like to work
  for. Postings appear here first and get fewest applicants.
- LinkedIn with a saved search for each of the six titles, set to daily alerts,
  filtered to "past 24 hours." Speed matters more than volume.
- The PreSales Collective job board and Slack, which is where SE-specific
  roles get posted and where hiring managers actually participate.
- Wellfound and Built In NYC for startups, which hire more on aptitude and
  less on credential.
- Your university's alumni tool. A UNC alumnus at a target company is worth
  more than any application.

The ratio to plan for: roughly 60 percent of your time on 10 to 15 targeted
applications with an outreach message attached, and 40 percent on volume. Fifty
cold applications with no human contact is worse than ten with one each.

### Reading a posting and building a gap list

Take any posting and sort every requirement into three columns.

| Have | Adjacent | Gap |
|---|---|---|
| SQL, APIs, Python basics, customer-facing communication, the capstone | Salesforce (used adjacent tools), cloud concepts (understand, not hands-on) | Their specific product, industry vertical, 2 years quota-carrying experience |

Then act on each column differently:

- **Have**: name it in the cover note using their exact words. If they say
  "data modeling," write "data modeling," not "schema design."
- **Adjacent**: this is what interviews are for. Prepare one sentence bridging
  each item: "I have not used Workato, but I have built the same nightly-sync
  pattern by hand, so I understand what it is doing under the hood."
- **Gap**: apply anyway if the gaps are experience-shaped rather than
  skill-shaped. Do not apply if three or more gaps are core skills.

The point of writing it down is that "I'm not qualified" is a feeling and a
three-column table is a fact. Usually the table shows six haves, three
adjacents, and two gaps, and you were about to not apply.

### The résumé bullet formula

**Action verb + what you did + tool or technology + outcome with a number.**

Every bullet needs all four. Missing the number is the most common failure and
the most costly, because a number is the only part a skimming reader believes.

If you do not have a real number, you have three honest options: count
something (records, queries, users, hours), compare something (before and
after), or state scope (across 6 teams, 200 accounts, 3 systems). Never invent
a percentage.

### Before and after: rewriting CS bullets

These are real-shaped customer success intern bullets and their rewrites. The
rewrite never claims anything the original did not contain — it changes what
is foregrounded.

**Before:** "Assisted customers with product questions and escalations."

**After:** "Resolved 40+ customer issues per week across a 60-account
portfolio, triaging technical questions on data imports and API errors and
escalating root-cause findings to engineering."

*What changed:* volume and scope made explicit, the word "assisted" replaced
with what was actually done, and the technical nature of the questions named.

**Before:** "Created reports for the customer success team."

**After:** "Built recurring account-health reporting in Excel covering usage,
ticket volume, and renewal risk for 60 accounts, replacing an ad-hoc process
and cutting weekly preparation from 3 hours to 30 minutes."

*What changed:* the tool is named, the metrics are named, and there is a
before-and-after number. Excel is not a weakness here; the reasoning is the
point, and it sets up "and I now do the same analysis in SQL."

**Before:** "Onboarded new customers."

**After:** "Ran onboarding for 15 new accounts, mapping each customer's
existing spreadsheet data to our platform's fields and documenting the
recurring mismatches, which reduced repeat setup tickets."

*What changed:* "mapping data to fields" is data mapping, which is literally a
module-05 skill and an implementation-specialist job requirement. It was
always true; it was just described in the customer's language instead of the
employer's.

**Before:** "Participated in weekly meetings with the product team."

**After:** "Synthesized recurring customer feedback into prioritized product
requests, presenting weekly to product and engineering stakeholders."

*What changed:* "participated" became a contribution with an output. If you
only listened, cut the bullet — a weak bullet costs more than a missing one.

**Before:** "Learned SQL and Python."

**After:** Delete this bullet. Skills go in the skills section; the projects
section proves them. A bullet that says you learned something invites the
question of whether you can use it.

### The projects section

Put it above your work experience if your experience is a single internship.
Two projects, four lines each, maximum.

> **NYC 311 Service Analytics Pipeline** — github.com/yourname/se-capstone
> Built an end-to-end pipeline in Python pulling 24,000 service requests from
> the NYC Open Data REST API with pagination and retry handling, transforming
> nested JSON into a typed schema loaded into DuckDB.
> Authored 15 analytical SQL queries using joins, CTEs, and window functions;
> found that billing-category requests took 41 percent longer to resolve than
> technical ones, pointing to a process rather than capacity constraint.
> Published with documentation, four charts, and a 10-minute recorded
> walkthrough.

Note what the third line does. It is a finding, not a feature, and it is the
line that makes an interviewer ask a question — which is the entire purpose of
a projects section.

### LinkedIn

**Headline formula:** target role + evidence + domain. Not "aspiring."

> Solutions Engineering | SQL, APIs, Python | Customer Success background |
> MS Information Science

"Aspiring" and "seeking opportunities" both signal that you do not yet count.
Name the role you want as though you are in it.

**About paragraph**, four sentences: where you come from, what you can do now,
what you are building toward, what you want next.

> I spent my summer in customer success at SAS, where the part I liked most
> was the technical half — translating what a customer meant into what the
> product needed to do. Over the past two months I have built the technical
> floor underneath that: SQL, REST APIs, Python, data modeling, and an
> end-to-end data pipeline I published with a walkthrough. I am finishing an
> MS in Information Science at UNC and looking for an associate solutions
> engineer or implementation role in New York. If you work in presales and
> would trade fifteen minutes for a coffee's worth of questions, I would take
> you up on it.

**Post the video.** One post, when the capstone is finished: what you built,
one thing that surprised you, one thing that broke, and the link. Do not
apologize for it being a learning project. This post is the single highest-
leverage thing you can do on LinkedIn, because it is evidence, and almost
nobody posts evidence.

### The take-home demo assignment

Many SE interviews end with: "here is our product, prepare a 30-minute demo
for a fictional prospect." What they are grading, in order:

1. Did you tailor it to the stated prospect, or give a product tour?
2. Did you start with the outcome?
3. Did you handle a question you could not answer honestly?
4. Did you finish on time?
5. Did you know the product well enough to look competent?

Note that product knowledge is last. Candidates fail this by learning every
feature and demoing all of them.

The approach: spend 25 percent of your prep on the product and 75 percent on
the story. Pick three things. Write the first sixty seconds verbatim. Build
one deliberate moment where you say "I don't know, here is how I'd find out."
Rehearse against a timer and cut until you land two minutes early.

### The 30/60/90 plan

Bring it to a final interview. One page, three columns, and it makes you the
candidate who already started.

| Days | Focus | Example items |
|---|---|---|
| 0 to 30 | Learn | Complete product certification, shadow 10 calls, build the demo environment myself, meet every SE on the team, read the last 20 closed-won and closed-lost technical notes |
| 31 to 60 | Contribute | Own the demo for 3 deals with a senior SE on the call, write 2 RFP response sections, take first-line technical Q&A for one AE |
| 61 to 90 | Own | Run discovery and demo independently for small deals, own one POC end to end with written success criteria, publish one internal asset the team reuses |

The third row matters most. "Publish one asset the team reuses" is how a new
SE becomes valuable faster than their ramp, and saying it in an interview
signals you understand the job is partly building leverage for other people.

### Asking for an informational interview

Three sentences. Nothing longer gets read.

> Hi [Name] — I'm an MS student at UNC moving from customer success into
> solutions engineering, and I've been building the technical side myself
> (SQL, APIs, and a data pipeline project I published). I saw you've been an
> SE at [Company] for three years and I'd love fifteen minutes to ask how you
> think about the first year in the role. Happy to work around your calendar,
> and no ask beyond the conversation.

Why it works: it says who you are, gives one piece of evidence, names a
specific reason it is *them*, asks for a bounded amount of time, and
explicitly removes the fear that you will ask for a referral.

Send fifteen. Expect three to five replies. In the call, ask what surprised
them in year one, what makes someone good at this job, and who else you should
talk to. Do not ask for a referral in the first conversation — ask at the end
whether it would be alright to follow up when you apply, and then actually
follow up.

## Walkthrough

Build the kit in one week. Five sessions, ninety minutes each.

**Session 1: the résumé.** One page. Order: name and contact, skills,
projects, experience, education. Rewrite every internship bullet using the
formula in `templates/resume-bullet-formula.md`. Every bullet gets a number or
gets cut. Save as `Firstname-Lastname-Resume.pdf` — never `resume_final_v3`.

**Session 2: LinkedIn.** Headline, about paragraph, experience bullets
matching the résumé, skills, and the capstone in the projects section. Turn on
"open to work" for recruiters only. Then write the post about your capstone and
schedule it.

**Session 3: the target list.** Twenty-five companies in NYC hiring for the six
titles. For each: company, title, link, date posted, three-column gap table,
and whether you know anyone there. A spreadsheet is fine. Sort by "applied
within 48 hours of posting" — that is the highest-yield signal you control.

**Session 4: interview prep.** Work through the 35 questions in the exercises
below. Say the answers out loud, standing up, timed. Two minutes each for
technical, three for behavioral. Record two of them and watch them back once.

**Session 5: outreach.** Fifteen messages, using the template above,
personalized in the second sentence. Track replies. Book the calls.

Then run the loop: five applications a week with a personalized note, three
outreach messages a week, one LinkedIn post a month. Track every application
and its outcome in the same sheet. When a rejection comes back, add one line
on what you would change, and move on within the hour.

## Exercises

These are your interview preparation. Model answers are in `solutions.md` —
answer each one out loud first, then read. Exercises 1 and 2 are the question
banks; work through them across several sessions rather than one.

1. **The 20 technical questions**, at associate-SE depth. Two minutes each.

   1. What is an API, explained to someone non-technical?
   2. What is the difference between a 401 and a 403?
   3. What happens when you type a URL into a browser and press enter?
   4. What is the difference between GET and POST, and why does it matter for
      retries?
   5. What is JSON, and how does it differ from CSV?
   6. What is a primary key, and what is a foreign key?
   7. Explain the difference between an INNER JOIN and a LEFT JOIN.
   8. Write a query to find the second-highest value in a column.
   9. What is the difference between WHERE and HAVING?
   10. What does GROUP BY do, and when do you need it?
   11. What is a window function and when would you use one over GROUP BY?
   12. How would you find duplicate records in a table?
   13. What is the difference between a database and a data warehouse?
   14. What is a webhook, and how is it different from polling?
   15. What is SSO, and what is the difference between SAML and OIDC?
   16. What does "encrypted at rest and in transit" mean?
   17. What is multi-tenancy, and why does a customer ask about it?
   18. What is the difference between ETL and ELT?
   19. A customer says the integration is broken. Walk me through your first
       fifteen minutes.
   20. Tell me about a technical project you built, end to end.

2. **The 15 behavioral questions.** Answer each in STAR structure — Situation,
   Task, Action, Result — in about three minutes, and make sure the Result
   always carries a number or a concrete outcome.

   1. Tell me about yourself.
   2. Why solutions engineering, and why now?
   3. Tell me about a time you explained something technical to a
      non-technical person.
   4. Tell me about a time you did not know the answer in front of a customer.
   5. Tell me about a difficult customer and how you handled it.
   6. Tell me about a time you had to learn something quickly.
   7. Describe a time you disagreed with a colleague. What happened?
   8. Tell me about a mistake you made and what you did about it.
   9. How do you prioritize when three customers all need you at once?
   10. Tell me about a time you influenced a decision without authority.
   11. Describe a time you had to say no to a customer.
   12. What is the most technical thing you have done, and how did you
       approach it?
   13. How do you handle a demo or presentation going wrong?
   14. Tell me about a time you worked with a salesperson or a sales team.
   15. Where do you want to be in three years?

3. Rewrite three of your own résumé bullets using the formula. For each, write
   down which of the four components was missing in the original.

4. Take a real posting for one of the six titles and build the three-column
   gap table. Then write the two-sentence cover note that references their
   exact words for two items in the Have column.

5. Write your own 30/60/90 plan for a specific company you are applying to,
   using their actual product name and market. Three items per column.

6. Write and send five informational interview messages. Track replies for two
   weeks and note what the responders had in common.

7. You are given a take-home: "demo our product to a fictional prospect, a
   200-person logistics company with a manual reporting process." Write the
   three things you would show, the first sixty seconds verbatim, and the one
   question you would plant that you cannot fully answer.

8. Write ten questions to ask your interviewer, split into: about the role,
   about the team, and about how success is measured. Say why each one is
   worth asking.

## Checkpoint

<details>
<summary>1. What is missing from this bullet: "Helped customers with technical issues using Zendesk."</summary>

The outcome and the number. It has an action ("helped", weak), a tool
(Zendesk), and a vague activity, but nothing that tells a reader the scale or
the result. Fixed: "Resolved 40+ technical support issues weekly in Zendesk
across a 60-account portfolio, reducing average first-response time from 6
hours to under 2." Also note that "helped" became "resolved" — a verb that
implies ownership rather than assistance.
</details>

<details>
<summary>2. A posting requires "3+ years in a customer-facing technical role" and you have one internship. Do you apply?</summary>

Yes, if the rest of the posting is mostly in your Have and Adjacent columns.
Years of experience is the most negotiable line in any posting, and lists are
written as wish lists by committee. The decision rule: apply when the gaps are
experience-shaped (years, industry, a specific product) and do not when three
or more are skill-shaped (they want deep Kubernetes and you have none). Also
apply differently — a posting with a years gap needs an outreach message to a
human, not a submitted form.
</details>

<details>
<summary>3. Why is "aspiring solutions engineer" a bad LinkedIn headline?</summary>

Because it tells recruiters you do not consider yourself one yet, and it does
not match what anyone searches for. Recruiters search skills and titles, so
"Solutions Engineering | SQL, APIs, Python | Customer Success background"
matches queries and reads as capability. There is nothing dishonest about it:
you are stating a target and the evidence for it, and the evidence is real
because you built it.
</details>

<details>
<summary>4. In a take-home demo assignment, what are you actually being graded on?</summary>

Tailoring, structure, honesty, and timing — roughly in that order — with
product knowledge last. They want to see whether you demo the prospect's
stated problem rather than the feature list, whether you open with the outcome,
whether you can say "I don't know, here's how I'd find out," and whether you
finish on time. Candidates who fail almost always fail by learning the whole
product and showing all of it.
</details>

<details>
<summary>5. What is the actual purpose of an informational interview?</summary>

Three things, none of which is a job. Information: what the first year is
really like, which is what makes your interview answers specific. Vocabulary:
how people in the role talk about it, which you then use in applications. And
a warm contact who will recognize your name later — a message six weeks after
a good conversation is a different thing from a cold application. Asking for a
referral in the first conversation converts a generous person into an
awkward one.
</details>

You can now say:

- "I built and published an end-to-end data pipeline project, and I can walk
  through the code, the queries, and the trade-offs I made."
- "I moved from customer success into solutions engineering by building the
  technical floor deliberately — SQL, APIs, Python, data modeling, and
  integration architecture — and I have the artifacts to show it."
- "I know what an SE does across a deal, from discovery through security
  review to implementation handoff, and where I would need support in my first
  ninety days."

## Put it on your résumé

- Published a technical portfolio project with documentation and a recorded
  walkthrough, and presented it as a 10-minute structured demonstration:
  [GitHub URL].
- Completed a self-directed technical curriculum covering SQL, REST APIs,
  Python, data modeling, and integration architecture, producing an end-to-end
  data pipeline and 15 analytical queries as the capstone artifact.

## Go deeper

- [PreSales Collective](https://www.presalescollective.com/) — job board,
  Slack, and mentorship program. The single highest-value place to spend an
  hour a week while job searching.
- [Mastering Technical Sales, John Care](https://www.masteringtechnicalsales.com/) —
  read the chapters on the demo and the POC before your first onsite.
- [DataLemur](https://datalemur.com/) — free SQL interview questions with a
  browser query editor. Do the easy and medium sets until they are automatic.
- [Levels.fyi presales data](https://www.levels.fyi/) — real compensation
  ranges by company and level, so you negotiate with numbers rather than
  hope.
- [Big Interview or your university career center](https://careers.unc.edu/) —
  UNC's career services are free to you as a current student and include mock
  interviews. Use them while they are free.
