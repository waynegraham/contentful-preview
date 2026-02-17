import { describe, expect, it } from "vitest";

import { buildPreviewQueryString, normalizePreviewQuery } from "./previewQuery";

describe("normalizePreviewQuery", () => {
  it("normalizes bad input and applies defaults", () => {
    const normalized = normalizePreviewQuery({
      page: "0",
      q: "  heading  ",
      editorialStatus: [" changed ", "draft"],
      sort: "",
    });

    expect(normalized).toEqual({
      page: 1,
      search: "heading",
      editorialStatus: "changed",
      sort: "updated-desc",
    });
  });

  it("parses page from array and keeps explicit sort", () => {
    const normalized = normalizePreviewQuery({
      page: ["3", "2"],
      sort: "title-asc",
    });

    expect(normalized.page).toBe(3);
    expect(normalized.sort).toBe("title-asc");
  });
});

describe("buildPreviewQueryString", () => {
  it("omits default values", () => {
    expect(
      buildPreviewQueryString({
        page: 1,
        editorialStatus: "all",
        sort: "updated-desc",
      }),
    ).toBe("");
  });

  it("includes non-default values", () => {
    expect(
      buildPreviewQueryString({
        page: 2,
        search: "title",
        editorialStatus: "in review",
        sort: "title-desc",
      }),
    ).toBe("?page=2&q=title&editorialStatus=in+review&sort=title-desc");
  });
});
