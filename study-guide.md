# Engineering Learning Guide

Persistent reference for learning real engineering while building with AI.
Day-to-day progress lives in **learning-log.md** (same folder).
Last updated: 2026-08-28.

## How to use this in future sessions

In any new chat, say: **"Load my study guide."** Then read this file and
`learning-log.md`, and follow the standing rules below during all coding work.

### Standing rules for every coding session
1. When any topic in this guide comes up in the code we are writing, pause and teach it using the protocol below.
2. Keep the fixed format: failure story → mechanism → trade-off → in our code → break-it exercise.
3. **Style: the user is a newbie.** Everyday analogy FIRST, technical term SECOND (say the term, then define it in one plain sentence). Short sentences. Never use a word or acronym without explaining it the first time.
4. After each lesson, update `learning-log.md` (date, topic, how it appeared, exercise, result).
5. Track weak spots and revisit them in later sessions (spaced repetition).
6. **Keep chat replies SHORT.** Long lessons and long explanations go into a markdown file in the learning folder (the user can scroll files freely in the editor; the chat panel auto-scrolls to the bottom while streaming, which makes reading long chat messages painful). End chat messages with a pointer to the file.

## The three root facts

Every topic in this guide is a coping strategy for one of these:
1. **The network is unreliable, and you can't tell "slow" from "dead."**
2. **Components fail independently and partially** — half the system works while the other half burns.
3. **The system must keep working while it changes** — deploys, migrations, and scaling happen mid-traffic.

## The teaching protocol (used whenever a topic appears in code)

1. **Failure story** — what concretely breaks without it (incident-style narrative, not definitions).
2. **Mechanism** — how it works under the hood: plain-language analogy first, then the real terms and numbers.
3. **Trade-off** — what it costs you; every technique is a trade, never a free win.
4. **In our code** — point at the actual lines we are writing, plus the code smell that signals the need.
5. **Break it** — a ~10-minute experiment that reproduces the failure, so it becomes intuition instead of trivia.

## Plain-English glossary (grows as we learn)

- **Distributed system** — several computers doing one job together, talking over a network.
- **Network partition** — the connection between computers breaks; they can't talk.
- **Consistency** — how quickly everyone sees the same up-to-date information.
- **Eventual consistency** — everyone sees the truth, just a bit late.
- **Read-your-writes** — you always see your own changes immediately.
- **Transaction** — a group of steps where ALL happen or NONE happen.
- **Race condition** — two things act on the same data at the same time, both using old info.
- **Check-then-act** — look at data, then act on it. Dangerous if the data can change in between.
- **Lock** — "one at a time, please": only one worker may touch the data.
- **CAS (compare-and-swap)** — "change it only if nobody else changed it first; otherwise try again."
- **Atomic** — happens as one single, unsplittable step; nothing can squeeze in the middle.
- **Idempotent** — doing the same thing twice has the same result as doing it once (proper lesson in cluster B).
- **Agent** — an LLM run in a loop that can take actions between turns, not just answer once (cluster H).
- **Agent loop** — the repeating cycle an agent runs: perceive → think → act → observe.
- **Tool use / function calling** — the model can't act; it *requests* an action (fills out a form) and your code runs it.
- **Context window** — the fixed-size "desk" of everything the model can see this turn, measured in tokens; overflow = it forgets.
- **Token** — a chunk of text (roughly ¾ of a word) — the unit context and cost are measured in.
- **ReAct** — "reason + act": think, do one step, observe, repeat — flexible, self-correcting.
- **Runaway loop** — an agent with no budget and no stop condition that keeps spending and acting; the #1 agent incident.
- **Human-in-the-loop** — the agent pauses for a human yes/no before a risky action (e.g. sending a cold email).

## Learning path

Foundations (1–5) → Fault tolerance (6–10) → Data (17–20) → Messaging (11–16) → Interfaces (21–22) → Operations (23–25) → Risk & money (26–30).
Each cluster uses everything before it.

## How the topics connect

- **Unreliable-network chain:** timeouts (8) → retries (7) → idempotency (6) → delivery semantics (11) → outbox (16).
- **Overload chain:** rate limiting (10) → backoff/jitter (7) → circuit breakers (9) → capacity planning (29).
- **Many-machines chain:** distributed systems (1) → consistency (2) → CAP (3) → isolation (4) → sagas (15) → CQRS (14).
- **Independent-deploys chain:** backward compat (22) → schema evolution (13) → API versioning (21) → expand/contract → zero-downtime (27).
- **Operations loop:** observability (23) → SLOs/error budgets (25) → incident response (24) → rollback/DR (28) → cost (30).

---

## The field guide

Numbers match the original 30-topic list. Quizzes and personalized notes live in `learning-log.md`.

### Cluster A — Foundations: why distributed systems are hard

**1. Distributed systems** — Many machines coordinating over a network. The defining property is *partial failure*: unlike a single machine (works or doesn't), a distributed system fails in arbitrary half-ways, and you often can't distinguish "node crashed" from "network is slow." Learn the *Eight Fallacies of Distributed Computing* — they are the coordinate axes for everything else on this list.

**2. Consistency models** — The contract about what reads may see after writes. A *spectrum*, not a binary: linearizable (behaves like one machine) → sequential → causal → eventual. Session guarantees like *read-your-writes* are what users actually demand ("I deposited money and my balance didn't change" is a bug). Pick the *weakest* model that keeps your feature correct: a view count can be eventual, a bank balance cannot.

**3. CAP trade-offs** — During a network partition you must choose consistency (reject requests) or availability (serve possibly-stale data). Misreading: "always pick 2 of 3" — partitions are rare. The everyday trade-off is **latency vs. consistency** (see PACELC): even with no partition, waiting for replication takes time. A "CA" system is just a single-node system.

**4. Transactions** — ACID. Atomicity is easy; *isolation* is where the depth lives. Isolation levels (read committed → repeatable read → serializable) each permit different anomalies: dirty reads, lost updates, phantoms, and the sneaky *write skew* (two on-call doctors each check "at least one doctor is on duty," both resign). Postgres defaults to read committed, MySQL to repeatable read. Distributed 2PC is slow and blocking — which is why sagas (#15) exist.

**5. Concurrency & race conditions** — Correctness that depends on timing. Canonical bug: *check-then-act* — two requests read "3 in stock," both pass the check, both decrement, stock goes negative. Fixes: locks (pessimistic), compare-and-swap / version columns (optimistic, retry on conflict), or serializing writes for one entity through a single point (one queue, one partition key). Race conditions are why isolation levels (#4) exist.

### Cluster B — The fault-tolerance kit

**6. Idempotency** — Applying the same operation twice has the same effect as once. Matters because at-least-once delivery (#11) + retries (#7) guarantee duplicates *will* happen. Practice: client sends an **idempotency key**; server stores key → result and replays it on duplicates. `PUT` is naturally idempotent; `POST` isn't — which is why payment APIs demand keys.

**7. Retries & exponential backoff** — Wait 1s, 2s, 4s… between attempts, plus **jitter** so a million clients don't retry in synchronized waves. Golden rules: only retry *idempotent* operations and *retryable* errors (5xx yes, 4xx no), cap attempts, respect `Retry-After`, use a retry budget (retries ≤ ~10–20% of traffic). Unmanaged retries are how a struggling server gets drowned.

**8. Timeouts** — The maximum you'll wait before giving up. *Every* network call needs one; without it, one hung dependency hangs your thread pool and your whole service. Too long → resources pile up; too short → you abandon requests that would have succeeded. Advanced: propagate deadlines across service hops so the *total* budget is respected, not just each hop.

**9. Circuit breakers** — After a failure threshold, stop calling the dependency and fail fast (closed → open → half-open probe states). Gives the dependency room to recover and prevents cascading failure, because *slow failures are worse than fast failures* (they eat threads/memory). Pair with fallbacks: degraded-but-working beats hard-down.

**10. Rate limiting** — Deliberately rejecting excess traffic with `429`. Algorithms: token bucket (allows bursts), leaky bucket (smooths), fixed/sliding window (cheap vs. accurate). It's a fairness tool as much as protection: one runaway tenant must not starve everyone else. Distributed rate limiting needs shared state (e.g., Redis) — a first taste of consistency costs (#2, #3).

### Cluster C — Event-driven systems (Kafka)

**11. Kafka delivery semantics** — At-most-once (skip on failure: data loss), at-least-once (retry: duplicates — the practical default), exactly-once (Kafka transactions + idempotent producer — real *within Kafka*). The professional insight: **"exactly-once" end-to-end is almost always at-least-once + idempotent consumers.** Design consumers for duplicates, always.

**12. Consumer rebalancing** — When group membership changes (deploy, crash, scale-up), partitions are reassigned. Eager rebalancing is stop-the-world. Expect duplicate processing during rebalances (offset committed, processing incomplete) — idempotent consumers again. Pro tips: cooperative-sticky assignor (incremental rebalances), static membership (`group.instance.id`) so rolling deploys don't trigger rebalances, tune `session.timeout` vs. `max.poll.interval`.

**13. Schema evolution** — Producers and consumers deploy independently, so old readers must handle new data and vice versa. Avro/Protobuf + schema registry: declare a compatibility mode (backward / forward / full) and the registry *rejects incompatible schemas*. Rules: make new fields optional with defaults, **never rename a field** (that's delete + add — breaks readers), consumers must tolerate unknown fields.

**14. CQRS trade-offs** — Separate the write model (normalized, protects invariants) from read models (denormalized, shaped for queries). Wins: each side scales and evolves independently, reads get fast. Costs: reads become *eventually consistent* (you just wrote something the read API doesn't show yet), you maintain a sync pipeline (#16), complexity roughly doubles. Don't start with CQRS — grow into it.

**15. Saga compensation** — A long business process (order → charge → ship) as a sequence of *local* transactions, each atomic in its own DB, with **compensating actions** if a later step fails (refund the charge). Compensation is *not* undo — it's a new forward business action, so it must itself be idempotent and handle its own failures. Choreography (events, no coordinator) is flexible but invisible; orchestration (coordinator drives steps) is explicit but centralizes logic.

**16. Transactional outbox** — Solves the **dual-write problem**: "insert order" (DB) + "publish event" (Kafka) are two systems; one can succeed while the other fails, and data silently diverges. Fix: write the event into an `outbox` table *in the same DB transaction* as the state change; a relay (poller or CDC like Debezium reading the WAL) publishes it afterward; consumers dedupe by event ID. If you ever see "then call publish() after save()" — that is the bug this solves.

### Cluster D — Data layer

**17. Database indexing** — Extra B-tree structures mapping column values → row locations: O(n) scan becomes O(log n). Cost: every index slows every write and eats storage. Composite index `(a, b, c)` serves filters on `a`, `a,b`, `a,b,c` (leftmost-prefix rule); order matters — equality columns before range columns. Bad indexes: a low-cardinality column alone (`is_deleted`), or wrapping the indexed column in a function inside your `WHERE`.

**18. Query optimization** — The planner picks join orders/methods from statistics; steer it with `EXPLAIN (ANALYZE)`. Classic killers: **N+1 queries** (one query per row in an app loop — batch it), `SELECT *` (defeats covering indexes), `OFFSET 100000` pagination (scans and discards — use keyset/cursor pagination with `WHERE id > last_seen`), and implicit type conversions that quietly disable an index. Fix the data model before tuning the query.

**19. Partitioning & sharding** — Partitioning splits a table *within* a node (e.g., time-range partitions you can drop instantly). Sharding splits *across machines* because one box can't scale. The shard key decision is nearly irreversible: match it to your query pattern or every query becomes scatter-gather; beware hot spots (celebrity IDs, today's timestamp); plan resharding early (consistent hashing). Exhaust vertical scaling and read replicas first.

**20. Caching & invalidation** — Keep hot data in a faster layer. Cache-aside is the default pattern (read cache → miss → DB → populate). Invalidation: TTLs (simple, eventually stale), explicit invalidation on write (correct, couples systems), versioned keys. Classic failures: **cache stampede** (hot key expires → herd of identical DB queries → add request coalescing or stale-while-revalidate) and never measuring your hit rate. "There are only two hard things in CS: cache invalidation and naming things."

### Cluster E — Interfaces & change

**21. API versioning** — Let old clients live while you evolve. URL path versioning (`/v1/`) is visible and cache-friendly; header versioning is cleaner but invisible. The Stripe model is the masterclass: *never* break anyone — only additive changes, so "versioning" becomes per-feature, not per-API. Additive changes (new optional fields, new endpoints) are never breaking; removals and semantic changes always are.

**22. Backward compatibility** — The discipline that makes rolling deploys (#27), independent service releases, and gradual consumer upgrades possible. Rules: never remove or rename fields (deprecate first, remove much later), new fields must be optional with defaults, servers must ignore unknown fields ("tolerant reader"), DB migrations follow **expand → migrate → contract** (add nullable column, backfill, start writing, only then remove the old one).

### Cluster F — Operating the thing

**23. Observability** — Three pillars: logs (discrete events — structured/JSON with correlation IDs), metrics (aggregated time series — RED: rate/errors/duration for services), traces (one request's full journey across services, spans). Monitoring answers questions you predicted; observability lets you answer questions you *didn't*. High-cardinality fields (user_id, not just endpoint) are what make tracing powerful.

**24. Incident response** — Mitigate first, diagnose later: restart/failover/rollback *before* root cause. Roles: incident commander (coordinates, doesn't type commands), comms lead, ops lead. Declare early; severity = user impact. Then a **blameless postmortem**: timeline, contributing factors (never "human error" — ask why the system let the error matter), action items with owners and dates. "Be more careful" is a failed action item.

**25. SLOs / SLAs / error budgets** — The chain: **SLI** (the measurement, e.g., p99 latency) → **SLO** (internal target: 99.9% under 300ms over 30 days) → **SLA** (contractual promise with penalties — always looser than your SLO). Error budget = 100% − SLO: at 99.9% you may fail ~43 min/month, and you *spend* it on launches. Budget gone → feature work pauses. Converts "reliability vs. velocity" fights into arithmetic. Alert on burn rate: fast burn pages, slow burn files a ticket.

### Cluster G — Risk, change, and money

**26. Security & threat modeling** — Threat modeling = systematically asking "what can go wrong?" *before* building: draw the system, mark trust boundaries, enumerate threats with **STRIDE** (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege), assign mitigations. Principles: least privilege, defense in depth, fail closed, validate at every trust boundary. DoS connects directly to CAP (#3) and rate limiting (#10) — security and reliability are the same discipline at different layers.

**27. Zero-downtime deployments** — Rolling (replace instances in batches — requires N−1 compatibility, i.e., #22), blue-green (two full environments, flip traffic — instant rollback, 2× cost), canary (1% → 10% → 100% with automated metric gating). The sneaky hard part is the database: two app versions run simultaneously against one schema, so *every* migration must be backward compatible (expand/contract). Feature flags decouple "deployed" from "released."

**28. Rollback & disaster recovery** — Rollback works when schema changes were expand/contract; it fails after destructive migrations or once new-format data is written. DR is driven by two numbers: **RTO** (max time to restore) and **RPO** (max data loss = replication/back-up frequency). Two laws: a backup is hypothetical until you've restored from it (schedule restore drills), and at 3am you follow a written runbook — write runbooks during peacetime.

**29. Capacity planning** — Know your units (QPS, queue depth, connections, memory per request), measure headroom (run at ≤50–60% of proven capacity), load-test with *production-shaped* traffic — spikes, not averages. Autoscaling is not a capacity plan: cold starts lag, and your database doesn't autoscale with your pods. Leading indicator of doom: queue depth climbing while CPU looks fine.

**30. Cost vs. reliability trade-offs** — Each extra nine costs roughly an order of magnitude: multi-region, redundant everything, on-call discipline. Match spend to actual business impact — the payment path gets five nines, the internal admin tool gets best-effort. Make the trade explicit with per-service SLOs and error budgets (#25). The cheapest reliability wins are boring: fewer dependencies, simpler designs, correct timeouts and retries.

---

*End of field guide. Progress, quiz results, and the personalized plan live in `learning-log.md`.*

---

## Cluster H — Agentic & autonomous systems (topics 31–44)

Added 2026-09-02 as a fast-track for building AI agents. Same format as the 30 core
topics; each ties to one of the user's real repos. Lessons live in `lesson-02-…`
onward. Recommended order is the numbering below (0 → competent).

**31. The agent loop** — An agent is an LLM run in a loop: *perceive → think → act →
observe*, repeat until done or out of budget. Differs from a single prompt because it
takes real actions between turns. The defining risk is the **runaway loop** (no stop =
burns money + spams). Everything else in this cluster is a part of, or a guard on, this
loop. *In our code:* `local-research-agent`, `ejentic-agents/src/agents/*`.

**32. Tool use / function calling** — The model can't *do* anything; it emits text. You
give it a menu of tools (name + inputs), it *requests* a call, **your code decides and
runs it**, result goes back. Two truths: the tool description is prompt engineering, and
the request/decision gap is where all safety lives. *In our code:* `ejentic-agents/src/tools/*`,
`src/lib/{websearch,firecrawl}.ts`.

**33. Context = working memory** — The model has no memory between calls; each turn you
re-hand it everything relevant (goal, rules, history, looked-up facts). The context
window is a fixed token budget — overflow and it forgets the goal. Curate, don't dump;
summarise old turns. *In our code:* `ejentic-agents/src/context/*`.

**34. Planning vs acting** — ReAct (think→act→observe, adaptive) vs plan-then-execute
(plan up front, cheaper/predictable, brittle). Tiny tasks need neither. Pick the lightest
shape. *In our code:* the SDR's research→draft→score→revise pipeline in
`lead-generation-system`.

**35. Memory & state** — Short-term (this run's context) vs long-term (a durable store:
facts, past actions, dedupe keys). Persist what you must recompute or must not repeat;
recompute the rest. *In our code:* `ejentic-agents/src/lib/store.ts`.

**36. RAG for agents** — Retrieval as a tool: chunk docs, embed, retrieve-then-generate,
cite sources. Retrieve only when needed; stale/irrelevant context hurts more than no
context. *In our code:* `ejentic-rag-system` / `rag-system`. (Depends on the reranker;
ours degrades gracefully when that 404s.)

**37. Multi-agent orchestration** — One agent-with-tools vs many specialised agents with
handoffs. Orchestration (a coordinator drives) vs choreography (agents react to events) —
same trade-off as Sagas (#15). Don't reach for many agents until one won't do. *In our
code:* the four `ejentic-agents` sub-agents; the lead-gen pipeline stages.

**38. Autonomy I — schedulers & triggers** — Cron / GitHub Actions / event triggers let an
agent run with no human present. A scheduled runaway is worse (nobody's watching at 3am),
so runs must be **idempotent** (#6) — a re-run must not double-act. *In our code:*
`ejentic-agents/.github/workflows/*.yml`.

**39. Autonomy II — human-in-the-loop & approval gates** — Some actions must pause for a
human yes/no (sending cold email, spending money, anything irreversible). Design the
*smallest* safe checkpoint; approve/reject over a channel like Telegram or an approval
link. *In our code:* `ejentic-agents/src/lib/telegram.ts`; the lead-gen approval/audit
server (`audit.ejentic.ai`). This is why the SDR queues drafts instead of auto-sending.

**40. Guardrails & safety** — Validate inputs/outputs, allow-list tools and recipients,
treat retrieved/scraped text as untrusted (prompt injection), cap spend, fail closed.
Connects to threat modeling (#26). *In our code:* the SDR's controlled send-mode + the
unfilled `physical_address` gate; RAG not leaking private docs.

**41. Cost & rate-limit management** — Token budget per run, model routing, provider
fallback on 429, caching, per-key usage tracking. Same levers as rate limiting (#10) and
retries+backoff (#7). *In our code:* the `freellmapi` gateway — one endpoint, ~11 free
providers, fail-over, per-key caps.

**42. Observability & debugging agents** — Trace one run end-to-end; log every tool call +
model input/output; be able to replay a failed run; add self-tests/health checks. Extends
observability (#23). *In our code:* `ejentic-agents/src/tools/{selftest,probeModels}.ts`.

**43. Evaluation & LLM-as-judge** — You can't eyeball agent quality at scale. Build a
golden test set, run offline evals, use a model to *score* outputs, guard against
regressions when you change a prompt or model. *In our code:* the SDR's copy-quality
judge (draft → score → revise → gate at min_score); RAG answer correctness.

**44. Reliability for agent runs (capstone)** — Apply Cluster B to agents: timeouts on
tool calls, retries only on idempotent/retryable steps, dedupe so a GitHub Actions re-run
never double-sends a Telegram message or a cold email. Pulls together #6, #7, #8, #38.
*In our code:* `ejentic-agents` re-runs + SDR send-dedupe.

### How Cluster H connects to the core 30
- **Runaway-loop chain:** agent loop (31) → budgets/caps → idempotency (6) → schedulers (38) → reliability (44).
- **Safety chain:** tool use (32) → guardrails (40) → human-in-the-loop (39) → threat modeling (26).
- **Cost chain:** context budget (33) → cost/rate-limit (41) → rate limiting (10) → backoff (7).
- **Quality chain:** planning (34) → RAG (36) → eval/LLM-as-judge (43) → observability (42, 23).




