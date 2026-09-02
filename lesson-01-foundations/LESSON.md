# Lesson 1 — Foundations: why distributed systems are hard

Topics 1–5 · written in plain language on purpose — everyday picture first, tech term second.
All terms also live in the glossary in `../study-guide.md`.

---

## 1. A "distributed system" = several computers, one job, and a phone line that lies

Work is split across machines that talk over a network. The core problem: **the network can go silent, and silence tells you nothing.**

You call a pizza place and order. The line goes quiet… then dies. Did they hear you? You don't know. Your pizza may be in the oven. Or they never heard you. If you call back and they *did* hear you — two pizzas.

That "did it happen or not?" doubt is what this whole field is about. (The official name for "half the system broke and you can't even tell which half": **partial failure**.) Nearly all 30 topics are clever ways to handle that doubt.

## 2. "Consistency" = how fast everyone sees the same truth

You change your profile photo. Your friend's phone still shows the old one for 10 seconds. Nobody died — everyone gets the truth, just a little late.

So the real question for every feature is: **how fresh must the truth be here?**

- Video likes: 30 seconds late is fine.
- Your bank balance after *you* deposit: must show up for *you* immediately. (Quiz Q2 — you got this right. It's called **read-your-writes**.)
- Money moving between accounts: exact, every time.

Fresher truth = more waiting and more machines. Good engineers use the *least* freshness the feature actually needs.

## 3. CAP = when the line between shops dies, pick one: stay correct or stay open

A shop with two branches, each with its own stock notebook. The phone line between them dies. A customer at branch B asks for the last item — which branch A may have *just* sold. Two choices:

- **Stop selling at B** until the line returns → never oversell, but you turn customers away.
- **Keep selling** and fix the mess later → stay open, but you might sell the same item twice.

You can't do both while the line is dead. That's the whole CAP idea. In normal life the line isn't dead, just slow — waiting for branch A to confirm makes everything sluggish. So every day you trade **speed vs. freshness**. (The fancy name people use for that everyday trade: **PACELC** — you'll never need to say it out loud.)

## 4. A "transaction" = all steps happen, or none do

Moving $100 from savings to checking = two steps: take 100 out, put 100 in. Power dies between them? The $100 vanished into thin air. A transaction wraps the steps so they happen **together or not at all**.

"Isolation" = *privacy while working*: while the bank does your two steps, nobody can peek at or touch the half-done state.

Plot twist: most databases by default **don't** give you the strictest isolation. They let small overlaps through unless you ask for more. That's where races sneak in…

## 5. A race = two hands on the last slice of pizza

One slice. Two people. Both **look** — it's there. Both **grab**. One grab is a lie.

That's quiz Q4, and exactly what our lab does: 1 item, 20 buyers. Every buyer *looks* ("1 left!") then *buys*. All 20 look before anyone updates the shelf. Result: 20 "sold!" receipts for 1 item. 19 lies.

**The key sentence: the bug isn't speed or threads — it's the GAP between looking and acting.** Anything that can happen inside that gap *will* happen eventually.

(Q4's answer was C: an index just helps you *find* things on the shelf faster. It does nothing about two hands grabbing at once.)

**The three fixes, in shop language:**

1. **Bouncer at the door** — one buyer inside at a time. Real name: a **lock** (`SELECT ... FOR UPDATE`). Safe, but a queue forms — and if the bouncer naps while someone's inside, everyone waits forever.
2. **Check the tag at the register** — everyone shops freely; at the register the system asks "changed since you looked?" If yes, go back and try again. Real name: **optimistic** (version + retry). Great when fights are rare; when everyone wants the same item, everyone keeps retrying (later: topic 7 teaches "wait longer between tries").
3. **One single motion** — the cashier takes the item *and* updates the shelf in one move; nobody can squeeze in between. Real name: **atomic** (`UPDATE stock = stock - 1 WHERE stock > 0` — the `WHERE` *is* the check, inside the action).

## The lab

```bash
cd /Users/ejehrebecca/.cline/data/workspaces/chat/engineering-learning/lesson-01-foundations
node lab.js        # watch the lie happen: 20 sold, 1 item
node solutions.js  # the three shop tricks — only AFTER you try them yourself
```

Mission: predict → run → fix → compare. Watch fix 2's retry counter (19 = the cost of optimism under a fight).

Think about: why is this bug *intermittent* in real life? (Real latency varies, so the gap opens at random moments — "it worked in testing" proves nothing.)

## Homework

1. Re-answer the bonus question: **one failure mode no single computer would ever face + one defense against it.** (Hint: the pizza call is one; the bouncer and the one-motion cashier are defenses.)
2. One sentence: why doesn't an index fix the pizza problem?
3. Map each fix to the technique your favorite database or framework actually offers.

## Tiny self-check (say answers out loud; we check next session)

1. In one sentence: what is "the gap"?
2. Which fix creates a queue — and what is its danger?
3. What does `WHERE stock > 0` do, and which fix is it?
