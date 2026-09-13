# Three.js Runtime

Version: 0.186.0, MIT license (see LICENSE).

Copied without modification from the installed npm package's build/three.module.js and build/three.core.js.
Both files are required because the module imports the core using a relative path.
The footer loads these files locally and lazily; no external CDN is needed.

Source and documentation: https://threejs.org/

When upgrading the package, replace both runtime files together and rerun `npm run test:footer`.
