import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "parse5";
import { siteContent } from "../scripts/content.js";
import { heroMarkup, newsMarkup } from "../scripts/hero-markup.js";
import { prerenderHomepage } from "../tools/prerender-homepage.mjs";

const html = await readFile(new URL("../C-V3.html", import.meta.url), "utf8");
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...(node.childNodes ?? []).flatMap(child => all(child, predicate))];
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const text = node => node.value ?? (node.childNodes ?? []).map(text).join("");

test("hero copy escapes text, preserves semantic bullets, and handles optional fields", () => {
  const copy = heroMarkup({ name: '<Team & "lab">', englishName: "English", recruitment: {}, researchDirections: [] });
  assert.equal(copy.title, "&lt;Team &amp; &quot;lab&quot;&gt;");
  assert.equal(copy.recruitment, "");
  assert.match(copy.directions, /^<p /);
  const populated = heroMarkup(siteContent.team);
  assert.match(populated.directions, /^<ul /);
  assert.equal((populated.title.match(/<span>/g) ?? []).length, 2);
});

test("news escapes editable content and handles absent links and empty lists", () => {
  const markup = newsMarkup([{ date: "<2026>", title: '<img src=x onerror="bad()">', source: "A&B" }]);
  assert(!markup.includes("<img"));
  assert(!markup.includes("<a "));
  assert(markup.includes("A&amp;B"));
  assert.match(newsMarkup([]), /news-empty/);
});

test("static export includes hero content, one bootstrap, and is idempotent", () => {
  const output = prerenderHomepage(html, siteContent);
  assert.equal(prerenderHomepage(output, siteContent), output);
  const page = parse(output);
  assert.equal(all(page, node => attr(node, "id") === "macc-entrance").length, 1);
  assert.equal(all(page, node => attr(node, "data-recruitment") !== undefined).length, 1);
  const title = all(page, node => attr(node, "data-team-name") !== undefined)[0];
  assert.equal(text(title), siteContent.team.titleLines.join(""));
  assert.equal(all(page, node => attr(node, "class")?.split(" ").includes("news-item")).length, siteContent.news.length);
  assert.equal(all(page, node => attr(node, "rel") === "modulepreload").length, 3);
});

test("static navigation matches reordered sections, and blank copy does not linger", () => {
  const content = structuredClone(siteContent);
  content.team.recruitment.text = "";
  content.team.researchDirections = [];
  content.team.titleLines = [];
  content.news = [];
  content.navigation = [{ id: "publications", label: "Papers" }, { id: "members", label: "People" }];
  const page = parse(prerenderHomepage(html, content));
  assert.equal(all(page, node => attr(node, "data-recruitment") !== undefined).length, 0);
  assert.equal(all(page, node => attr(node, "data-team-directions") !== undefined).length, 0);
  assert.deepEqual(all(page, node => attr(node, "data-section") !== undefined).map(node => attr(node, "data-section")), ["home", "publications", "members", "projects", "patents", "awards"]);
});
