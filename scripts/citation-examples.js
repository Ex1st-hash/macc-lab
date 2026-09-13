// Deliberately fictional metadata. Every copied/exported format carries its warning.
export function createExampleCitations(title, index) {
  const warning = "EXAMPLE ONLY - NOT FOR ACADEMIC CITATION";
  return {
    gbt7714: `[${warning}] Author A. ${title}[J]. Example Journal, 2026, 1(1): 1-10.`,
    mla: `[${warning}] Author, A. "${title}." Example Journal, vol. 1, no. 1, 2026, pp. 1-10.`,
    apa: `[${warning}] Author, A. (2026). ${title}. Example Journal, 1(1), 1-10.`,
    bibtex: `@article{example${index + 1},\n  author = {Author, A.},\n  title = {${title}},\n  journal = {Example Journal},\n  year = {2026},\n  note = {${warning}}\n}`,
    endnote: `%0 Journal Article\n%A Author, A.\n%T ${title}\n%J Example Journal\n%D 2026\n%Z ${warning}\n`,
    ris: `TY  - JOUR\nAU  - Author, A.\nTI  - ${title}\nJO  - Example Journal\nPY  - 2026\nN1  - ${warning}\nER  - \n`,
    refworks: `RT Journal Article\nA1 Author, A.\nT1 ${title}\nJF Example Journal\nYR 2026\nNO ${warning}\n`
  };
}
