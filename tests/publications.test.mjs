import assert from "node:assert/strict";
import test from "node:test";
import { publications } from "../content/publications.js";
import { siteContent } from "../scripts/content.js";
import { assertPublications, publicationDateKey, publicationErrors, selectLatestPublications } from "../scripts/publications.js";

const paper = (date, title = date) => ({ date, title, citations: { gbt7714: title } });

test("sorts the full archive before limiting to 15 without changing the source", () => {
  const archive = Array.from({ length: 23 }, (_, index) => Object.freeze(paper(`2026-09-${String(index + 1).padStart(2, "0")}`)));
  Object.freeze(archive);
  const selected = selectLatestPublications(archive);
  assert.equal(selected.length, 15);
  assert.deepEqual(selected, [...archive].reverse().slice(0, 15));
  assert.equal(archive.length, 23);
  assert.equal(archive[0].date, "2026-09-01");
  assert.equal(selected[0], archive[22]);
  assert.equal(selected[0].citations.gbt7714, "2026-09-23");
});

test("calendar sorting crosses years and months, not file position or meta text", () => {
  const archive = [paper("2025-12-31"), paper("2026-02-01"), { ...paper("2024-01-01"), meta: "2099" }, paper("2026-01-31")];
  assert.deepEqual(selectLatestPublications(archive).map(item => item.date), ["2026-02-01", "2026-01-31", "2025-12-31", "2024-01-01"]);
});

test("partial dates sort by period start and ties preserve file order at the cutoff", () => {
  const archive = [paper("2026", "A"), paper("2026-02", "B"), paper("2026-01-01", "C"), paper("2026-02-01", "D")];
  assert.deepEqual(selectLatestPublications(archive).map(item => item.title), ["B", "D", "A", "C"]);
  const ties = Array.from({ length: 20 }, (_, index) => paper("2026-05-01", String(index)));
  assert.deepEqual(selectLatestPublications(ties), ties.slice(0, 15));
});

test("empty, fewer than 15, and exactly 15 entries are all handled", () => {
  for (const count of [0, 1, 7, 15]) {
    const archive = Array.from({ length: count }, (_, index) => paper("2026", String(index)));
    assert.deepEqual(selectLatestPublications(archive), archive);
  }
});

test("date validation checks real calendar days and leap years without timezone parsing", () => {
  for (const date of ["2026", "2026-09", "2026-09-30", "2024-02-29", "2000-02-29", "0099-01-01"]) {
    assert.equal(typeof publicationDateKey(date), "number", date);
  }
  for (const date of [undefined, null, 2026, "", "2026/09/30", "2026-9-30", "2026-00", "2026-13", "2026-02-29", "1900-02-29", "2026-04-31", "2026-01-00", "0000", "2026-09-30T00:00:00Z", " 2026"]) {
    assert.equal(publicationDateKey(date), null, String(date));
  }
});

test("invalid archived entries are reported even outside the latest 15", () => {
  const archive = [...Array.from({ length: 15 }, () => paper("2026")), paper("2023-02-30")];
  assert.throws(() => assertPublications(archive), /content\/publications.js:\npublications\[15\] \(entry 16\).date/);
  assert.equal(selectLatestPublications(archive).length, 15);
});

test("malformed records cannot stop valid records from rendering locally", () => {
  const invalid = [null, [], {}, { date: "2026", title: " " }, { ...paper("2026"), summary: 5 }, { ...paper("2026"), href: "javascript:alert(1)" }, { ...paper("2026"), citations: null }, { ...paper("2026"), citations: { bibtex: 42 } }, { ...paper("2026"), citationExample: "false" }];
  for (const record of invalid) assert(publicationErrors([record]).length > 0);
  const valid = paper("2025", "Valid");
  assert.deepEqual(selectLatestPublications([...invalid, valid]), [valid]);
  assert.throws(() => assertPublications({}), /must be an array/);
  assert.throws(() => assertPublications(new Array(1)), /entry 1.*must be an object/);
  assert.deepEqual(selectLatestPublications(null), []);
});

test("links, empty citations, and explicit future dates are accepted without scheduling", () => {
  for (const href of [undefined, "", "https://example.org/paper?a=1&b=2", "./assets/papers/example.pdf", "#publications"]) {
    assertPublications([{ ...paper("2099-01-01"), href, citations: {} }]);
  }
  assert.equal(selectLatestPublications([paper("2099-01-01")]).length, 1);
});

test("the content adapter preserves the archive and only explicitly marked demos receive examples", () => {
  assertPublications(publications);
  assert.equal(siteContent.publications.length, publications.length);
  publications.forEach((publication, index) => {
    assert.equal(siteContent.publications[index].title, publication.title);
    assert.equal(siteContent.publications[index].date, publication.date);
    if (publication.citationExample === true && !publication.citations) {
      assert(siteContent.publications[index].citations.gbt7714.includes("EXAMPLE ONLY"));
      assert.equal(publication.citations, undefined);
    } else {
      assert.deepEqual(siteContent.publications[index].citations, publication.citations);
    }
  });
});
