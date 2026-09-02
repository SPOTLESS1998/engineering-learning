# Lesson 1 — Foundations (topics 1–5: distributed systems, consistency, CAP, transactions, races)

The lab reproduces the classic **check-then-act race condition** (quiz Q4) and
you fix it three ways: pessimistic lock, optimistic CAS + retry, atomic update.

## Rules
1. **Predict before you run.** Write down what you think `node lab.js` prints.
2. **Attempt before you peek.** Implement the three fixes in `lab.js` yourself,
   then compare with `solutions.js`.
3. Explain every fix's trade-off in one sentence each — that's the real lesson.

## Run
```bash
node lab.js        # watch the overselling bug
node solutions.js  # three working fixes, all must sell exactly 1/1
```

## Homework
1. Re-answer the diagnostic **bonus question** (one failure mode a distributed
   system faces that a single machine never does + one defense).
2. One sentence: why is a plain index on `stock` (quiz Q4 option C) useless here?
3. Map each fix to its real-world technique (the comments in `solutions.js`
   name them — find the one your database/framework offers).
