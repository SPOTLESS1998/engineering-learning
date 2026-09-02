/**
 * LESSON 2 LAB — the runaway agent loop
 *
 * Run:  node lab.js
 *
 * Task given to the agent: "Find Acme's CEO and send them ONE hello email."
 * That needs ~2 steps and exactly 1 email.
 *
 * The agent loop below is the naive version:
 *   perceive -> think -> act -> observe, repeat
 * ...but it has NO budget and NO real stop condition, and our fake model
 * (like a confused intern) never clearly says "I'm done." So it keeps acting.
 *
 * Every loop iteration is a PAID model call.
 * Every sendEmail() is a REAL email to the same person.
 *
 * BEFORE RUNNING: predict how many emails the CEO receives. Then run it.
 */

// ---------- A fake "LLM": given the story so far, it returns the next action ----------
// It's deliberately dumb. It found the CEO ages ago but still never says stop —
// this models the real failure where the model doesn't emit a clean terminal signal.
let brain = 0;
function fakeModelDecideNextAction(history) {
  brain++;
  if (brain === 1) return { tool: 'searchWeb', args: { q: 'Acme CEO email' } };
  // From here on it just keeps re-sending, never returning {tool:'done'}.
  return { tool: 'sendEmail', args: { to: 'ceo@acme.com', body: 'Hello!' } };
}

// ---------- The tools (what the agent's code can actually run) ----------
let modelCalls = 0;   // each costs money
const outbox = [];    // every real email we sent

const tools = {
  searchWeb({ q }) {
    return `top result: ceo@acme.com`;
  },
  sendEmail({ to, body }) {
    outbox.push({ to, body });          // THE REAL-WORLD ACTION — no memory, always sends
    return `sent to ${to}`;
  },
};

// ---------- The agent loop: perceive -> think -> act -> observe ----------
function runAgent(goal) {
  const history = [`GOAL: ${goal}`];
  // ⚠️ no budget, no terminal check — "while true" is the bug
  while (true) {
    modelCalls++;
    const action = fakeModelDecideNextAction(history);   // THINK
    const result = tools[action.tool](action.args);      // ACT
    history.push(`did ${action.tool} -> ${result}`);     // OBSERVE

    // A safety valve ONLY so this demo can exit and show you the damage.
    // (A real runaway has no such valve — it runs until the bill or the rate limit stops it.)
    if (modelCalls >= 30) {
      console.log('...cut off by the demo safety valve at 30 steps.\n');
      break;
    }
  }
}

console.log('Task: send ONE hello to the CEO. Watch what actually happens.\n');
runAgent('Find Acme CEO and send one hello email');

console.log(`RESULT: ${modelCalls} paid model calls, ${outbox.length} emails sent to ceo@acme.com`);
if (outbox.length > 1) {
  console.log(`💥 RUNAWAY: the CEO got ${outbox.length} identical emails, and you paid for ${modelCalls} model calls.`);
  console.log(`   The task needed 1 email and ~2 calls. Nothing told the loop to STOP.`);
} else {
  console.log(`✅ Exactly one email — lucky, or already fixed?`);
}
