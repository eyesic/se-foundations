# 10. Solutions

There is no single right answer to most of these. What follows are model
answers plus, in each case, the standard your own answer has to meet.

## 1. Rewriting vague criteria as testable ones

| Vague | Testable |
|---|---|
| "The sync should be reliable" | "Over a 14-day POC, the nightly sync completes successfully on at least 13 of 14 nights; any failure produces an alert within 15 minutes and the next run recovers without manual intervention" |
| "Reporting needs to be flexible" | "Three named report requirements — [A], [B], [C] — are each built by a customer analyst without engineering help, in under 30 minutes each" |
| "It has to work for our whole team" | "Twelve named users across three roles log in via SAML SSO and each completes their primary task unassisted; permissions match their current access exactly" |
| "The data should be accurate" | "10,000 synced account records reconcile against the Salesforce source to within 0.1 percent, and every mismatch appears in an exception report" |
| "Onboarding should be quick" | "A new user completes setup and produces their first report within 20 minutes, measured across five users with no assistance" |

The standard: a criterion is testable if a neutral third party could look at
the result and say "passed" or "failed" without asking anyone's opinion. Every
rewrite above contains a number, a named actor, and a time bound. If yours is
missing any of the three, it is still an aspiration.

Two failure modes to watch. Criteria that only you can evaluate ("the API is
well designed") are not criteria. And criteria the customer cannot resource
("twenty users complete the flow") quietly fail because they never happened,
which is worse than failing honestly.

## 2. "We just need something that pulls our data into one place"

The four questions, in order, and what each establishes:

1. **"Which sources, and which one is the source of truth when they
   disagree?"** Establishes scope and surfaces the real problem. "One place"
   usually means three to eight systems, and the disagreement question exposes
   whether they have a data-quality problem that no tool will fix.
2. **"Who is going to use it once the data is there, and what decision are
   they making with it?"** Establishes value, and separates a real project
   from tidiness. If nobody can name the decision, this is a nice-to-have with
   no budget behind it.
3. **"How fresh does it need to be — real-time, hourly, or is last night fine?"**
   Establishes architecture and cost. This one question decides between a
   nightly batch job and a streaming integration, and the difference in effort
   is roughly tenfold.
4. **"What have you already tried, and why did it stop?"** Establishes
   history and constraints. There is almost always a half-built internal
   solution, a failed vendor, or a spreadsheet someone is defending. You need
   to know which before you propose anything.

The standard: your questions should move from scope, to value, to
architecture, to history. If all four of your questions are about their tech
stack, you are scoping an implementation for a project that may not have a
reason to exist.

## 3. The 10-minute answer at minute 12

"That's a good question and it deserves a proper answer, which is about ten
minutes — more than we have right now without cutting the part you asked me
to show. Can I do this: I'll note it, finish the two things I promised, and
then either take it in the last ten minutes if we have them, or set up a
30-minute technical session on it. Which would you prefer?"

Then actually write it down, visibly, and actually follow up.

What makes this work: you validate the question rather than deflecting, you
name the real constraint (time), you give them the choice, and you leave
control of the agenda with the customer. The version that fails is either
answering it — which eats the demo and means you deliver nothing you promised
— or saying "let's take that offline" with no commitment attached, which every
buyer has heard and correctly reads as "never."

One nuance: if the question comes from the economic buyer rather than a
bystander, consider abandoning your agenda and answering it. The plan is not
more important than the person who signs.

## 4. "Your API was terrible two years ago"

"I don't know what you ran into two years ago, and I don't want to guess or
tell you it's all fixed. Can you tell me what specifically went wrong — was it
missing endpoints, rate limits, documentation, something else? I'll find out
exactly what changed in that area and come back to you with specifics rather
than a general reassurance. If you still have the ticket or the notes, that
would help me get you a precise answer."

The three moves: admit you do not know, ask for specifics, and commit to a
concrete follow-up. What you must not do is defend a product you did not build
two years ago, or say "we've completely rebuilt it since then" unless you know
that is true and can point at what changed.

There is also real value hiding in this objection. Someone who evaluated you
before and still took this meeting is interested. And their specific complaint
tells you exactly what to demo, and is worth passing to your product team with
the customer's name attached.

## 5. The AE's "about a week" estimate

**During the call:** say nothing that contradicts them. If there is a natural
opening, add scope rather than correction: "And to make sure we scope that
accurately — how many objects are you syncing, and does the mapping need
transformation, or is it field-for-field?" That plants the qualifier without
undermining anyone, and it makes the eventual longer number feel like a
consequence of their answers rather than a walk-back.

**After the call, immediately:** message the AE directly, in private, before
anything is written down. "Heads up — I think that integration is closer to
three or four weeks, not one, because of [reason]. Can we correct it in the
follow-up email? I'd rather adjust now than at the contract stage." Then draft
the corrected timeline yourself so the AE has something to send rather than a
problem to solve.

Why it must be corrected rather than left: implementation timelines end up in
contracts and in the customer's own project plan. A week that becomes a month
is discovered by the customer's project manager in month one of the
relationship, and it becomes your implementation team's problem and your
credibility.

Why privately: correcting an AE in front of a customer breaks the partnership
you depend on, and the customer reads a divided vendor team as a risk. The
rule generalizes — disagree in private, present one position in public, and
never let the private correction go unsaid.

## 6. "Send anything you have on security"

The reply:

> "Happy to. Before I send a pile of documents — do you know which framework
> they're reviewing against, or is there a questionnaire I should fill in? I'd
> rather answer their actual questions than hand you 40 pages.
>
> In the meantime, here is what I can send right now: our public security
> overview, the SSO and SCIM documentation, and our subprocessor list. Our
> SOC 2 Type II report needs a mutual NDA — if you can tell me who to send
> that to, I'll start it today so it isn't the thing that delays you.
>
> If they send a questionnaire, forward it and I'll turn it around with our
> security team. Anything I'm not certain about, I'll flag rather than guess."

**Attach:** the public security overview or trust-page link, SSO and SCIM
setup documentation, the subprocessor list, the architecture diagram if you
have one, and the DPA if it is a standard published document.

**Do not attach:** the SOC 2 report before an NDA is in place, the penetration
test report (send the summary letter, if anything, and only through the
security team), anything you have not read yourself, and anything containing
another customer's name.

The judgement being tested: sending everything looks responsive and is
actually a risk. Asking which framework saves the champion from doing your
triage, and offering to start the NDA today removes the step that usually
costs a week.

## 7. Three things to demo, two to skip

Worked example, for the NYC 311 capstone demoed to an operations director who
said resolution times are tracked in a spreadsheet and reported monthly:

**Demo these three:**

1. The resolution-time chart by complaint type. Answers the pain "I don't know
   which categories are slow until the monthly report, and by then it's
   history."
2. One query run live, changing the date range on screen. Answers "any new
   question means asking an analyst and waiting three days."
3. The backlog-by-agency finding. Answers "I can't tell whether we have a
   volume problem or a staffing problem."

**Deliberately do not show:**

1. **The extract and transform scripts.** They are the part you are proudest
   of and the part this buyer cares least about. Her problem is the monthly
   lag, not how JSON gets flattened. Keep it ready in case a technical
   participant asks.
2. **Every other chart.** Four exist; three are being shown. The fourth is a
   good chart that does not answer anything she said, and including it would
   dilute the argument and cost two minutes you need for questions.

The standard: every included item traces to a sentence the customer said, and
every excluded item has a reason that is not "we ran out of time." The second
list is the harder one, and being able to explain why you cut something is
what an interviewer is listening for when they ask about your demo.

## 8. The clean no

> **Prospect:** "Can it push updates back into our ERP automatically?"
>
> **You:** "No, not today. We read from an ERP, but we don't write back, and
> there isn't a workaround I'd feel good recommending. Is that a hard
> requirement for you, or a nice-to-have?"
>
> **Prospect:** "It's how our finance team wants it to work, but I don't know
> that it's a blocker."
>
> **You:** "That's useful. Can I ask what would happen today if the update
> arrived as a file or an export instead of a direct write? I want to
> understand whether the requirement is really 'automatic' or really 'no
> manual re-keying', because those have different answers."

What you do with the answer:

- If it is a **hard requirement**: tell the AE the same day, before the next
  call. Then find out whether it is genuinely absent from the roadmap or
  simply unbuilt, and get a real answer rather than a hopeful one. A deal that
  dies in week three is far cheaper than one that dies in week twelve.
- If it is a **preference**: write it in the notes, feed it to product with the
  account name attached, and move on. Do not spend demo time on it.
- Either way, **log it**. Three prospects asking for the same missing feature
  is the most credible product-feedback artifact an SE can produce, and it is
  a genuinely good answer to "how do you work with product?" in an interview.

The last question in that exchange is the one worth practising. "Automatic
write-back" and "no manual re-keying" sound like the same requirement and are
not, and the gap between them is where a lost deal turns into a won one.
