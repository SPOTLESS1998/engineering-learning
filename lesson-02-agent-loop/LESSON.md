# Lesson 2 — Agents: a program that thinks in a loop

Topics 31–34 · everyday picture first, tech term second. This is the start of the
**agentic fast-track** you asked for — the full 14-topic map lives in
`../study-guide.md` → **Cluster H**. Terms also go in the glossary there.

---

## 1. An "agent" = an LLM put in a loop with a stop button

A normal chatbot answers once and waits for you. An **agent** doesn't wait — it runs
the model over and over, and *between* answers it can go do things.

Picture a new intern with a phone and a to-do note: *"Find Acme's CEO and email them
hello."* The intern looks something up, sees the result, decides the next move, does
it, looks again… and stops when the job's done. That repeating cycle has four beats:

**perceive → think → act → observe**, then round again.

- **perceive** — gather what the model can see this turn (the goal + what's happened so far)
- **think** — the model picks the next action
- **act** — your code runs that action (a search, an email)
- **observe** — the result gets added to what the model sees, and the loop repeats

The official name is the **agent loop**. Everything fancy — "autonomous agents,"
"AI employees" — is this loop plus safety rails. **The single most important part is
the stop button.** An intern who never decides "I'm done" and never runs out of hours
will keep working forever. That's the bug in section 5, and the whole lab.

> **In our code:** `local-research-agent/` is a plain one-agent loop; each of
> `ejentic-agents/src/agents/{research,content,job,scholarship}.ts` is one of these
> loops with a specific job.

## 2. "Tool use" = the model can't do anything itself — it fills out a request form

Here's the thing that surprises everyone: **the model can't actually search the web or
send an email.** All it can do is produce text. So how do agents *do* things?

You hand the model a short menu of **tools** — each with a name and what info it needs,
like a paper form: `sendEmail(to, body)`. When the model wants to act, it doesn't act —
it fills out the form: *"call `sendEmail` with to=ceo@acme.com, body=Hello."* **Your
code** reads that form and decides whether to actually run it, then hands the result
back. The real name for "the model filling out the form" is **function calling** (or
**tool use** — same thing).

Two things follow, and they matter:

1. **The tool's description is you programming the model.** A vague description
   ("does stuff with email") = the model uses it wrong. A sharp one = it uses it right.
   Writing tool descriptions *is* prompt engineering.
2. **The model only ever *requests*. Your code is the gatekeeper.** That gap — request
   here, decision there — is where every safety rail lives (topic 40). Never wire a tool
   so the model's request runs automatically with no check.

> **In our code:** `ejentic-agents/src/tools/*` (`ping`, `selftest`, `probeModels`…)
> and `src/lib/{websearch,firecrawl}.ts` are exactly these forms — a name, some inputs,
> and code that runs when the model asks.

## 3. "Context" = the sticky notes on the model's desk (and the desk is small)

The model has no memory between calls. Each time you ask it to think, you must re-hand
it *everything it's allowed to know right now*: its job, the rules, the history so far,
any facts you looked up. That pile is the **context**.

Picture a desk covered in sticky notes — that's all the model can see. **The desk has a
fixed size** (the **context window**, measured in **tokens** — think "chunks of words").
When a long job piles up too many notes, the oldest ones fall off the edge and the model
literally forgets the goal. So good agents are deliberate: put the *useful* notes on the
desk, and when it fills up, **summarise** the old ones into one note instead of keeping
all of them.

**The key sentence: context is a budget, not a bucket.** Dumping everything in feels
safe but fills the desk and costs money every turn (topic 41).

> **In our code:** `ejentic-agents/src/context/*` (`brand`, `candidate`, `calendar`,
> `ejentic`, `scholar`) are pre-written sticky notes — each assembles the *right* facts
> for one kind of job instead of dumping the whole database.

## 4. "Planning vs acting" = make a plan, or just take the next step?

Two ways to run the loop:

- **Just act, one step at a time** (the real name is **ReAct** — reason + act). Think,
  do one thing, see what happened, think again. Flexible and self-correcting — if step 1
  surprises you, step 2 adapts. But it can wander in circles.
- **Plan first, then execute.** Make the whole plan up front ("1. search, 2. email"),
  then run it. Cheaper and more predictable — but brittle: if reality doesn't match the
  plan, it charges ahead anyway.

And the beginner trap: **tiny jobs need neither.** If the task is one step, just do the
step — a plan is wasted motion (and wasted tokens). The skill is picking the *lightest*
shape that gets it done.

> **In our code:** the SDR in `lead-generation-system` sequencing an outreach (research
> the prospect → draft → score → maybe revise → queue for approval) is a small plan-then-
> execute pipeline; a research agent chasing leads it didn't expect is ReAct.

## 5. The one bug that bites every beginner = the loop that never stops

Remember Lesson 1's overselling bug — the danger hid in a *gap*? The agent version hides
in the *loop*. A single prompt's worst case is a bad sentence. An agent's worst case is a
loop that **never stops** — because now the program keeps *spending money and taking real
actions* on every turn.

Our lab task is trivial: *find the CEO, send one hello.* Needs ~2 steps and 1 email. But
the naive loop below has **no budget** and **no real stop condition**, and the (fake)
model never says "I'm done" — so it searches, emails, searches, emails… forever. Every
loop is a paid model call. Every `sendEmail` is a *real email to the same person.*

**The key sentence: with no stop button and no budget, an agent doesn't stop — it burns.**
This is the #1 real-world agent incident: the runaway loop that drains an API account
overnight or spams one poor prospect 200 times.

**The three fixes, in plain terms** (you'll build them in the lab):

1. **A budget** — never loop more than N steps (or N tokens/dollars). Blunt but it *always*
   stops the bleeding. Cost: a genuinely long job gets cut off, so pick N from real data
   and log every time you hit it. Real name: **max-iterations / token budget.**
2. **A real finish line** — the model gets a way to say *"done, here's the answer,"* and the
   loop obeys it; plus a cheap guard: if two steps in a row do the exact same thing, stop
   (it's stuck). Real name: **terminal condition + no-progress guard.**
3. **Tools that can't double-act** — make `sendEmail` remember it already emailed this
   person today, so even if the loop misbehaves, the email goes out **once**. Real name:
   **idempotent tool** — and it's the same idempotency idea waiting for you in topic 6.

Notice fix 3 is *defense in depth*: fixes 1 and 2 stop the loop; fix 3 protects the outside
world *even when the loop logic fails*. Autonomous systems layer all three.

## The lab

```bash
cd /Users/ejehrebecca/.cline/data/workspaces/chat/engineering-learning/lesson-02-agent-loop
node lab.js        # watch the runaway: dozens of steps, dozens of duplicate emails, $$ burned
node solutions.js  # the three stop-buttons — only AFTER you try them yourself
```

Mission: predict → run → fix → compare. In `lab.js`, before running, write down your
guess: how many emails does the same person get? Then watch fix 3 in `solutions.js` — the
loop still misbehaves, but the recipient gets exactly **one** email.

Think about: why is a runaway loop *worse* on a schedule (topic 38)? (Because nobody's
watching at 3am — it burns all night.)

## Homework

1. One sentence each: what does a **budget** protect, and what does an **idempotent tool**
   protect? (Hint: one guards *your* wallet, the other guards *the outside world*.)
2. Look at one file in `ejentic-agents/src/tools/`. Write its "form": the tool name, what
   inputs it takes, and one sentence of description sharp enough that a model would call it
   right.
3. Your lead-gen SDR sends real cold emails on a schedule. Name the one step that MUST have
   a human approve it before it fires (topic 39), and say why a budget alone isn't enough
   there.

## Tiny self-check (say answers out loud; we check next session)

1. In one sentence: what are the four beats of the agent loop?
2. True or false: the model sends the email itself. (Why?)
3. What is "the context window," and what breaks when a job overflows it?
4. Which fix still saves you *after* the loop logic has already gone wrong — and why?
