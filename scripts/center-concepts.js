(() => {
  const visual = document.querySelector(".page-visual--concept");
  const anchor = document.querySelector(".center-visual-anchor");
  if (!visual || !anchor) return;
  const narrow = matchMedia("(max-width: 700px)");
  const main = document.querySelector("main");
  const header = document.querySelector(".site-header");

  const measure = () => {
    if (narrow.matches) {
      if (visual.parentNode !== anchor) anchor.append(visual);
    } else {
      if (visual.parentNode !== document.body) document.body.insertBefore(visual, main);
      const rect = anchor.getBoundingClientRect();
      const style = getComputedStyle(visual);
      const centered = style.getPropertyValue("--center-scene").trim() === "1";
      const focusY = Number(style.getPropertyValue("--scene-focus-y")) || 0.5;
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      const left = centered ? (document.documentElement.clientWidth - rect.width) / 2 : rect.left + window.scrollX;
      const top = centered ? (headerBottom + window.innerHeight) / 2 - rect.height * focusY : rect.top + window.scrollY;
      visual.style.setProperty("--concept-left", `${left}px`);
      visual.style.setProperty("--concept-top", `${top}px`);
      visual.style.setProperty("--concept-width", `${rect.width}px`);
      visual.style.setProperty("--concept-height", `${rect.height}px`);
    }
  };

  // Recalculate on layout changes; scrolling only controls the existing footer fade.
  const observer = new ResizeObserver(measure);
  observer.observe(document.querySelector(".hero__grid"));
  observer.observe(anchor);
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  narrow.addEventListener("change", measure);
  document.fonts.ready.then(measure);
  measure();
})();
