import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteContent } from "../scripts/content.js";
import { prerenderHomepage } from "./prerender-homepage.mjs";
import { buildFooterRuntime } from "./build-footer-runtime.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const variants = ["A-V1", "A-V2", "A-V3", "B-V3", "C-V1", "C-V2", "C-V3"];
const config = JSON.parse(await readFile(path.join(root, "site.config.json"), "utf8"));
assert(variants.includes(config.defaultConcept), "Invalid defaultConcept");
await mkdir(path.join(root, "artifacts"), { recursive: true });
// A new allowlisted directory excludes source packages, screenshots, docs, and dependencies.
const destination = await mkdtemp(path.join(root, "artifacts", "site-"));
for (const name of ["assets", "styles", "scripts"]) {
  await cp(path.join(root, name), path.join(destination, name), { recursive: true });
}
await buildFooterRuntime(path.join(destination, "assets", "vendor", "three"));
for (const variant of variants) {
  const name = `${variant}.html`;
  await writeFile(path.join(destination, name), prerenderHomepage(await readFile(path.join(root, name), "utf8"), siteContent));
}
await cp(path.join(destination, `${config.defaultConcept}.html`), path.join(destination, "index.html"));
await writeFile(path.join(destination, ".nojekyll"), "");
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `path=${destination}\n`);
console.log(process.argv.includes("--json") ? JSON.stringify({ concept: config.defaultConcept, directory: destination }) : `Built ${config.defaultConcept}: ${destination}`);
