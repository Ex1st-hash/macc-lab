const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };

const edgeShader = `
  uniform vec2 uViewport;
  float edgeFade() {
    vec2 uv = gl_FragCoord.xy / uViewport;
    vec2 pad = vec2(5.0) / uViewport;
    return smoothstep(pad.x, 0.065, uv.x) * smoothstep(pad.x, 0.065, 1.0 - uv.x)
      * smoothstep(pad.y, 0.18, uv.y) * smoothstep(pad.y, 0.18, 1.0 - uv.y);
  }
`;

export function bindFooterField(element, initialCanvas, reducedMotion) {
  if (!element || !initialCanvas) return;
  let canvas = initialCanvas;
  const state = {
    renderer: "pending", width: 0, height: 0, dpr: 1, time: 0, frame: 0,
    lastFrame: 0, visible: false, visibilityRatio: 0, loading: false, lost: false,
    worldWidth: 1200, nodes: [], edges: [], faces: [], depthRange: [0, 0],
    pointerX: 0, pointerY: 0, cameraX: 0, cameraY: 0
  };
  let THREE, renderer, scene, camera, pointsGeometry, linesGeometry, surfaceGeometry, pointMaterial, lineMaterial, surfaceMaterial;
  let fallback;
  const positions = [];
  const palette = [[0.58, 0.84, 0.79], [0.86, 0.75, 0.53]];
  const canAnimate = () => state.visible && !state.lost && !document.hidden && !reducedMotion.matches && innerWidth > 760 && state.renderer === "webgl";

  function buildTopology() {
    state.nodes = [];
    state.edges = [];
    state.faces = [];
    const columns = clamp(Math.round(state.width / 38), 16, 55);
    for (let layer = 0; layer < 2; layer++) {
      const rows = layer ? 5 : 9;
      const offset = state.nodes.length;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const seed = (Math.sin(col * 17.13 + row * 31.7 + layer * 9.4) * 43758.54) % 1;
          state.nodes.push({ u: col / (columns - 1), v: row / (rows - 1) * 2 - 1, layer, seed: Math.abs(seed) });
          const index = offset + row * columns + col;
          if (col) state.edges.push([index - 1, index, 1]);
          if (row) state.edges.push([index - columns, index, 0.75]);
          if (row && col && (row + col) % 2 === 0) state.edges.push([index - columns - 1, index, 0.45]);
          if (row && col) state.faces.push(index - columns - 1, index - 1, index, index - columns - 1, index, index - columns);
        }
      }
    }
    if (!renderer) return;
    pointsGeometry?.dispose();
    linesGeometry?.dispose();
    surfaceGeometry?.dispose();
    scene.clear();
    const geometry = count => {
      const result = new THREE.BufferGeometry();
      for (const [name, size] of [["position", 3], ["aColor", 3], ["aAlpha", 1], ["aSize", 1]]) {
        result.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count * size), size).setUsage(THREE.DynamicDrawUsage));
      }
      return result;
    };
    pointsGeometry = geometry(state.nodes.length);
    linesGeometry = geometry(state.edges.length * 2);
    surfaceGeometry = new THREE.BufferGeometry();
    surfaceGeometry.setAttribute("position", pointsGeometry.attributes.position);
    surfaceGeometry.setAttribute("aColor", pointsGeometry.attributes.aColor);
    surfaceGeometry.setIndex(state.faces);
    const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    const points = new THREE.Points(pointsGeometry, pointMaterial);
    const lines = new THREE.LineSegments(linesGeometry, lineMaterial);
    points.frustumCulled = lines.frustumCulled = false;
    surface.frustumCulled = false;
    lines.renderOrder = 1;
    points.renderOrder = 2;
    scene.add(surface, lines, points);
  }

  function positionNodes(time) {
    positions.length = state.nodes.length;
    let near = -Infinity, far = Infinity;
    // Bounded analytic deformation preserves every connection, even after hours of motion.
    state.nodes.forEach((node, index) => {
      const { u, v, layer, seed } = node;
      const phase = u * Math.PI * 2;
      const fold = Math.sin(phase * 1.16 - time * 0.22 + layer * 2.4);
      const angle = v * 1.28 + fold * 0.72 + (layer ? -0.45 : 0.12);
      const centerY = Math.sin(phase * 1.08 - time * 0.19 + layer * 2.7) * 28;
      const centerZ = Math.cos(phase * 0.87 + time * 0.15 + layer * 2.8) * 60 - layer * 100;
      const x = (u - 0.5) * state.worldWidth * 1.18 + Math.sin(angle) * 12;
      const y = centerY + Math.sin(angle) * (layer ? 43 : 58);
      const z = centerZ + Math.cos(angle) * (layer ? 72 : 108);
      const light = Math.pow(0.5 + 0.5 * Math.cos(phase * 1.6 - time * 0.55 + v * 1.2), 5);
      const depth = clamp((z + 180) / 360, 0, 1);
      const alpha = (0.35 + depth * 0.5 + light * 0.15) * (layer ? 0.68 : 1);
      const tint = palette[layer];
      const pearl = 0.14 + light * 0.4 + seed * 0.08;
      positions[index] = {
        x, y, z, alpha, light, depth,
        size: 6.4 + seed * 2.6 + light * 3 + (seed > 0.94 ? 3 : 0),
        color: tint.map(value => value + (1 - value) * pearl)
      };
      near = Math.max(near, z); far = Math.min(far, z);
    });
    state.depthRange = [far, near];
  }

  function draw(time = state.time) {
    if (!state.width || !state.height || state.lost) return;
    positionNodes(time);
    if (fallback) { drawFallback(); return; }
    if (!renderer) return;
    const assign = (geometry, index, point, alpha = point.alpha) => {
      geometry.attributes.position.setXYZ(index, point.x, point.y, point.z);
      geometry.attributes.aColor.setXYZ(index, ...point.color);
      geometry.attributes.aAlpha.setX(index, alpha);
      geometry.attributes.aSize.setX(index, point.size);
    };
    positions.forEach((point, index) => assign(pointsGeometry, index, point));
    surfaceGeometry.computeVertexNormals();
    state.edges.forEach(([from, to, weight], index) => {
      for (const [endpoint, pointIndex] of [from, to].entries()) {
        const point = positions[pointIndex];
        const alpha = (0.08 + point.depth * 0.16 + point.light * 0.18) * weight * (state.nodes[pointIndex].layer ? 0.62 : 1);
        assign(linesGeometry, index * 2 + endpoint, point, alpha);
      }
    });
    for (const geometry of [pointsGeometry, linesGeometry]) {
      Object.values(geometry.attributes).forEach(attribute => { attribute.needsUpdate = true; });
    }
    state.cameraX += (state.pointerX * 12 - state.cameraX) * 0.035;
    state.cameraY += (state.pointerY * 7 - state.cameraY) * 0.035;
    camera.position.set(state.cameraX, 58 + state.cameraY, 620);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  function resize() {
    const parent = element.parentElement.getBoundingClientRect();
    element.style.width = `${document.documentElement.clientWidth}px`;
    element.style.marginLeft = `${-parent.left}px`;
    element.style.marginRight = "0px";
    const rect = element.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const changed = width !== state.width || height !== state.height || dpr !== state.dpr;
    state.width = width; state.height = height; state.dpr = dpr;
    state.worldWidth = 2 * 620 * Math.tan(26 * Math.PI / 360) * width / height;
    if (renderer) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      for (const material of [pointMaterial, lineMaterial, surfaceMaterial]) material.uniforms.uViewport.value.set(canvas.width, canvas.height);
      pointMaterial.uniforms.uDpr.value = dpr;
    } else if (fallback) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      fallback.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (changed || !state.nodes.length) buildTopology();
    draw(reducedMotion.matches || innerWidth <= 760 ? 0 : state.time);
    syncAnimation();
  }

  function tick(timestamp) {
    state.frame = 0;
    if (!canAnimate()) return;
    if (timestamp - state.lastFrame >= 1000 / 40) {
      state.time += state.lastFrame ? Math.min(timestamp - state.lastFrame, 70) / 1000 : 0;
      state.lastFrame = timestamp;
      draw();
    }
    state.frame = requestAnimationFrame(tick);
  }

  function syncAnimation() {
    if (canAnimate()) {
      if (!state.frame) { state.lastFrame = 0; state.frame = requestAnimationFrame(tick); }
    } else {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      if (state.visible) draw(reducedMotion.matches || innerWidth <= 760 ? 0 : state.time);
    }
  }

  function drawFallback() {
    const ctx = fallback;
    ctx.clearRect(0, 0, state.width, state.height);
    const projected = positions.map(point => ({
      x: state.width / 2 + point.x / state.worldWidth * state.width,
      y: state.height / 2 - point.y / 200 * state.height,
      fade: smooth((point.x / state.worldWidth + 0.5) / 0.08) * smooth((0.5 - point.x / state.worldWidth) / 0.08)
    }));
    state.edges.forEach(([a, b, weight]) => {
      const p = projected[a], q = projected[b];
      ctx.strokeStyle = `rgba(150,208,196,${0.16 * weight * Math.min(p.fade, q.fade)})`;
      ctx.lineWidth = 0.65;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    });
    projected.forEach((p, index) => {
      ctx.fillStyle = `rgba(${state.nodes[index].layer ? "215,193,150" : "192,230,218"},${p.fade * 0.7})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); ctx.fill();
    });
  }

  async function initialize() {
    if (state.loading || state.renderer !== "pending") return;
    state.loading = true;
    try {
      THREE = await import("../assets/vendor/three/three.module.js");
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: "low-power" });
      renderer.setClearColor(0x000000, 0);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(26, 1, 1, 1600);
      const vertex = `
        attribute vec3 aColor;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
      `;
      const fragment = `varying vec3 vColor; varying float vAlpha; ${edgeShader}`;
      surfaceMaterial = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uViewport: { value: new THREE.Vector2() } },
        vertexShader: `
          attribute vec3 aColor; varying vec3 vColor; varying vec3 vNormal;
          void main() {
            vColor = aColor; vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `varying vec3 vColor; varying vec3 vNormal; ${edgeShader}
          void main() {
            vec3 n = normalize(vNormal);
            float sheen = pow(abs(dot(n, normalize(vec3(-0.2, 0.8, 0.55)))), 12.0);
            float rim = pow(1.0 - abs(n.z), 3.0);
            gl_FragColor = vec4(mix(vColor, vec3(0.88, 0.97, 0.93), sheen), (0.008 + sheen * 0.055 + rim * 0.012) * edgeFade());
          }`
      });
      lineMaterial = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uViewport: { value: new THREE.Vector2() } },
        vertexShader: `${vertex} void main() { vColor = aColor; vAlpha = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `${fragment} void main() { gl_FragColor = vec4(vColor, vAlpha * edgeFade()); }`
      });
      pointMaterial = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uViewport: { value: new THREE.Vector2() }, uDpr: { value: 1 } },
        vertexShader: `${vertex}
          attribute float aSize; uniform float uDpr;
          void main() {
            vColor = aColor; vAlpha = aAlpha;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * uDpr * clamp(620.0 / -mv.z, 0.55, 1.8);
          }`,
        fragmentShader: `${fragment}
          void main() {
            vec2 p = gl_PointCoord * 2.0 - 1.0;
            float r = length(p);
            if (r > 1.0) discard;
            float halo = exp(-r * r * 6.5) * 0.2 * (1.0 - smoothstep(0.6, 1.0, r));
            float core = 1.0 - smoothstep(0.30, 0.44, r);
            vec2 sphere = p / 0.44;
            vec3 n = normalize(vec3(sphere.x, -sphere.y, sqrt(max(0.0, 1.0 - dot(sphere, sphere)))));
            float diffuse = max(0.0, dot(n, normalize(vec3(-0.5, 0.6, 1.0))));
            float specular = pow(max(0.0, dot(n, normalize(vec3(-0.35, 0.4, 1.0)))), 18.0);
            vec3 color = vColor * (0.38 + diffuse * 0.64) + vec3(specular * 0.7);
            gl_FragColor = vec4(mix(vColor, color, core), min(0.98, core + halo) * vAlpha * edgeFade());
          }`
      });
      state.renderer = "webgl";
      buildTopology();
      canvas.addEventListener("webglcontextlost", event => { event.preventDefault(); state.lost = true; syncAnimation(); });
      canvas.addEventListener("webglcontextrestored", () => { state.lost = false; resize(); });
    } catch (error) {
      console.warn("Footer WebGL unavailable; using a transparent static topology.", error);
      renderer?.dispose(); renderer = null;
      const replacement = canvas.cloneNode(false);
      canvas.replaceWith(replacement); canvas = replacement;
      fallback = canvas.getContext("2d");
      state.renderer = "fallback";
    }
    element.dataset.footerRenderer = state.renderer;
    resize();
  }

  const visibleObserver = new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    state.visibilityRatio = entry.intersectionRatio;
    if (state.visible) initialize();
    syncAnimation();
  }, { threshold: [0, 0.01, 0.25, 0.5, 1] });
  visibleObserver.observe(element);
  const preload = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { initialize(); preload.disconnect(); }
  }, { rootMargin: "500px 0px" });
  preload.observe(element);
  const observer = new ResizeObserver(resize);
  observer.observe(element);
  observer.observe(element.parentElement);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", syncAnimation);
  reducedMotion.addEventListener("change", () => { state.pointerX = state.pointerY = 0; resize(); });
  element.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse" || reducedMotion.matches) return;
    const rect = element.getBoundingClientRect();
    state.pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    state.pointerY = (event.clientY - rect.top) / rect.height - 0.5;
  });
  element.addEventListener("pointerleave", () => { state.pointerX = state.pointerY = 0; });
  window.__maccFooterField = {
    getState: () => ({
      renderer: state.renderer, drawnEdges: state.edges.length, visibleNodes: state.nodes.length,
      width: state.width, height: state.height, time: state.time, visibilityRatio: state.visibilityRatio,
      depthRange: state.depthRange, cameraX: state.cameraX, cameraY: state.cameraY, animating: Boolean(state.frame)
    }),
    renderAt: time => draw(time)
  };
  resize();
}
