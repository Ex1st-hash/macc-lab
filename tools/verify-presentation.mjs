import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = path.join(root, "artifacts", "presentation");
await mkdir(output, { recursive: true });
let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
if (!executablePath && !existsSync(chromium.executablePath()) && process.platform === "win32") {
  const cache = path.join(process.env.LOCALAPPDATA, "ms-playwright");
  for (const version of (await readdir(cache)).filter(name => /^chromium-\d+$/.test(name)).sort().reverse()) {
    const candidate = path.join(cache, version, "chrome-win64", "chrome.exe");
    if (existsSync(candidate)) { executablePath = candidate; break; }
  }
}
const browser = await chromium.launch({ headless: true, executablePath });
const variants = ["A-V1", "A-V2", "A-V3", "B-V3", "C-V1", "C-V2", "C-V3"];
const ready = page => page.waitForFunction(() => !["pending", "revealing"].includes(document.documentElement.dataset.entrance), null, { timeout: 3000 });
const visible = page => page.locator(".hero__intro").evaluate(el => Number(getComputedStyle(el).opacity) === 1);
const trace = async page => page.addInitScript(() => {
  window.entranceTrace = [];
  new MutationObserver(records => {
    for (const record of records) if (record.attributeName === "data-entrance") {
      window.entranceTrace.push(document.documentElement.dataset.entrance);
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-entrance"] });
});
try {
  for (const variant of variants) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await trace(page);
    await page.goto(`${baseURL}/${variant}.html`, { waitUntil: "domcontentloaded" });
    await ready(page);
    assert(await visible(page));
    assert.equal(await page.locator("[data-recruitment]").count(), 1);
    assert.equal(await page.locator("[data-team-directions]").count(), 1);
    assert.deepEqual(await page.evaluate(() => [...new Set(window.entranceTrace)]), ["pending", "revealing", "ready"]);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, `${variant}-ready.png`) });
    if (variant === "C-V3") {
      const canvas = page.locator("[data-topology-canvas]");
      const hash = () => canvas.evaluate(canvas => {
        const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let lit = 0, hash = 0;
        for (let i = 3; i < pixels.length; i += 16) { if (pixels[i] > 10) lit++; hash = (Math.imul(hash, 31) + pixels[i]) | 0; }
        return { lit, hash };
      });
      const before = await hash();
      await page.waitForTimeout(160);
      assert(before.lit > 1000 && before.hash !== (await hash()).hash, "Center must remain nonblank and moving");
      const news = page.locator(".news-item__title-link").first();
      const bounds = await news.boundingBox();
      await news.hover();
      await page.waitForTimeout(300);
      assert.deepEqual(await news.boundingBox(), bounds, "News hover moved text");
      assert.equal(await news.evaluate(el => getComputedStyle(el, "::before").opacity), "1");
      assert.equal(await news.evaluate(el => getComputedStyle(el, "::after").transform), "matrix(1, 0, 0, 1, 0, 0)");
      await page.locator(".news-panel").screenshot({ path: path.join(output, "news-hover.png") });
      const paper = page.locator("#publications .stack-item").first();
      await paper.scrollIntoViewIfNeeded();
      const paperBounds = await paper.boundingBox();
      await paper.locator(".stack-item__title a").hover();
      await page.waitForTimeout(300);
      assert.deepEqual(await paper.boundingBox(), paperBounds, "Publication hover moved the card");
      await paper.screenshot({ path: path.join(output, "publication-hover.png") });
      const cite = paper.locator(".citation-trigger");
      await cite.focus();
      await page.waitForTimeout(300);
      assert.equal(await cite.evaluate(el => getComputedStyle(el, "::before").opacity), "1");
      await page.keyboard.press("Enter");
      assert(await page.locator(".citation-dialog").isVisible());
      await page.keyboard.press("Escape");
      assert(await cite.evaluate(el => el === document.activeElement));
      await page.evaluate(() => scrollTo({ top: document.querySelector("#members").offsetTop - 110, behavior: "instant" }));
      await page.waitForTimeout(150);
      const chapter = page.locator("#members .section-head");
      assert((await chapter.evaluate(el => getComputedStyle(el, "::before").maskImage)).includes("topology-mark.svg"));
      assert((await chapter.boundingBox()).y > 80, "Chapter mark is obscured by the header");
      await chapter.screenshot({ path: path.join(output, "chapter-mark.png") });
    }
    await page.close();
    console.log(`PASS ${variant}: one-time entrance, hydrated copy, unchanged animation`);
  }

  // Hold the app while the static hero and the independent center renderer arrive.
  const slow = await browser.newPage({ viewport: { width: 1318, height: 680 } });
  await trace(slow);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await slow.route("**/scripts/app.js", async route => { await gate; await route.continue(); });
  await slow.goto(baseURL, { waitUntil: "commit" });
  await slow.waitForSelector("[data-topology-canvas]", { state: "attached" });
  assert.equal(await slow.locator("html").getAttribute("data-entrance"), "pending");
  assert((await slow.locator("[data-team-name]").textContent()).length > 0);
  assert.equal(await slow.locator(".news-item").count(), 10);
  assert.equal(await visible(slow), false);
  await slow.screenshot({ path: path.join(output, "slow-pending.png") });
  release();
  await ready(slow);
  assert(await visible(slow));
  await slow.screenshot({ path: path.join(output, "slow-ready.png") });
  await slow.close();
  console.log("PASS delayed app: populated HTML, dim scene, coordinated reveal");

  const failed = await browser.newPage();
  await trace(failed);
  await failed.route("**/scripts/app.js", route => route.abort());
  await failed.goto(baseURL, { waitUntil: "domcontentloaded" });
  await ready(failed);
  assert(await visible(failed));
  assert.equal(await failed.locator(".news-item").count(), 10);
  assert.equal(await failed.locator(".site-nav__link").count(), 6);
  assert(!(await failed.evaluate(() => window.entranceTrace)).includes("revealing"));
  await failed.close();
  console.log("PASS failed app: 1.8s fail-open keeps static hero and navigation readable");

  const fonts = await browser.newPage();
  await trace(fonts);
  const css = await readFile(path.join(root, "styles", "client-refinements.css"), "utf8");
  let releaseFont;
  const fontGate = new Promise(resolve => { releaseFont = resolve; });
  await fonts.route("**/slow-title.woff2", async route => { await fontGate; await route.abort(); });
  await fonts.route("**/styles/client-refinements.css", route => route.fulfill({ contentType: "text/css", body: css + '\n@font-face { font-family: SlowTitle; src: url("/slow-title.woff2"); font-display: swap; } body .hero__title { font-family: SlowTitle, serif !important; }' }));
  await fonts.goto(baseURL, { waitUntil: "commit" });
  await fonts.waitForFunction(() => document.fonts.status === "loading" && document.querySelector("[data-publications-list] .stack-item"));
  assert.equal(await fonts.locator("html").getAttribute("data-entrance"), "pending");
  await ready(fonts);
  assert(await visible(fonts));
  releaseFont();
  await fonts.evaluate(() => document.fonts.ready);
  await fonts.waitForTimeout(100);
  assert(!(await fonts.evaluate(() => window.entranceTrace)).includes("revealing"), "Late font completion replayed the entrance");
  await fonts.close();
  console.log("PASS stalled font: bounded wait and no late replay");

  for (const input of ["keyboard", "scroll", "restore"]) {
    const page = await browser.newPage();
    await page.route("**/scripts/app.js", route => route.abort());
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    if (input === "keyboard") await page.keyboard.press("Tab");
    if (input === "scroll") await page.evaluate(() => scrollTo({ top: 100, behavior: "instant" }));
    if (input === "restore") await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    await ready(page);
    assert(await visible(page));
    await page.close();
    console.log(`PASS ${input}: entrance yields to navigation immediately`);
  }
  for (const options of [{ javaScriptEnabled: false }, { reducedMotion: "reduce" }, { viewport: { width: 390, height: 844 } }]) {
    const page = await browser.newPage(options);
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await ready(page);
    assert(await visible(page));
    assert.equal(await page.locator(".news-item").count(), 10);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (options.viewport) await page.screenshot({ path: path.join(output, "mobile.png"), fullPage: true });
    await page.close();
    console.log(`PASS accessible fallback: ${JSON.stringify(options)}`);
  }
  const deep = await browser.newPage();
  await deep.goto(`${baseURL}/#publications`, { waitUntil: "networkidle" });
  assert.equal(await deep.locator("html").getAttribute("data-entrance"), null);
  assert(await visible(deep));
  await deep.close();
  console.log("PASS direct section link: no homepage entrance");
} finally {
  await browser.close();
}
