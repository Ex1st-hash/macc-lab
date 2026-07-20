import { siteContent } from "./content.js";

const state = {
  navItems: siteContent.navigation,
  newsItems: siteContent.news.slice(0, 10),
  newsItemsPerPage: 2,
  newsPage: 0
};

const header = document.querySelector("[data-site-header]");
const navList = document.querySelector("[data-nav-list]");
const teamName = document.querySelector("[data-team-name]");
const teamEnglish = document.querySelector("[data-team-english]");
const teamSummary = document.querySelector("[data-team-summary]");
const siteMarkLabel = document.querySelector("[data-site-mark-label]");
const dockText = document.querySelector("[data-site-dock-text]");
const floatingMonogram = document.querySelector("[data-floating-monogram]");
const monogramDock = document.querySelector("[data-monogram-dock]");
const monogramOrigin = document.querySelector("[data-monogram-origin]");
const monogramTextNodes = document.querySelectorAll("[data-team-acronym]");
const newsList = document.querySelector("[data-news-list]");
const newsCount = document.querySelector("[data-news-count]");
const newsPage = document.querySelector("[data-news-page]");
const newsPrev = document.querySelector("[data-news-prev]");
const newsNext = document.querySelector("[data-news-next]");
const membersGrid = document.querySelector("[data-members-grid]");
const publicationsList = document.querySelector("[data-publications-list]");
const projectsGrid = document.querySelector("[data-projects-grid]");
const patentsList = document.querySelector("[data-patents-list]");
const awardsGrid = document.querySelector("[data-awards-grid]");
const heroSection = document.querySelector("#home");
const pageVisual = document.querySelector(".page-visual");
const pageVisualFrame = document.querySelector(".page-visual__frame");
const footerObserver = document.querySelector("[data-footer-observer]");
const footerCanvas = document.querySelector("[data-footer-canvas]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersFinePointer = window.matchMedia("(pointer: fine)");
const floatingMonogramSize = 116;

const runtime = {
  activeSectionId: "home",
  frameId: 0,
  pointerFrameId: 0,
  pointerX: 0,
  pointerY: 0
};

const geometry = {
  sections: [],
  heroTop: 0,
  heroHeight: 0,
  heroRange: 220,
  originAbsX: 0,
  originAbsY: 0,
  dockX: 0,
  dockY: 0,
  dockWidth: 40,
  footerTop: 0,
  footerHeight: 0,
  visualFrameHeight: 0,
  releaseStartLine: 0,
  releaseRange: 0,
  releaseMaxShift: 0
};

function renderNavigation() {
  navList.innerHTML = state.navItems
    .map(
      (item) => `
        <li>
          <a class="site-nav__link" href="#${item.id}" data-nav-link="${item.id}">
            ${item.label}
          </a>
        </li>
      `
    )
    .join("");
}

function renderHero() {
  if (siteContent.team.titleLines?.length) {
    teamName.innerHTML = siteContent.team.titleLines
      .map((line) => `<span>${line}</span>`)
      .join("");
  } else {
    teamName.textContent = siteContent.team.name;
  }

  teamEnglish.textContent = siteContent.team.englishName;
  teamSummary.textContent = siteContent.team.summary;
  siteMarkLabel.textContent = siteContent.team.markLabel;
  dockText.textContent = siteContent.team.acronym;
  monogramTextNodes.forEach((node) => {
    node.textContent = siteContent.team.acronym;
  });

  renderNews();
}

function renderNews() {
  const totalPages = Math.ceil(state.newsItems.length / state.newsItemsPerPage);
  const startIndex = state.newsPage * state.newsItemsPerPage;
  const visibleItems = state.newsItems.slice(startIndex, startIndex + state.newsItemsPerPage);

  newsList.innerHTML = visibleItems
    .map(
      (item) => `
        <li class="news-item">
          <span class="news-item__marker" aria-hidden="true"></span>
          <div>
            <div class="news-item__date">${item.date}</div>
            <div class="news-item__title">
              ${
                item.href
                  ? `<a class="news-item__title-link" href="${item.href}" target="_blank" rel="noreferrer">${item.title}</a>`
                  : item.title
              }
            </div>
            ${item.source ? `<div class="news-item__source">${item.source}</div>` : ""}
          </div>
        </li>
      `
    )
    .join("");

  newsCount.textContent = `${state.newsItems.length} items`;
  newsPage.textContent = `Page ${state.newsPage + 1} / ${totalPages}`;
  newsPrev.disabled = state.newsPage === 0;
  newsNext.disabled = state.newsPage >= totalPages - 1;
}

function bindNewsPager() {
  const transitionNews = async (targetPage) => {
    const totalPages = Math.ceil(state.newsItems.length / state.newsItemsPerPage);
    const boundedTarget = clamp(targetPage, 0, totalPages - 1);
    if (boundedTarget === state.newsPage) {
      return;
    }

    const direction = boundedTarget > state.newsPage ? 1 : -1;
    newsList.classList.add("is-transitioning");

    const exitAnimation = newsList.animate(
      [
        { opacity: 1, transform: "translateY(0px)" },
        { opacity: 0, transform: `translateY(${direction * -14}px)` }
      ],
      {
        duration: 220,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards"
      }
    );

    try {
      await exitAnimation.finished;
    } catch {
      // Ignore aborted animations.
    }

    state.newsPage = boundedTarget;
    renderNews();

    newsList.animate(
      [
        { opacity: 0, transform: `translateY(${direction * 14}px)` },
        { opacity: 1, transform: "translateY(0px)" }
      ],
      {
        duration: 280,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both"
      }
    );

    newsList.classList.remove("is-transitioning");
  };

  newsPrev.addEventListener("click", () => {
    transitionNews(state.newsPage - 1);
  });

  newsNext.addEventListener("click", () => {
    transitionNews(state.newsPage + 1);
  });
}

function renderMembers() {
  membersGrid.innerHTML = siteContent.members
    .map(
      (member) => `
        <article class="member-card" style="--avatar-hue: ${member.hue}">
          <div class="member-card__portrait" aria-hidden="true">
            <span class="member-card__portrait-tag">Portrait Slot</span>
            <span class="member-card__portrait-mark">${member.initials}</span>
          </div>
          <div class="member-card__content">
            <p class="member-card__group">${member.group}</p>
            <h3 class="member-card__name">
              ${
                member.href
                  ? `<a href="${member.href}" target="_blank" rel="noreferrer">${member.name}</a>`
                  : member.name
              }
            </h3>
            <p class="member-card__role">${member.role}</p>
            <p class="member-card__bio">${member.bio}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderStackList(items, container) {
  container.innerHTML = items
    .map(
      (item) => `
        <article class="stack-item">
          <div class="stack-item__meta">${item.meta}</div>
          <div>
            <h3 class="stack-item__title">
              ${
                item.href
                  ? `<a href="${item.href}" target="_blank" rel="noreferrer">${item.title}</a>`
                  : item.title
              }
            </h3>
            <p class="stack-item__summary">${item.summary}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderCardGrid(items, container, cardClass) {
  container.innerHTML = items
    .map(
      (item) => `
        <article class="${cardClass}">
          <h3 class="${cardClass}__title">
            ${
              item.href
                ? `<a href="${item.href}" target="_blank" rel="noreferrer">${item.title}</a>`
                : item.title
            }
          </h3>
          <p class="${cardClass}__meta">${item.meta}</p>
          <p class="${cardClass}__summary">${item.summary}</p>
        </article>
      `
    )
    .join("");
}

function bindActiveNavigation() {
  const sections = [...document.querySelectorAll("[data-section]")];
  const links = [...document.querySelectorAll("[data-nav-link]")];

  const setActive = (id) => {
    links.forEach((link) => {
      const active = link.dataset.navLink === id;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  geometry.sections = sections.map((section) => ({
    id: section.dataset.section,
    offsetTop: section.offsetTop
  }));

  const updateActive = () => {
    const currentY = window.scrollY + header.offsetHeight + 48;
    let currentId = geometry.sections[0]?.id ?? "home";

    geometry.sections.forEach((section) => {
      if (currentY >= section.offsetTop) {
        currentId = section.id;
      }
    });

    if (currentId !== runtime.activeSectionId) {
      runtime.activeSectionId = currentId;
      setActive(currentId);
    }
  };

  window.addEventListener("hashchange", scheduleVisualFrame);

  links.forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(scheduleVisualFrame, 60);
    });
  });

  updateActive();
  return updateActive;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeInOut(progress) {
  return progress * progress * (3 - 2 * progress);
}

function cacheLayoutMetrics() {
  const originRect = monogramOrigin?.getBoundingClientRect();
  const dockRect = monogramDock?.getBoundingClientRect();

  geometry.heroTop = heroSection?.offsetTop ?? 0;
  geometry.heroHeight = heroSection?.offsetHeight ?? 0;
  geometry.heroRange = Math.max(220, geometry.heroHeight * 0.42);

  if (originRect) {
    geometry.originAbsX = originRect.left + window.scrollX + originRect.width / 2;
    geometry.originAbsY = originRect.top + window.scrollY + originRect.height / 2;
  }

  if (dockRect) {
    geometry.dockX = dockRect.left + dockRect.width / 2;
    geometry.dockY = dockRect.top + dockRect.height / 2;
    geometry.dockWidth = dockRect.width;
  }

  if (pageVisualFrame) {
    geometry.visualFrameHeight = pageVisualFrame.getBoundingClientRect().height;
  }

  if (footerObserver) {
    const footerRect = footerObserver.getBoundingClientRect();
    geometry.footerTop = footerRect.top + window.scrollY;
    geometry.footerHeight = footerRect.height;
  }

  geometry.releaseStartLine = window.innerHeight * 0.88;
  geometry.releaseRange = Math.max(window.innerHeight * 0.5, 320);
  geometry.releaseMaxShift = Math.max(geometry.visualFrameHeight * 0.08, 36);

  geometry.sections = [...document.querySelectorAll("[data-section]")].map((section) => ({
    id: section.dataset.section,
    offsetTop: section.offsetTop
  }));
}

function updatePageVisualRelease() {
  if (!pageVisual || !footerObserver) {
    return;
  }

  if (window.innerWidth <= 760) {
    pageVisual.style.setProperty("--visual-release-y", "0px");
    pageVisual.style.setProperty("--visual-opacity", "1");
    return;
  }

  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const remaining = Math.max(maxScroll - window.scrollY, 0);
  const fadeRange = Math.max(window.innerHeight * 0.7, geometry.footerHeight * 1.5, 360);
  const progress = clamp(1 - remaining / fadeRange, 0, 1);
  const eased = easeInOut(progress);
  const shiftY = -geometry.releaseMaxShift * eased;
  const opacity = 1 - eased;
  pageVisual.style.setProperty("--visual-release-y", `${shiftY.toFixed(2)}px`);
  pageVisual.style.setProperty("--visual-opacity", `${opacity.toFixed(3)}`);
}

function updateFloatingMonogram() {
  if (!floatingMonogram || !monogramDock || !monogramOrigin || !heroSection) {
    return;
  }

  if (window.innerWidth <= 760) {
    floatingMonogram.style.transform = "translate(-999px, -999px)";
    floatingMonogram.style.opacity = "0";
    header.classList.add("is-monogram-docked");
    return;
  }

  const rawProgress = clamp((window.scrollY - geometry.heroTop) / geometry.heroRange, 0, 1);
  const progress = easeInOut(rawProgress);

  const originX = geometry.originAbsX - window.scrollX;
  const originY = geometry.originAbsY - window.scrollY;
  const dockX = geometry.dockX;
  const dockY = geometry.dockY;
  const x = originX + (dockX - originX) * progress;
  const y = originY + (dockY - originY) * progress;
  const targetScale = geometry.dockWidth / floatingMonogramSize;
  const scale = 1 + (targetScale - 1) * progress;
  const docked = rawProgress > 0.985;

  floatingMonogram.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
  floatingMonogram.style.opacity = docked ? "0" : `${1 - rawProgress * 0.12}`;
  header.classList.toggle("is-monogram-docked", rawProgress > 0.9);
}

function bindPointerVisualResponse() {
  if (prefersReducedMotion.matches || !prefersFinePointer.matches) {
    document.documentElement.style.setProperty("--pointer-x", "0");
    document.documentElement.style.setProperty("--pointer-y", "0");
    return;
  }

  const flushPointer = () => {
    runtime.pointerFrameId = 0;
    document.documentElement.style.setProperty("--pointer-x", runtime.pointerX.toFixed(4));
    document.documentElement.style.setProperty("--pointer-y", runtime.pointerY.toFixed(4));
  };

  const updatePointer = (event) => {
    runtime.pointerX = event.clientX / window.innerWidth - 0.5;
    runtime.pointerY = event.clientY / window.innerHeight - 0.5;

    if (!runtime.pointerFrameId) {
      runtime.pointerFrameId = window.requestAnimationFrame(flushPointer);
    }
  };

  const resetPointer = () => {
    runtime.pointerX = 0;
    runtime.pointerY = 0;

    if (!runtime.pointerFrameId) {
      runtime.pointerFrameId = window.requestAnimationFrame(flushPointer);
    }
  };

  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("pointerleave", resetPointer);
  resetPointer();
}

function scheduleVisualFrame() {
  if (runtime.frameId) {
    return;
  }

  runtime.frameId = window.requestAnimationFrame(() => {
    runtime.frameId = 0;
    updateFloatingMonogram();
    updatePageVisualRelease();
    runtime.updateActiveNavigation?.();
  });
}

function bindFloatingMonogram() {
  cacheLayoutMetrics();
  updateFloatingMonogram();
  window.addEventListener("scroll", scheduleVisualFrame, { passive: true });
  window.addEventListener("resize", () => {
    cacheLayoutMetrics();
    scheduleVisualFrame();
  });
}

function bindFooterObserverField() {
  if (!footerObserver || !footerCanvas) {
    return;
  }

  const context = footerCanvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!context) {
    return;
  }

  const field = {
    canvas: footerCanvas,
    context,
    width: 0,
    height: 0,
    dpr: 1,
    nodes: [],
    edges: [],
    visible: false,
    rafId: 0,
    resizeObserver: null,
    intersectionObserver: null,
    worldWidth: 0,
    worldHeight: 0,
    columns: 0,
    rows: 0,
    xGap: 0,
    yGap: 0,
    bufferColumns: 3,
    perspective: 360,
    drift: 0,
    tickTime: 0,
    lastTime: 0,
    energyClusters: [],
    lastDrawnEdges: 0,
    lastVisibleNodes: 0
  };

  const shouldAnimate = () =>
    field.visible &&
    document.visibilityState === "visible" &&
    !prefersReducedMotion.matches &&
    window.innerWidth > 760;

  const clampInt = (value, min, max) => Math.min(Math.max(value, min), max);
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const mix = (a, b, t) => a + (b - a) * t;

  const wrap = (value, span) => {
    if (span <= 0) {
      return value;
    }
    return ((value % span) + span) % span;
  };

  const rebuildField = () => {
    field.nodes = [];
    field.edges = [];
    const visibleColumns = clampInt(Math.round(field.width / 64), 18, 28);
    field.rows = clampInt(Math.round(field.height / 24), 5, 7);
    field.xGap = field.width / Math.max(visibleColumns - 1, 1);
    field.columns = visibleColumns;
    field.columns += field.bufferColumns * 2;
    field.worldWidth = field.xGap * field.columns;
    field.worldHeight = Math.max(field.height * 1.28, field.rows * 30);
    field.yGap = field.worldHeight / Math.max(field.rows - 1, 1);
    const spanLeft = -field.width * 0.5 - field.bufferColumns * field.xGap;

    for (let row = 0; row < field.rows; row += 1) {
      const rowRatio = field.rows === 1 ? 0.5 : row / (field.rows - 1);

      for (let col = 0; col < field.columns; col += 1) {
        const colRatio = col / Math.max(field.columns - 1, 1);
        const lateralWave = Math.sin(colRatio * Math.PI * 2.1 + row * 0.44) * 7;
        const verticalWave = Math.sin(col * 0.56 + row * 0.82) * 4.8;

        field.nodes.push({
          baseX: spanLeft + col * field.xGap + lateralWave,
          baseY: row * field.yGap - field.worldHeight * 0.5 + verticalWave,
          radius: 1.55 + Math.random() * 1.4,
          phaseA: Math.random() * Math.PI * 2,
          phaseB: Math.random() * Math.PI * 2,
          phaseZ: Math.random() * Math.PI * 2,
          waveX: 3 + Math.random() * 9,
          waveY: 4 + Math.random() * 8,
          waveZ: 16 + Math.random() * 28,
          depthBias: mix(-34, 148, rowRatio * 0.5 + Math.random() * 0.5),
          driftFactor: 0.72 + Math.random() * 0.58,
          bias: 0.55 + Math.random() * 0.45
        });
      }
    }

    const nodeIndex = (row, col) => row * field.columns + col;

    for (let row = 0; row < field.rows; row += 1) {
      for (let col = 0; col < field.columns; col += 1) {
        const source = nodeIndex(row, col);

        if (col < field.columns - 1) {
          field.edges.push([source, nodeIndex(row, col + 1), 0.84]);
        }

        if (row < field.rows - 1) {
          field.edges.push([source, nodeIndex(row + 1, col), 0.66]);

          if (col < field.columns - 1 && ((row + col) % 2 === 0 || Math.random() > 0.34)) {
            field.edges.push([source, nodeIndex(row + 1, col + 1), 0.56]);
          }
        }

        if (row > 0 && col < field.columns - 1 && ((row + col) % 3 === 0 || Math.random() > 0.68)) {
          field.edges.push([source, nodeIndex(row - 1, col + 1), 0.46]);
        }

        if (col < field.columns - 2 && ((row + col) % 2 === 0 || Math.random() > 0.58)) {
          field.edges.push([source, nodeIndex(row, col + 2), 0.28]);
        }
      }
    }

    field.energyClusters = [
      {
        x: field.width * 0.08,
        yRatio: 0.44,
        speed: field.width * 0.028,
        radiusX: field.width * 0.095,
        radiusY: field.height * 0.52,
        strength: 0.84,
        phase: Math.random() * Math.PI * 2,
        sway: field.height * 0.08
      },
      {
        x: field.width * 0.36,
        yRatio: 0.58,
        speed: field.width * 0.019,
        radiusX: field.width * 0.13,
        radiusY: field.height * 0.46,
        strength: 0.62,
        phase: Math.random() * Math.PI * 2,
        sway: field.height * 0.11
      },
      {
        x: field.width * 0.68,
        yRatio: 0.40,
        speed: field.width * 0.024,
        radiusX: field.width * 0.11,
        radiusY: field.height * 0.48,
        strength: 0.71,
        phase: Math.random() * Math.PI * 2,
        sway: field.height * 0.07
      },
      {
        x: field.width * 0.92,
        yRatio: 0.54,
        speed: field.width * 0.016,
        radiusX: field.width * 0.09,
        radiusY: field.height * 0.42,
        strength: 0.58,
        phase: Math.random() * Math.PI * 2,
        sway: field.height * 0.06
      }
    ];
  };

  const resizeField = () => {
    const parentRect = footerObserver.parentElement?.getBoundingClientRect();
    if (parentRect) {
      footerObserver.style.width = `${document.documentElement.clientWidth}px`;
      footerObserver.style.marginLeft = `${-parentRect.left}px`;
      footerObserver.style.marginRight = "0px";
    }

    const rect = footerObserver.getBoundingClientRect();
    field.width = Math.max(1, Math.floor(rect.width));
    field.height = Math.max(1, Math.floor(rect.height));
    field.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    field.canvas.width = Math.max(1, Math.floor(field.width * field.dpr));
    field.canvas.height = Math.max(1, Math.floor(field.height * field.dpr));
    field.canvas.style.width = `${field.width}px`;
    field.canvas.style.height = `${field.height}px`;
    field.context.setTransform(field.dpr, 0, 0, field.dpr, 0, 0);
    rebuildField();
    drawField(performance.now(), true);
  };

  const computeNodePositions = (timeMs) => {
    const positions = [];
    const span = field.worldWidth;

    for (const node of field.nodes) {
      const wrappedX =
        wrap(node.baseX + field.drift * node.driftFactor + field.worldWidth * 0.5, span) -
        field.worldWidth * 0.5;
      const worldX =
        wrappedX +
        Math.sin(timeMs * 0.00021 + node.phaseA) * node.waveX +
        Math.sin(timeMs * 0.00043 + node.phaseB) * 0.9;
      const worldY =
        node.baseY +
        Math.sin(timeMs * 0.00023 + node.phaseB) * node.waveY +
        Math.cos(timeMs * 0.00037 + node.phaseA) * 1.8;
      const z =
        node.depthBias +
        Math.sin(timeMs * 0.00018 + node.phaseZ) * node.waveZ +
        Math.cos(timeMs * 0.00041 + node.phaseA) * 5.4;
      const perspective = field.perspective / (field.perspective + z);
      const x = field.width * 0.5 + worldX * perspective;
      const y =
        field.height * 0.5 +
        worldY * perspective +
        Math.sin(timeMs * 0.00016 + node.phaseZ + worldX * 0.0045) * 1.25;

      let energy = 0;
      for (const cluster of field.energyClusters) {
        const clusterY =
          field.height * cluster.yRatio +
          Math.sin(timeMs * 0.00032 + cluster.phase) * cluster.sway;
        const dx = x - cluster.x;
        const dy = y - clusterY;
        const breath = 0.72 + 0.28 * Math.sin(timeMs * 0.0012 + cluster.phase);
        const horizontal = (dx * dx) / (2 * cluster.radiusX * cluster.radiusX);
        const vertical = (dy * dy) / (2 * cluster.radiusY * cluster.radiusY);
        energy += cluster.strength * breath * Math.exp(-(horizontal + vertical));
      }

      positions.push({
        x,
        y,
        z,
        perspective,
        radius: node.radius * perspective + energy * 1.15,
        energy,
        bias: node.bias,
        depthAlpha: mix(0.3, 0.98, clamp(1 - (z + 48) / 248, 0, 1)),
        shimmer: 0.34 + 0.28 * Math.sin(timeMs * 0.0011 + node.phaseA)
      });
    }

    return positions;
  };

  function drawField(timeMs, forceStatic = false) {
    if (!field.width || !field.height) {
      return;
    }

    const ctx = field.context;
    ctx.clearRect(0, 0, field.width, field.height);

    const positions = computeNodePositions(forceStatic ? 0 : timeMs);
    field.lastDrawnEdges = 0;
    field.lastVisibleNodes = positions.filter(
      (point) =>
        point.x > -field.xGap * 1.4 &&
        point.x < field.width + field.xGap * 1.4 &&
        point.y > -field.yGap &&
        point.y < field.height + field.yGap
    ).length;

    for (const cluster of field.energyClusters) {
      const clusterY =
        field.height * cluster.yRatio +
        Math.sin((forceStatic ? 0 : timeMs) * 0.00032 + cluster.phase) * cluster.sway;
      const breath = 0.72 + 0.28 * Math.sin((forceStatic ? 0 : timeMs) * 0.0012 + cluster.phase);
      const radiusX = cluster.radiusX * (0.88 + breath * 0.18);
      const radiusY = cluster.radiusY * (0.9 + breath * 0.16);

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cluster.x, clusterY, radiusX, radiusY, cluster.phase * 0.12, 0, Math.PI * 2);
      ctx.clip();

      const gradient = ctx.createRadialGradient(cluster.x, clusterY, 0, cluster.x, clusterY, radiusX);
      gradient.addColorStop(0, `rgba(248, 250, 252, ${(0.16 * cluster.strength * breath).toFixed(3)})`);
      gradient.addColorStop(0.38, `rgba(238, 244, 246, ${(0.08 * cluster.strength * breath).toFixed(3)})`);
      gradient.addColorStop(1, "rgba(238, 244, 246, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(cluster.x - radiusX, clusterY - radiusY, radiusX * 2, radiusY * 2);
      ctx.restore();
    }

    for (const [sourceIndex, targetIndex, weight] of field.edges) {
      const source = positions[sourceIndex];
      const target = positions[targetIndex];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const depthDelta = Math.abs(source.z - target.z);
      const screenDistance = Math.hypot(dx, dy);
      const outOfBoundsMarginX = field.xGap * 1.8;
      const outOfBoundsMarginY = field.yGap * 1.5;

      if (
        (source.x < -outOfBoundsMarginX && target.x < -outOfBoundsMarginX) ||
        (source.x > field.width + outOfBoundsMarginX && target.x > field.width + outOfBoundsMarginX) ||
        (source.y < -outOfBoundsMarginY && target.y < -outOfBoundsMarginY) ||
        (source.y > field.height + outOfBoundsMarginY && target.y > field.height + outOfBoundsMarginY)
      ) {
        continue;
      }

      if (Math.abs(dy) > field.yGap * 2.45 || depthDelta > 168 || screenDistance > field.xGap * 2.7) {
        continue;
      }

      const energy = Math.min((source.energy + target.energy) * 0.5, 1.5);
      const alpha =
        0.052 +
        weight * 0.06 +
        ((source.depthAlpha + target.depthAlpha) * 0.5) * 0.07 +
        energy * 0.11;
      ctx.strokeStyle = `rgba(241, 245, 247, ${Math.min(alpha, 0.36).toFixed(3)})`;
      ctx.lineWidth = 0.52 + weight * 0.42 + energy * 0.24;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      field.lastDrawnEdges += 1;
    }

    const depthSorted = [...positions].sort((a, b) => b.z - a.z);

    for (const point of depthSorted) {
      const alpha =
        0.18 +
        point.depthAlpha * 0.24 +
        point.shimmer * 0.14 +
        Math.min(point.energy, 1.15) * 0.46;
      const glow = 1.6 + point.perspective * 2.8 + point.energy * 7.4;

      ctx.beginPath();
      ctx.fillStyle = `rgba(245, 247, 248, ${Math.min(alpha, 0.92).toFixed(3)})`;
      ctx.shadowColor = `rgba(255, 255, 255, ${Math.min(0.2 + point.energy * 0.48, 0.82).toFixed(3)})`;
      ctx.shadowBlur = glow;
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  const tick = (timeMs) => {
    field.rafId = 0;

    if (!shouldAnimate()) {
      drawField(timeMs, true);
      return;
    }

    const deltaMs = field.lastTime ? Math.min(timeMs - field.lastTime, 40) : 16;
    field.lastTime = timeMs;
    field.tickTime += deltaMs;
    field.drift -= deltaMs * 0.022;

    for (const cluster of field.energyClusters) {
      cluster.x += cluster.speed * (deltaMs / 1000);
      if (cluster.x - cluster.radiusX > field.width + cluster.radiusX * 0.22) {
        cluster.x = -cluster.radiusX * 1.24;
      }
    }

    drawField(field.tickTime);
    field.rafId = window.requestAnimationFrame(tick);
  };

  const syncFieldAnimation = () => {
    if (shouldAnimate()) {
      if (!field.rafId) {
        field.lastTime = 0;
        field.rafId = window.requestAnimationFrame(tick);
      }
    } else if (field.rafId) {
      window.cancelAnimationFrame(field.rafId);
      field.rafId = 0;
      drawField(performance.now(), true);
    } else {
      drawField(performance.now(), true);
    }
  };

  field.intersectionObserver = new IntersectionObserver(
    (entries) => {
      field.visible = entries[0]?.isIntersecting ?? false;
      syncFieldAnimation();
    },
    { threshold: 0.18 }
  );
  field.intersectionObserver.observe(footerObserver);

  if ("ResizeObserver" in window) {
    field.resizeObserver = new ResizeObserver(() => {
      resizeField();
      syncFieldAnimation();
    });
    field.resizeObserver.observe(footerObserver);
  } else {
    window.addEventListener("resize", resizeField);
  }

  document.addEventListener("visibilitychange", syncFieldAnimation);
  window.__maccFooterField = {
    getState: () => ({
      drawnEdges: field.lastDrawnEdges,
      visibleNodes: field.lastVisibleNodes,
      clusters: field.energyClusters.map((cluster) => ({
        x: Number(cluster.x.toFixed(2)),
        yRatio: cluster.yRatio,
        radiusX: Number(cluster.radiusX.toFixed(2)),
        radiusY: Number(cluster.radiusY.toFixed(2))
      }))
    })
  };
  resizeField();
  syncFieldAnimation();
}

function init() {
  renderNavigation();
  renderHero();
  bindNewsPager();
  renderMembers();
  renderStackList(siteContent.publications, publicationsList);
  renderCardGrid(siteContent.projects, projectsGrid, "project-card");
  renderStackList(siteContent.patents, patentsList);
  renderCardGrid(siteContent.awards, awardsGrid, "award-card");
  runtime.updateActiveNavigation = bindActiveNavigation();
  bindPointerVisualResponse();
  bindFloatingMonogram();
  bindFooterObserverField();
  cacheLayoutMetrics();
  updatePageVisualRelease();
  scheduleVisualFrame();
}

init();
