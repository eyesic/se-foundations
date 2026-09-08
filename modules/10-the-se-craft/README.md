# 10. The SE craft

## Why an SE needs this

Everything in modules 01 through 09 was the technical floor. This module is
the job. An SE sits in a room — usually a video call — between a salesperson
who wants the deal and a technical buyer who has been sold to badly before,
and earns the buyer's trust by being the one person in the conversation who
will say "no, we don't do that." Your customer success internship already
trained the half of this that most engineers never learn: listening,
translating, and holding a room when something is going wrong. Name that
explicitly, because it is a real advantage and you will be tempted to
discount it. What follows is the other half — the structure that turns
listening into a deal.

## What you will be able to do

- Describe what an SE does at each stage of a deal, in order.
- Run a discovery call using a five-part framework and 20 prepared questions.
- Structure a demo that opens with the outcome instead of the login screen.
- Handle "can it do X" live, including when the answer is no.
- Recover from a demo failure without losing the room.
- Write POC success criteria that can be objectively passed or failed.
- Respond to the five technical objections every SE hears.
- Divide work with an account executive without stepping on each other.

## Concepts

### What an SE does across a deal

| Stage | The AE owns | You own | Your deliverable |
|---|---|---|---|
| Qualification | Budget, authority, timeline | Nothing yet, or a 15-minute technical sniff test | A yes or no on technical fit |
| **Discovery** | Business pain, decision process | Current state, technical environment, integration points | Discovery notes shared with the customer |
| **Demo** | Framing, commercial narrative | The demonstration itself | A tailored demo, not a product tour |
| **POC / trial** | Timeline, commercial pressure | Scope, success criteria, hands-on support | A signed success-criteria document |
| **Technical Q&A** | Nothing | Written answers, architecture diagrams | A solution-design document |
| **Security review** | Legal, procurement | Questionnaire responses, escalation to security | Completed questionnaire |
| **Handoff** | The signature | Everything implementation needs to know | A handoff document |

Two things stand out from that table. First, the SE owns the entire technical
narrative from discovery to handoff, which is why continuity matters more than
brilliance in any single meeting. Second, the deliverables are mostly
documents. An SE who writes clearly is worth more than one who demos
beautifully, because the document is what circulates in the customer's
organization when you are not in the room.

**Sales vocabulary** you will hear immediately:

- **AE** (Account Executive): the salesperson who owns the deal and the quota.
- **Champion**: the person inside the customer who wants this to happen and
  will argue for it when you are not there. Your job is to make them look good.
- **Economic buyer**: whoever signs. Often not the champion.
- **Technical buyer**: whoever can say no on technical grounds. Often the one
  you spend the most time with.
- **MEDDIC / MEDDPICC**: a qualification framework. You will be asked to fill
  in the technical parts, usually Metrics and Decision Criteria.
- **POC** (Proof of Concept) or **pilot**: a time-boxed hands-on evaluation.
- **RFP** (Request for Proposal): a formal document of questions, often
  hundreds. SEs write the technical answers.

### Discovery

Discovery is not qualification and it is not a demo. It is the call where you
learn enough to build a demo worth watching. The single most common junior SE
mistake is demoing during discovery because the customer asked a product
question and it felt good to answer it.

The framework has five parts. Ask in this order.

**1. Current state.** What do they do today, with what, and who does it.
**2. Pain.** What breaks, how often, and what it costs.
**3. Desired state.** What "solved" looks like to them, in their words.
**4. Technical environment.** Systems, data, identity, constraints.
**5. Decision process.** Who evaluates, on what criteria, by when.

The twenty questions. Do not read all twenty on one call — pick eight to
twelve based on what you already know, and let the answers pull you into
follow-ups.

*Current state*

1. Walk me through how your team does this today, from the first step to the
   last.
2. Which systems are involved, and which one is the source of truth?
3. Who touches this process, and how much of their week does it take?
4. How did you end up with the current setup?
5. What have you already tried to fix it?

*Pain*

6. Where does this break most often, and what happens when it does?
7. What does that cost you — in hours, in dollars, or in customers?
8. Who complains about it, and to whom?
9. What made you start looking at this now, as opposed to last year?
10. If you did nothing for another twelve months, what happens?

*Desired state*

11. If this worked perfectly, what would be different on a Monday morning?
12. What would you measure to know it worked?
13. Who else benefits if this gets solved, and who does not care?

*Technical environment*

14. What systems would this need to connect to, and in which direction does
    the data flow?
15. Roughly how much data are we talking about — records, growth, history?
16. How do your people log in to internal tools today, and do you require SSO?
17. Are there data-residency, retention, or compliance requirements I should
    know about now rather than in legal review?
18. Who would own this integration internally after it is live, and do they
    have capacity?

*Decision process*

19. Who else needs to be convinced, and what would each of them need to see?
20. What does your evaluation timeline look like, and what happens at the end
    of it?

Question 9 is the most valuable one on the list. "Why now" separates a real
project with a budget from an interesting conversation, and the answer tells
you what to build the demo around. Question 17 is the second most valuable,
because a residency or compliance requirement discovered in week ten kills
deals that were otherwise won.

Two discipline rules. **Ask, then stop talking.** Silence after a question is
the cheapest tool you have and the hardest to use. And **write it down in
their words.** When you replay "you said the nightly reconciliation takes
Marcus two hours every morning," you have proved you were listening, and that
sentence becomes the first slide of the demo.

Send your notes to the customer afterwards using
`templates/discovery-call-notes.md`. This single habit puts you ahead of most
working SEs. It confirms your understanding, gives your champion something to
forward, and creates a written record of what "success" meant before anyone
starts arguing about it.

### The demo

A demo is an argument, not a tour. The structure is **tell, show, tell**.

- **Tell**: "You said reconciliation takes Marcus two hours every morning and
  errors are found a week late. I am going to show you that same process
  taking four minutes, with errors flagged the same day."
- **Show**: do exactly that, and nothing else.
- **Tell**: "That is the two hours gone. Should I show you what happens when
  the data is bad, or would you rather see the permissions model?"

Four rules that do most of the work.

**Start with the outcome, not the login screen.** Open on the finished report,
the completed dashboard, the resolved ticket. Then work backwards to how it
got there. Nobody has ever been persuaded by a navigation menu.

**Demo the problem, not the features.** The feature list is on the website.
Your job is to show their problem, solved. Every screen you show should be
traceable to something they said on the discovery call. If you cannot name the
sentence it answers, cut the screen.

**Use their vocabulary and their data shape.** If they say "matters" and your
product says "cases," say matters. If they have 40,000 accounts, do not demo
with three. Pre-loading a demo environment with data that resembles theirs is
the highest-leverage hour of preparation there is.

**Cut ruthlessly.** A 30-minute slot is 20 minutes of demo, 10 of questions.
That is roughly three things, well told. Choosing which three is the skill.

**Handling "can it do X" live.** There are exactly four honest answers, and
using the right one builds more trust than any feature.

| Situation | What you say |
|---|---|
| Yes, and you can show it | "Yes — here, let me show you." Then actually show it, briefly |
| Yes, but not right now | "Yes, and it needs a bit of setup I do not have loaded. I will record it and send it today." Then send it today |
| Not directly, but there is a path | "Not natively. It is achievable through the API, and I would want to understand your volume before recommending it. Can we take that offline?" |
| No | "No, we do not do that today. Is that a hard requirement or a preference?" |

The fourth answer is the one that separates good SEs from average ones. Saying
no clearly and early makes every yes credible, and the follow-up question does
real qualification work: a "preference" costs you nothing, a "hard
requirement" you cannot meet means the AE needs to know today rather than in
week eleven.

Never say "that's on the roadmap" unless you know it is, with a quarter, and
you are permitted to say it. Roadmap promises get written into contracts.

**When something breaks.** It will. The recovery, in order:

1. Name it plainly. "That's not loading — give me ten seconds." Do not narrate
   your troubleshooting and do not blame the wifi.
2. Try once. Refresh, or re-run.
3. If it does not recover, move on. "I have a recording of this exact flow, I
   will send it right after the call. Meanwhile, let me show you the piece you
   asked about earlier."
4. Follow up the same day with the working version.

The room is not judging whether your software broke. They are judging whether
you get flustered, because that predicts what you will be like during their
implementation. Calm recovery is a stronger signal than a flawless demo.

Always have a fallback: a recorded video of the core flow, and screenshots.
Preparing them takes twenty minutes and you will use them twice a year.

### POC scoping

A POC without written success criteria never ends. It drifts, the champion
loses interest, and the deal dies of exhaustion rather than a decision.

Before a POC starts, agree in writing on five things:

1. **Success criteria.** Specific and testable. "Sync 10,000 accounts from
   Salesforce and reconcile to within 0.1 percent" is a criterion. "Show it
   works well" is not.
2. **Scope.** What is explicitly out. Name it, or it will appear in week two.
3. **Timeline.** Start and end dates, with a decision meeting on the calendar
   before the POC begins.
4. **Resources.** Who on their side does what, and how many hours. A POC where
   the customer commits nobody is not a POC.
5. **What happens if it passes.** If the answer is "then we'll discuss," you
   are running a science project, not an evaluation.

Rewrite every vague criterion into a testable one before you agree to it:

| Vague | Testable |
|---|---|
| "It should be fast" | "The daily report returns in under 10 seconds at 2 million rows" |
| "It should integrate with Salesforce" | "Accounts sync nightly, matched on external ID, with a reconciliation report" |
| "Our team should find it easy" | "Three named users each complete the onboarding flow unassisted" |

### Objection handling: the five you will hear

The structure for all of them: acknowledge, ask a clarifying question, answer
honestly, then confirm you answered it. Never argue, and never answer an
objection you have not understood.

**1. "It doesn't integrate with [system]."**

"We don't have a prebuilt connector for that today, you're right. Can I ask
what data needs to move, and in which direction? If it's account records
flowing in nightly, that's our standard API and we've done it many times. If
you need bidirectional real-time sync, that's a bigger conversation and I want
to be straight with you about the effort." Then be straight about it. Most
"integration" objections turn out to be a one-directional nightly sync that
takes a day.

**2. "It's too expensive."**

Do not negotiate — that is the AE's job, and stepping into it undermines them.
Your job is to move the conversation to value or to scope. "That's a fair
concern, and pricing is really [AE]'s conversation. What I can do is help us
compare against the current cost. You said reconciliation takes two people two
hours a day — what is that worth over a year? And if the number still doesn't
work, is there a narrower starting scope that gets you the biggest piece of
that?"

**3. "We can build this ourselves."**

Often true, and saying otherwise insults an engineering team you need on your
side. "You probably could — you have the team for it. The question I'd ask is
what it costs to maintain, not to build. The first version is usually a few
weeks; the ongoing part is API changes, edge cases, someone on call, and a
person who owns it when they leave. What else is that team's roadmap competing
against this quarter?" You are not arguing they cannot. You are moving the
comparison from build cost to total cost and opportunity cost.

**4. "Your security posture isn't good enough" or "we need [certification]."**

Never wing this one. "Tell me which requirement specifically, so I answer the
right question. We have SOC 2 Type II available under NDA, encryption in
transit and at rest, SAML SSO, and SCIM. If you need something we don't have —
ISO 27001, or EU data residency, for example — I would rather tell you today
than in legal review, and I'll get you a firm answer from our security team by
Thursday." Then deliver by Thursday.

**5. "It can't handle our scale" or "your performance won't work for us."**

Get to a number immediately. "What does your scale look like — records, users,
peak concurrency, growth? Our largest customer in your segment runs [X], and
I can share the architecture. If your numbers are beyond that I'd rather scope
a performance test into the POC than promise something on a call." Turning a
vague fear into a testable number is the entire move, and it converts an
objection into a POC criterion.

### Working with the AE

Agree three things before every customer call, in about ninety seconds:

1. **What is the goal of this call?** One sentence. Not "build the
   relationship."
2. **Who talks when?** Typically: the AE opens and closes; you own everything
   between the first technical question and the last.
3. **What is the next step we are asking for?** Every call ends with a
   scheduled next step, and someone has to say it out loud.

The rules that keep the partnership working. Never contradict the AE in front
of the customer — write it down and correct it after. Never discuss pricing;
redirect. Never commit to a date without checking. And do give the AE the bad
news immediately: an SE who says "this is not a technical fit and here is why"
in week two is far more valuable than one who lets a deal die slowly in week
twelve.

## Walkthrough

Two artifacts, using the templates, both built on your capstone from module 09.
Treat your capstone as if it were a product you are selling.

### Part 1: the discovery notes

Invent a plausible prospect for your capstone's subject matter. For the NYC
311 project, that might be an operations director at a mid-size city agency
who currently tracks resolution times in a spreadsheet.

Open `templates/discovery-call-notes.md` and fill it in as if the call has
happened. Write the customer's words, not your paraphrase. You need:

- Current state, in two or three sentences.
- Two specific pains, each with a cost attached.
- Desired state, in their words.
- Technical environment: systems, data volume, identity, constraints.
- Decision process: who, criteria, timeline.
- Open questions you owe them, with dates.

This is invented, and it is still the highest-value part of this module,
because it forces you to decide what a person with this problem actually
cares about. Fifteen minutes with the template beats an hour of reading about
discovery.

### Part 2: the ten-minute demo script

Open `templates/demo-script-template.md` and write the script for a demo of
your capstone project to that prospect.

| Minutes | Content | Test |
|---|---|---|
| 0:00 to 1:00 | Replay their pain in their words, then state what you will show | Do you name a specific thing they said? |
| 1:00 to 2:30 | The outcome first: the finished chart or answer | Is the first screen a result, not a login? |
| 2:30 to 6:00 | How it got there: the pipeline, briefly, and one query live | Can you cut this to three things? |
| 6:00 to 8:00 | The finding they did not expect | Does this connect to a decision they would make? |
| 8:00 to 10:00 | Limitations, and the next step you are asking for | Do you name a specific next step? |

Write the words you will say for the first sixty seconds, verbatim. Not bullet
points — sentences. The opening is the only part that must be memorized,
because it is where nerves are worst and where the argument is set up.

Then record it, following the module 09 video checkpoint. Watch it once, at
speed, with the sound on. Note three things to fix. Record it again. The
second take is always better and it is where the learning happens.

Two things to look for on the replay: how often you say "um" or "so", and
whether you started with the outcome or drifted into a tour. Almost everyone
drifts into a tour on take one.

## Exercises

Answers in `solutions.md`.

1. Take three of the vague statements below and rewrite each as a testable POC
   success criterion: "the sync should be reliable", "reporting needs to be
   flexible", "it has to work for our whole team", "the data should be
   accurate", "onboarding should be quick".

2. A prospect says on a discovery call: "We just need something that pulls our
   data into one place." Write the next four questions you would ask, in
   order, and say what each one is trying to establish.

3. You are 12 minutes into a 30-minute demo and the prospect asks a question
   that would take 10 minutes to answer properly. Write exactly what you say.

4. Write your response to this: "We looked at you two years ago and your API
   was terrible. What's changed?" Assume you do not know what it was like two
   years ago.

5. Your AE tells the customer on a call that the integration "should take
   about a week." You believe it is closer to a month. Write what you do
   during the call, and what you do after.

6. A champion asks you to send "anything you have on security" the day before
   a review. Write your reply, and list what you attach and what you do not.

7. From your discovery notes in the walkthrough, choose the three things you
   would demo and write one sentence for each explaining which pain it
   answers. Then name two things you would deliberately not show, and why.

8. A prospect asks "can it do X" and the answer is no, with no workaround.
   Write the exchange, including your follow-up question and what you do with
   the answer.

## Checkpoint

<details>
<summary>1. What is the difference between discovery and a demo, and what happens when you blur them?</summary>

Discovery is where you learn what problem they have, what it costs, and what
their environment looks like. A demo is where you argue that your product
solves that specific problem. If you demo during discovery you are showing
generic features to someone whose problem you do not yet understand, so the
demo cannot be tailored — and worse, you have spent your credibility on a
tour. You have also lost the chance to ask hard questions, because once you
start selling, the customer stops explaining.
</details>

<details>
<summary>2. A prospect asks "can it do X" in front of eight people. It cannot. What do you say and why?</summary>

"No, we don't do that today. Is that a hard requirement or a preference?" You
say it plainly because eight people just watched you answer a hard question
honestly, and every yes you gave earlier became more believable. The follow-up
does real work: a preference costs nothing, and a hard requirement you cannot
meet is information the AE needs immediately rather than in week eleven. The
alternative — hedging, or promising a roadmap you have not verified — either
gets discovered later or ends up in a contract.
</details>

<details>
<summary>3. Why do POCs without written success criteria fail?</summary>

Because nothing can be passed. Without a written definition of success, the
evaluation ends when someone gets bored, and every new stakeholder introduces
a new expectation mid-flight. Written criteria give the champion something to
take to the economic buyer, prevent scope creep, and turn a subjective "we
weren't sure" into an objective outcome you can act on. They also protect you:
if the criteria are met and the deal stalls, the reason is commercial, not
technical, and that is a different conversation.
</details>

<details>
<summary>4. Your demo breaks. Rank these responses from best to worst: (a) troubleshoot out loud for three minutes, (b) blame the environment, (c) name it, try once, then move to the fallback, (d) apologize repeatedly.</summary>

Best is (c): naming it, one attempt, then moving on with a recording sent the
same day. It shows composure and respects the room's time. Next is (a) —
troubleshooting out loud is at least honest, but three minutes of watching you
debug costs the room its attention. Then (d): repeated apology makes the
failure the topic and reads as anxiety. Worst is (b), blaming the environment,
because it sounds like deflection and predicts how you will handle problems
during their implementation. The buyer is evaluating your composure, not your
uptime.
</details>

<details>
<summary>5. Name three things your customer success background already gives you that a newly graduated engineer would not have.</summary>

First, you can hear the difference between what a customer says and what they
mean, and you know to ask rather than assume. Second, you have held a
conversation with an unhappy customer and kept it productive, which is exactly
the demo-breaks and the escalation scenario. Third, you know how a
post-sale relationship actually goes, so you can tell the difference between a
promise that lands well in a demo and a promise that creates a problem in
month three. That last one is the perspective most SE teams are short of.
</details>

You can now say:

- "I run discovery with a structured framework — current state, pain, desired
  state, technical environment, and decision process — and I send written
  notes back to the customer to confirm what I heard."
- "I structure demos around the customer's stated problem rather than a
  feature tour, I open with the outcome, and I have a fallback ready for when
  something breaks."
- "I scope proofs of concept with written, testable success criteria and a
  decision date agreed before the POC starts."

## Put it on your résumé

- Ran structured discovery using a five-part framework and documented findings
  in written call notes shared with stakeholders, converting stated pain into
  testable evaluation criteria.
- Built and delivered a tailored 10-minute technical demonstration structured
  around customer-stated outcomes, including live query walkthrough, stated
  limitations, and a defined next step.

## Go deeper

- [Mastering Technical Sales, John Care](https://www.masteringtechnicalsales.com/) —
  the standard reference for the SE role. If you read one book on this, read
  this one; the demo and POC chapters are the strongest.
- [PreSales Collective](https://www.presalescollective.com/) — a free
  community with a large Slack, job board, and content aimed specifically at
  people entering the profession. Join before you start applying.
- [Great Demo, Peter Cohan](https://greatdemo.com/) — the source of the
  "start with the last slide first" idea. His free articles cover most of it.
- [Gong's public research](https://www.gong.io/resources/) — recorded-call
  analysis of what actually correlates with closed deals, including talk-ratio
  and question counts. Data instead of folklore.
- [Sales Engineering subreddit](https://www.reddit.com/r/salesengineers/) —
  unfiltered day-to-day reality of the job, including compensation and what
  people actually get asked in interviews.
