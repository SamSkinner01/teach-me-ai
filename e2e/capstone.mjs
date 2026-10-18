// End-to-end test of the capstone: a real training run from the browser.
//
//   E2E_UNLOCKED_URL  app URL of a server started with TMAI_UNLOCK_ALL=1
//                     (default http://localhost:8001), so the capstone is open
//   E2E_LANGUAGE      python | rust | cpp (default rust)
//   CHROME_PATH       Chrome/Chromium binary (default /usr/bin/google-chrome)
//
// It runs the starter (which must stop at its TODO), then the reference solution
// with the default settings (a shorter run for Python), and checks the live
// dashboard, the result, the confusion matrix and gallery, and that the learner's
// own model reads a digit drawn on the canvas. Needs MNIST on the server.

import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.E2E_UNLOCKED_URL ?? "http://localhost:8001";
const LANG = process.env.E2E_LANGUAGE ?? "rust";
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const EXT = { python: "py", rust: "rs", cpp: "cpp" }[LANG];
const solution = readFileSync(new URL(`../content/exercises/cap-train/solution.${EXT}`, import.meta.url), "utf8");
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
  await page.fill("#username", `cap${Date.now().toString(36)}`);
  await page.fill("#password", "correct horse battery");
  await page.click("button[type=submit]");
  await page.waitForURL("**/start");
  await page.click(`.lang-card >> nth=${{ python: 0, rust: 1, cpp: 2 }[LANG]}`);
  await page.click("text=/Start the .* track/");
  await page.waitForURL("**/learn");

  await page.goto(`${BASE}/learn/training-cnn`);
  await page.waitForSelector(".training-lab .code-editor", { timeout: 30000 });
  check(true, "training lab loads");

  await page.click("button:has-text('Start training')");
  await page.waitForSelector(".training-lab .results-banner", { timeout: 120000 });
  check((await page.textContent(".training-lab .results-banner")).includes("Not implemented"), "the starter stops at its TODO");

  // The reference solution goes in through the drafts API (typing it into Monaco
  // would be mangled by auto-indent).
  const status = await page.evaluate(async (code) => {
    const r = await fetch("/api/exercises/cap-train/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return r.status;
  }, solution);
  check(status === 200, "save the reference solution as the draft");
  await page.reload();
  await page.waitForSelector(".training-lab .code-editor", { timeout: 30000 });
  if (LANG === "python") await page.selectOption(".train-params select >> nth=0", "1000");
  await page.click("button:has-text('Start training')");
  await page.waitForFunction(() => document.querySelector(".train-status")?.textContent?.includes("Epoch"), null, {
    timeout: 120000,
  });
  check((await page.$$(".train-chart path.train-smooth")).length === 2, "live loss and accuracy curves");

  await page.waitForSelector(".training-lab .results-banner.pass, .training-lab .results-banner.fail", {
    timeout: 1200000,
  });
  const result = await page.textContent(".training-lab .results-banner");
  console.log(`     ${result.trim().slice(0, 120)}`);
  check(result.includes("Test accuracy"), "the run finishes with a test accuracy");
  if (LANG !== "python") check(result.includes("Passed"), "the default run passes");

  await page.goto(`${BASE}/learn/evaluation`);
  await page.waitForSelector(".cm-thumb canvas", { timeout: 30000 });
  check((await page.$$(".cm-cell")).length === 100, "a 10 × 10 confusion matrix");
  check((await page.$$(".cm-thumb")).length > 0, "a gallery of misclassified test images");

  await page.goto(`${BASE}/learn/your-model`);
  await page.waitForSelector(".dd-guess", { timeout: 30000 });
  const box = await (await page.$(".dd-canvas")).boundingBox();
  const at = (x, y) => [box.x + x * box.width, box.y + y * box.height];
  await page.mouse.move(...at(0.3, 0.2));
  await page.mouse.down();
  await page.mouse.move(...at(0.7, 0.2), { steps: 8 });
  await page.mouse.move(...at(0.45, 0.85), { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  check((await page.textContent(".dd-digit")).trim() === "7", "your model reads a drawn 7");

  check(errors.length === 0, `no page errors${errors.length ? ":\n  " + errors.join("\n  ") : ""}`);
} catch (e) {
  check(false, `unexpected failure: ${e.message}`);
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
