import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = path.join(root, "artifacts", "footer");
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
const report = [];
const sample = page => page.evaluate(() => {
  const canvas = document.querySelector("[data-footer-canvas]");
  const copy = document.createElement("canvas");
  copy.width = canvas.width; copy.height = canvas.height;
  const ctx = copy.getContext("2d");
  ctx.drawImage(canvas, 0, 0);
  const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
  let lit = 0, hash = 0, border = 0, dark = 0;
  for (let y = 0; y < copy.height; y++) {
    for (let x = 0; x < copy.width; x++) {
      const index = (y * copy.width + x) * 4;
      const alpha = pixels[index + 3];
      if (alpha > 5) lit++;
      if ((x < 4 || x >= copy.width - 4 || y < 4 || y >= copy.height - 4) && alpha > 2) border++;
      if (alpha > 100 && pixels[index] < 20 && pixels[index + 1] < 20 && pixels[index + 2] < 20) dark++;
      hash = (Math.imul(hash, 31) + alpha) | 0;
    }
  }
  const element = document.querySelector("[data-footer-observer]");
  const rect = element.getBoundingClientRect();
  return {
    ...window.__maccFooterField.getState(), lit, hash, border, dark,
    width: rect.width, left: rect.left, viewport: document.documentElement.clientWidth,
    background: getComputedStyle(element).backgroundColor,
    overlay: getComputedStyle(element, "::before").display,
    buffer: [canvas.width, canvas.height]
  };
});
const reveal = async page => {
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForFunction(() => ["webgl", "fallback"].includes(window.__maccFooterField?.getState().renderer));
  await page.waitForTimeout(600);
};
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1318, height: 680 }, { width: 1920, height: 1080 }, { width: 820, height: 900 }, { width: 390, height: 844 }, { width: 430, height: 932, dpr: 3 }, { width: 1280, height: 800, dpr: 2 }]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.dpr ?? 1, isMobile: viewport.width <= 760, hasTouch: viewport.width <= 760 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error" && /shader|WebGLProgram/.test(message.text())) errors.push(message.text()); });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await reveal(page);
    const before = await sample(page);
    assert.equal(before.renderer, "webgl");
    assert.equal(before.buffer[0], Math.floor(before.width * Math.min(viewport.dpr ?? 1, 1.5)));
    assert(before.lit > 1000, "Blank field");
    assert.equal(before.border, 0, "Edges must be transparent, not darkened");
    assert.equal(before.dark, 0, "Opaque black pixels remain");
    assert.equal(before.background, "rgba(0, 0, 0, 0)");
    assert.equal(before.overlay, "none");
    assert(before.depthRange[1] - before.depthRange[0] > 180, "Insufficient 3D depth");
    await page.waitForTimeout(650);
    const after = await sample(page);
    assert.notEqual(before.hash, after.hash, "Topology is not moving");
    assert(after.animating && after.time > before.time, "Animation clock did not advance");
    await page.screenshot({ path: path.join(output, `footer-${viewport.width}.png`) });
    await page.locator("[data-footer-observer]").screenshot({ path: path.join(output, `field-${viewport.width}.png`) });
    if (viewport.width > 760) {
      const box = await page.locator("[data-footer-observer]").boundingBox();
      await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.5);
      await page.waitForTimeout(600);
      assert((await sample(page)).cameraX > 1, "Pointer parallax is missing");
      await page.mouse.move(0, 0);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(300);
    const stopped = await sample(page);
    await page.waitForTimeout(500);
    assert.equal((await sample(page)).hash, stopped.hash);
    assert.equal(stopped.animating, false);
    for (const time of [0, 600, 3600, 14400]) {
      await page.evaluate(time => window.__maccFooterField.renderAt(time), time);
      const frame = await sample(page);
      assert.equal(frame.visibleNodes, before.visibleNodes);
      assert.equal(frame.drawnEdges, before.drawnEdges);
      assert(frame.lit > 1000 && frame.depthRange[1] < 200 && frame.depthRange[0] > -210, "Long-running topology lost its bounds");
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(200);
    const resumed = await sample(page);
    await page.waitForTimeout(450);
    assert(resumed.animating && (await sample(page)).time > resumed.time, "Animation did not resume after reduced motion");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForFunction(() => !window.__maccFooterField.getState().animating);
    const offscreen = await sample(page);
    await page.waitForTimeout(300);
    assert.equal((await sample(page)).time, offscreen.time, "Offscreen animation kept running");
    await reveal(page);
    const returned = await sample(page);
    await page.waitForTimeout(400);
    assert(returned.animating && (await sample(page)).time > returned.time, "Animation did not resume on return");
    assert.deepEqual(errors, []);
    report.push({ viewport, before, after });
    console.log(`PASS ${viewport.width}: transparent edges, 3D depth, motion, parallax, reduced motion, 4-hour bounds`);
    await page.close();
  }

  const page = await browser.newPage();
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await reveal(page);
  for (const width of [1920, 390, 760, 1440, 820, 1318, 390, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await reveal(page);
    const current = await sample(page);
    assert(Math.abs(current.width - current.viewport) < 1 && Math.abs(current.left) < 1);
    assert(current.lit > 1000);
    await page.waitForTimeout(300);
    const next = await sample(page);
    assert(next.animating && next.time > current.time, "Resize stopped animation");
    assert.notEqual(next.hash, current.hash, "Resize left a static topology");
  }
  await page.close();
  console.log("PASS continuous narrow/wide viewport restoration");

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type.startsWith("webgl")) return null;
      return getContext.call(this, type, ...args);
    };
  });
  await fallback.goto(baseURL, { waitUntil: "networkidle" });
  await reveal(fallback);
  const still = await sample(fallback);
  assert.equal(still.renderer, "fallback");
  assert(still.lit > 1000);
  await fallback.screenshot({ path: path.join(output, "fallback.png") });
  await fallback.close();
  console.log("PASS no-WebGL static fallback");

  const runtimePath = "**/assets/vendor/three/footer-runtime.min.js";
  const slow = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  let releaseRuntime;
  const download = new Promise(resolve => { releaseRuntime = resolve; });
  const requests = [];
  slow.on("request", request => { if (request.url().includes("/vendor/three/")) requests.push(request.url()); });
  await slow.route(runtimePath, async route => { await download; await route.continue(); });
  await slow.goto(baseURL, { waitUntil: "domcontentloaded" });
  await slow.waitForFunction(() => window.__maccFooterField?.getState().loading);
  const warm = await sample(slow);
  assert.equal(warm.loadReason, "idle", "Runtime was not prepared in the background");
  assert.equal(warm.visibilityRatio, 0);
  assert.equal(warm.animating, false);
  assert.equal(await slow.locator("html").getAttribute("data-entrance"), "ready", "Footer download competed with the entrance");
  await slow.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await slow.waitForTimeout(150);
  const preview = await sample(slow);
  assert.equal(preview.renderer, "pending");
  assert(preview.lit > 1000 && preview.border === 0 && preview.dark === 0, "Cold-load preview is blank or has dark edges");
  await slow.locator("[data-footer-observer]").screenshot({ path: path.join(output, "loading-preview.png") });
  await slow.waitForTimeout(1800);
  assert((await sample(slow)).lit > 1000, "A stalled download removed the preview");
  releaseRuntime();
  await slow.waitForFunction(() => window.__maccFooterField.getState().renderer === "webgl");
  await slow.waitForTimeout(350);
  assert.equal(await slow.locator("[data-footer-canvas]").count(), 1);
  assert.equal(await slow.locator("[data-footer-preview]").count(), 0);
  assert((await sample(slow)).lit > 1000);
  assert.equal(requests.length, 1, "Footer should load one self-contained runtime");
  await slow.locator("[data-footer-observer]").screenshot({ path: path.join(output, "loading-ready.png") });
  await slow.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await slow.waitForTimeout(100);
  assert.equal((await sample(slow)).animating, false, "Offscreen footer kept running");
  await slow.close();
  console.log("PASS cold load: idle preload after entrance, immediate transparent preview, one runtime request, seamless handoff");

  for (const connection of [{ saveData: true, effectiveType: "4g" }, { saveData: false, effectiveType: "2g" }]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.addInitScript(connection => Object.defineProperty(navigator, "connection", { value: connection, configurable: true }), connection);
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1100);
    assert.equal((await sample(page)).loadReason, null, "Save-data/slow network downloaded the runtime eagerly");
    await page.evaluate(() => {
      const top = document.querySelector("[data-footer-observer]").getBoundingClientRect().top + scrollY;
      scrollTo({ top: top - innerHeight - 1200, behavior: "instant" });
    });
    await page.waitForFunction(() => window.__maccFooterField.getState().renderer === "webgl");
    assert.equal((await sample(page)).loadReason, "nearby");
    assert.equal((await sample(page)).visibilityRatio, 0, "Near-viewport warmup happened too late");
    await page.close();
  }
  console.log("PASS save-data and 2G: deferred runtime, prepared 1200px before the footer enters view");

  const failed = await browser.newPage();
  await failed.route(runtimePath, route => route.abort());
  await failed.goto(baseURL, { waitUntil: "domcontentloaded" });
  await reveal(failed);
  const failedState = await sample(failed);
  assert.equal(failedState.renderer, "fallback");
  assert(failedState.lit > 1000 && failedState.dark === 0 && failedState.border === 0);
  await failed.setViewportSize({ width: 390, height: 844 });
  await reveal(failed);
  assert((await sample(failed)).lit > 1000);
  await failed.close();
  const vendor = path.join(root, "assets", "vendor", "three");
  const originalBytes = (await readFile(path.join(vendor, "three.module.js"))).length + (await readFile(path.join(vendor, "three.core.js"))).length;
  const runtimeBytes = (await readFile(path.join(vendor, "footer-runtime.min.js"))).length;
  assert(runtimeBytes < originalBytes * 0.3, "Footer runtime payload regressed");
  console.log(`PASS failed download: responsive static fallback; runtime ${originalBytes} -> ${runtimeBytes} bytes`);
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
