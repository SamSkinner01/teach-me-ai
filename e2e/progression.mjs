// End-to-end smoke test: a brand-new learner goes through the course in order.
//
//   E2E_BASE_URL   app URL (default http://localhost:5173, the Vite dev server)
//   CHROME_PATH    Chrome/Chromium binary (default /usr/bin/google-chrome)
//
// Run against a server with lesson locking ON (the default, no TMAI_UNLOCK_ALL).
// It signs up, completes the first two lessons (passing the warm-up exercise
// through the real editor and sandbox), then opens every lesson and fails on
// any page error or a lesson that renders nothing.

import { chromium } from "playwright-core";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const errors = [];
let failed = false;

function check(ok, what) {
  console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failed = true;
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));

  await page.goto(`${BASE}/register`);
  await page.fill("#username", `e2e${Date.now().toString(36)}`);
  await page.fill("#password", "correct horse battery");
  await page.click("button[type=submit]");
  await page.waitForURL("**/start");
  await page.click(".lang-card >> nth=0");
  await page.click("text=Start the Python track");
  await page.waitForURL("**/learn");
  check(true, "sign up and choose a language");

  await page.click("text=Start the course");
  await page.waitForSelector(".prose h2");
  await page.click("text=Complete lesson");
  await page.waitForURL("**/how-it-works");
  check(true, "complete lesson 1 and move to lesson 2");

  const editor = "#exercise-warmup-vec-sum .monaco-editor";
  await page.waitForSelector(editor, { timeout: 60_000 });
  check((await page.$$(".error-box")).length === 0, "lesson 2 renders its exercise editor");
  // Load the solution as a saved draft (the editor's auto-indent makes simulated
  // typing unreliable), then reload and submit through the real UI.
  const solution = "def vec_sum(v):\n    total = 0.0\n    for x in v:\n        total += x\n    return total\n";
  await page.evaluate(async (code) => {
    await fetch("/api/exercises/warmup-vec-sum/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  }, solution);
  await page.reload();
  await page.waitForSelector(editor, { timeout: 60_000 });
  await page.click("#exercise-warmup-vec-sum >> text=Submit");
  await page.waitForSelector("#exercise-warmup-vec-sum .badge-success", { timeout: 60_000 });
  check(true, "pass the warm-up exercise in the sandbox");

  await page.click("text=Complete lesson");
  await page.waitForURL("**/vectors");
  await page.waitForSelector("#exercise-la-vec-add .monaco-editor", { timeout: 60_000 });
  check((await page.$$(".viz")).length > 0, "lesson 3 renders figures and exercises");

  await page.goto(`${BASE}/learn`);
  await page.waitForSelector(".modules");
  const hrefs = await page.$$eval("a.lesson-row", (a) => a.map((el) => el.getAttribute("href")));
  const lessonCount = await page.$$eval(".lesson-row", (rows) => rows.length);
  for (const href of hrefs) {
    await page.goto(`${BASE}${href}`);
    await page.waitForSelector(".prose > *:not(.center-screen), .locked-lesson", { timeout: 30_000 });
    const boxes = await page.$$(".error-box");
    check(boxes.length === 0, `${href} renders`);
  }
  // Locked lessons must show the locked card, not a blank page.
  const lockedId = await page.evaluate(async () => {
    const p = await (await fetch("/api/progress")).json();
    return Object.entries(p.lessons).find(([, s]) => !s.unlocked)?.[0];
  });
  if (lockedId) {
    await page.goto(`${BASE}/learn/${lockedId}`);
    await page.waitForSelector(".locked-lesson", { timeout: 15_000 });
    check(true, `locked lesson /learn/${lockedId} explains why it's locked`);
  }
  console.log(`(${hrefs.length} of ${lessonCount} lessons open for this learner)`);
} catch (e) {
  console.log(`FAIL ${e.message}`);
  failed = true;
} finally {
  await browser.close();
}

for (const e of errors) console.log(`page error: ${e}`);
if (errors.length || failed) {
  console.log("e2e: FAILED");
  process.exit(1);
}
console.log("e2e: passed");
