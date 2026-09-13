export function resolveNavigation(config, sectionIds) {
  const known = new Set(sectionIds);
  const seen = new Set();
  const items = [];
  for (const item of Array.isArray(config) ? config : []) {
    if (!item || !known.has(item.id) || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push({ id: item.id, label: String(item.label || item.id) });
  }

  // Home owns the fixed scene and logo destination, so it stays first.
  if (known.has("home")) {
    const index = items.findIndex(item => item.id === "home");
    const home = index < 0 ? { id: "home", label: "Home" } : items.splice(index, 1)[0];
    items.unshift(home);
    seen.add("home");
  }

  return {
    items,
    order: [...items.map(item => item.id), ...sectionIds.filter(id => !seen.has(id))]
  };
}

export function applyNavigationOrder(main, config) {
  const sections = [...main.children].filter(element => element.matches("section[data-section]"));
  const byId = new Map(sections.map(section => [section.dataset.section, section]));
  const resolved = resolveNavigation(config, [...byId.keys()]);
  let number = 0;
  for (const id of resolved.order) {
    const section = byId.get(id);
    main.append(section);
    const label = section.querySelector(".section-head__eyebrow");
    if (id !== "home" && label) label.textContent = `Section ${String(++number).padStart(2, "0")}`;
  }
  return resolved.items;
}
