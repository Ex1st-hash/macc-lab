import { assertPublications, selectLatestPublications } from "../scripts/publications.js";

try {
  // Dynamic imports also report syntax mistakes in the hand-edited data files.
  await import("../content/site.js");
  const { publications } = await import("../content/publications.js");
  assertPublications(publications);
  const latest = selectLatestPublications(publications);
  console.log(`Content OK: ${publications.length} publications in the archive, ${latest.length} displayed (latest 15).`);
  for (const publication of latest) console.log(`${publication.date}  ${publication.title}`);
} catch (error) {
  console.error(`Content check failed. Review content/site.js and content/publications.js.\n${error.message}`);
  process.exitCode = 1;
}
