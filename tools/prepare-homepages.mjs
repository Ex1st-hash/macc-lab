import { readFile, writeFile } from "node:fs/promises";
import { siteContent } from "../scripts/content.js";
import { prerenderHomepage } from "./prerender-homepage.mjs";

for (const name of ["index", "A-V1", "A-V2", "A-V3", "B-V3", "C-V1", "C-V2", "C-V3"]) {
  const file = new URL(`../${name}.html`, import.meta.url);
  await writeFile(file, prerenderHomepage(await readFile(file, "utf8"), siteContent));
  console.log(`Prepared ${name}: static hero and bounded entrance`);
}
