import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, serialize, serializeOuter } from "parse5";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = process.argv[2];
assert(sourceRoot, "Pass the directory containing A-V1, A-V2, A-V3, B-V3, C-V1, C-V2, C-V3.");
const variants = ["A-V1", "A-V2", "A-V3", "B-V3", "C-V1", "C-V2", "C-V3"];
const { defaultConcept } = JSON.parse(await readFile(path.join(root, "site.config.json"), "utf8"));
assert(variants.includes(defaultConcept), "Unknown defaultConcept in site.config.json.");
const findAll = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...(node.childNodes ?? []).flatMap(child => findAll(child, predicate))
];
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
const setAttr = (node, name, value = "") => {
  const existing = node.attrs.find(a => a.name === name);
  if (existing) existing.value = value;
  else node.attrs.push({ name, value });
};
const hasClass = (node, name) => attr(node, "class")?.split(/\s+/).includes(name);
const first = (node, predicate) => findAll(node, predicate)[0];
const textOf = node => (node.childNodes ?? []).map(child => child.value ?? "").join("");
const remove = node => {
  node.parentNode.childNodes = node.parentNode.childNodes.filter(child => child !== node);
};
const renameHalo = text => text.replaceAll("cathedral-field__cathedral", "concept-halo__light").replaceAll("cathedral-field", "concept-halo");
const hash = text => createHash("sha256").update(text).digest("hex");

await mkdir(path.join(root, "templates"), { recursive: true });
await mkdir(path.join(root, "scripts", "concepts"), { recursive: true });
await mkdir(path.join(root, "styles", "concepts"), { recursive: true });
await mkdir(path.join(root, "assets", "icons"), { recursive: true });
for (const name of ["quote", "copy", "x", "check"]) {
  await copyFile(path.join(root, "node_modules", "lucide-static", "icons", `${name}.svg`), path.join(root, "assets", "icons", `${name}.svg`));
}
await copyFile(path.join(root, "node_modules", "lucide-static", "LICENSE"), path.join(root, "assets", "icons", "LICENSE"));
let template;
try {
  template = await readFile(path.join(root, "templates", "homepage.html"), "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  template = await readFile(path.join(root, "index.html"), "utf8");
  await writeFile(path.join(root, "templates", "homepage.html"), template);
}

const manifest = [];
let commonStyles;
let commonLight;
for (const variant of variants) {
  const source = await readFile(path.join(sourceRoot, variant, `${variant}.html`), "utf8");
  const concept = parse(source);
  const styles = findAll(concept, node => node.tagName === "style");
  const scripts = findAll(concept, node => node.tagName === "script");
  const light = textOf(scripts.find(node => attr(node, "id") === "macc-unified-light"));
  const animation = textOf(scripts.at(-1));
  assert(animation.includes("data-topology-canvas"), `${variant}: animation script missing`);
  let renderedAnimation = animation;
  if (variant === "C-V3") {
    // Separate the source's logical scene size from its extended paint surface.
    const viewportEdits = [
      ["ctx.clearRect(0,0,rt.w,rt.h);", "ctx.clearRect(0,0,canvas.width/rt.dpr,canvas.height/rt.dpr);"],
      ["const r=canvas.getBoundingClientRect();", "const r=canvas.parentElement.getBoundingClientRect(),paint=canvas.getBoundingClientRect();"],
      ["canvas.width=Math.round(rt.w*rt.dpr);canvas.height=Math.round(rt.h*rt.dpr);", "canvas.width=Math.round(paint.width*rt.dpr);canvas.height=Math.round(paint.height*rt.dpr);"]
    ];
    for (const [before, after] of viewportEdits) {
      assert.equal(renderedAnimation.split(before).length, 2, `${variant}: canvas adapter target changed`);
      renderedAnimation = renderedAnimation.replace(before, after);
    }
  }
  const baseStyles = styles.slice(2, 5).map(textOf);
  const atmosphere = textOf(styles.find(node => attr(node, "id") === "macc-unified-atmosphere"));
  if (!commonStyles) {
    commonStyles = [...baseStyles, atmosphere];
    commonLight = light;
    await writeFile(path.join(root, "styles", "concepts", "source.css"), renameHalo(commonStyles.join("\n")));
    await writeFile(path.join(root, "scripts", "concepts", "sphere-material.js"), light);
  } else {
    assert.deepEqual([...baseStyles, atmosphere], commonStyles, `${variant}: shared styles changed`);
    assert.equal(light, commonLight, `${variant}: sphere material changed`);
  }
  const extraStyles = styles.slice(5).filter(node => attr(node, "id") !== "macc-unified-atmosphere").map(textOf).join("\n");
  if (extraStyles) await writeFile(path.join(root, "styles", "concepts", `${variant}.css`), renameHalo(extraStyles));
  await writeFile(path.join(root, "scripts", "concepts", `${variant}.js`), renderedAnimation);

  const page = parse(template);
  const head = first(page, node => node.tagName === "head");
  const body = first(page, node => node.tagName === "body");
  setAttr(body, "data-center-concept", variant);
  first(page, node => node.tagName === "title").childNodes[0].value = `MACC | ${variant}`;
  const oldVisual = first(page, node => hasClass(node, "page-visual"));
  remove(oldVisual);
  const oldHero = first(page, node => attr(node, "id") === "home");
  const hero = first(concept, node => attr(node, "id") === "home");
  const studyHeading = first(hero, node => hasClass(node, "tides-study__heading"));
  if (studyHeading) remove(studyHeading);
  setAttr(hero, "data-section", "home");
  const monogram = first(hero, node => hasClass(node, "hero__monogram-anchor"));
  setAttr(monogram, "data-monogram-origin");
  setAttr(monogram, "data-team-acronym");
  const newsFooter = first(hero, node => hasClass(node, "news-panel__footer"));
  if (newsFooter) remove(newsFooter);

  const visual = first(hero, node => hasClass(node, "topology-visual"));
  const anchor = parse('<div class="center-visual-anchor topology-visual__frame" aria-hidden="true"></div>');
  const anchorNode = first(anchor, node => hasClass(node, "center-visual-anchor"));
  anchorNode.parentNode = visual.parentNode;
  visual.parentNode.childNodes.splice(visual.parentNode.childNodes.indexOf(visual), 1, anchorNode);
  setAttr(visual, "class", "page-visual__frame topology-visual");
  oldHero.parentNode.childNodes.splice(oldHero.parentNode.childNodes.indexOf(oldHero), 1, hero);
  hero.parentNode = oldHero.parentNode;

  const wrapperDoc = parse(`<div class="page-visual page-visual--concept" aria-hidden="true">${renameHalo(serializeOuter(visual))}</div>`);
  const wrapper = first(wrapperDoc, node => hasClass(node, "page-visual"));
  wrapper.parentNode = body;
  body.childNodes.splice(body.childNodes.indexOf(first(page, node => node.tagName === "main")), 0, wrapper);
  const appendHtml = (parent, html) => {
    const fragment = parse(html);
    const nodes = findAll(fragment, node => node.tagName === "link" || node.tagName === "script");
    for (const node of nodes) { node.parentNode = parent; parent.childNodes.push(node); }
  };
  appendHtml(head, '<link rel="icon" href="data:,"><link rel="stylesheet" href="./styles/concepts/source.css">');
  if (extraStyles) appendHtml(head, `<link rel="stylesheet" href="./styles/concepts/${variant}.css">`);
  appendHtml(head, '<link rel="stylesheet" href="./styles/center-concepts.css">');
  appendHtml(head, '<link rel="stylesheet" href="./styles/client-refinements.css">');
  appendHtml(body, '<script src="./scripts/center-concepts.js"></script>');
  appendHtml(body, '<script src="./scripts/concepts/sphere-material.js"></script>');
  appendHtml(body, `<script src="./scripts/concepts/${variant}.js"></script>`);

  const output = ("<!DOCTYPE html>\n" + serialize(page).replace(/^<!DOCTYPE html>\s*/i, "")).replace(/[\t ]+$/gm, "").trimEnd() + "\n";
  await writeFile(path.join(root, `${variant}.html`), output);
  if (variant === defaultConcept) await writeFile(path.join(root, "index.html"), output);
  manifest.push({ variant, sourceSha256: hash(source), animationSha256: hash(animation),
    ...(renderedAnimation !== animation ? { renderedAnimationSha256: hash(renderedAnimation) } : {}),
    page: `${variant}.html` });
  console.log(`Imported ${variant}: original animation (${animation.length} characters), complete homepage`);
}
await writeFile(path.join(root, "scripts", "concepts", "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
