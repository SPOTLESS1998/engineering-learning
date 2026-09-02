/**
 * LESSON 1 LAB — SOLUTIONS (three independent fixes for the same race)
 *
 * Run:  node solutions.js
 *
 * Try to implement these yourself in lab.js FIRST. Peek only to compare.
 * Each fix must sell EXACTLY 1 of the 1 available item.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function makeWorld() {
  return { stock: 1, version: 0, sales: [], retries: 0, lock: { held: false } };
}

// Latency helpers (the "network")
async function read(w) {
  await sleep(10);
  return w.stock;
}
async function write(w, v) {
  await sleep(10);
  w.stock = v;
}

// ---------------------------------------------------------------------------
// FIX 1 — PESSIMISTIC LOCKING: take exclusive access BEFORE check-then-act.
// Real world: SELECT ... FOR UPDATE (Postgres), SETNX (Redis), synchronized (Java).
// Trade-off: everything serializes (throughput drops); a crashed holder who
// never releases = deadlock for everyone. Always release in `finally`.
// ---------------------------------------------------------------------------
async function buyWithLock(w, buyer) {
  while (w.lock.held) await sleep(1); // spin-wait (real lock managers queue you instead)
  w.lock.held = true;
  try {
    const current = await read(w);
    if (current > 0) {
      await write(w, current - 1);
      w.sales.push(buyer);
    }
  } finally {
    w.lock.held = false;
  }
}

// ---------------------------------------------------------------------------
// FIX 2 — OPTIMISTIC CONCURRENCY: read value + version, write only if the
// version is unchanged; otherwise retry from a fresh read.
// Real world: version column + UPDATE ... WHERE version = expected, HTTP ETags,
// DynamoDB conditional writes. Trade-off: no blocking, great when conflicts are
// rare — but under heavy contention you get retry storms (hello, backoff #7).
// ---------------------------------------------------------------------------
async function readWithVersion(w) {
  await sleep(10);
  return { stock: w.stock, version: w.version };
}
async function compareAndSwap(w, expectedVersion, newValue) {
  await sleep(10);
  if (w.version === expectedVersion) {
    w.stock = newValue;
    w.version += 1;
    return true;
  }
  return false;
}
async function buyOptimistic(w, buyer) {
  for (;;) {
    const { stock, version } = await readWithVersion(w);
    if (stock <= 0) return; // sold out
    if (await compareAndSwap(w, version, stock - 1)) {
      w.sales.push(buyer);
      return;
    }
    w.retries += 1; // lost the race — someone wrote first. Try again.
  }
}

// ---------------------------------------------------------------------------
// FIX 3 — ATOMIC CONDITIONAL UPDATE: push the check INSIDE the write.
// "decrement ONLY IF stock > 0" is one indivisible step.
// Real world: UPDATE inventory SET stock = stock - 1 WHERE id = 1 AND stock > 0
// (the DB row lock makes check+act atomic), or Lua scripts in Redis.
// In this simulation there is NO await between check and act, so the JS event
// loop (a single serialization point) guarantees nothing interleaves.
// ---------------------------------------------------------------------------
async function buyAtomic(w, buyer) {
  await sleep(10); // reading can be as slow as you like...
  if (w.stock > 0) { // ...but check+act happen in one synchronous step
    w.stock -= 1;
    w.sales.push(buyer);
  }
}

// ---------------------------------------------------------------------------
async function runFix(label, buyFn, showRetries = false) {
  const w = makeWorld();
  await Promise.all(Array.from({ length: 20 }, (_, i) => buyFn(w, i + 1)));
  const extra = showRetries ? `, total retry attempts=${w.retries}` : "";
  const ok = w.sales.length === 1 ? "✅" : "💥";
  console.log(`${ok} ${label}: sold ${w.sales.length}/1, final stock=${w.stock}${extra}`);
}

(async () => {
  console.log("Each fix must sell EXACTLY 1 of the 1 available item.\n");
  await runFix("FIX 1  pessimistic lock   ", buyWithLock);
  await runFix("FIX 2  optimistic + retry ", buyOptimistic, true);
  await runFix("FIX 3  atomic conditional ", buyAtomic);
})();
