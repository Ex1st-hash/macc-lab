import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = path.join(root, "artifacts", "layout");
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
const viewports = [
  { width: 1920, height: 1080 }, { width: 1440, height: 1000 },
  { width: 1318, height: 680 }, { width: 1280, height: 720 },
  { width: 1100, height: 800 },
  { width: 1024, height: 768 }, { width: 820, height: 900 },
  { width: 730, height: 900 }, { width: 390, height: 844 }
];
const report = [];
const snapshot = page => page.evaluate(() => {
  const rect = selector => {
    const el = document.querySelector(selector), r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  };
  const canvas = document.querySelector("[data-topology-canvas]");
  const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
  let lit = 0;
  for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 10) lit++;
  const titleStyle = getComputedStyle(document.querySelector(".hero__title"));
  return {
    header: rect(".site-header"), intro: rect(".hero__intro"),
    logo: rect("[data-monogram-origin]"), english: rect(".hero__eyebrow"),
    title: rect(".hero__title"), newsTitle: rect(".news-panel__title"),
    news: rect(".hero__news"), recruitment: rect(".hero__recruitment"),
    scene: rect(".page-visual__frame"), count: rect(".news-panel__count"),
    overflow: document.documentElement.scrollWidth > innerWidth + 1, lit,
    titleSize: parseFloat(titleStyle.fontSize),
    titleLineHeight: parseFloat(titleStyle.lineHeight),
    titleLines: [...document.querySelectorAll(".hero__title span")].map(line => line.getBoundingClientRect().height),
    newsTitleSize: parseFloat(getComputedStyle(document.querySelector(".news-panel__title")).fontSize),
    countWrap: getComputedStyle(document.querySelector(".news-panel__count")).whiteSpace
  };
});
try {
  for (const variant of variants) {
    for (const viewport of viewports) {
      if (variant !== "C-V3" && ![1440, 1318, 390].includes(viewport.width)) continue;
      const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`${baseURL}/${variant}.html`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const initial = await snapshot(page);
      assert.equal(initial.overflow, false, `${variant} ${viewport.width}: horizontal overflow`);
      assert(initial.lit > 1000, "Blank center scene");
      assert.equal(initial.countWrap, "nowrap");
      assert(initial.title.y >= initial.english.bottom + 16, "Identity overlaps title");
      if (viewport.width > 760) {
        assert(initial.logo.right + 10 <= initial.english.x, "Logo must share the identity row");
        assert(Math.abs(initial.logo.y + initial.logo.height / 2 - initial.english.y - initial.english.height / 2) < 1);
        assert(initial.intro.y - initial.header.bottom <= 48, "Excessive top whitespace");
      }
      if (viewport.width > 1100 && !["C-V1", "C-V2"].includes(variant)) {
        assert(initial.titleSize >= initial.newsTitleSize * 2, "Main title must lead the visual hierarchy");
        assert(initial.title.y + 30 < initial.newsTitle.y, "News must remain a secondary, offset heading");
        assert(initial.titleLines.length === 2 && initial.titleLines.every(height => height <= initial.titleLineHeight + 1), "Demo title has an orphaned line");
        assert(initial.recruitment.bottom < viewport.height - 8, "Recruitment falls outside first viewport");
        assert(initial.title.right + 20 < initial.news.x, "Sidebars overlap");
      }
      if (["C-V1", "C-V2"].includes(variant)) assert(initial.news.y >= initial.intro.bottom, "C-series news must retain its lower row");
      if (variant === "C-V3" && viewport.width >= 1101) {
        assert(initial.scene.y + initial.scene.height * 0.935 <= viewport.height - 20, "Globe bottom clipped");
      }
      await page.screenshot({ path: path.join(output, `${variant}-${viewport.width}.png`) });
      if (viewport.width > 760) {
        // Sample the whole handoff: the compact origin may not pass above its dock.
        const range = await page.evaluate(() => Math.max(220, document.querySelector("#home").offsetHeight * 0.42));
        for (const fraction of [0.2, 0.5, 0.75]) {
          await page.evaluate(top => scrollTo({ top, behavior: "instant" }), initial.header.height + range * fraction);
          await page.waitForTimeout(60);
          const state = await page.evaluate(() => {
            const r = document.querySelector("[data-floating-monogram]").getBoundingClientRect();
            const d = document.querySelector("[data-monogram-dock]").getBoundingClientRect();
            const s = document.querySelector(".page-visual__frame").getBoundingClientRect();
            return { y: r.y + r.height / 2, dockY: d.y + d.height / 2, sceneX: s.x, sceneY: s.y };
          });
          assert(state.y >= state.dockY - 1, "Logo overshoots header");
          assert(Math.abs(state.sceneX - initial.scene.x) < 1 && Math.abs(state.sceneY - initial.scene.y) < 1, "Scene moved during reading");
        }
      }
      assert.deepEqual(errors, []);
      report.push({ variant, viewport, ...initial });
      console.log(`PASS ${variant} ${viewport.width}x${viewport.height}: title hierarchy, compact identity, content, fixed scene`);
      await page.close();
    }
  }
  const page = await browser.newPage({ viewport: { width: 1318, height: 680 } });
  const content = await readFile(path.join(root, "scripts", "content.js"), "utf8");
  await page.route("**/scripts/content.js", route => route.fulfill({
    contentType: "application/javascript; charset=utf-8",
    body: `${content}\nsiteContent.team.englishName = "Multi-Agent Cognition, Collaboration and Distributed Intelligence Research Group";\nsiteContent.team.recruitment.text = "";\nsiteContent.news = [];`
  }));
  await page.goto(baseURL, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".hero__recruitment").count(), 0);
  assert(await page.locator(".news-empty").isVisible());
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.close();
  console.log("PASS editable content: longer identity, empty recruitment and news");
} finally {
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
}
