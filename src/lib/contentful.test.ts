import { describe, expect, it } from "vitest";

import {
  getEditorUrl,
  getEntryContentStatus,
  getFieldValueByLocale,
  getSingleFieldValue,
} from "./contentful";

describe("getFieldValueByLocale", () => {
  it("uses requested locale when present", () => {
    const value = getFieldValueByLocale(
      { "en-US": "Hello", ar: "مرحبا" },
      "en-US",
      "ar",
    );

    expect(value).toBe("Hello");
  });

  it("falls back to fallback locale", () => {
    const value = getFieldValueByLocale(
      { "en-US": "Hello", ar: "مرحبا" },
      "fr-FR",
      "ar",
    );

    expect(value).toBe("مرحبا");
  });

  it("falls back to any non-empty localized value", () => {
    const value = getFieldValueByLocale(
      { de: "Hallo", fr: "" },
      "en-US",
      "ar",
    );

    expect(value).toBe("Hallo");
  });

  it("formats localized arrays into display text", () => {
    const value = getFieldValueByLocale(
      { "en-US": ["alpha", null, "beta"] },
      "en-US",
      "ar",
    );

    expect(value).toBe("alpha, beta");
  });
});

describe("getSingleFieldValue", () => {
  it("returns the first non-empty value from an object", () => {
    const value = getSingleFieldValue({
      "en-US": "",
      ar: null,
      "fr-FR": "Bonjour",
    });

    expect(value).toBe("Bonjour");
  });

  it("handles scalar values", () => {
    expect(getSingleFieldValue(42)).toBe("42");
  });
});

describe("getEntryContentStatus", () => {
  it("maps archived entries", () => {
    expect(
      getEntryContentStatus({
        sys: {
          id: "1",
          createdAt: "",
          updatedAt: "",
          archivedVersion: 1,
        },
      }),
    ).toBe("Archived");
  });

  it("maps draft entries", () => {
    expect(
      getEntryContentStatus({
        sys: {
          id: "1",
          createdAt: "",
          updatedAt: "",
        },
      }),
    ).toBe("Draft");
  });

  it("maps changed entries", () => {
    expect(
      getEntryContentStatus({
        sys: {
          id: "1",
          createdAt: "",
          updatedAt: "",
          publishedVersion: 3,
          version: 5,
        },
      }),
    ).toBe("Changed");
  });

  it("maps published entries", () => {
    expect(
      getEntryContentStatus({
        sys: {
          id: "1",
          createdAt: "",
          updatedAt: "",
          publishedVersion: 3,
          version: 4,
        },
      }),
    ).toBe("Published");
  });
});

describe("getEditorUrl", () => {
  it("builds an editor URL for an entry id", () => {
    expect(getEditorUrl("entry-123")).toMatch(/\/entries\/entry-123$/);
  });
});
