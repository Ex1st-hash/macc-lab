import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendor = path.join(root, "assets", "vendor", "three");

export async function buildFooterRuntime(destination = vendor) {
  const outfile = path.join(destination, "footer-runtime.min.js");
  await build({
    stdin: {
      contents: `export { WebGLRenderer, Scene, PerspectiveCamera, Vector2, ShaderMaterial,
        BufferGeometry, BufferAttribute, DynamicDrawUsage, Mesh, Points, LineSegments,
        DoubleSide } from "./assets/vendor/three/three.module.js";`,
      resolveDir: root,
      sourcefile: "footer-three-entry.js"
    },
    outfile,
    bundle: true,
    minify: true,
    treeShaking: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    legalComments: "inline",
    logLevel: "silent"
  });
  const originalBytes = (await readFile(path.join(vendor, "three.module.js"))).length
    + (await readFile(path.join(vendor, "three.core.js"))).length;
  return { originalBytes, bytes: (await readFile(outfile)).length, outfile };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildFooterRuntime();
  console.log(JSON.stringify({ ...result, reduction: `${(100 * (1 - result.bytes / result.originalBytes)).toFixed(1)}%` }));
}
