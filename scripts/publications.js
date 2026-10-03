export const PUBLICATION_LIMIT = 15;

// Calendar-only keys avoid timezone differences. Unknown months/days sort as 01.
export function publicationDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return null;
  const [year, month = 1, day = 1] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) return null;
  return year * 10000 + month * 100 + day;
}

function entryErrors(publication, index) {
  const prefix = `publications[${index}] (entry ${index + 1})`;
  if (!publication || typeof publication !== "object" || Array.isArray(publication)) {
    return [`${prefix}: must be an object.`];
  }
  const errors = [];
  if (publicationDateKey(publication.date) === null) errors.push(`${prefix}.date: use a valid YYYY-MM-DD, YYYY-MM, or YYYY date.`);
  if (typeof publication.title !== "string" || !publication.title.trim()) errors.push(`${prefix}.title: a non-empty title is required.`);
  for (const field of ["meta", "summary", "href"]) {
    if (publication[field] !== undefined && typeof publication[field] !== "string") errors.push(`${prefix}.${field}: must be text.`);
  }
  if (typeof publication.href === "string" && publication.href) {
    try {
      const url = new URL(publication.href, "https://macc.invalid/");
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid protocol");
    } catch {
      errors.push(`${prefix}.href: use an HTTP(S) link or a relative website path.`);
    }
  }
  if (publication.citationExample !== undefined && typeof publication.citationExample !== "boolean") {
    errors.push(`${prefix}.citationExample: must be true or false.`);
  }
  if (publication.citations !== undefined) {
    if (!publication.citations || typeof publication.citations !== "object" || Array.isArray(publication.citations)) {
      errors.push(`${prefix}.citations: must be an object; use {} if unavailable.`);
    } else {
      for (const field of ["gbt7714", "bibtex"]) {
        if (publication.citations[field] !== undefined && typeof publication.citations[field] !== "string") {
          errors.push(`${prefix}.citations.${field}: must be text.`);
        }
      }
    }
  }
  return errors;
}

export function publicationErrors(publications) {
  if (!Array.isArray(publications)) return ["publications: must be an array."];
  return Array.from(publications, entryErrors).flat();
}

export function assertPublications(publications) {
  const errors = publicationErrors(publications);
  if (errors.length) throw new Error(`content/publications.js:\n${errors.join("\n")}`);
}

export function selectLatestPublications(publications) {
  if (!Array.isArray(publications)) return [];
  return publications
    .map((publication, index) => ({ publication, index }))
    .filter(({ publication, index }) => entryErrors(publication, index).length === 0)
    .sort((a, b) => publicationDateKey(b.publication.date) - publicationDateKey(a.publication.date) || a.index - b.index)
    .slice(0, PUBLICATION_LIMIT)
    .map(({ publication }) => publication);
}
