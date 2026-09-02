/**
 * LESSON 1 LAB — the overselling race
 *
 * Run:  node lab.js
 *
 * Scenario: an online store has exactly 1 item left in stock.
 * 20 buyers hit "Buy" at the same time.
 *
 * The implementation below uses CHECK-THEN-ACT:
 *   1. READ the current stock
 *   2. CHECK if stock > 0
 *   3. ACT: write stock - 1
 *
 * Between step 1 and step 3 there is latency (the "network"),
 * and during that time OTHER buyers do their own read...
 *
 * BEFORE RUNNING: predict how many of the 20 buyers will succeed.
 * Then run it and compare.
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- Simulated "database": a shared variable + latency on every access ----------
let stock = 1;
const sales = [];

async function readStockFromDB() {
  await sleep(10); // network + DB latency
  return stock;
}

async function writeStockToDB(value) {
  await sleep(10); // network + DB latency
  stock = value;
}

// ---------- The bug: check-then-act across an await boundary ----------
async function buyNaive(buyer) {
  const current = await readStockFromDB(); // 1. READ
  if (current > 0) {                       // 2. CHECK
    await sleep(5);                        //    (thinking time — widens the race window)
    await writeStockToDB(current - 1);     // 3. ACT — every buyer writes (theirRead - 1)
    sales.push(buyer);
  }
}

async function main() {
  console.log(`Stock starts at ${stock}. 20 buyers attack.\n`);
  await Promise.all(Array.from({ length: 20 }, (_, i) => buyNaive(i + 1)));
  console.log(`\nRESULT: ${sales.length} buyers were told "sold!", stock variable = ${stock}`);
  if (sales.length > 1) {
    console.log(`💥 OVERSOLD by ${sales.length - 1}.`);
    console.log(`   Notice: stock is 0, but 20 sale records exist.`);
    console.log(`   19 decrement writes were silently LOST (last-write-wins).`);
  } else {
    console.log(`✅ Correct — lucky, or already fixed?`);
  }
}

main();
