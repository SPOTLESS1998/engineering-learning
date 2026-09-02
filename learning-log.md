# Learning Log

Day-to-day progress for the engineering learning plan.
The reference material lives in **study-guide.md** (same folder).
Start date: 2026-08-28.

## Profile
- Goal: become an engineer — learn how systems actually work, not just generate code.
- Method: teach topics when they appear in real coding work, using the 5-beat protocol in study-guide.md.

## Current status
- Stage: **Lesson 1 in progress (foundations, topics 1–5) — race-condition lab assigned.** Fast-track added: **Lesson 2 (agent loop, topics 31–34) also assigned** at user request (2026-09-02).
- Quiz graded 2026-08-28: 5/12 correct, 7 honest IDKs. Profile: strong instincts, no formal grounding yet.
- Next: complete lab (3 fixes) + homework (re-answer bonus question) → then cluster B (fault tolerance). Agentic Cluster H (topics 31–44) runs in parallel per user's "learn fast" ask.

## Diagnostic quiz (issued 2026-08-28)
- Format: 12 multiple-choice + 1 open-ended, covering all 7 clusters of the guide.
- Rule: "IDK" is a valid answer — this is a diagnostic, not a test.
- Result: **5/12 correct** — Q1 C ✓, Q2 B ✓, Q6 B ✓, Q10 A ✓; Q5 C ✗ (trap); Q3, Q4, Q7, Q8, Q9, Q11, Q12 = IDK; bonus unanswered
- Interpretation: correct instincts on timeout semantics ("unknown outcome"), read-your-writes, backoff+jitter, and cache stampede behavior. No formal study yet of CAP, isolation, concurrency control, Kafka, indexing, migrations, SLO math.
- Weak clusters identified: full curriculum from foundations; extra attention on B (circuit breakers) given Q5.

## Personalized plan

Path (quiz confirmed starting at the beginning — full curriculum):
1. **Cluster A — Foundations (topics 1–5)** ← Lesson 1 now, incl. race-condition lab (`lesson-01-foundations/`)
2. Cluster B — Fault tolerance (6–10) — extra attention: circuit breakers vs rate limiting (Q5 miss)
3. Cluster D — Data (17–20)
4. Cluster C — Messaging (11–16)
5. Cluster E — Interfaces (21–22)
6. Cluster F — Operations (23–25)
7. Cluster G — Risk & money (26–30)

Checkpoints:
- After clusters A+B: 5-question mini-quiz (must cover CAP, isolation levels, lock vs CAS vs atomic update).
- After every cluster: log lesson + exercise result; revisit weak spots before moving on.
- Lesson 1 homework: re-answer the diagnostic bonus question using new knowledge.

## Lessons completed
| Date | Topic(s) | How it showed up | Exercise | Result |
|------|----------|------------------|----------|--------|
| — | — | — | — | — |

## Weak spots to revisit
- Q5: inbound protection (rate limiting) vs outbound protection (timeouts + circuit breakers) — revisit at start of cluster B.
- Q3: CAP — taught in Lesson 1; re-check at A+B mini-quiz.
- Q4: concurrency control (lock vs optimistic CAS vs atomic update) — Lesson 1 lab covers this; verify at mini-quiz.
- Q7/Q8: Kafka redelivery + outbox — cluster C.
- Q9: functional/expression indexes — cluster D.
- Q11: backward-compatible migrations (expand/contract) — cluster E.
- Q12: error-budget math (99.9% of 30 days ≈ 43 min) — cluster F.

## Session notes
- 2026-08-28: Agreement established. Combined plan: persistent study guide + diagnostic quiz + foundations start + teach-as-we-code standing rule. Created `engineering-learning/` folder with `study-guide.md` and this log.
- 2026-08-28: **Feedback from user: ease up on vocabulary — newbie-friendly, simple + relatable explanations.** Style rule added to study-guide.md; glossary started; Lesson 1 re-taught with everyday analogies. Lab unchanged.
- 2026-08-28: **Feedback from user: chat auto-scroll drags them to the bottom while reading.** Adopted file-first teaching: lessons live in markdown files (e.g., `lesson-01-foundations/LESSON.md`), chat stays short. Rule 6 added to study-guide.md.
- 2026-09-02: **User asked for an agentic/autonomous-systems track — "I need to learn a lot very fast."** Added **Cluster H — Agentic & autonomous systems (topics 31–44)** to study-guide.md, each tied to a real repo (ejentic-agents, freellmapi, lead-gen, rag-system, local-research-agent). Wrote **Lesson 2 — the agent loop** (`lesson-02-agent-loop/`, topics 31–34) with a runnable break-it lab: the **runaway agent loop** (no budget/stop → 29 duplicate emails) fixed 3 ways (budget cap / terminal + no-progress guard / idempotent tool). Both lab files verified running with `node`. Cluster H taught out of curriculum order (before B–G) at user's request for speed.
