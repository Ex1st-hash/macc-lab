export const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

// Shared by the live page and static export so slow scripts do not leave the hero empty.
export function heroMarkup(team) {
  return {
    title: team.titleLines?.length
      ? team.titleLines.map(line => `<span>${escapeHTML(line)}</span>`).join("")
      : escapeHTML(team.name),
    directions: team.researchDirections?.length
      ? `<ul class="hero__subtitle hero__directions" data-team-english data-team-directions>${team.researchDirections.map(direction => `<li>${escapeHTML(direction)}</li>`).join("")}</ul>`
      : `<p class="hero__subtitle" data-team-english>${escapeHTML(team.englishName)}</p>`,
    recruitment: team.recruitment?.text
      ? `<p class="hero__recruitment" data-recruitment>${team.recruitment.href
        ? `<a href="${escapeHTML(team.recruitment.href)}">${escapeHTML(team.recruitment.text)}</a>`
        : `<span>${escapeHTML(team.recruitment.text)}</span>`}</p>`
      : ""
  };
}

export function newsMarkup(items) {
  if (!items.length) return '<li class="news-empty">No news at present.</li>';
  return items.map((item, index) => `<li class="news-item ${index === 0 ? "news-item--lead" : "news-item--secondary"}">
    <span class="news-item__marker" aria-hidden="true"></span>
    <div class="news-item__body">
      <div class="news-item__signal">${index === 0 ? "Current signal" : "Prior note"}</div>
      <div class="news-item__date">${escapeHTML(item.date)}</div>
      <div class="news-item__title">${item.href
        ? `<a class="news-item__title-link" href="${escapeHTML(item.href)}" target="_blank" rel="noreferrer">${escapeHTML(item.title)}</a>`
        : escapeHTML(item.title)}</div>
      ${item.source ? `<div class="news-item__source">${escapeHTML(item.source)}</div>` : ""}
    </div>
  </li>`).join("");
}
