import { describe, expect, it } from "vitest";
import { books, calculateReadingProgress, filterLibraryBooks } from "../client/src/lib/library";

describe("library helpers", () => {
  it("filters by author or title and genre", () => {
    expect(filterLibraryBooks("james", "All genres").map((book) => book.title)).toEqual(["Atomic Habits"]);
    expect(filterLibraryBooks("tomorrow", "Fiction").map((book) => book.title)).toEqual([
      "Tomorrow, and Tomorrow, and Tomorrow",
    ]);
  });

  it("returns a safe bounded reading percentage", () => {
    expect(calculateReadingProgress(214, 315)).toBe(68);
    expect(calculateReadingProgress(500, 315)).toBe(100);
    expect(calculateReadingProgress(-20, 315)).toBe(0);
    expect(calculateReadingProgress(1, 0)).toBe(0);
  });

  it("ships with a useful starter catalog", () => {
    expect(books.length).toBeGreaterThanOrEqual(6);
  });
});
