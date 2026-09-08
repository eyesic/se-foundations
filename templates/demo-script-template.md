# Demo script template

Used in module 10, and for the recorded capstone walkthrough in module 09.

A demo is not a feature tour. It is a story about the customer's problem in
which your product is how the problem gets solved. The structure below is
tell-show-tell: say what you are about to show and why it matters, show it, then
say what they just saw.

Ten minutes. Written out, then rehearsed until you are not reading it.

---

```markdown
# Demo: AUDIENCE, DATE

## Setup before the call

- [ ] Data loaded and looks realistic for THIS audience
- [ ] Browser: only the tabs I need, bookmarks bar hidden, notifications off
- [ ] Zoom level up so text is readable on a shared screen
- [ ] Backup screenshots saved locally in case something fails live
- [ ] The one number I want them to remember: ______________

## 0:00 Frame (60 seconds, no screen share yet)

"Last time we spoke you told me PROBLEM IN THEIR WORDS. What I want to show you
today is how you would DESIRED OUTCOME, and I'll stop after each part so you
can tell me if it matches how your team actually works."

Their stated problem: ______________________________________
Who is on the call and what each one cares about:
- NAME, ROLE: cares about ______________
- NAME, ROLE: cares about ______________

## 1:00 The outcome first (90 seconds)

Show the end state before showing how to get there. The finished dashboard, the
completed workflow, the alert that fires.

"This is what your team would be looking at on a Monday morning."

Screen: ______________________________________
Say: ______________________________________

## 2:30 Part one: THEIR FIRST PRIORITY (2 minutes)

Tell: what problem this part solves, in their words.
Show: the smallest sequence of clicks that proves it.
Tell: what they just saw and why it matters to their role.

Screen: ______________________________________
Say: ______________________________________
Stop and ask: "Does that match how your team does it today?"

## 4:30 Part two: THEIR SECOND PRIORITY (2 minutes)

Screen: ______________________________________
Say: ______________________________________
Stop and ask: ______________________________________

## 6:30 The technical question they will ask (2 minutes)

Pick the one you know is coming: the integration, the permissions model, the
data refresh. Answer it before they have to raise it.

Screen: ______________________________________
Say: ______________________________________

## 8:30 Close (90 seconds)

"So today you saw THREE THINGS. The one I would focus on is THE ONE THAT
MATTERS TO THEM. What would you want to see next, and who else should be in
that conversation?"

Recap in their words: ______________________________________
Next step I am asking for: ______________________________________

## Questions I expect, and my answers

| question | answer | if I don't know |
|---|---|---|
| | | "I don't know, let me confirm with our team and send it today." |
| | | |

## If something breaks

- Do not narrate the panic. Keep talking.
- Backup screenshot location: ______________
- The sentence: "That's a demo environment issue, not a product one. Here's the
  result it produces, and I'll send you a live link after the call."
```

---

## Completed example, abbreviated

```markdown
# Demo: Ridgeline Freight ops team, 2026-09-15

## 0:00 Frame

"Last time, Dana told me your team spends the first hour of every Monday
copying numbers out of three systems into a spreadsheet before anyone can act
on them. I want to show you what that Monday looks like without the copying,
and I'll stop after each part so you can tell me if it matches how your team
actually works."

On the call: Dana (ops manager, cares about her team's time), Marcus (IT,
cares about how data gets in and who can see it).

## 1:00 The outcome first

Screen: the account health dashboard, already populated.
Say: "This is Monday morning. Every account, revenue, open support load, last
activity, and a flag on anything that has gone quiet. No copying."

## 2:30 Part one: finding the accounts that went quiet

Say: "Dana, you said you find out an account has gone dark when they don't
renew. This is the filter that surfaces it 60 days earlier."
Screen: filter to accounts with no activity in 60 days, 43 of 200 appear.
Say: "43 accounts. Fifteen of them were heavy users before they stopped, which
usually means someone left. That's a call list, not a report."
Ask: "Is 60 days the right window for your business, or is it shorter?"

## 6:30 The technical question

Say: "Marcus, you're going to ask how this data gets here and who can see it.
Two answers." Screen: the integration settings page and the role permissions
page. "Nightly sync from your CRM, and permissions are per role and per region,
enforced server-side. Nobody sees an account they don't own."

## 8:30 Close

"Today you saw the Monday view, the quiet-account list, and how the data gets
in. If I were you, the quiet-account list is the one I'd pilot first because
it pays for itself in one save. What would you want to see next, and should
your CFO be in that conversation?"
```

The parts that make it work: their words in the framing, the outcome before the
mechanism, a stop-and-ask after each section, the technical objection handled
before it is raised, and a close that asks for a specific next step and a
specific person.
