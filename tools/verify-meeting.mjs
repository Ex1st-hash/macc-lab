import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = path.join(root, "artifacts", "meeting");
await mkdir(output, { recursive: true });
const source = await readFile(path.join(root, "scripts", "content.js"), "utf8");
let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
if (!executablePath && !existsSync(chromium.executablePath()) && process.platform === "win32") {
  const cache = path.join(process.env.LOCALAPPDATA, "ms-playwright");
  for (const version of (await readdir(cache)).filter(name => /^chromium-\d+$/.test(name)).sort().reverse()) {
    const candidate = path.join(cache, version, "chrome-win64", "chrome.exe");
    if (existsSync(candidate)) { executablePath = candidate; break; }
  }
}
const browser = await chromium.launch({ headless: true, executablePath });
const settle = page => page.waitForTimeout(400);
const scroll = async (page, top) => {
  await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), top);
  await settle(page);
};
const footer = page => page.evaluate(() => {
  const field = document.querySelector("[data-footer-observer]");
  const canvas = document.querySelector("[data-footer-canvas]");
  const copy = document.createElement("canvas");
  copy.width = canvas.width; copy.height = canvas.height;
  const context = copy.getContext("2d");
  context.drawImage(canvas, 0, 0);
  const pixels = context.getImageData(0, 0, copy.width, copy.height).data;
  let lit = 0, hash = 0;
  for (let i = 3; i < pixels.length; i += 16) {
    if (pixels[i]) lit++;
    hash = (Math.imul(hash, 31) + pixels[i]) | 0;
  }
  return {
    width: field.getBoundingClientRect().width, left: field.getBoundingClientRect().left,
    viewport: document.documentElement.clientWidth, canvasWidth: canvas.width,
    expected: Math.floor(Math.floor(field.getBoundingClientRect().width) * Math.min(devicePixelRatio, 1.5)),
    lit, hash, state: window.__maccFooterField.getState(),
    sceneOpacity: Number(getComputedStyle(document.querySelector(".page-visual")).opacity)
  };
});

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1318, height: 680 }, { width: 820, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, permissions: ["clipboard-read", "clipboard-write"] });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1(?::|\/))/, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator(".news-item").count(), 10);
    assert.equal(await page.locator("[data-news-next], [data-news-prev]").count(), 0);
    const news = page.locator("[data-news-list]");
    await news.scrollIntoViewIfNeeded();
    await news.hover();
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 180);
    await settle(page);
    assert(await news.evaluate(el => el.scrollTop > 0), "Wheel did not scroll News");
    assert.equal(await page.evaluate(() => scrollY), before, "News scrolling moved the main page before reaching the edge");
    await news.focus();
    const start = await news.evaluate(el => el.scrollTop);
    await page.keyboard.press("PageDown");
    await settle(page);
    assert(await news.evaluate((el, start) => el.scrollTop > start, start), "Keyboard cannot scroll News");
    await news.evaluate(el => { el.scrollTop = el.scrollHeight; });
    await settle(page);
    await news.hover();
    await page.mouse.wheel(0, 300);
    await settle(page);
    // Chromium consumes the first wheel gesture at a fractional scroll boundary.
    await page.mouse.wheel(0, 300);
    await settle(page);
    assert(await page.evaluate(before => scrollY > before, before), `News boundary: ${JSON.stringify(await news.evaluate(el => ({page: scrollY, top: el.scrollTop, height: el.scrollHeight, visible: el.clientHeight})))}; initial page ${before}`);
    await news.evaluate(el => { el.scrollTop = 0; });
    await news.evaluate(el => el.blur());
    await scroll(page, 0);
    await page.screenshot({ path: path.join(output, `home-${viewport.width}.png`) });
    await page.locator("[data-recruitment] a").click();
    await page.waitForFunction(() => location.hash === "#contact");
    await page.waitForFunction(() => Math.abs(document.documentElement.scrollHeight - innerHeight - scrollY) < 2);
    await settle(page);
    assert.equal(await page.locator("[data-contact-list] > div").count(), 3);
    assert(await page.locator("[data-contact-list] a[href^='mailto:']").isVisible());
    await page.screenshot({ path: path.join(output, `footer-${viewport.width}.png`) });
    await scroll(page, await page.locator("#members").evaluate(el => el.getBoundingClientRect().top + scrollY - 90));
    await settle(page);
    assert.deepEqual(await page.locator("[data-member-group]").evaluateAll(nodes => nodes.map(node => node.dataset.memberGroup)), ["teachers", "collaborators", "students"]);
    assert.equal(await page.locator(".member-card").count(), 12);
    const columns = await page.locator(".member-grid").first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    assert.equal(columns, viewport.width > 1100 ? 4 : 2);
    const colors = await page.locator(".member-group").evaluateAll(groups => groups.map(group => [...group.querySelectorAll(".member-card__portrait-backdrop")].map(el => getComputedStyle(el).backgroundColor)));
    assert(colors.every(group => new Set(group).size === 1));
    assert.equal(new Set(colors.map(group => group[0])).size, 3);
    await page.waitForFunction(() => [...document.querySelectorAll(".member-group:first-of-type img")].every(img => img.complete && img.naturalWidth > 0));
    const alpha = await page.locator(".member-card__portrait-image").first().evaluate(async img => {
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 100;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 100, 100);
      const pixels = ctx.getImageData(0, 0, 100, 100).data;
      let clear = 0, solid = 0;
      for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] === 0) clear++; if (pixels[i] > 200) solid++; }
      return { clear, solid };
    });
    assert(alpha.clear > 1000 && alpha.solid > 1000, "Portrait is not a real transparent cutout");
    await page.screenshot({ path: path.join(output, `members-${viewport.width}.png`) });
    await page.locator("[data-cite-index='0']").click();
    assert(await page.locator(".citation-dialog__example").isVisible());
    assert.equal(await page.locator(".citation-dialog__downloads a").count(), 4);
    await page.getByRole("button", { name: "Copy APA citation", exact: true }).click();
    assert((await page.evaluate(() => navigator.clipboard.readText())).includes("EXAMPLE ONLY"));
    await page.keyboard.press("Escape");
    await scroll(page, 999999);
    const drawn = await footer(page);
    assert(drawn.lit > 100 && drawn.state.drawnEdges > 0);
    await page.waitForTimeout(700);
    assert.notEqual((await footer(page)).hash, drawn.hash, "Footer animation stopped");
    if (viewport.width > 700) assert.equal(drawn.sceneOpacity, 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Page overflows horizontally");
    assert.deepEqual(errors, []);
    console.log(`PASS ${viewport.width}: news wheel/keyboard/edge, recruitment, groups, alpha portrait, citations, footer pixels`);
    await context.close();
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1(?::|\/))/, route => route.abort());
  await page.goto(baseURL, { waitUntil: "networkidle" });
  for (const offscreen of [false, true]) {
    for (const width of [1440, 760, 390, 1024, 1920, 1318, 390, 1440]) {
      await scroll(page, offscreen ? 0 : 999999);
      await page.setViewportSize({ width, height: 900 });
      await settle(page);
      await scroll(page, 999999);
      const state = await footer(page);
      assert(Math.abs(state.width - state.viewport) < 1 && Math.abs(state.left) < 1, `Footer width failed after resize to ${width}`);
      assert.equal(state.canvasWidth, state.expected);
      assert(state.lit > 100 && state.state.drawnEdges > 0);
    }
  }
  console.log("PASS footer: 16 consecutive visible/offscreen resize transitions and canvas redraws");

  await page.route("**/scripts/content.js", route => route.fulfill({
    contentType: "application/javascript; charset=utf-8",
    body: `${source}\nsiteContent.news.push(...Array.from({length: 8}, (_, i) => ({date: '2026-09-13', title: 'Extra sample ' + i})));\nsiteContent.publications[0].citations = {};\nsiteContent.publications[0].citationExample = false;\nsiteContent.members = [];\nsiteContent.team.recruitment = {};\nsiteContent.contact = {};`
  }));
  await page.goto(`${baseURL}/?empty-fixture=1`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".news-item").count(), 18);
  assert.equal(await page.locator("[data-recruitment]").count(), 0);
  assert.equal(await page.locator(".member-group__empty").count(), 3);
  assert.equal(await page.locator("[data-contact-list] > div").count(), 0);
  await page.locator("[data-cite-index='0']").click();
  assert(await page.locator(".citation-dialog__empty").isVisible());
  assert.equal(await page.locator(".citation-row").count(), 0);
  await page.close();
  console.log("PASS empty/extended data: 18 news items, empty roster/contact/recruitment/citations");

  const build = JSON.parse(execFileSync(process.execPath, ["tools/build-site.mjs", "--json"], { cwd: root, encoding: "utf8" }));
  const relative = path.relative(root, build.directory).split(path.sep).join("/");
  const deployed = await browser.newPage();
  const missing = [];
  deployed.on("response", response => { if (response.status() === 404) missing.push(response.url()); });
  await deployed.goto(`${baseURL}/${relative}/`, { waitUntil: "networkidle" });
  assert.equal(await deployed.locator("body").getAttribute("data-center-concept"), "C-V3");
  assert.equal(await deployed.locator(".member-group").count(), 3);
  await deployed.locator("[data-cite-index='0']").click();
  assert.equal(await deployed.locator(".citation-row").count(), 4);
  await deployed.keyboard.press("Escape");
  for (const variant of ["A-V1", "A-V2", "A-V3", "B-V3", "C-V1", "C-V2", "C-V3"]) {
    assert((await deployed.request.get(`${baseURL}/${relative}/${variant}.html`)).ok());
  }
  for (const excluded of ["node_modules", "docs", ".git", "templates"]) assert(!existsSync(path.join(build.directory, excluded)));
  assert.deepEqual(missing, []);
  console.log(`PASS static subpath deployment: ${build.directory}`);
  await deployed.close();
} finally {
  await browser.close();
}
