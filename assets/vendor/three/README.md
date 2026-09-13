# Three.js Runtime

Version: 0.186.0, MIT license (see LICENSE).

Copied without modification from the installed npm package's build/three.module.js and build/three.core.js.
Both files are required because the module imports the core using a relative path.
These two upstream files are build inputs. The footer downloads the single generated
`footer-runtime.min.js` instead: a minified ES module containing the exports used by
`scripts/footer-field.js`. It is built with esbuild; no external CDN is needed.

Run `npm run build:footer` to regenerate the local runtime. `npm run build:site`
also rebuilds it automatically inside the deployment output. The source files and
MIT license stay alongside the generated file for maintenance and attribution.

Source and documentation: https://threejs.org/

When upgrading the package, replace both upstream files together, run
`npm run build:footer`, and rerun `npm run test:footer`.
