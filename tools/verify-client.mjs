import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = process.env.PREVIEW_URL ?? "http://127.0.0.1:4173";
const output = path.join(root, "artifacts", "client");
await mkdir(output, { recursive: true });
const content = await readFile(path.join(root, "scripts", "content.js"), "utf8");
const example = JSON.parse(await readFile(path.join(root, "tests", "fixtures", "citation-example.json"), "utf8"));
let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
if (!executablePath && !existsSync(chromium.executablePath()) && process.platform === "win32") {
  const cache = path.join(process.env.LOCALAPPDATA, "ms-playwright");
  for (const version of (await readdir(cache)).filter(name => /^chromium-\d+$/.test(name)).sort().reverse()) {
    const candidate = path.join(cache, version, "chrome-win64", "chrome.exe");
    if (existsSync(candidate)) { executablePath = candidate; break; }
  }
}
const browser = await chromium.launch({ headless: true, executablePath });
const order = ["home", "awards", "publications", "members", "patents", "projects"];
try {
  for (const viewport of [{ width: 1318, height: 680 }, { width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce", permissions: ["clipboard-read", "clipboard-write"] });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1(?::|\/))/, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator("body").getAttribute("data-center-concept"), "C-V3");
    assert.equal(await page.locator(".hero__directions li").count(), 3);
    assert((await page.locator(".hero__title").textContent()).includes("多智能体"));
    assert.equal(await page.locator("#publications .stack-item__summary").first().evaluate(el => getComputedStyle(el).fontStyle), "italic");
    assert.equal(await page.locator("#publications .stack-item__title").first().evaluate(el => getComputedStyle(el).fontStyle), "normal");
    assert.equal(await page.locator("#patents .stack-item__summary").first().evaluate(el => getComputedStyle(el).fontStyle), "normal");
    assert.equal(await page.locator("#patents [data-cite-index]").count(), 0);
    assert.equal(await page.locator("#publications [data-cite-index]").count(), 7);
    assert.equal(await page.locator(".tides-legend").count(), 0);
    assert.equal(await page.locator(".motion-toggle").count(), 1);
    const measures = await page.locator("#publications .stack-item").first().evaluate(card => {
      const title = card.querySelector(".stack-item__title");
      const summary = card.querySelector(".stack-item__summary");
      return [title.offsetWidth / title.parentElement.clientWidth, summary.offsetWidth / summary.parentElement.clientWidth];
    });
    const expected = viewport.width > 700 ? [0.6, 0.8] : [1, 1];
    measures.forEach((value, index) => assert(Math.abs(value - expected[index]) < 0.01, "Publication measure differs from client proportions"));
    const gap = await page.evaluate(() => {
      const hero = document.querySelector("#home");
      const grid = hero.querySelector(".hero__grid");
      return hero.getBoundingClientRect().bottom - grid.getBoundingClientRect().bottom + parseFloat(getComputedStyle(hero.nextElementSibling).paddingTop);
    });
    assert(gap <= 82, "Excess blank space remains after the hero");
    assert((await page.request.get(`${baseURL}/assets/award-laurel.svg`)).ok());
    assert((await page.locator(".award-card").first().evaluate(el => getComputedStyle(el, "::before").maskImage)).includes("award-laurel.svg"));
    await page.screenshot({ path: path.join(output, `home-${viewport.width}.png`) });
    await page.locator("[data-cite-index='0']").click();
    assert(await page.locator(".citation-dialog__example").isVisible());
    assert.deepEqual(await page.locator(".citation-row__label").allTextContents(), ["GB/T 7714", "BibTeX"]);
    assert.equal(await page.locator(".citation-dialog a").count(), 0);
    await page.keyboard.press("Escape");
    assert(await page.locator("[data-cite-index='0']").evaluate(el => el === document.activeElement));

    // The client-supplied example is a test fixture, never inserted into their publication list.
    await context.route("**/scripts/content.js", route => route.fulfill({
      contentType: "application/javascript; charset=utf-8",
      body: `${content}\nsiteContent.publications[0] = ${JSON.stringify(example)};\nsiteContent.navigation = ${JSON.stringify(order)}.map(id => siteContent.navigation.find(item => item.id === id));\nsiteContent.members.push(...Array.from({ length: 5 }, (_, index) => ({ ...siteContent.members[0], name: 'Additional Teacher ' + (index + 1) })));`
    }));
    await page.goto(`${baseURL}/?client-fixture=1#publications`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    assert.deepEqual(await page.locator("main > [data-section]").evaluateAll(nodes => nodes.map(node => node.dataset.section)), order);
    assert.deepEqual(await page.locator("[data-nav-link]").evaluateAll(nodes => nodes.map(node => node.dataset.navLink)), order);
    assert.equal(await page.locator("#awards .section-head__eyebrow").textContent(), "Section 01");
    assert.equal(await page.locator("#members .section-head__eyebrow").textContent(), "Section 03");
    const roster = await page.locator('[data-member-group="teachers"] .member-card').evaluateAll(cards => cards.map(card => {
      const rect = card.getBoundingClientRect();
      return { x: rect.left, y: rect.top, bottom: rect.bottom };
    }));
    assert.equal(roster.length, 9, "Additional members were dropped");
    const columns = viewport.width > 1100 ? 4 : 2;
    roster.forEach((card, index) => {
      const rowStart = Math.floor(index / columns) * columns;
      assert(Math.abs(card.y - roster[rowStart].y) < 1, "Members did not share their row");
      if (index >= columns) assert(card.y >= roster[index - columns].bottom, "Member rows overlap");
    });
    const nextGroup = await page.locator('[data-member-group="collaborators"]').boundingBox();
    assert(nextGroup.y > roster[8].bottom, "Next group started before all members were displayed");
    await page.locator('[data-member-group="teachers"]').screenshot({ path: path.join(output, `members-nine-${viewport.width}.png`) });
    await page.locator('.award-card').first().screenshot({ path: path.join(output, `award-${viewport.width}.png`) });
    await page.locator('[data-nav-link="publications"]').click();
    await page.waitForFunction(() => document.querySelector('[data-nav-link="publications"]').getAttribute("aria-current") === "page");
    await page.screenshot({ path: path.join(output, `publications-${viewport.width}.png`) });
    await page.locator("[data-cite-index='0']").click();
    assert.equal(await page.locator(".citation-row").count(), 2);
    assert.equal(await page.locator(".citation-dialog__paper").textContent(), example.title);
    const fits = await page.locator(".citation-dialog").evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && el.scrollWidth <= el.clientWidth;
    });
    assert(fits, "Citation dialog overflows viewport");
    await page.getByRole("button", { name: "Copy GB/T 7714 citation", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".citation-dialog__status").textContent === "Citation copied.");
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), example.citations.gbt7714);
    await page.screenshot({ path: path.join(output, `citation-example-${viewport.width}.png`) });
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      // Native dialogs may cycle through browser chrome, but never the inert page controls.
      assert(await page.locator(".citation-dialog").evaluate(el => el.matches(":modal") && (el.contains(document.activeElement) || document.activeElement === document.body)), "Focus entered the inert page");
    }
    await page.getByRole("button", { name: "Copy BibTeX citation", exact: true }).click();
    const copiedBibtex = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(copiedBibtex.replace(/\r\n/g, "\n"), example.citations.bibtex);
    assert.equal(await page.locator(".citation-dialog a").count(), 0);

    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denied in test"); } } }));
    await page.getByRole("button", { name: "Copy GB/T 7714 citation", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".citation-dialog__status").textContent === "Clipboard access unavailable.");
    assert.equal(await page.evaluate(() => getSelection().toString()), example.citations.gbt7714);
    await page.getByRole("button", { name: "Close citation", exact: true }).click();
    await page.locator("[data-cite-index='0']").click();
    await page.mouse.click(2, 2);
    assert.equal(await page.locator(".citation-dialog").evaluate(el => el.open), false);
    assert.equal(await page.locator("body").evaluate(el => el.classList.contains("citation-dialog-open")), false);
    await page.locator(".site-mark").click();
    await page.waitForFunction(() => document.querySelector("#home").getBoundingClientRect().top >= -2);
    assert.equal(await page.locator('[data-nav-link="home"]').getAttribute("aria-current"), "page");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Page overflow");
    for (const icon of ["quote", "copy", "x", "check"]) assert((await page.request.get(`${baseURL}/assets/icons/${icon}.svg`)).ok());
    assert.deepEqual(errors, []);
    console.log(`PASS ${viewport.width}x${viewport.height}: compact hero, paper proportions, nine-member wrapping, laurel, two citation formats, clipboard, focus, navigation`);
    await context.close();
  }
} finally {
  await browser.close();
}
