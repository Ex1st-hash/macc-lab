const formats = [
  { id: "gbt7714", label: "GB/T 7714" },
  { id: "mla", label: "MLA" },
  { id: "apa", label: "APA" },
  { id: "bibtex", label: "BibTeX" }
];
const exports = [
  { id: "bibtex", label: "BibTeX", extension: "bib" },
  { id: "endnote", label: "EndNote", extension: "enw" },
  { id: "ris", label: "RefMan", extension: "ris" },
  { id: "refworks", label: "RefWorks", extension: "txt" }
];

export function bindCitations(container, publications) {
  if (!container) return;
  const dialog = document.createElement("dialog");
  dialog.className = "citation-dialog";
  dialog.setAttribute("aria-labelledby", "citation-dialog-title");
  dialog.innerHTML = `
    <header class="citation-dialog__header">
      <h2 id="citation-dialog-title">Cite</h2>
      <button class="icon-button" type="button" data-citation-close aria-label="Close citation" title="Close citation">
        <span class="ui-icon ui-icon--x" aria-hidden="true"></span>
      </button>
    </header>
    <p class="citation-dialog__paper"></p>
    <p class="citation-dialog__example" hidden>示例引用：作者、期刊等为占位数据，不可用于学术引用。</p>
    <div class="citation-dialog__formats"></div>
    <p class="citation-dialog__empty" hidden>Citation data is not available yet.</p>
    <div class="citation-dialog__downloads" hidden></div>
    <p class="citation-dialog__status" role="status" aria-live="polite"></p>`;
  document.body.append(dialog);

  const rows = dialog.querySelector(".citation-dialog__formats");
  const downloads = dialog.querySelector(".citation-dialog__downloads");
  const status = dialog.querySelector(".citation-dialog__status");
  let opener;
  let objectURLs = [];
  let opening = 0;
  const releaseDownloads = () => {
    objectURLs.forEach(url => URL.revokeObjectURL(url));
    objectURLs = [];
  };

  const copyCitation = async (text, block, button) => {
    const currentOpening = opening;
    try {
      await navigator.clipboard.writeText(text);
      if (dialog.open && opening === currentOpening) {
        status.textContent = "Citation copied.";
        button.dataset.copied = "true";
        window.setTimeout(() => { delete button.dataset.copied; }, 1800);
      }
    } catch {
      if (!dialog.open || opening !== currentOpening) return;
      const range = document.createRange();
      range.selectNodeContents(block);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Clipboard access unavailable.";
      block.focus({ preventScroll: true });
    }
  };

  container.addEventListener("click", event => {
    const button = event.target.closest("[data-cite-index]");
    if (!button || !container.contains(button)) return;
    const publication = publications[Number(button.dataset.citeIndex)];
    if (!publication) return;
    opener = button;
    opening++;
    releaseDownloads();
    rows.replaceChildren();
    downloads.replaceChildren();
    status.textContent = "";
    dialog.querySelector(".citation-dialog__paper").textContent = publication.title;
    dialog.querySelector(".citation-dialog__example").hidden = !publication.citationExample;
    const citations = publication.citations ?? {};

    for (const format of formats) {
      const text = citations[format.id];
      if (typeof text !== "string" || !text.trim()) continue;
      const row = document.createElement("div");
      row.className = "citation-row";
      const label = document.createElement("span");
      label.className = "citation-row__label";
      label.textContent = format.label;
      const block = document.createElement(format.id === "bibtex" ? "pre" : "p");
      block.className = "citation-row__text";
      block.tabIndex = 0;
      block.textContent = text;
      const copy = document.createElement("button");
      copy.className = "icon-button";
      copy.type = "button";
      copy.title = `Copy ${format.label} citation`;
      copy.setAttribute("aria-label", copy.title);
      copy.innerHTML = '<span class="ui-icon ui-icon--copy" aria-hidden="true"></span>';
      copy.addEventListener("click", () => copyCitation(text, block, copy));
      row.append(label, block, copy);
      rows.append(row);
    }

    for (const format of exports) {
      const text = citations[format.id];
      if (typeof text !== "string" || !text.trim()) continue;
      const link = document.createElement("a");
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      objectURLs.push(url);
      link.href = url;
      link.download = `citation-${Number(button.dataset.citeIndex) + 1}.${format.extension}`;
      link.textContent = format.label;
      downloads.append(link);
    }
    dialog.querySelector(".citation-dialog__empty").hidden = rows.childElementCount > 0 || downloads.childElementCount > 0;
    downloads.hidden = !downloads.childElementCount;
    document.body.classList.add("citation-dialog-open");
    dialog.showModal();
  });

  dialog.querySelector("[data-citation-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("citation-dialog-open");
    releaseDownloads();
    opener?.focus({ preventScroll: true });
  });
}
