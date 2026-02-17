import { describe, expect, it } from "vitest";

import { looksLikeHtml, sanitizeBasicHtml } from "./sanitizeHtml";

describe("looksLikeHtml", () => {
  it("detects tag-like content", () => {
    expect(looksLikeHtml("<p>Hello</p>")).toBe(true);
  });

  it("does not flag plain text", () => {
    expect(looksLikeHtml("1 < 2 and 3 > 1")).toBe(false);
  });
});

describe("sanitizeBasicHtml", () => {
  it("removes unsafe tags", () => {
    expect(sanitizeBasicHtml('<script>alert("x")</script><p>safe</p>')).toBe('alert("x")<p>safe</p>');
  });

  it("strips inline event handlers", () => {
    expect(sanitizeBasicHtml('<a href="#" onclick="run()">link</a>')).toBe('<a href="#">link</a>');
  });

  it("replaces javascript URLs", () => {
    expect(
      sanitizeBasicHtml('<a href="javascript:alert(1)">click</a><img src=\'javascript:evil()\'>'),
    ).toBe('<a href="#">click</a><img src="#">');
  });
});
