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
  pointerY: 0,
  visualStateTimer: 0,
  visualTargetId: "home"
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
      (item, index) => `
        <li class="news-item${index === 0 ? " news-item--lead" : ""}">
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
      (member) => {
        const portraitStyle = [];

        if (member.image) {
          portraitStyle.push(`--portrait-image: url('${member.image}')`);
        }

        if (member.portraitPosition) {
          portraitStyle.push(`--portrait-position: ${member.portraitPosition}`);
        }

        if (member.portraitBackdropPosition) {
          portraitStyle.push(`--portrait-backdrop-position: ${member.portraitBackdropPosition}`);
        }

        if (member.portraitScale) {
          portraitStyle.push(`--portrait-scale: ${member.portraitScale}`);
        }

        const portraitStyleAttribute = portraitStyle.length
          ? ` style="${portraitStyle.join("; ")}"`
          : "";

        return `
        <article class="member-card${member.image ? " member-card--has-image" : ""}" style="--avatar-hue: ${member.hue}">
          <div class="member-card__portrait" aria-hidden="true"${portraitStyleAttribute}>
            ${
              member.image
                ? `
                  <div class="member-card__portrait-backdrop"></div>
                  <div class="member-card__portrait-cutout">
                    <img class="member-card__portrait-image" src="${member.image}" alt="${member.name}" loading="lazy" referrerpolicy="no-referrer" />
                  </div>
                `
                : ""
            }
            <span class="member-card__portrait-tag">${member.group}</span>
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
      `;
      }
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

  const updatePageVisualState = (id, options = {}) => {
    if (!pageVisual) {
      return;
    }

    const immediate = options.immediate || prefersReducedMotion.matches || window.innerWidth <= 760;
    const targetId = id || "home";

    if (runtime.visualTargetId === targetId && !immediate) {
      return;
    }

    runtime.visualTargetId = targetId;

    if (runtime.visualStateTimer) {
      window.clearTimeout(runtime.visualStateTimer);
      runtime.visualStateTimer = 0;
    }

    if (immediate) {
      pageVisual.dataset.visualPhase = "settled";
      pageVisual.dataset.visualState = targetId;
      return;
    }

    pageVisual.dataset.visualPhase = "rest";

    runtime.visualStateTimer = window.setTimeout(() => {
      pageVisual.dataset.visualState = targetId;
      pageVisual.dataset.visualPhase = "settled";
      runtime.visualStateTimer = 0;
    }, 160);
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
      updatePageVisualState(currentId);
    }
  };

  window.addEventListener("hashchange", scheduleVisualFrame);

  links.forEach((link) => {
    link.addEventListener("click", () => {
      window.setTimeout(scheduleVisualFrame, 60);
    });
  });

  updateActive();
  updatePageVisualState(runtime.activeSectionId, { immediate: true });
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
    columns: 0,
    rows: 0,
    xGap: 0,
    yGap: 0,
    bufferColumns: 2,
    perspective: 780,
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
  const tau = Math.PI * 2;
  const addEdge = (edgeSet, source, target, weight) => {
    const key = source < target ? `${source}:${target}` : `${target}:${source}`;
    if (edgeSet.has(key)) {
      return;
    }

    edgeSet.add(key);
    field.edges.push([source, target, weight]);
  };

  const rebuildField = () => {
    field.nodes = [];
    field.edges = [];
    const edgeSet = new Set();
    const visibleColumns = clampInt(Math.round(field.width / 72), 18, 28);
    field.rows = clampInt(Math.round(field.height / 22), 6, 8);
    field.xGap = field.width / Math.max(visibleColumns - 1, 1);
    field.yGap = field.height / Math.max(field.rows - 1, 1);
    field.columns = visibleColumns + field.bufferColumns * 2;
    const startX = -field.bufferColumns * field.xGap;
    const startY = 0;

    for (let row = 0; row < field.rows; row += 1) {
      const rowRatio = field.rows === 1 ? 0.5 : row / (field.rows - 1);

      for (let col = 0; col < field.columns; col += 1) {
        const colRatio = col / Math.max(field.columns - 1, 1);
        const stagger =
          (row % 2 === 0 ? 1 : -1) * field.xGap * (0.12 + 0.03 * Math.sin(row * 0.86 + colRatio * 3.1));
        const rowSkew = Math.sin((rowRatio - 0.5) * Math.PI) * field.xGap * 0.14;
        const warpX =
          Math.sin(colRatio * tau * 0.94 + row * 0.53) * 10.5 +
          Math.cos(col * 0.47 - row * 0.37) * 5.8 +
          Math.sin((col + row) * 0.18) * 3.8;
        const baseY =
          startY +
          row * field.yGap +
          Math.sin(col * 0.31 + row * 0.82) * 5.8 +
          Math.cos(colRatio * tau * 1.18 - row * 0.44) * 3.6 +
          Math.sin((col - row) * 0.26) * 2.4 +
          Math.sin(colRatio * Math.PI * 1.15) * (rowRatio - 0.5) * 9.5;

        field.nodes.push({
          baseX: startX + col * field.xGap + stagger + rowSkew + warpX,
          baseY,
          radius: 1.35 + Math.random() * 1.08,
          phaseA: Math.random() * Math.PI * 2,
          phaseB: Math.random() * Math.PI * 2,
          phaseZ: Math.random() * Math.PI * 2,
          offsetX: 1.8 + Math.random() * 4.4,
          offsetY: 2.1 + Math.random() * 4.2,
          depthWave: 14 + Math.random() * 18,
          depthBias: mix(-12, 76, rowRatio * 0.68 + Math.random() * 0.18),
          bias: 0.55 + Math.random() * 0.45
        });
      }
    }

    const nodeIndex = (row, col) => row * field.columns + col;

    for (let row = 0; row < field.rows; row += 1) {
      for (let col = 0; col < field.columns; col += 1) {
        const source = nodeIndex(row, col);

        if (col < field.columns - 1) {
          addEdge(edgeSet, source, nodeIndex(row, col + 1), 0.82);
        }

        if (row < field.rows - 1) {
          addEdge(edgeSet, source, nodeIndex(row + 1, col), 0.64);

          if (col < field.columns - 1) {
            if ((row + col) % 2 === 0) {
              addEdge(edgeSet, source, nodeIndex(row + 1, col + 1), 0.58);
            } else {
              addEdge(edgeSet, nodeIndex(row, col + 1), nodeIndex(row + 1, col), 0.58);
            }
          }
        }

        if (col < field.columns - 2 && row < field.rows - 1 && (row + col) % 3 === 0) {
          addEdge(edgeSet, source, nodeIndex(row, col + 2), 0.24);
        }
      }
    }

    field.energyClusters = [
      {
        x: field.width * 0.04,
        yRatio: 0.3,
        speed: field.width * 0.022,
        radiusX: field.width * 0.11,
        radiusY: field.height * 0.34,
        strength: 0.74,
        phase: Math.random() * Math.PI * 2,
        sway: field.height * 0.1,
        angle: -0.2
      },
      {
        x: field.width * 0.23,
        yRatio: 0.68,
        speed: field.width * 0.017,
        radiusX: field.width * 0.12,
        radiusY: field.height * 0.27,
        strength: 0.62,
        phase: Math.random() * Math.PI * 2,
        sway: field.height * 0.08,
        angle: 0.18
      },
      {
        x: field.width * 0.48,
        yRatio: 0.45,
        speed: field.width * 0.02,
        radiusX: field.width * 0.105,
        radiusY: field.height * 0.3,
        strength: 0.7,
        phase: Math.random() * Math.PI * 2,
        sway: field.height * 0.09,
        angle: -0.1
      },
      {
        x: field.width * 0.71,
        yRatio: 0.61,
        speed: field.width * 0.018,
        radiusX: field.width * 0.115,
        radiusY: field.height * 0.29,
        strength: 0.66,
        phase: Math.random() * Math.PI * 2,
        sway: field.height * 0.08,
        angle: 0.15
      },
      {
        x: field.width * 0.92,
        yRatio: 0.36,
        speed: field.width * 0.021,
        radiusX: field.width * 0.1,
        radiusY: field.height * 0.32,
        strength: 0.72,
        phase: Math.random() * Math.PI * 2,
        sway: field.height * 0.09,
        angle: -0.22
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
    const span = field.xGap * Math.max(field.columns - 1, 1);

    for (const node of field.nodes) {
      let worldX = node.baseX + field.drift;
      while (worldX < -field.bufferColumns * field.xGap) {
        worldX += span;
      }
      while (worldX > field.width + field.bufferColumns * field.xGap) {
        worldX -= span;
      }

      worldX +=
        Math.sin(timeMs * 0.00018 + node.phaseA) * node.offsetX +
        Math.cos(timeMs * 0.00029 + node.phaseB) * 0.8;
      const worldY =
        node.baseY +
        Math.sin(timeMs * 0.00022 + node.phaseB) * node.offsetY +
        Math.cos(timeMs * 0.00031 + node.phaseA) * 1.1;
      const z =
        node.depthBias +
        Math.sin(timeMs * 0.00017 + node.phaseZ) * node.depthWave +
        Math.cos(timeMs * 0.00026 + node.phaseA) * 4.6;
      const perspective = field.perspective / (field.perspective + z);
      const centeredX = worldX - field.width * 0.5;
      const centeredY = worldY - field.height * 0.5;
      const x = field.width * 0.5 + centeredX * perspective;
      const y = field.height * 0.5 + centeredY * perspective;

      let energy = 0;
      for (const cluster of field.energyClusters) {
        const clusterY =
          field.height * cluster.yRatio +
          Math.sin(timeMs * 0.0003 + cluster.phase) * cluster.sway;
        const dx = x - cluster.x;
        const dy = y - clusterY;
        const cosAngle = Math.cos(cluster.angle);
        const sinAngle = Math.sin(cluster.angle);
        const localX = dx * cosAngle + dy * sinAngle;
        const localY = -dx * sinAngle + dy * cosAngle;
        const breath = 0.68 + 0.32 * Math.sin(timeMs * 0.0013 + cluster.phase);
        const horizontal = (localX * localX) / (2 * cluster.radiusX * cluster.radiusX);
        const vertical = (localY * localY) / (2 * cluster.radiusY * cluster.radiusY);
        energy += cluster.strength * breath * Math.exp(-(horizontal + vertical));
      }

      positions.push({
        x,
        y,
        z,
        perspective,
        radius: node.radius * perspective + energy * 0.92,
        energy,
        bias: node.bias,
        depthAlpha: mix(0.34, 0.96, clamp(1 - (z + 18) / 138, 0, 1)),
        shimmer: 0.28 + 0.2 * Math.sin(timeMs * 0.001 + node.phaseA)
      });
    }

    return positions;
  };

  const drawCluster = (cluster, timeMs, forceStatic = false) => {
    const ctx = field.context;
    const clusterY =
      field.height * cluster.yRatio +
      Math.sin((forceStatic ? 0 : timeMs) * 0.0003 + cluster.phase) * cluster.sway;
    const breath = 0.7 + 0.3 * Math.sin((forceStatic ? 0 : timeMs) * 0.0013 + cluster.phase);
    const radiusX = cluster.radiusX * (0.88 + breath * 0.22);
    const radiusY = cluster.radiusY * (0.92 + breath * 0.18);

    ctx.save();
    ctx.translate(cluster.x, clusterY);
    ctx.rotate(cluster.angle);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    gradient.addColorStop(0, `rgba(250, 252, 255, ${(0.2 * cluster.strength * breath).toFixed(3)})`);
    gradient.addColorStop(0.42, `rgba(241, 247, 249, ${(0.11 * cluster.strength * breath).toFixed(3)})`);
    gradient.addColorStop(1, "rgba(241, 247, 249, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, tau);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${(0.06 * cluster.strength * breath).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(radiusX * 0.14, 0, radiusX * 0.34, radiusY * 0.48, 0, 0, tau);
    ctx.fill();
    ctx.restore();
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
      drawCluster(cluster, timeMs, forceStatic);
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

      if (Math.abs(dy) > field.yGap * 1.92 || depthDelta > 96 || screenDistance > field.xGap * 2.08) {
        continue;
      }

      const energy = Math.min((source.energy + target.energy) * 0.5, 1.3);
      const alpha =
        0.042 +
        weight * 0.052 +
        ((source.depthAlpha + target.depthAlpha) * 0.5) * 0.058 +
        energy * 0.12;
      ctx.strokeStyle = `rgba(242, 246, 248, ${Math.min(alpha, 0.34).toFixed(3)})`;
      ctx.lineWidth = 0.46 + weight * 0.28 + energy * 0.18;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
      field.lastDrawnEdges += 1;
    }

    const depthSorted = [...positions].sort((a, b) => b.z - a.z);

    for (const point of depthSorted) {
      const alpha =
        0.17 +
        point.depthAlpha * 0.21 +
        point.shimmer * 0.1 +
        Math.min(point.energy, 1.08) * 0.5;
      const glow = 1.4 + point.perspective * 2.2 + point.energy * 6.6;

      ctx.beginPath();
      ctx.fillStyle = `rgba(245, 247, 248, ${Math.min(alpha, 0.92).toFixed(3)})`;
      ctx.shadowColor = `rgba(255, 255, 255, ${Math.min(0.18 + point.energy * 0.52, 0.84).toFixed(3)})`;
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
    field.drift -= deltaMs * 0.018;
    const wrapSpan = field.xGap * Math.max(field.columns - field.bufferColumns * 2 - 1, 1);
    if (Math.abs(field.drift) > wrapSpan) {
      field.drift += wrapSpan;
    }

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
