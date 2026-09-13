import { siteContent } from "./content.js";
import { applyNavigationOrder } from "./navigation.js";
import { bindCitations } from "./citations.js";
import { bindFooterField } from "./footer-field.js";
import { heroMarkup, newsMarkup } from "./hero-markup.js";

const state = {
  navItems: siteContent.navigation,
  newsItems: siteContent.news
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
  committedPointerX: 0,
  committedPointerY: 0,
  visualStateTimer: 0,
  visualPulseTimer: 0,
  visualTargetId: "home",
  readingGuideIndex: -1,
  updatePublicationReadingGuide: null
};

const geometry = {
  sections: [],
  heroTop: 0,
  heroHeight: 0,
  heroRange: 220,
  originAbsX: 0,
  originAbsY: 0,
  originWidth: floatingMonogramSize,
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
  state.navItems = applyNavigationOrder(document.querySelector("main"), siteContent.navigation);
  navList.replaceChildren(...state.navItems.map(item => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.className = "site-nav__link";
    link.href = `#${item.id}`;
    link.dataset.navLink = item.id;
    link.textContent = item.label;
    li.append(link);
    return li;
  }));
}

function renderHero() {
  const copy = heroMarkup(siteContent.team);
  teamName.innerHTML = copy.title;
  document.querySelector(".hero__eyebrow").textContent = siteContent.team.englishName;
  teamEnglish.outerHTML = copy.directions;
  teamSummary.textContent = siteContent.team.summary;
  document.querySelector("[data-recruitment]")?.remove();
  teamSummary.insertAdjacentHTML("afterend", copy.recruitment);
  siteMarkLabel.textContent = siteContent.team.markLabel;
  dockText.textContent = siteContent.team.acronym;
  monogramTextNodes.forEach((node) => {
    node.textContent = siteContent.team.acronym;
  });

  renderNews();
}

function renderNews() {
  newsList.tabIndex = 0;
  newsList.setAttribute("aria-label", "News");
  newsList.innerHTML = newsMarkup(state.newsItems);
  newsCount.textContent = `${state.newsItems.length} items`;
}

function renderMembers() {
  membersGrid.classList.replace("member-grid", "member-groups");
  membersGrid.replaceChildren();
  const groups = [...siteContent.memberGroups];
  for (const member of siteContent.members) {
    if (!groups.some(group => group.id === member.group)) {
      groups.push({ id: member.group, label: member.group || "Members", color: "#b9cbc8" });
    }
  }
  if (siteContent.membersNotice) {
    const notice = document.createElement("p");
    notice.className = "member-groups__notice";
    notice.textContent = siteContent.membersNotice;
    membersGrid.append(notice);
  }
  for (const [index, group] of groups.entries()) {
    const members = siteContent.members.filter(member => member.group === group.id);
    const section = document.createElement("section");
    section.className = "member-group";
    section.dataset.memberGroup = group.id;
    section.style.setProperty("--member-color", group.color);
    section.setAttribute("aria-labelledby", `member-group-${index}`);
    const heading = document.createElement("h3");
    heading.id = `member-group-${index}`;
    heading.className = "member-group__title";
    heading.textContent = group.label;
    const count = document.createElement("span");
    count.textContent = String(members.length).padStart(2, "0");
    heading.append(count);
    const grid = document.createElement("div");
    grid.className = "member-grid";
    for (const member of members) {
      const card = document.createElement("article");
      card.className = "member-card";
      card.innerHTML = `<div class="member-card__portrait" aria-hidden="true">
        <div class="member-card__portrait-backdrop"></div>
        <div class="member-card__portrait-cutout"></div>
        <span class="member-card__portrait-tag"></span>
        <span class="member-card__portrait-mark"></span>
      </div><div class="member-card__content"><h4 class="member-card__name"></h4>
        <p class="member-card__role"></p><p class="member-card__bio"></p></div>`;
      card.querySelector(".member-card__portrait-tag").textContent = group.label;
      card.querySelector(".member-card__portrait-mark").textContent = member.initials;
      const name = card.querySelector(".member-card__name");
      const link = document.createElement(member.href ? "a" : "span");
      link.textContent = member.name;
      if (member.href) { link.href = member.href; link.target = "_blank"; link.rel = "noreferrer"; }
      name.append(link);
      card.querySelector(".member-card__role").textContent = member.role;
      card.querySelector(".member-card__bio").textContent = member.bio ?? "";
      if (member.image) {
        const image = document.createElement("img");
        image.className = "member-card__portrait-image";
        image.alt = "";
        image.loading = "lazy";
        image.style.objectPosition = member.portraitPosition || "50% 100%";
        image.addEventListener("error", () => {
          image.remove();
          card.classList.remove("member-card--has-image");
        });
        image.src = member.image;
        card.querySelector(".member-card__portrait-cutout").append(image);
        card.classList.add("member-card--has-image");
      }
      grid.append(card);
    }
    if (!members.length) {
      const empty = document.createElement("p");
      empty.className = "member-group__empty";
      empty.textContent = "To be announced.";
      grid.append(empty);
    }
    section.append(heading, grid);
    membersGrid.append(section);
  }
}

function renderFooter() {
  document.querySelector(".site-footer__eyebrow").textContent = siteContent.team.englishName;
  document.querySelector(".site-footer__text").textContent = siteContent.team.summary;
  const contact = siteContent.contact ?? {};
  const list = document.querySelector("[data-contact-list]");
  for (const [label, value, href] of [
    ["Email", contact.email, contact.email ? `mailto:${contact.email}` : ""],
    ["Phone", contact.phone, contact.phone && !contact.isExample ? `tel:${contact.phone.replace(/[^+\d]/g, "")}` : ""],
    ["Office", contact.office, ""]
  ]) {
    if (!value) continue;
    const item = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    const text = document.createElement(href ? "a" : "span");
    text.textContent = value;
    if (href) text.href = href;
    detail.append(text);
    item.append(term, detail);
    list.append(item);
  }
  document.querySelector("[data-contact-notice]").textContent = contact.isExample ? "示例联系方式，正式信息待更新。" : "";
  document.querySelector("[data-footer-copyright]").textContent = `(c) ${new Date().getFullYear()} ${siteContent.team.englishName}`;
  const filing = document.querySelector("[data-footer-filing]");
  filing.hidden = !contact.filing?.text;
  if (contact.filing?.text) {
    const text = document.createElement(contact.filing.href ? "a" : "span");
    text.textContent = contact.filing.text;
    if (contact.filing.href) { text.href = contact.filing.href; text.rel = "noreferrer"; text.target = "_blank"; }
    filing.append(text);
  }
}

function renderStackList(items, container) {
  container.innerHTML = items
    .map(
      (item, index) => `
        <article class="stack-item">
          <div class="stack-item__meta">${item.meta}${container === publicationsList ? `
            <div><button class="citation-trigger" type="button" data-cite-index="${index}">
              <span class="ui-icon ui-icon--quote" aria-hidden="true"></span>Cite
            </button></div>` : ""}</div>
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

    const targetId = "home";

    if (runtime.visualTargetId === targetId) {
      pageVisual.dataset.visualPhase = "settled";
      pageVisual.dataset.visualState = targetId;
      return;
    }

    runtime.visualTargetId = targetId;

    if (runtime.visualStateTimer) {
      window.clearTimeout(runtime.visualStateTimer);
      runtime.visualStateTimer = 0;
    }

    if (runtime.visualPulseTimer) {
      window.clearTimeout(runtime.visualPulseTimer);
      runtime.visualPulseTimer = 0;
    }

    pageVisual.dataset.visualPhase = "settled";
    pageVisual.dataset.visualState = targetId;
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

    setActive(currentId);

    if (currentId !== runtime.activeSectionId) {
      runtime.activeSectionId = currentId;
      updatePageVisualState(currentId);
      document.dispatchEvent(
        new CustomEvent("macc:sectionchange", {
          detail: { id: currentId }
        })
      );
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

function bindPublicationReadingGuide() {
  if (!publicationsList) {
    return;
  }

  const publicationsSection = publicationsList.closest(".content-section");
  const items = [...publicationsList.querySelectorAll(".stack-item")];
  if (!items.length) {
    return;
  }

  const setReadingIndex = (nextIndex) => {
    if (runtime.readingGuideIndex === nextIndex) {
      return;
    }

    runtime.readingGuideIndex = nextIndex;
    items.forEach((item, index) => {
      item.classList.toggle("is-reading", index === nextIndex);
    });
  };

  const updateReadingGuide = () => {
    if (window.innerWidth <= 760) {
      setReadingIndex(-1);
      return;
    }

    const headerOffset = header?.offsetHeight ?? 0;
    const sectionRect = publicationsSection?.getBoundingClientRect();
    if (
      sectionRect &&
      runtime.activeSectionId !== "publications" &&
      (sectionRect.bottom < headerOffset + 12 || sectionRect.top > window.innerHeight * 1.02)
    ) {
      setReadingIndex(-1);
      return;
    }

    const guideLine = headerOffset + Math.min(window.innerHeight * 0.28, 228);
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const visible = rect.bottom > headerOffset + 22 && rect.top < window.innerHeight * 0.9;

      if (!visible) {
        return;
      }

      const readingAnchor = rect.top + Math.min(rect.height * 0.34, 132);
      const distance = Math.abs(readingAnchor - guideLine);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    setReadingIndex(bestIndex);
  };

  runtime.updatePublicationReadingGuide = updateReadingGuide;
  updateReadingGuide();
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
    geometry.originWidth = originRect.width;
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

  if (window.innerWidth <= (pageVisual.classList.contains("page-visual--concept") ? 700 : 760)) {
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
  // A higher, compact origin must not overshoot the header before docking.
  const y = Math.max(dockY, originY + (dockY - originY) * progress);
  const originScale = geometry.originWidth / floatingMonogramSize;
  const targetScale = geometry.dockWidth / floatingMonogramSize;
  const scale = originScale + (targetScale - originScale) * progress;
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

  const pointerEpsilon = 0.0025;
  const flushPointer = () => {
    runtime.pointerFrameId = 0;

    if (
      Math.abs(runtime.pointerX - runtime.committedPointerX) < pointerEpsilon &&
      Math.abs(runtime.pointerY - runtime.committedPointerY) < pointerEpsilon
    ) {
      return;
    }

    runtime.committedPointerX = runtime.pointerX;
    runtime.committedPointerY = runtime.pointerY;
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
  window.addEventListener("pointerleave", resetPointer, { passive: true });
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
    runtime.updatePublicationReadingGuide?.();
  });
}

function bindFloatingMonogram() {
  const refreshLayout = () => {
    cacheLayoutMetrics();
    scheduleVisualFrame();
  };
  cacheLayoutMetrics();
  updateFloatingMonogram();
  window.addEventListener("scroll", scheduleVisualFrame, { passive: true });
  window.addEventListener("resize", refreshLayout);
  document.fonts.ready.then(refreshLayout);
}


function revealHomepage() {
  const entrance = window.__maccEntrance;
  if (!entrance || document.documentElement.dataset.entrance !== "pending") return;
  const buffer = Math.max(0, 180 - (performance.now() - entrance.started));
  Promise.all([document.fonts.ready, new Promise(resolve => setTimeout(resolve, buffer))]).then(() => {
    // Two frames let hydrated text and scene geometry settle before the fade starts.
    requestAnimationFrame(() => requestAnimationFrame(() => entrance.finish(true)));
  });
}

function init() {
  renderNavigation();
  renderHero();
  renderMembers();
  renderFooter();
  renderStackList(siteContent.publications, publicationsList);
  bindCitations(publicationsList, siteContent.publications);
  bindPublicationReadingGuide();
  renderCardGrid(siteContent.projects, projectsGrid, "project-card");
  renderStackList(siteContent.patents, patentsList);
  renderCardGrid(siteContent.awards, awardsGrid, "award-card");
  runtime.updateActiveNavigation = bindActiveNavigation();
  bindPointerVisualResponse();
  bindFloatingMonogram();
  bindFooterField(footerObserver, footerCanvas, prefersReducedMotion);
  cacheLayoutMetrics();
  updatePageVisualRelease();
  scheduleVisualFrame();
  revealHomepage();
}

init();
