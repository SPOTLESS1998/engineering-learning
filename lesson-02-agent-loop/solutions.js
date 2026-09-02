/**
 * LESSON 2 LAB — SOLUTIONS (three independent stop-buttons for the runaway loop)
 *
 * Run:  node solutions.js
 *
 * Try them in lab.js FIRST. Peek only to compare.
 * Every fix must end with EXACTLY 1 email sent to the CEO.
 *
 * The same dumb "model" is used throughout: it searches once, then tries to
 * send forever. That's on purpose — good agents survive a model that misbehaves.
 */

function makeModel() {
  // Returns a fresh dumb brain: step 1 search, then send forever (never says done).
  let n = 0;
  return function decide() {
    n++;
    if (n === 1) return { tool: 'searchWeb', args: { q: 'Acme CEO email' } };
    return { tool: 'sendEmail', args: { to: 'ceo@acme.com', body: 'Hello!' } };
  };
}

// ---------------------------------------------------------------------------
// FIX 1 — A BUDGET: never loop more than maxSteps. Blunt, but it ALWAYS stops.
// Real world: max-iterations / a token or dollar budget per run.
// The task truly needs ~2 steps (search, then send), so we size the budget to
// that real cost: maxSteps = 2. Sized right, it lands exactly 1 email.
// Trade-off: the budget is only as good as the number you pick. Too tight cuts
// off a legit long job; too loose still lets it over-send (set maxSteps=5 here
// and the CEO gets 4 emails — capped, but still wrong). A budget limits the
// DAMAGE; it doesn't make the loop smart. LOG every time you hit the cap, and
// still add fix 3 for the times your number is wrong.
// ---------------------------------------------------------------------------
function runWithBudget(goal, maxSteps = 2) {
  const decide = makeModel();
  const outbox = [];
  const tools = {
    searchWeb: () => 'ceo@acme.com',
    sendEmail: ({ to }) => { outbox.push(to); return `sent ${to}`; },
  };
  let steps = 0;
  while (steps < maxSteps) {           // <-- the budget replaces "while true"
    steps++;
    const a = decide();
    tools[a.tool](a.args);
  }
  return { emails: outbox.length, note: 'budget sized to the real ~2-step cost; a looser cap would still over-send' };
}

// ---------------------------------------------------------------------------
// FIX 2 — A REAL FINISH LINE: give the model a "done" action and OBEY it, plus
// a no-progress guard (two identical actions in a row = it's stuck, so stop).
// Real world: terminal condition + loop-detection.
// Trade-off: you must design a clean "done" signal and trust it; a model that
// declares done too early quits with the job half-finished. Here our dumb model
// never says done, so the no-progress guard is what actually saves us.
// ---------------------------------------------------------------------------
function runWithTerminal(goal, maxSteps = 30) {
  const decide = makeModel();
  const outbox = [];
  const tools = {
    searchWeb: () => 'ceo@acme.com',
    sendEmail: ({ to }) => { outbox.push(to); return `sent ${to}`; },
    done: () => 'finished',
  };
  let last = '';
  for (let steps = 0; steps < maxSteps; steps++) {
    const a = decide();
    if (a.tool === 'done') break;                 // model says stop -> stop
    const sig = a.tool + JSON.stringify(a.args);
    if (sig === last) break;                       // no progress -> it's stuck -> stop
    last = sig;
    tools[a.tool](a.args);
  }
  return { emails: outbox.length, note: 'stopped the instant it repeated itself' };
}

// ---------------------------------------------------------------------------
// FIX 3 — AN IDEMPOTENT TOOL: the tool itself remembers it already emailed this
// person, so even a broken loop can't double-send. The safety lives in the TOOL,
// not the loop — defense in depth.
// Real world: a dedupe/idempotency key ("emailed:<addr>:<day>") checked before
// the side effect. Same idea as topic 6.
// Trade-off: the tool needs somewhere to remember (a set here; a DB in real life),
// and you must pick the right "same action" key — too broad blocks legit repeats,
// too narrow lets dupes through.
// ---------------------------------------------------------------------------
function runWithIdempotentTool(goal, maxSteps = 30) {
  const decide = makeModel();
  const alreadyEmailed = new Set();   // the tool's memory
  const outbox = [];
  const tools = {
    searchWeb: () => 'ceo@acme.com',
    sendEmail: ({ to }) => {
      const key = `emailed:${to}:today`;
      if (alreadyEmailed.has(key)) return `skipped duplicate to ${to}`;  // <-- the guard
      alreadyEmailed.add(key);
      outbox.push(to);
      return `sent ${to}`;
    },
  };
  for (let steps = 0; steps < maxSteps; steps++) {
    const a = decide();
    tools[a.tool](a.args);            // loop STILL misbehaves...
  }
  return { emails: outbox.length, note: 'loop ran wild, but the recipient got exactly 1' };
}

// ---------------------------------------------------------------------------
function show(label, r) {
  const ok = r.emails === 1 ? '✅' : '💥';
  console.log(`${ok} ${label}: ${r.emails} email(s) sent — ${r.note}`);
}

console.log('Each fix must end with EXACTLY 1 email to the CEO.\n');
show('FIX 1  budget cap        ', runWithBudget('goal', 2));
show('FIX 2  terminal + guard  ', runWithTerminal('goal'));
show('FIX 3  idempotent tool   ', runWithIdempotentTool('goal'));
console.log('\nBudget note: try runWithBudget("goal", 5) — the cap holds but the CEO gets');
console.log('4 emails. A budget bounds the damage; it does not make the loop correct.');
console.log('\nReal autonomous systems use ALL THREE at once: a budget caps the spend,');
console.log('a terminal condition ends clean runs, and idempotent tools protect the');
console.log('outside world even when the first two fail.');
