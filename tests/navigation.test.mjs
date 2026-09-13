import assert from "node:assert/strict";
import test from "node:test";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveNavigation } from "../scripts/navigation.js";

const ids = ["home", "members", "publications", "projects", "patents", "awards"];
test("navigation order also determines section order", () => {
  const order = ["home", "awards", "publications", "members", "patents", "projects"];
  const result = resolveNavigation(order.map(id => ({ id, label: id })), ids);
  assert.deepEqual(result.order, order);
  assert.deepEqual(result.items.map(item => item.id), order);
});
test("home remains first even if moved or omitted", () => {
  for (const config of [[{ id: "awards" }, { id: "home", label: "首页" }], [{ id: "members" }]]) {
    const result = resolveNavigation(config, ids);
    assert.equal(result.order[0], "home");
    assert.equal(result.items[0].id, "home");
  }
});
test("invalid IDs and duplicates cannot create dead links or duplicate sections", () => {
  const result = resolveNavigation([{ id: "members" }, { id: "bogus" }, null, { id: "members" }], ids);
  assert.deepEqual(result.items.map(item => item.id), ["home", "members"]);
  assert.deepEqual(result.order, ids);
});
test("unlisted sections stay visible at the end", () => {
  const result = resolveNavigation([{ id: "awards", label: "成果与荣誉" }], ids);
  assert.deepEqual(result.order, ["home", "awards", "members", "publications", "projects", "patents"]);
  assert.equal(result.items[1].label, "成果与荣誉");
});
test("missing configuration preserves content", () => {
  assert.deepEqual(resolveNavigation(null, ids).order, ids);
  assert.deepEqual(resolveNavigation([], []).order, []);
});

test("default selection is reversible and rejects unknown paths", async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const workspace = path.join(root, "artifacts", "selection-test", String(process.pid));
  await mkdir(path.join(workspace, "tools"), { recursive: true });
  await copyFile(path.join(root, "tools", "select-concept.mjs"), path.join(workspace, "tools", "select-concept.mjs"));
  await writeFile(path.join(workspace, "site.config.json"), JSON.stringify({ defaultConcept: "C-V3" }));
  for (const variant of ["C-V3", "A-V2"]) await writeFile(path.join(workspace, `${variant}.html`), `<body data-center-concept="${variant}"></body>`);
  const select = variant => spawnSync(process.execPath, [path.join(workspace, "tools", "select-concept.mjs"), ...(variant ? [variant] : [])], { encoding: "utf8" });
  for (const variant of ["A-V2", "C-V3"]) {
    const result = select(variant);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(await readFile(path.join(workspace, "index.html"), "utf8"), await readFile(path.join(workspace, `${variant}.html`), "utf8"));
    assert.equal(JSON.parse(await readFile(path.join(workspace, "site.config.json"), "utf8")).defaultConcept, variant);
  }
  assert.equal(select().status, 0);
  assert.notEqual(select("../index").status, 0);
  assert.equal(JSON.parse(await readFile(path.join(workspace, "site.config.json"), "utf8")).defaultConcept, "C-V3");
});
