import { siteDetails } from "../content/site.js";
import { publications } from "../content/publications.js";
import { createExampleCitations } from "./citation-examples.js";

// Keep data files free of rendering logic. Selection happens once in app.js.
export const siteContent = {
  ...siteDetails,
  publications: Array.isArray(publications) ? publications.map((publication, index) => ({
    ...publication,
    ...(publication?.citationExample === true && !publication.citations
      ? { citations: createExampleCitations(publication.title, index) }
      : {})
  })) : publications
};
