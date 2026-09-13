import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = path.join(root, "artifacts", "monogram");
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
const near = (actual, expected, label) => assert(Math.abs(actual - expected) < 1, `${label}: ${actual} != ${expected}`);
const snapshot = page => page.evaluate(() => {
  const measure = selector => {
    const element = document.querySelector(selector);
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      centerX: rect.x + rect.width / 2, centerY: rect.y + rect.height / 2,
      display: style.display, visibility: style.visibility, opacity: Number(style.opacity)
    };
  };
  const hero = document.querySelector("#home");
  return {
    origin: measure("[data-monogram-origin]"), floating: measure("[data-floating-monogram]"),
    dock: measure("[data-monogram-dock]"), label: measure("[data-site-mark-label]"),
    scene: measure(".page-visual__frame"),
    range: Math.max(220, hero.offsetHeight * 0.42), start: hero.offsetTop,
    docked: document.querySelector("[data-site-header]").classList.contains("is-monogram-docked")
  };
});
const scrollTo = async (page, top) => {
  await page.evaluate(async top => {
    window.scrollTo({ top, behavior: "instant" });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, top);
  await page.waitForTimeout(250);
  return snapshot(page);
};

try {
  const cases = [
    ...["index", "A-V1", "A-V2", "A-V3", "B-V3", "C-V1", "C-V2", "C-V3"].map(name => ({ name, width: 1440, height: 1000 })),
    ...[{ width: 1318, height: 680 }, { width: 820, height: 900 }, { width: 760, height: 900 }, { width: 730, height: 900 }, { width: 390, height: 844 }].map(viewport => ({ name: "C-V3", ...viewport }))
  ];
  for (const { name, width, height } of cases) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1(?::|\/))/, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${baseURL}/${name}.html`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const initial = await scrollTo(page, 0);
    if (width > 760) {
      assert.equal(initial.floating.display, "grid", "Moving logo was hidden by concept CSS");
      assert.equal(initial.floating.opacity, 1);
      assert.equal(initial.origin.visibility, "hidden", "Static origin must not duplicate the moving logo");
      near(initial.floating.centerX, initial.origin.centerX, "Initial X");
      near(initial.floating.centerY, initial.origin.centerY, "Initial Y");
      near(initial.floating.width, initial.origin.width, "Initial size");
      assert.equal(initial.dock.opacity, 0);
      assert.equal(initial.label.opacity, 0);
      const middle = await scrollTo(page, initial.start + initial.range * 0.5);
      assert(middle.floating.width < initial.floating.width && middle.floating.width > middle.dock.width);
      assert(middle.floating.centerY < initial.floating.centerY);
      assert(middle.floating.opacity > 0.8);
      near(middle.scene.x, initial.scene.x, "Central scene X unchanged");
      near(middle.scene.y, initial.scene.y, "Central scene Y unchanged");
      if (name === "C-V3") await page.screenshot({ path: path.join(output, `moving-${width}.png`) });
      const docked = await scrollTo(page, initial.start + initial.range + 5);
      assert(docked.docked);
      assert.equal(docked.floating.opacity, 0);
      assert.equal(docked.dock.opacity, 1);
      assert.equal(docked.label.opacity, 1);
      near(docked.floating.centerX, docked.dock.centerX, "Docked X");
      near(docked.floating.centerY, docked.dock.centerY, "Docked Y");
      near(docked.floating.width, docked.dock.width, "Docked size");
      if (name === "C-V3") await page.screenshot({ path: path.join(output, `docked-${width}.png`) });
      const restored = await scrollTo(page, 0);
      near(restored.floating.centerY, initial.floating.centerY, "Reverse scroll Y");
      near(restored.floating.width, initial.floating.width, "Reverse scroll size");
      assert.equal(restored.dock.opacity, 0);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(250);
      assert.equal((await snapshot(page)).floating.opacity, 0);
      await page.setViewportSize({ width, height });
      const resized = await scrollTo(page, 0);
      near(resized.floating.centerX, resized.origin.centerX, "Restored viewport X");
      near(resized.floating.centerY, resized.origin.centerY, "Restored viewport Y");
    } else {
      assert.equal(initial.floating.display, "none");
      assert.equal(initial.origin.display, "none");
      assert.equal(initial.dock.opacity, 1);
      assert.equal(initial.label.opacity, 1);
      const docked = await scrollTo(page, 900);
      assert(docked.docked);
      assert.equal(docked.floating.opacity, 0);
      assert.equal(docked.dock.opacity, 1);
    }
    if (name === "C-V3") {
      await scrollTo(page, 0);
      await page.screenshot({ path: path.join(output, `home-${width}.png`) });
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${name} ${width}x${height}: logo visibility, scroll handoff, reverse, responsive layout`);
    await context.close();
  }
} finally {
  await browser.close();
}
