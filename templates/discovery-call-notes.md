# Discovery call notes

Used in module 10. Fill this in during the call, clean it up within an hour
after, and send the summary to the AE the same day.

The five areas below are the question framework: current state, pain, desired
state, technical environment, decision process. If you leave a call with all
five filled in, you did the job.

---

```markdown
# Discovery: COMPANY, DATE

Attendees (theirs): NAME, TITLE, what they care about
Attendees (ours): NAME, ROLE
Call number: 1st / 2nd / follow-up

## 1. Current state

How do they do this today, step by step, in their words?

- Tools in use:
- Who does the work, and how many people:
- How often:
- What the process looks like end to end:

## 2. Pain

What is broken, and what does it cost? Push for a number, then push once more.

- The problem in their words:
- Who feels it:
- How often it happens:
- What it costs (time, money, risk, headcount):
- What they have already tried:
- What happens if they do nothing:

## 3. Desired state

What does success look like to them, not to us?

- In their words:
- How they would measure it:
- Timeline they are working to, and what is driving it:

## 4. Technical environment

- Systems this would touch:
- Where their data lives (system, warehouse, format):
- Identity and access (SSO provider, SAML or OIDC, SCIM):
- Integration expectation (API, file transfer, iPaaS, manual):
- Data volumes, and rate of growth:
- Security or compliance requirements (SOC 2, GDPR, residency, questionnaire):
- Who owns each of these internally:

## 5. Decision process

- Who else has to agree:
- What the evaluation looks like (POC, security review, procurement):
- Success criteria for a POC, in writing:
- Budget owner and cycle:
- Competing options, including doing nothing:

## Open questions I could not answer

| question | who I need to ask | promised by |
|---|---|---|
| | | |

## Risks

- Technical:
- Commercial:
- Political:

## Next steps

| what | who | by when |
|---|---|---|
| | | |

## Summary to send the AE (three sentences)

```

---

## Completed example, abbreviated

```markdown
# Discovery: Ridgeline Freight, 2026-09-10

Attendees (theirs): Dana Alvarez (VP Operations, cares about her team's time),
Marcus Okoye (IT Director, cares about data flow and access control)
Attendees (ours): me (SE), Priya (AE). Call 1.

## 1. Current state

- Tools: Salesforce, their internal TMS, and a shared Excel workbook.
- Three ops coordinators spend the first 60 to 90 minutes of every Monday
  copying figures from two systems into the workbook.
- The workbook is emailed to eight people and is stale by Tuesday.

## 2. Pain

- Dana: "By the time we see a problem account it's already a renewal
  conversation."
- Costs roughly 4.5 person-hours a week plus the cost of finding out late; she
  named two accounts lost last year she believes were preventable.
- They tried a Salesforce report; it does not include product usage, which is
  the signal that matters.
- Doing nothing: the workbook grows, and the new coordinator inherits it.

## 3. Desired state

- One view, current as of this morning, that flags accounts going quiet before
  the renewal window.
- Measured by: hours saved on Monday, and number of at-risk accounts caught
  more than 60 days before renewal.
- Timeline: wants it in place before their January renewal cluster.

## 4. Technical environment

- Systems: Salesforce (source of truth for accounts), TMS (usage), Okta for SSO.
- Data: Salesforce via API; TMS exports nightly CSV to SFTP; no warehouse.
- Identity: Okta, SAML. SCIM provisioning wanted but not required at launch.
- Volume: about 1,200 accounts, 40,000 events a month.
- Security: SOC 2 report requested; no data residency requirement (US only).
- Owners: Marcus owns Okta and the SFTP job; Dana owns the process.

## 5. Decision process

- Dana recommends, Marcus must sign off technically, CFO approves spend above
  $50k.
- Evaluation: 3-week POC with their real data, then a security review.
- Success criteria to be agreed in writing: at-risk flag matches their manual
  judgment on 10 named accounts.
- Competing option: build it themselves in their BI tool. Marcus estimated one
  quarter of engineering time.

## Open questions I could not answer

| question | who I need to ask | promised by |
|---|---|---|
| Do we support SCIM deprovisioning with Okta today? | Platform team | tomorrow 10am |
| Can the nightly TMS CSV land via SFTP on our side? | Integrations | Thursday |

## Next steps

| what | who | by when |
|---|---|---|
| Send SOC 2 report and SSO documentation | me | today |
| Written POC success criteria | me and Dana | Friday |
| Technical deep dive with Marcus | Priya to schedule | next week |
```

Two things to notice in the example. Their words are quoted, not paraphrased
into ours. And every unanswered question has an owner and a date, because
"I'll find out" is only worth anything if it is followed by a time.
