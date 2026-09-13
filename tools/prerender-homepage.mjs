import { parse, parseFragment, serialize } from "parse5";
import { escapeHTML, heroMarkup, newsMarkup } from "../scripts/hero-markup.js";
import { resolveNavigation } from "../scripts/navigation.js";

// Runs before the body paints; timeout and input handlers also work if app.js fails.
const entranceBootstrap = `(() => {
  const root = document.documentElement;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || (location.hash && location.hash !== "#home")) return;
  const events = ["wheel", "touchstart", "pointerdown", "keydown", "scroll", "hashchange"];
  let timer;
  const cancel = () => finish(false);
  const restore = event => { if (event.persisted) cancel(); };
  function finish(animate = false) {
    if (root.dataset.entrance !== "pending" && root.dataset.entrance !== "revealing") return;
    clearTimeout(timer);
    if (animate && root.dataset.entrance === "pending") {
      root.dataset.entrance = "revealing";
      timer = setTimeout(cancel, 680);
      return;
    }
    root.dataset.entrance = "ready";
    events.forEach(name => window.removeEventListener(name, cancel));
    window.removeEventListener("pageshow", restore);
    motion.removeEventListener("change", cancel);
  }
  window.__maccEntrance = { started: performance.now(), finish };
  root.dataset.entrance = "pending";
  timer = setTimeout(cancel, 1800);
  events.forEach(name => window.addEventListener(name, cancel, { passive: true }));
  window.addEventListener("pageshow", restore);
  motion.addEventListener("change", cancel);
})();`;

const all = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...(node.childNodes ?? []).flatMap(child => all(child, predicate))
];
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const setHTML = (node, html) => {
  node.childNodes = parseFragment(html).childNodes;
  node.childNodes.forEach(child => { child.parentNode = node; });
};
const replace = (node, html) => {
  const nodes = parseFragment(html).childNodes;
  nodes.forEach(child => { child.parentNode = node.parentNode; });
  node.parentNode.childNodes.splice(node.parentNode.childNodes.indexOf(node), 1, ...nodes);
};

export function prerenderHomepage(html, content) {
  const page = parse(html.trimEnd());
  const first = predicate => all(page, predicate)[0];
  const data = name => first(node => attr(node, name) !== undefined);
  const copy = heroMarkup(content.team);
  setHTML(data("data-team-name"), copy.title);
  setHTML(first(node => attr(node, "class") === "hero__eyebrow"), escapeHTML(content.team.englishName));
  replace(data("data-team-english"), copy.directions);
  const summary = data("data-team-summary");
  setHTML(summary, escapeHTML(content.team.summary));
  const recruitment = data("data-recruitment");
  if (recruitment) replace(recruitment, "");
  const extra = parseFragment(copy.recruitment).childNodes;
  extra.forEach(child => { child.parentNode = summary.parentNode; });
  summary.parentNode.childNodes.splice(summary.parentNode.childNodes.indexOf(summary) + 1, 0, ...extra);
  for (const node of all(page, node => attr(node, "data-team-acronym") !== undefined)) setHTML(node, escapeHTML(content.team.acronym));
  setHTML(data("data-site-dock-text"), escapeHTML(content.team.acronym));
  setHTML(data("data-site-mark-label"), escapeHTML(content.team.markLabel));
  setHTML(data("data-news-list"), newsMarkup(content.news));
  setHTML(data("data-news-count"), `${content.news.length} items`);
  const newsList = data("data-news-list");
  newsList.attrs = newsList.attrs.filter(item => !["tabindex", "aria-label"].includes(item.name));
  newsList.attrs.push({ name: "tabindex", value: "0" }, { name: "aria-label", value: "News" });
  const main = first(node => node.tagName === "main");
  const sections = main.childNodes.filter(node => attr(node, "data-section") !== undefined);
  const byId = new Map(sections.map(node => [attr(node, "data-section"), node]));
  const navigation = resolveNavigation(content.navigation, [...byId.keys()]);
  setHTML(data("data-nav-list"), navigation.items.map(item => `<li><a class="site-nav__link" href="#${escapeHTML(item.id)}" data-nav-link="${escapeHTML(item.id)}">${escapeHTML(item.label)}</a></li>`).join(""));
  if (sections.some((node, index) => attr(node, "data-section") !== navigation.order[index])) {
    main.childNodes = main.childNodes.filter(node => !sections.includes(node));
    main.childNodes.push(...navigation.order.map(id => byId.get(id)));
  }
  let number = 0;
  for (const id of navigation.order) {
    const label = all(byId.get(id), node => attr(node, "class") === "section-head__eyebrow")[0];
    if (id !== "home" && label) setHTML(label, `Section ${String(++number).padStart(2, "0")}`);
  }
  const head = first(node => node.tagName === "head");
  const existingBootstrap = first(node => attr(node, "id") === "macc-entrance");
  if (existingBootstrap) {
    existingBootstrap.childNodes[0].value = entranceBootstrap;
  } else {
    const script = parseFragment(`<script id="macc-entrance">${entranceBootstrap}</script>`).childNodes[0];
    script.parentNode = head;
    // Keep charset and viewport metadata ahead of the early bootstrap.
    const position = head.childNodes.findIndex(node => node.tagName === "title");
    head.childNodes.splice(position, 0, script);
  }
  for (const href of ["./scripts/app.js", "./scripts/content.js", "./scripts/hero-markup.js"]) {
    if (first(node => node.tagName === "link" && attr(node, "rel") === "modulepreload" && attr(node, "href") === href)) continue;
    const link = parseFragment(`<link rel="modulepreload" href="${href}">`).childNodes[0];
    link.parentNode = head;
    head.childNodes.push(link);
  }
  return serialize(page).trimEnd() + "\n";
}
