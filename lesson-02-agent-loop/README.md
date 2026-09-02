# Lesson 2 — Agents (topics 31–34: agent loop, tool use, context, planning vs acting)

The lab reproduces the **runaway agent loop** — the #1 real-world agent incident: a loop
with no budget and no stop condition that burns money and spams a real recipient. You fix
it three ways: a budget cap, a real terminal condition, and an idempotent tool.

## Rules
1. **Predict before you run.** Write down what you think `node lab.js` prints — especially
   how many emails the same person receives.
2. **Attempt before you peek.** Try to add the three stop-buttons to `lab.js` yourself,
   then compare with `solutions.js`.
3. Explain every fix's trade-off in one sentence each — that's the real lesson.

## Run
```bash
node lab.js        # watch the runaway loop
node solutions.js  # three working fixes — all end with exactly 1 email sent
```

## Homework
1. One sentence each: what does a **budget** protect vs. what does an **idempotent tool**
   protect? (One guards your wallet; one guards the outside world.)
2. Open one file in `../../ejentic-agents/src/tools/` and write out its "form": name,
   inputs, and a one-sentence description sharp enough that a model calls it correctly.
3. In your lead-gen SDR, name the one step that MUST have human approval before it fires
   (topic 39) and say why a budget alone isn't enough protection there.
