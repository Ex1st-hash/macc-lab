import assert from "node:assert/strict";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "site.config.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const variant = process.argv[2] ?? config.defaultConcept;
assert(["A-V1", "A-V2", "A-V3", "B-V3", "C-V1", "C-V2", "C-V3"].includes(variant), "Unknown concept version.");
await copyFile(path.join(root, `${variant}.html`), path.join(root, "index.html"));
await writeFile(configPath, JSON.stringify({ ...config, defaultConcept: variant }, null, 2) + "\n");
console.log(`Default homepage: ${variant}. Shared content and navigation are unchanged.`);
