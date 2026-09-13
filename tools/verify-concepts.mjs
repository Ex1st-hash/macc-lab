import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = process.argv[2];
assert(sourceRoot, "Pass the original feedback-package directory for visual comparison.");
const baseURL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = path.join(root, "artifacts", "concepts");
await mkdir(output, { recursive: true });
let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
if (!executablePath && !existsSync(chromium.executablePath()) && process.platform === "win32") {
  const cache = path.join(process.env.LOCALAPPDATA, "ms-playwright");
  const versions = (await readdir(cache)).filter(name => /^chromium-\d+$/.test(name)).sort().reverse();
  for (const version of versions) {
    const candidate = path.join(cache, version, "chrome-win64", "chrome.exe");
    if (existsSync(candidate)) { executablePath = candidate; break; }
  }
}
const browser = await chromium.launch({ headless: true, executablePath });
const selectedVariant = process.argv.find(argument => argument.startsWith("--variant="))?.split("=")[1];
const variants = ["A-V1", "A-V2", "A-V3", "B-V3", "C-V1", "C-V2", "C-V3"]
  .filter(variant => !selectedVariant || variant === selectedVariant);
assert(variants.length, `Unknown concept variant: ${selectedVariant}`);
const viewports = [{ width: 1318, height: 680 }, { width: 1440, height: 800 }, { width: 1440, height: 1000 }, { width: 1920, height: 1080 }, { width: 820, height: 1180 }, { width: 390, height: 844 }]
  .filter(viewport => !process.argv.includes("--mobile") || viewport.width < 701);
const report = [];

const settleCanvas = async page => {
  // Background tabs can defer ResizeObserver after the reference receives layout CSS.
  await page.bringToFront();
  await page.waitForFunction(() => {
    const canvas = document.querySelector("[data-topology-canvas]");
    const rect = canvas.getBoundingClientRect();
    return canvas.width === Math.round(rect.width) && canvas.height === Math.round(rect.height);
  });
};

const inspect = (page, trimClippedEdge = false) => page.evaluate(trimClippedEdge => {
  const canvas = document.querySelector("[data-topology-canvas]");
  const paintRect = canvas.getBoundingClientRect();
  const rect = (document.body.dataset.centerConcept === "C-V3" ? canvas.parentElement : canvas).getBoundingClientRect();
  const width = Math.min(canvas.width, Math.round(rect.width * Math.min(devicePixelRatio || 1, 1.75)));
  // Extending a clipped arc changes rasterization at the old edge. Its new pixels are checked separately.
  const comparisonWidth = trimClippedEdge ? Math.floor(width * 0.98) : width;
  const data = canvas.getContext("2d").getImageData(0, 0, comparisonWidth, canvas.height).data;
  let nonblank = 0, fingerprint = 2166136261;
  for (let i = 0; i < data.length; i++) {
    fingerprint = Math.imul(fingerprint ^ data[i], 16777619) >>> 0;
    if (i % 4 === 3 && data[i] > 10) nonblank++;
  }
  const api = window.__coherentTides ?? window.__maccConcept;
  return {
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    viewport: { width: document.documentElement.clientWidth, height: innerHeight, headerBottom: document.querySelector("header").getBoundingClientRect().bottom },
    pixels: [width, canvas.height],
    paint: { width: paintRect.width, height: paintRect.height },
    nonblank, fingerprint, state: api.state,
    sample: api.sample(4),
    overflow: document.documentElement.scrollWidth > innerWidth,
    opacity: Number(getComputedStyle(document.querySelector(".page-visual") ?? canvas).opacity),
    scroll: scrollY
  };
}, trimClippedEdge);

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
    // Use one raster backend for both pages despite repeated pixel readbacks.
    await context.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, options) {
        return getContext.call(this, type, type === "2d" ? { ...options, willReadFrequently: true } : options);
      };
    });
    const actual = await context.newPage();
    const reference = await context.newPage();
    // Existing roster photos are external. Keep visual checks deterministic and offline.
    await context.route(/^https?:\/\/(?!127\.0\.0\.1(?::|\/))/, route => route.abort());
    for (const variant of variants) {
      const errors = [];
      const errorHandler = error => errors.push(error.message);
      actual.on("pageerror", errorHandler);
      await reference.goto(pathToFileURL(path.join(sourceRoot, variant, `${variant}.html`)).href);
      // Concept titles are intentionally omitted from the live homepage.
      await reference.locator(".tides-study__heading").evaluate(element => element.remove());
      await actual.goto(`${baseURL}/${variant}.html`, { waitUntil: "networkidle" });
      await actual.evaluate(() => document.fonts.ready);
      // Keep client-approved copy and typography equal when checking the original scene placement.
      const intro = await actual.locator(".hero__intro").innerHTML();
      await reference.evaluate(({ intro, variant }) => {
        document.body.dataset.centerConcept = variant;
        document.querySelector(".hero__intro").innerHTML = intro;
        document.querySelector(".news-panel__footer")?.remove();
      }, { intro, variant });
      await reference.addStyleTag({ path: path.join(root, "styles", "client-refinements.css") });
      await reference.evaluate(() => document.fonts.ready);
      await settleCanvas(reference);
      await settleCanvas(actual);
      const orbitBleed = variant === "C-V3" && viewport.width >= 1000;
      const live = await inspect(actual, orbitBleed);
      const centered = viewport.width > 1100 && /^(A-V[123]|B-V3)$/.test(variant);
      if (centered) {
        // Compare the original renderer at the intentionally resized display size.
        await reference.locator(".topology-visual__frame").evaluate((frame, rect) => {
          frame.style.width = `${rect.width}px`;
          frame.style.height = `${rect.height}px`;
        }, live.rect);
        await settleCanvas(reference);
        await reference.waitForFunction(([width, height]) => {
          const canvas = document.querySelector("[data-topology-canvas]");
          return canvas.width === width && canvas.height === height;
        }, live.pixels);
      }
      const ref = await inspect(reference, orbitBleed);
      const entry = { variant, viewport, reference: ref.rect, actual: live.rect, issues: [] };
      if (ref.fingerprint !== live.fingerprint) entry.pixelState = { reference: ref.state, actual: live.state };
      const check = (condition, message) => { if (!condition) entry.issues.push(message); };
      check(errors.length === 0, `Browser errors: ${errors.join("; ")}`);
      check(await actual.locator(".tides-study__heading").count() === 0, "Removed concept heading has returned");
      check(live.nonblank > 200, `Canvas is blank: ${live.nonblank} painted pixels`);
      check(!live.overflow, "Horizontal page overflow");
      if (live.overflow) entry.overflow = await actual.evaluate(() => ({
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll("body *")].filter(element => element.getBoundingClientRect().right > innerWidth)
          .map(element => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right }))
      }));
      check(live.state.paused, "Reduced motion not respected");
      check(JSON.stringify(ref.pixels) === JSON.stringify(live.pixels), "Canvas dimensions differ from source");
      check(ref.fingerprint === live.fingerprint, "Canvas pixels differ from source at time zero");
      check(JSON.stringify(ref.sample) === JSON.stringify(live.sample), "Animation geometry differs from source at t=4");
      for (const key of centered ? ["width", "height"] : ["x", "y", "width", "height"]) {
        let expected = ref.rect[key];
        if (variant === "C-V3" && viewport.width >= 1000) {
          if (key === "x") expected -= 24;
          if (key === "y") expected = Math.min(ref.rect.y - 64, viewport.height - ref.rect.height * 0.935 - 28);
        }
        check(Math.abs(expected - live.rect[key]) < 1, `Composition ${key} differs by ${(live.rect[key] - expected).toFixed(2)}px`);
      }
      if (variant === "C-V3" && viewport.width >= 1000) {
        const globe = await actual.evaluate(() => window.__maccConcept.dimensions());
        const globeBottom = live.rect.y + globe.cy + globe.r + 3.5;
        check(globeBottom <= viewport.height - 24, "Globe's bottom rim is clipped or too close to the viewport edge");
        entry.globeBottom = globeBottom;
        const rings = await actual.evaluate(() => {
          const canvas = document.querySelector("[data-topology-canvas]");
          const ctx = canvas.getContext("2d");
          const d = window.__maccConcept.dimensions();
          const rect = canvas.getBoundingClientRect();
          const dpr = Math.min(devicePixelRatio || 1, 1.75);
          const alphaAt = (x, y) => {
            const pixels = ctx.getImageData(Math.round(x * dpr) - 1, Math.round(y * dpr) - 1, 3, 3).data;
            return Math.max(...pixels.filter((_, index) => index % 4 === 3));
          };
          const samples = [1.39, 1.54].flatMap(scale => [-0.35, 0, 0.35].map(angle => {
            const x = d.cx + d.r * scale * Math.cos(angle);
            const y = d.cy + d.r * scale * Math.sin(angle);
            return { x, y, alpha: alphaAt(x, y), background: alphaAt(x + 5, y) };
          }));
          const layers = [canvas.parentElement, canvas.closest(".topology-visual__frame")].map(element => {
            const style = getComputedStyle(element);
            return { overflow: style.overflow, contain: style.contain };
          });
          return { samples, layers, right: rect.x + d.cx + d.r * 1.54 * 1.004 };
        });
        check(live.paint.width >= globe.cx + globe.r * 1.54 * 1.004 + 1, "Paint surface clips the outer orbit");
        check(rings.layers.every(layer => layer.overflow === "visible" && layer.contain === "none"), "A container clips the orbit bleed");
        check(rings.samples.every(point => point.alpha > point.background + 3), "Right-hand orbit pixels are missing");
        check(rings.right < live.viewport.width, "Right-hand orbit extends outside the viewport");
        entry.rings = rings;
      }
      if (centered) {
        const focus = variant === "B-V3" ? 0.52 : 0.53;
        const centerX = live.rect.x + live.rect.width / 2;
        const centerY = live.rect.y + live.rect.height * focus;
        check(Math.abs(centerX - live.viewport.width / 2) < 1, "Scene is not horizontally centered in the viewport");
        check(Math.abs(centerY - (live.viewport.headerBottom + live.viewport.height) / 2) < 1, "Scene is not vertically centered below navigation");
        check(live.rect.y - live.rect.height * 0.15 >= live.viewport.headerBottom, "Halo extends under navigation");
        check(live.rect.y + live.rect.height * 1.15 <= live.viewport.height, "Halo extends below viewport");
        entry.center = { x: centerX, y: centerY };
      }
      const prefix = `${variant}-${viewport.width}x${viewport.height}`;
      await reference.screenshot({ path: path.join(output, `${prefix}-reference.png`) });
      await actual.bringToFront();
      await actual.screenshot({ path: path.join(output, `${prefix}-page.png`) });
      if (viewport.width < 701) {
        await actual.locator("[data-topology-canvas]").scrollIntoViewIfNeeded();
        await actual.screenshot({ path: path.join(output, `${prefix}-scene.png`) });
      }

      if (viewport.width > 700) {
        await actual.evaluate(() => scrollTo({ top: 1100, behavior: "instant" }));
        await actual.waitForTimeout(100);
        const scrolled = await inspect(actual);
        check(Math.abs(scrolled.rect.y - live.rect.y) < 0.1, "Scene moves during body scrolling");
        check(scrolled.opacity === 1, "Scene fades before footer");
        const positions = await actual.evaluate(() => {
          const max = document.documentElement.scrollHeight - innerHeight;
          const fieldHeight = document.querySelector("[data-footer-observer]").getBoundingClientRect().height;
          const range = Math.max(innerHeight * 0.7, fieldHeight * 1.5, 360);
          return { start: max - range, half: max - range / 2, end: max };
        });
        const opacities = [];
        for (const top of Object.values(positions)) {
          await actual.evaluate(y => scrollTo({ top: y, behavior: "instant" }), top);
          await actual.waitForTimeout(80);
          opacities.push((await inspect(actual)).opacity);
        }
        check(opacities[0] > 0.99 && Math.abs(opacities[1] - 0.5) < 0.01 && opacities[2] === 0,
          `Footer fade incorrect: ${opacities.join(", ")}`);
        entry.footerOpacity = opacities;
        if (viewport.width === 1440) await actual.screenshot({ path: path.join(output, `${variant}-footer.png`) });
      }
      await actual.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await actual.waitForTimeout(80);
      check((await inspect(actual)).opacity === 1, "Scene does not restore after scrolling back");
      await actual.emulateMedia({ reducedMotion: "no-preference" });
      await actual.locator("[data-topology-canvas]").scrollIntoViewIfNeeded();
      const before = await inspect(actual);
      await actual.waitForTimeout(300);
      const after = await inspect(actual);
      check(after.state.frames > before.state.frames && after.fingerprint !== before.fingerprint, "Animation is not advancing");
      await actual.locator("[data-motion-toggle]").click();
      const paused = await inspect(actual);
      await actual.waitForTimeout(150);
      check((await inspect(actual)).state.time === paused.state.time, "Pause control fails to stop animation");
      await actual.locator("[data-motion-toggle]").click();
      await actual.waitForTimeout(100);
      check((await inspect(actual)).state.time > paused.state.time, "Resume control fails to restart animation");
      await actual.locator("[data-news-list]").evaluate(list => { list.scrollTop = list.scrollHeight; });
      check(await actual.locator("[data-news-list]").evaluate(list => list.scrollTop > 0), "Live news scrolling failed");
      check(await actual.locator("[data-section]").count() === 6, "Full homepage sections missing");
      await actual.emulateMedia({ reducedMotion: "reduce" });
      actual.off("pageerror", errorHandler);
      report.push(entry);
      console.log(`${entry.issues.length ? "FAIL" : "PASS"} ${variant} ${viewport.width}: ${entry.issues.join(" | ") || "reference pixels, geometry, animation, layout, interactions"}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
}
assert(report.length === variants.length * viewports.length, "Verification did not finish");
assert(report.every(entry => !entry.issues.length), "See artifacts/concepts/report.json for visual differences");
