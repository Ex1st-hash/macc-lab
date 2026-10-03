import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { publications } from "../content/publications.js";
import { selectLatestPublications } from "../scripts/publications.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = path.join(root, "artifacts", "publications");
await mkdir(output, { recursive: true });
let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
if (!executablePath && !existsSync(chromium.executablePath()) && process.platform === "win32") {
  const cache = path.join(process.env.LOCALAPPDATA, "ms-playwright");
  for (const version of (await readdir(cache)).filter(name => /^chromium-\d+$/.test(name)).sort().reverse()) {
    const candidate = path.join(cache, version, "chrome-win64", "chrome.exe");
    if (existsSync(candidate)) { executablePath = candidate; break; }
  }
}
const records = Array.from({ length: 23 }, (_, index) => ({
  date: index < 10 ? `2025-12-${index + 10}` : `2026-01-${String(index - 9).padStart(2, "0")}`,
  title: `Publication ${index + 1}: Research & collaboration <benchmark>`,
  meta: `${index < 10 ? 2025 : 2026} / Journal Article / Example Journal`,
  summary: 'A manually maintained publication with "quoted" text & a <literal> comparison.',
  href: "",
  citations: { gbt7714: `Citation for publication ${index + 1}.`, bibtex: `@article{paper${index + 1}, title={Publication ${index + 1}}}` }
}));
const expected = records.slice().reverse().slice(0, 15);
// Deliberately interleaved file order: the newest item is not near the beginning.
let fixture = [...records.filter((_, i) => i % 2), ...records.filter((_, i) => !(i % 2))];
const build = JSON.parse(execFileSync(process.execPath, ["tools/build-site.mjs", "--json"], { cwd: root, encoding: "utf8" }));
const subpath = path.relative(root, build.directory).split(path.sep).join("/");
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", permissions: ["clipboard-read", "clipboard-write"] });
  await context.route(/^https?:\/\//, route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  await context.route("**/content/publications.js", route => route.fulfill({ contentType: "application/javascript; charset=utf-8", body: `export const publications = ${JSON.stringify(fixture)};` }));
  const page = await context.newPage();
  const errors = [];
  const missing = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.status() === 404) missing.push(response.url()); });
  for (const name of ["index", "A-V1", "A-V2", "A-V3", "B-V3", "C-V1", "C-V2", "C-V3"]) {
    await page.goto(`${baseURL}/${name}.html#publications`, { waitUntil: "networkidle" });
    assert.deepEqual(await page.locator("#publications .stack-item__title").allTextContents().then(titles => titles.map(title => title.trim())), expected.map(item => item.title));
    assert.equal(await page.locator("#publications [data-cite-index]").count(), 15);
  }
  console.log("PASS all seven concepts and default: newest 15 from an unsorted 23-paper archive");
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${baseURL}/${subpath}/#publications`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator("#publications .stack-item").count(), 15);
    assert.equal(await page.locator("#publications benchmark, #publications literal").count(), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(output, `latest-15-${viewport.width}.png`) });
    for (const index of [0, 7, 14]) {
      await page.locator(`[data-cite-index='${index}']`).click();
      assert.equal(await page.locator(".citation-dialog__paper").textContent(), expected[index].title);
      assert.deepEqual(await page.locator(".citation-row__text").allTextContents(), [expected[index].citations.gbt7714, expected[index].citations.bibtex]);
      await page.getByRole("button", { name: "Copy GB/T 7714 citation", exact: true }).click();
      await page.waitForFunction(() => document.querySelector(".citation-dialog__status").textContent === "Citation copied.");
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected[index].citations.gbt7714);
      await page.keyboard.press("Escape");
    }
    console.log(`PASS ${viewport.width}: subpath deployment, escaped copy, citation identity and clipboard after sorting`);
  }
  for (const count of [0, 3]) {
    fixture = records.slice(0, count).map(({ citations, ...paper }) => paper);
    await page.goto(`${baseURL}/?publication-count=${count}#publications`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("#publications .stack-item").count(), count);
    if (!count) assert(await page.locator(".publications-empty").isVisible());
    else {
      await page.locator("[data-cite-index='0']").click();
      assert(await page.locator(".citation-dialog__empty").isVisible());
      assert.equal(await page.locator(".citation-row").count(), 0);
      assert.equal(await page.locator(".citation-dialog__example").isVisible(), false);
      await page.keyboard.press("Escape");
    }
  }
  await context.unroute("**/content/publications.js");
  await page.goto(`${baseURL}/${subpath}/#publications`, { waitUntil: "networkidle" });
  assert.deepEqual(await page.locator("#publications .stack-item__title").allTextContents().then(titles => titles.map(title => title.trim())), selectLatestPublications(publications).map(item => item.title));
  for (const name of ["site", "publications"]) assert((await page.request.get(`${baseURL}/${subpath}/content/${name}.js`)).ok());
  for (const name of ["docs", "node_modules", ".git", "templates"]) assert(!existsSync(path.join(build.directory, name)));
  assert.deepEqual(errors, []);
  assert.deepEqual(missing, []);
  console.log("PASS empty/short lists, no fabricated citations for new records, and packaged content without missing resources");
  await context.close();
} finally {
  await browser.close();
}
